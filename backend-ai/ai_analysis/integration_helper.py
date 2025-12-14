"""
Integration Helper - Connect RealAIAnalyzer to main.py
Provides functions to start/stop real AI analysis with frame capture
"""

import asyncio
import logging
import json
import time
from typing import Optional, Callable

from ai_analysis.evidence_store import save_evidence_image

logger = logging.getLogger(__name__)

# Global real analyzer instance (singleton)
_real_analyzer = None
_analyzer_lock = asyncio.Lock()
_heartbeats = {}


def record_heartbeat(room_id: str, candidate_id: str, ts_ms: Optional[int] = None):
    """Record last activity/heartbeat timestamp for a candidate session."""
    global _heartbeats
    if ts_ms is None:
        ts_ms = int(time.time() * 1000)
    _heartbeats[(room_id, candidate_id)] = ts_ms


def _get_last_heartbeat(room_id: str, candidate_id: str) -> Optional[int]:
    return _heartbeats.get((room_id, candidate_id))


async def get_or_create_real_analyzer(use_mock: bool = False):
    """
    Get or create global RealAIAnalyzer instance
    
    Args:
        use_mock: Use mock models (for testing without GPU)
    
    Returns:
        RealAIAnalyzer instance (loaded and ready)
    """
    global _real_analyzer
    
    async with _analyzer_lock:
        if _real_analyzer is None:
            from ai_analysis.real_analyzer import RealAIAnalyzer
            
            logger.info("Creating RealAIAnalyzer instance...")
            _real_analyzer = RealAIAnalyzer(use_mock=use_mock, device="cpu")
            
            # Load models
            logger.info("Loading AI models (this may take 30-60s)...")
            success = await _real_analyzer.load_models()
            
            if not success:
                logger.error(f"Failed to load models: {_real_analyzer.loading_error}")
                raise RuntimeError("Model loading failed")
            
            logger.info("✅ RealAIAnalyzer ready")
    
    return _real_analyzer


async def run_real_analysis_loop(
    candidate_id: str,
    room_id: str,
    sfu_manager,
    websocket_send_func: Optional[Callable] = None,
    rooms_manager = None,
    use_mock_models: bool = False,
    frame_skip: int = 15  # 2 FPS at 30 FPS input
):
    """
    Background task that runs real AI analysis periodically
    
    Args:
        candidate_id: Candidate user ID
        room_id: Room identifier
        sfu_manager: SFU manager instance (to get candidate connection)
        websocket_send_func: Async function to send results via WebSocket (deprecated, use rooms_manager)
        rooms_manager: RoomManager instance for broadcasting to all participants
        use_mock_models: Use mock models (for testing)
        frame_skip: Skip N frames between analyses (15 = 2 FPS at 30 FPS input)
    """
    logger.info(f"Starting real AI analysis for {candidate_id} in room {room_id}")
    
    try:
        # Get analyzer
        analyzer = await get_or_create_real_analyzer(use_mock=use_mock_models)
        
        # Import frame capture
        from ai_analysis.frame_capture import capture_frames_from_candidate
        # Import rules engine for incident processing (A4 etc.)
        try:
            from rules_engine import rules_engine
        except Exception:
            rules_engine = None
        
        # Import save_cheating_log
        try:
            from kyc_service import save_cheating_log
        except ImportError:
            save_cheating_log = None

        monitoring = True
        frame_counter = 0
        # Track screen-missing state for A4 enforcement
        screen_missing_since: Optional[float] = None
        last_a4_sent: float = 0.0
        a4_timeout_sec: float = 60.0
        a4_cooldown_sec: float = 15.0
        if rules_engine is not None:
            try:
                a4_timeout_sec = float(rules_engine.THRESHOLDS.get("A4", {}).get("timeout_sec", a4_timeout_sec))
            except Exception:
                pass
        # A11 idle tracking
        a11_idle_sec: float = 120.0
        last_a11_sent: float = 0.0
        a11_cooldown_sec: float = 30.0
        if rules_engine is not None:
            try:
                a11_idle_sec = float(rules_engine.THRESHOLDS.get("A11", {}).get("idle_sec", a11_idle_sec))
            except Exception:
                pass
        
        while monitoring:
            try:
                # Get candidate connection from SFU
                candidate_conn = sfu_manager.get_candidate_connection(candidate_id, room_id)
                
                if candidate_conn is None:
                    logger.warning(f"No candidate connection found for {candidate_id}")
                    await asyncio.sleep(1.0)
                    continue
                
                # Skip frames (adaptive frame rate)
                frame_counter += 1
                if frame_counter < frame_skip:
                    await asyncio.sleep(0.033)  # ~30 FPS input
                    continue
                
                frame_counter = 0
                
                # Capture frames from candidate tracks
                frame_data = await capture_frames_from_candidate(
                    candidate_conn,
                    timeout=2.0
                )
                
                if frame_data is None:
                    logger.debug(f"No frame data captured for {candidate_id}")
                    await asyncio.sleep(0.5)
                    continue
                
                # --- Rule A4: Detect missing screen share beyond threshold ---
                now = time.time()
                screen_frame = frame_data.get("screen")
                if screen_frame is None:
                    # Start or continue missing timer
                    if screen_missing_since is None:
                        screen_missing_since = now
                    # If exceeded timeout and cooldown, emit incident
                    missing_duration = now - screen_missing_since
                    if missing_duration >= a4_timeout_sec and (now - last_a4_sent) >= a4_cooldown_sec:
                        try:
                            incident = {
                                "roomId": room_id,
                                "by": candidate_id,
                                "tag": "A4",
                                "level": "S2",  # default, will be adjusted by rules engine
                                "note": f"screen_share_missing_{int(missing_duration)}s",
                                "ts": int(now * 1000),
                            }
                            if rules_engine is not None:
                                processed = rules_engine.process_incident(room_id, candidate_id, incident)
                            else:
                                processed = incident
                            if rooms_manager:
                                try:
                                    room = await rooms_manager.get_or_create(room_id)
                                    # Store in room incidents for history APIs
                                    try:
                                        room.incidents.append(processed)
                                    except Exception:
                                        pass
                                    # Fanout to participants
                                    await room.broadcast(sender_id=candidate_id, message={"type": "incident", **processed})
                                except Exception as be:
                                    logger.warning(f"Broadcast A4 incident failed: {be}")
                            
                            # Save A4 to DB
                            if save_cheating_log:
                                try:
                                    ts_ms = int(now * 1000)
                                    evidence_path = save_evidence_image(
                                        frame_data=frame_data,
                                        incident_type="A4",
                                        room_id=room_id,
                                        candidate_id=candidate_id,
                                        timestamp_ms=ts_ms,
                                        prefer="camera",
                                    )
                                    save_cheating_log(
                                        exam_session_id=room_id,
                                        candidate_id=candidate_id,
                                        incident_type="A4",
                                        severity_level="S2",
                                        description=f"Screen share missing for {int(missing_duration)}s",
                                        timestamp=ts_ms,
                                        evidence=evidence_path
                                    )
                                except Exception as db_err:
                                    logger.error(f"Failed to save A4 cheating log: {db_err}")

                            last_a4_sent = now
                        except Exception as e:
                            logger.warning(f"A4 incident generation failed: {e}")
                else:
                    # Reset missing timer if screen is present again
                    screen_missing_since = None
                # --- End A4 detection ---

                # Check A11 (idle) based on last heartbeat/activity
                if rules_engine is not None:
                    try:
                        last_hb_ms = _get_last_heartbeat(room_id, candidate_id)
                        now_s = now
                        if last_hb_ms is not None:
                            idle_dur = (int(now_s * 1000) - last_hb_ms) / 1000.0
                            if idle_dur >= a11_idle_sec and (now_s - last_a11_sent) >= a11_cooldown_sec:
                                inc = {
                                    "roomId": room_id,
                                    "by": candidate_id,
                                    "tag": "A11",
                                    "level": "S1",
                                    "note": f"idle_{int(idle_dur)}s",
                                    "ts": int(now_s * 1000)
                                }
                                processed = rules_engine.process_incident(room_id, candidate_id, inc)
                                if rooms_manager:
                                    try:
                                        room = await rooms_manager.get_or_create(room_id)
                                        try:
                                            room.incidents.append(processed)
                                        except Exception:
                                            pass
                                        await room.broadcast(sender_id=candidate_id, message={"type": "incident", **processed})
                                    except Exception as be:
                                        logger.warning(f"Broadcast A11 incident failed: {be}")
                                
                                # Save A11 to DB
                                if save_cheating_log:
                                    try:
                                        ts_ms = int(now_s * 1000)
                                        evidence_path = save_evidence_image(
                                            frame_data=frame_data,
                                            incident_type="A11",
                                            room_id=room_id,
                                            candidate_id=candidate_id,
                                            timestamp_ms=ts_ms,
                                            prefer="camera",
                                        )
                                        save_cheating_log(
                                            exam_session_id=room_id,
                                            candidate_id=candidate_id,
                                            incident_type="A11",
                                            severity_level="S1",
                                            description=f"Idle for {int(idle_dur)}s",
                                            timestamp=ts_ms,
                                            evidence=evidence_path
                                        )
                                    except Exception as db_err:
                                        logger.error(f"Failed to save A11 cheating log: {db_err}")

                                last_a11_sent = now_s
                    except Exception as e:
                        logger.warning(f"A11 check failed: {e}")

                # Check if we have at least camera frame
                if frame_data.get("camera") is None:
                    logger.debug(f"No camera frame for {candidate_id}")
                    await asyncio.sleep(0.5)
                    continue
                
                # Run AI analysis
                analysis_result = await analyzer.analyze_frame(
                    candidate_id=candidate_id,
                    room_id=room_id,
                    frame_data=frame_data
                )
                
                logger.debug(
                    f"Analysis complete for {candidate_id}: "
                    f"{len(analysis_result.get('analyses', []))} analyses, "
                    f"{analysis_result.get('processing_time_ms')}ms"
                )
                
                print(f"[AI] Broadcasting analysis for {candidate_id} to room {room_id}")
                
                # Send results via WebSocket to all room participants
                if rooms_manager:
                    try:
                        room = await rooms_manager.get_or_create(room_id)
                        message = {
                            "type": "ai_analysis",
                            "data": analysis_result
                        }
                        message_json = json.dumps(message)
                        
                        # Broadcast to all participants in room (proctor + candidate)
                        for participant in room.participants.values():
                            try:
                                await participant.websocket.send_text(message_json)
                            except Exception as send_err:
                                logger.warning(f"Failed to send AI analysis to {participant.user_id}: {send_err}")
                    except Exception as e:
                        logger.error(f"Failed to broadcast AI analysis: {e}")
                elif websocket_send_func:
                    # Fallback to old method (only sends to candidate)
                    await websocket_send_func({
                        "type": "ai_analysis",
                        "data": analysis_result
                    })
                
                # Log alerts
                for analysis in analysis_result.get("analyses", []):
                    alert = analysis.get("result", {}).get("alert")
                    if alert:
                        logger.info(
                            f"Alert for {candidate_id}: "
                            f"{alert['type']} ({alert['level']}) - {alert['message']}"
                        )
                        
                        # Save to DB
                        if save_cheating_log:
                            try:
                                ts_ms = int(time.time() * 1000)
                                evidence_path = save_evidence_image(
                                    frame_data=frame_data,
                                    incident_type=alert["type"],
                                    room_id=room_id,
                                    candidate_id=candidate_id,
                                    timestamp_ms=ts_ms,
                                )
                                save_cheating_log(
                                    exam_session_id=room_id,
                                    candidate_id=candidate_id,
                                    incident_type=alert['type'],
                                    severity_level=alert['level'],
                                    description=alert['message'],
                                    timestamp=ts_ms,
                                    evidence=evidence_path
                                )
                            except Exception as db_err:
                                logger.error(f"Failed to save cheating log: {db_err}")
                
                # Adaptive sleep based on processing time
                proc_time_s = analysis_result.get("processing_time_ms", 0) / 1000
                sleep_time = max(0.1, 0.5 - proc_time_s)
                await asyncio.sleep(sleep_time)
                
            except asyncio.CancelledError:
                logger.info(f"Analysis cancelled for {candidate_id}")
                monitoring = False
                break
                
            except Exception as e:
                logger.error(f"Analysis error for {candidate_id}: {e}")
                await asyncio.sleep(1.0)
    
    except Exception as e:
        logger.error(f"Failed to start analysis for {candidate_id}: {e}")
        import traceback
        traceback.print_exc()


def get_analyzer_stats() -> dict:
    """Get statistics from the real analyzer"""
    if _real_analyzer is None:
        return {"error": "Analyzer not initialized"}
    
    return _real_analyzer.get_stats()


async def cleanup_analyzer():
    """Cleanup the global analyzer instance"""
    global _real_analyzer
    
    if _real_analyzer is not None:
        logger.info("Cleaning up RealAIAnalyzer...")
        await _real_analyzer.cleanup()
        _real_analyzer = None
        logger.info("RealAIAnalyzer cleaned up")
