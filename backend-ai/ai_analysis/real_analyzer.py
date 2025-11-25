"""
Real AI Analyzer - Production AI analysis orchestrator
Coordinates all 5 model adapters for comprehensive proctoring analysis
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
import numpy as np

from .base_analyzer import BaseAnalyzer
from .incident_types import IncidentTypes, SeverityLevel, get_incident_info
from .model_adapters import (
    YOLODetector,
    ArcFaceModel,
    PaddleOCREngine,
    SileroVAD,
    GazeEstimator
)

logger = logging.getLogger(__name__)


class RealAIAnalyzer(BaseAnalyzer):
    """
    Real AI Analyzer using actual AI models
    
    Orchestrates 5 model adapters:
    1. YOLODetector - Face detection
    2. ArcFaceModel - Face recognition/verification
    3. PaddleOCREngine - Screen OCR
    4. SileroVAD - Voice activity detection
    5. GazeEstimator - Gaze direction/behavior
    
    Architecture (from TODO_03):
    - Hybrid async + ThreadPoolExecutor
    - Eager model loading at startup
    - Sequential per-candidate inference (no batching)
    - FP16 for GPU models
    """
    
    def __init__(
        self,
        use_mock: bool = False,
        device: str = "cuda",
        num_threads: int = 4,
        kyc_threshold: float = 0.45
    ):
        """
        Initialize RealAIAnalyzer
        
        Args:
            use_mock: Use mock adapters (for testing without loading models)
            device: Device for GPU models ("cuda" or "cpu")
            num_threads: ThreadPoolExecutor thread count
            kyc_threshold: Face verification threshold (0.0-1.0)
        """
        self.use_mock = use_mock
        self.device = device
        self.kyc_threshold = kyc_threshold
        
        # Thread pool for CPU-bound inference
        self.executor = ThreadPoolExecutor(
            max_workers=num_threads,
            thread_name_prefix="ai_inference"
        )
        
        # Model adapters (loaded lazily)
        self.yolo_detector: Optional[YOLODetector] = None
        self.arcface_model: Optional[ArcFaceModel] = None
        self.paddle_ocr: Optional[PaddleOCREngine] = None
        self.silero_vad: Optional[SileroVAD] = None
        self.gaze_estimator: Optional[GazeEstimator] = None
        
        # Model loading state
        self.models_loaded = False
        self.loading_error: Optional[str] = None
        
        # Statistics
        self.stats = {
            "frames_analyzed": 0,
            "total_inference_time_ms": 0,
            "errors": 0,
            "cache_hits": 0
        }
        
        logger.info(
            f"RealAIAnalyzer initialized: "
            f"mock={use_mock}, device={device}, threads={num_threads}"
        )
    
    async def load_models(self) -> bool:
        """
        Load all AI models (blocking operation)
        Call this once at startup before processing frames
        
        Returns:
            True if all models loaded successfully, False otherwise
        """
        if self.models_loaded:
            logger.info("Models already loaded")
            return True
        
        logger.info("Loading AI models...")
        start_time = time.time()
        
        try:
            if self.use_mock:
                # Use mock adapters for testing
                logger.info("Using MOCK adapters (no real models)")
                await self._load_mock_models()
            else:
                # Load real models
                logger.info("Loading REAL models (this may take 30-60s)...")
                await self._load_real_models()
            
            self.models_loaded = True
            elapsed = time.time() - start_time
            
            logger.info(f"✅ All models loaded successfully in {elapsed:.1f}s")
            return True
            
        except Exception as e:
            self.loading_error = str(e)
            logger.error(f"❌ Failed to load models: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def _load_mock_models(self):
        """Load mock model adapters"""
        from .model_adapters import (
            create_mock_detector,
            create_mock_arcface,
            create_mock_ocr,
            create_mock_vad,
            create_mock_gaze
        )
        
        self.yolo_detector = create_mock_detector()
        self.arcface_model = create_mock_arcface()
        self.paddle_ocr = create_mock_ocr()
        self.silero_vad = create_mock_vad()
        self.gaze_estimator = create_mock_gaze()
        
        logger.info("Mock models loaded")
    
    async def _load_real_models(self):
        """Load real AI models"""
        loop = asyncio.get_event_loop()
        
        # Load models in thread pool (blocking operations)
        def load_all():
            # 1. YOLO Detector (GPU)
            logger.info("Loading YOLOv8n-Face...")
            self.yolo_detector = YOLODetector(device=self.device)
            self.yolo_detector.load()
            logger.info("✅ YOLO loaded")
            
            # 2. ArcFace Model (GPU)
            logger.info("Loading ArcFace-R100...")
            self.arcface_model = ArcFaceModel(device=self.device)
            self.arcface_model.load()
            logger.info("✅ ArcFace loaded")
            
            # 3. PaddleOCR (CPU)
            logger.info("Loading PaddleOCR...")
            self.paddle_ocr = PaddleOCREngine(device="cpu")
            self.paddle_ocr.load()
            logger.info("✅ PaddleOCR loaded")
            
            # 4. Silero VAD (CPU)
            logger.info("Loading Silero VAD...")
            self.silero_vad = SileroVAD(device="cpu")
            self.silero_vad.load()
            logger.info("✅ Silero VAD loaded")
            
            # 5. Gaze Estimator (CPU)
            logger.info("Loading MediaPipe Gaze Estimator...")
            self.gaze_estimator = GazeEstimator(device="cpu")
            self.gaze_estimator.load()
            logger.info("✅ Gaze Estimator loaded")
        
        # Run blocking load in thread pool
        await loop.run_in_executor(self.executor, load_all)
    
    async def analyze_frame(
        self,
        candidate_id: str,
        room_id: str,
        frame_data: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze a single frame using all AI models
        
        Args:
            candidate_id: Candidate user ID
            room_id: Room identifier
            frame_data: Dict containing:
                - camera: {"image": np.ndarray (HxWx3, uint8, RGB), "timestamp": int}
                - screen: {"image": np.ndarray (HxWx3, uint8, RGB), "timestamp": int}
                - audio: {"buffer": np.ndarray (float32, mono), "timestamp": int}
        
        Returns:
            Dict containing:
                - timestamp: int
                - candidate_id: str
                - room_id: str
                - analyses: List[Dict] (5 analysis types)
                - processing_time_ms: int
        """
        if not self.models_loaded:
            logger.error("Models not loaded - cannot analyze frame")
            return self._create_error_response(
                candidate_id,
                room_id,
                "Models not loaded"
            )
        
        start_time = time.time()
        
        # Validate frame_data
        if frame_data is None:
            logger.warning("No frame_data provided")
            return self._create_error_response(
                candidate_id,
                room_id,
                "No frame data provided"
            )
        
        # Extract frames
        camera_frame = frame_data.get("camera")
        screen_frame = frame_data.get("screen")
        audio_buffer = frame_data.get("audio")
        
        # Create base response
        response = self._create_base_response(candidate_id, room_id)
        
        try:
            # Run all analyses concurrently (where possible)
            analyses = await self._run_all_analyses(
                camera_frame,
                screen_frame,
                audio_buffer,
                candidate_id
            )
            
            response["analyses"] = analyses
            
            # Determine scenario based on alerts
            response["scenario"] = self._determine_scenario(analyses)
            
            # Update statistics
            self.stats["frames_analyzed"] += 1
            
        except Exception as e:
            logger.error(f"Analysis error for {candidate_id}: {e}")
            self.stats["errors"] += 1
            response["error"] = str(e)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        response["processing_time_ms"] = processing_time_ms
        
        self.stats["total_inference_time_ms"] += processing_time_ms
        
        logger.debug(
            f"Analyzed frame for {candidate_id}: "
            f"{len(response['analyses'])} analyses, {processing_time_ms}ms"
        )
        
        return response
    
    async def _run_all_analyses(
        self,
        camera_frame: Optional[Dict],
        screen_frame: Optional[Dict],
        audio_buffer: Optional[Dict],
        candidate_id: str
    ) -> List[Dict]:
        """
        Run all 5 analyses concurrently
        
        Returns:
            List of analysis dicts
        """
        loop = asyncio.get_event_loop()
        
        # Run analyses in thread pool (CPU-bound)
        tasks = []
        
        # 1. Face Detection (requires camera)
        if camera_frame and camera_frame.get("image") is not None:
            tasks.append(
                loop.run_in_executor(
                    self.executor,
                    self._analyze_face_detection,
                    camera_frame["image"]
                )
            )
        else:
            tasks.append(self._create_no_camera_analysis("face_detection"))
        
        # 2. Face Recognition (requires camera + face detection)
        if camera_frame and camera_frame.get("image") is not None:
            tasks.append(
                loop.run_in_executor(
                    self.executor,
                    self._analyze_face_recognition,
                    camera_frame["image"],
                    candidate_id
                )
            )
        else:
            tasks.append(self._create_no_camera_analysis("face_recognition"))
        
        # 3. Screen Analysis (requires screen)
        if screen_frame and screen_frame.get("image") is not None:
            tasks.append(
                loop.run_in_executor(
                    self.executor,
                    self._analyze_screen,
                    screen_frame["image"]
                )
            )
        else:
            tasks.append(self._create_no_screen_analysis())
        
        # 4. Audio Analysis (requires audio)
        if audio_buffer and audio_buffer.get("buffer") is not None:
            tasks.append(
                loop.run_in_executor(
                    self.executor,
                    self._analyze_audio,
                    audio_buffer["buffer"],
                    audio_buffer.get("sample_rate", 16000)
                )
            )
        else:
            tasks.append(self._create_no_audio_analysis())
        
        # 5. Behavior Analysis (requires camera)
        if camera_frame and camera_frame.get("image") is not None:
            tasks.append(
                loop.run_in_executor(
                    self.executor,
                    self._analyze_behavior,
                    camera_frame["image"]
                )
            )
        else:
            tasks.append(self._create_no_camera_analysis("behavior_analysis"))
        
        # Wait for all analyses to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid results
        analyses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Analysis {i} failed: {result}")
                self.stats["errors"] += 1
            elif result is not None:
                analyses.append(result)
        
        return analyses
    
    # ==================== INDIVIDUAL ANALYSIS METHODS ====================
    
    def _analyze_face_detection(self, camera_image: np.ndarray) -> Dict:
        """
        Run face detection on camera image
        
        Args:
            camera_image: RGB numpy array (HxWx3, uint8)
        
        Returns:
            Analysis dict with face detection results
        """
        start_time = time.time()
        
        try:
            # Run YOLO detection
            count, detections = self.yolo_detector.detect_faces(camera_image)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Determine status and alert
            status = "normal"
            alert = None
            
            if count == 0:
                # No face detected
                status = "no_face"
                incident = get_incident_info(IncidentTypes.A1_NO_FACE)
                alert = {
                    "type": IncidentTypes.A1_NO_FACE,
                    "level": incident["default_level"],
                    "message": incident["message"]
                }
            elif count > 1:
                # Multiple faces
                status = "multiple_faces"
                incident = get_incident_info(IncidentTypes.A2_MULTIPLE_FACES)
                alert = {
                    "type": IncidentTypes.A2_MULTIPLE_FACES,
                    "level": incident["default_level"],
                    "message": f"{count} khuôn mặt - " + incident["message"]
                }
            
            # Convert detections to response format
            bounding_boxes = []
            for det in detections:
                bounding_boxes.append({
                    "x": int(det["bbox"][0]),
                    "y": int(det["bbox"][1]),
                    "width": int(det["bbox"][2]),
                    "height": int(det["bbox"][3]),
                    "confidence": float(det["confidence"])
                })
            
            return {
                "type": "face_detection",
                "result": {
                    "faces_detected": count,
                    "confidence": float(detections[0]["confidence"]) if count > 0 else 0.0,
                    "bounding_boxes": bounding_boxes,
                    "status": status,
                    "alert": alert
                }
            }
            
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return self._create_error_analysis("face_detection", str(e))
    
    def _analyze_face_recognition(
        self,
        camera_image: np.ndarray,
        candidate_id: str
    ) -> Dict:
        """
        Run face recognition/verification
        
        Args:
            camera_image: RGB numpy array (HxWx3, uint8)
            candidate_id: Candidate ID (for KYC lookup)
        
        Returns:
            Analysis dict with face recognition results
        """
        start_time = time.time()
        
        try:
            # First detect face
            count, detections = self.yolo_detector.detect_faces(camera_image)
            
            if count == 0:
                # No face to recognize
                return {
                    "type": "face_recognition",
                    "result": {
                        "is_verified": False,
                        "similarity_score": 0.0,
                        "kyc_image_id": None,
                        "status": "no_face",
                        "alert": None
                    }
                }
            
            # Crop face from image
            face_bbox = detections[0]["bbox"]
            x1, y1, w, h = face_bbox
            x2, y2 = x1 + w, y1 + h
            
            # Ensure coordinates are within image bounds
            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(camera_image.shape[1], int(x2))
            y2 = min(camera_image.shape[0], int(y2))
            
            face_crop = camera_image[y1:y2, x1:x2]
            
            # Get face embedding
            embedding = self.arcface_model.infer(face_crop)
            
            # Check if embedding extraction succeeded
            if embedding is None or not isinstance(embedding, np.ndarray):
                logger.warning(f"Failed to extract embedding for candidate {candidate_id}")
                return {
                    "type": "face_recognition",
                    "result": {
                        "is_verified": False,
                        "similarity_score": 0.0,
                        "kyc_image_id": None,
                        "status": "embedding_failed",
                        "alert": None
                    }
                }
            
            # TODO: In production, fetch KYC embedding from database using candidate_id
            # Fetch KYC embedding from DB (cached for performance)
            if not hasattr(self, "_kyc_cache"):
                self._kyc_cache = {}
            kyc_embedding = self._kyc_cache.get(candidate_id)
            if kyc_embedding is None:
                try:
                    from kyc_service import get_kyc_embedding as _get_kyc
                    kyc_list = _get_kyc(candidate_id)
                    if kyc_list is not None:
                        kyc_embedding = np.array(kyc_list, dtype=np.float32)
                        # Normalize if not already
                        norm = np.linalg.norm(kyc_embedding)
                        if norm > 0:
                            kyc_embedding = kyc_embedding / norm
                        self._kyc_cache[candidate_id] = kyc_embedding
                except Exception as e:
                    logger.warning(f"KYC fetch error: {e}")
                    kyc_embedding = None
            
            # Verify face (if KYC available)
            if kyc_embedding is not None:
                is_match, similarity = self.arcface_model.verify_face(
                    embedding,
                    kyc_embedding,
                    threshold=self.kyc_threshold
                )
            else:
                # No KYC to compare - skip verification
                is_match = True
                similarity = 1.0
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Determine status and alert
            status = "verified" if is_match else "not_verified"
            alert = None
            
            if not is_match:
                incident = get_incident_info(IncidentTypes.A3_FACE_MISMATCH)
                alert = {
                    "type": IncidentTypes.A3_FACE_MISMATCH,
                    "level": incident["default_level"],
                    "message": incident["message"]
                }
            
            return {
                "type": "face_recognition",
                "result": {
                    "is_verified": is_match,
                    "similarity_score": float(similarity),
                    "kyc_image_id": f"kyc_{candidate_id}",
                    "status": status,
                    "alert": alert
                }
            }
            
        except Exception as e:
            logger.error(f"Face recognition error: {e}")
            return self._create_error_analysis("face_recognition", str(e))
    
    def _analyze_screen(self, screen_image: np.ndarray) -> Dict:
        """
        Run OCR on screen capture
        
        Args:
            screen_image: RGB numpy array (HxWx3, uint8)
        
        Returns:
            Analysis dict with screen analysis results
        """
        start_time = time.time()
        
        try:
            # Run OCR
            text, regions = self.paddle_ocr.extract_text(screen_image)
            
            # Detect suspicious keywords
            suspicious_keywords = self.paddle_ocr.detect_keywords(
                screen_image,
                keywords=["google", "search", "chatgpt", "messenger", "zalo"]
            )
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Calculate suspicion score
            suspicious_score = len(suspicious_keywords) / 10.0
            suspicious_score = min(suspicious_score, 1.0)
            
            # Determine status and alert
            status = "clean"
            alert = None
            
            if suspicious_score > 0.7:
                status = "violation"
                
                # Determine incident type based on keywords
                if any(kw in ["google", "search", "chatgpt"] for kw in suspicious_keywords):
                    incident = get_incident_info(IncidentTypes.B1_SEARCH_ENGINE)
                    alert = {
                        "type": IncidentTypes.B1_SEARCH_ENGINE,
                        "level": incident["default_level"],
                        "message": incident["message"]
                    }
                elif any(kw in ["messenger", "zalo"] for kw in suspicious_keywords):
                    incident = get_incident_info(IncidentTypes.B2_CHAT_APP)
                    alert = {
                        "type": IncidentTypes.B2_CHAT_APP,
                        "level": incident["default_level"],
                        "message": incident["message"]
                    }
            elif suspicious_score > 0.3:
                status = "suspicious"
            
            return {
                "type": "screen_analysis",
                "result": {
                    "ocr_text": text[:500],  # Truncate to 500 chars
                    "detected_apps": [],  # TODO: App detection
                    "suspicious_keywords": suspicious_keywords,
                    "suspicious_score": float(suspicious_score),
                    "status": status,
                    "alert": alert
                }
            }
            
        except Exception as e:
            logger.error(f"Screen analysis error: {e}")
            return self._create_error_analysis("screen_analysis", str(e))
    
    def _analyze_audio(self, audio_buffer: np.ndarray, sample_rate: int) -> Dict:
        """
        Run voice activity detection on audio
        
        Args:
            audio_buffer: Audio waveform (float32, mono)
            sample_rate: Sample rate in Hz
        
        Returns:
            Analysis dict with audio analysis results
        """
        start_time = time.time()
        
        try:
            # Check if VAD is loaded
            if not self.silero_vad.is_loaded:
                return {
                    "type": "audio_analysis",
                    "result": {
                        "voice_detected": False,
                        "speaking_duration": 0.0,
                        "num_speakers": 0,
                        "confidence": 0.0,
                        "status": "vad_not_loaded",
                        "alert": None
                    }
                }
            
            # Run VAD
            result = self.silero_vad.infer(audio_buffer)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            voice_detected = result["speaking"]
            speech_duration = result["duration"]
            
            # Determine status and alert
            status = "speaking" if voice_detected else "silent"
            alert = None
            
            if voice_detected and speech_duration > 1.0:
                incident = get_incident_info(IncidentTypes.C1_VOICE_DETECTED)
                alert = {
                    "type": IncidentTypes.C1_VOICE_DETECTED,
                    "level": incident["default_level"],
                    "message": incident["message"]
                }
            
            return {
                "type": "audio_analysis",
                "result": {
                    "voice_detected": voice_detected,
                    "speaking_duration": float(speech_duration),
                    "num_speakers": 1 if voice_detected else 0,  # TODO: Speaker diarization
                    "confidence": float(result.get("confidence", 1.0)),
                    "status": status,
                    "alert": alert
                }
            }
            
        except Exception as e:
            logger.error(f"Audio analysis error: {e}")
            return self._create_error_analysis("audio_analysis", str(e))
    
    def _analyze_behavior(self, camera_image: np.ndarray) -> Dict:
        """
        Run gaze estimation and behavior analysis
        
        Args:
            camera_image: RGB numpy array (HxWx3, uint8)
        
        Returns:
            Analysis dict with behavior analysis results
        """
        start_time = time.time()
        
        try:
            # Run gaze estimation
            result = self.gaze_estimator.infer(camera_image)
            
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Get direction from result (gaze_direction is the correct key)
            gaze_direction = result.get("gaze_direction", "center")
            
            # Determine status and alert
            status = "normal"
            alert = None
            
            if gaze_direction != "center":
                status = "looking_away"
                incident = get_incident_info(IncidentTypes.D1_LOOKING_AWAY)
                alert = {
                    "type": IncidentTypes.D1_LOOKING_AWAY,
                    "level": incident["default_level"],
                    "message": incident["message"]
                }
            
            return {
                "type": "behavior_analysis",
                "result": {
                    "gaze_direction": gaze_direction,
                    "looking_away_duration": 0.0,  # TODO: Track duration
                    "left_camera": False,
                    "movement_score": 0.0,  # TODO: Movement detection
                    "status": status,
                    "alert": alert
                }
            }
            
        except Exception as e:
            logger.error(f"Behavior analysis error: {e}")
            return self._create_error_analysis("behavior_analysis", str(e))
    
    # ==================== HELPER METHODS ====================
    
    async def _create_no_camera_analysis(self, analysis_type: str) -> Dict:
        """Create placeholder analysis when camera not available"""
        return {
            "type": analysis_type,
            "result": {
                "status": "no_camera",
                "alert": None
            }
        }
    
    async def _create_no_screen_analysis(self) -> Dict:
        """Create placeholder analysis when screen not available"""
        return {
            "type": "screen_analysis",
            "result": {
                "ocr_text": "",
                "detected_apps": [],
                "suspicious_keywords": [],
                "suspicious_score": 0.0,
                "status": "no_screen",
                "alert": None
            }
        }
    
    async def _create_no_audio_analysis(self) -> Dict:
        """Create placeholder analysis when audio not available"""
        return {
            "type": "audio_analysis",
            "result": {
                "voice_detected": False,
                "speaking_duration": 0.0,
                "num_speakers": 0,
                "confidence": 1.0,
                "status": "no_audio",
                "alert": None
            }
        }
    
    def _create_error_analysis(self, analysis_type: str, error_msg: str) -> Dict:
        """Create error analysis result"""
        return {
            "type": analysis_type,
            "result": {
                "status": "error",
                "error": error_msg,
                "alert": None
            }
        }
    
    def _create_error_response(
        self,
        candidate_id: str,
        room_id: str,
        error_msg: str
    ) -> Dict:
        """Create error response"""
        return {
            "timestamp": int(time.time() * 1000),
            "candidate_id": candidate_id,
            "room_id": room_id,
            "error": error_msg,
            "analyses": [],
            "scenario": "error",
            "processing_time_ms": 0
        }
    
    def _determine_scenario(self, analyses: List[Dict]) -> str:
        """
        Determine overall scenario based on alerts in analyses
        
        Priority (highest to lowest):
        1. Multiple faces (A2)
        2. Face mismatch (A3)
        3. No face (A1)
        4. Search engine/Chat app (B1/B2)
        5. Voice detected (C1)
        6. Looking away (D1)
        7. Normal (no alerts)
        
        Args:
            analyses: List of analysis results
        
        Returns:
            str: Scenario name
        """
        from .incident_types import IncidentTypes
        
        # Collect all alerts
        alerts = []
        for analysis in analyses:
            alert = analysis.get("result", {}).get("alert")
            if alert:
                alerts.append(alert["type"])
        
        # No alerts = normal
        if not alerts:
            return "normal"
        
        # Check alerts by priority
        if IncidentTypes.A2_MULTIPLE_FACES in alerts:
            return "multiple_faces"
        elif IncidentTypes.A3_FACE_MISMATCH in alerts:
            return "face_mismatch"
        elif IncidentTypes.A1_NO_FACE in alerts:
            return "no_face"
        elif IncidentTypes.B1_SEARCH_ENGINE in alerts:
            return "search_engine"
        elif IncidentTypes.B2_CHAT_APP in alerts:
            return "chat_app"
        elif IncidentTypes.C1_VOICE_DETECTED in alerts:
            return "voice_detected"
        elif IncidentTypes.D1_LOOKING_AWAY in alerts:
            return "looking_away"
        else:
            # Unknown alert type
            return "suspicious"
    
    def get_stats(self) -> Dict:
        """Get analyzer statistics"""
        stats = self.stats.copy()
        
        if stats["frames_analyzed"] > 0:
            stats["avg_inference_time_ms"] = (
                stats["total_inference_time_ms"] / stats["frames_analyzed"]
            )
        else:
            stats["avg_inference_time_ms"] = 0
        
        return stats
    
    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            "frames_analyzed": 0,
            "total_inference_time_ms": 0,
            "errors": 0,
            "cache_hits": 0
        }
    
    async def cleanup(self):
        """Clean up resources"""
        logger.info("Cleaning up RealAIAnalyzer...")
        
        # Cleanup models
        if self.yolo_detector:
            self.yolo_detector.cleanup()
        if self.arcface_model:
            self.arcface_model.cleanup()
        if self.paddle_ocr:
            self.paddle_ocr.cleanup()
        if self.silero_vad:
            self.silero_vad.cleanup()
        if self.gaze_estimator:
            self.gaze_estimator.cleanup()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        logger.info("RealAIAnalyzer cleanup complete")


# Global instance (lazy initialized)
_real_analyzer: Optional[RealAIAnalyzer] = None


async def get_real_analyzer(use_mock: bool = False) -> RealAIAnalyzer:
    """
    Get or create global RealAIAnalyzer instance
    
    Args:
        use_mock: Use mock adapters (for testing)
    
    Returns:
        RealAIAnalyzer instance (loaded and ready)
    """
    global _real_analyzer
    
    if _real_analyzer is None:
        logger.info("Creating RealAIAnalyzer instance...")
        _real_analyzer = RealAIAnalyzer(use_mock=use_mock)
        
        # Load models
        success = await _real_analyzer.load_models()
        
        if not success:
            logger.error("Failed to load models")
            raise RuntimeError(f"Model loading failed: {_real_analyzer.loading_error}")
    
    return _real_analyzer
