import asyncio
import logging
from typing import Dict, Optional
from dataclasses import dataclass

try:
    from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack, RTCIceCandidate
    from aiortc.sdp import candidate_from_sdp
    try:
        from aiortc.sdp import candidate_to_sdp
    except Exception:
        candidate_to_sdp = None
    AIORTC_AVAILABLE = True
    print("[SFU_SERVICE] Import aiortc thành công, AIORTC_AVAILABLE = True")
except ImportError as e:
    AIORTC_AVAILABLE = False
    RTCPeerConnection = None
    RTCSessionDescription = None
    MediaStreamTrack = None
    RTCIceCandidate = None
    candidate_from_sdp = None
    candidate_to_sdp = None
    print(f"[SFU_SERVICE] Import aiortc thất bại: {e}, AIORTC_AVAILABLE = False")

logger = logging.getLogger(__name__)


@dataclass
class CandidateConnection:
    """Đại diện cho kết nối WebRTC của thí sinh."""
    pc: 'RTCPeerConnection'
    user_id: str
    room_id: str
    camera_track: Optional['MediaStreamTrack'] = None
    screen_track: Optional['MediaStreamTrack'] = None
    audio_track: Optional['MediaStreamTrack'] = None
    track_labels: dict = None  # ánh xạ trackId -> nhãn (camera/screen/audio)
    
    def __post_init__(self):
        if self.track_labels is None:
            self.track_labels = {}


@dataclass
class ProctorConnection:
    """Đại diện cho kết nối WebRTC của giám thị (proctor)."""
    pc: 'RTCPeerConnection'
    user_id: str
    room_id: str


class SFUManager:
    """
    Quản lý các kết nối WebRTC để chuyển tiếp luồng (stream forwarding).

    Luồng tổng quát:
    1) Thí sinh kết nối → Backend nhận các track (camera/screen/audio)
    2) Giám thị kết nối → Backend chuyển tiếp toàn bộ track của thí sinh tới giám thị
    3) Khi thí sinh bật track mới (ví dụ chia sẻ màn hình) → Backend renegotiate với giám thị để thêm track
    """
    
    def __init__(self):
        if not AIORTC_AVAILABLE:
            logger.warning("Không có aiortc - SFU bị vô hiệu hóa")
        
        # room_id -> candidate_user_id -> CandidateConnection
        self._candidates: Dict[str, Dict[str, CandidateConnection]] = {}
        
        # room_id -> ProctorConnection (mỗi phòng chỉ 1 giám thị)
        self._proctors: Dict[str, ProctorConnection] = {}
        
        self._lock = asyncio.Lock()
        
        # Metadata track: track_id -> label (camera/screen/audio)
        self._track_labels: Dict[str, str] = {}
        
        # Offer renegotiation đang chờ (để gửi cho giám thị)
        self._pending_renegotiate = None
        
        # Debounce renegotiation: tránh tạo offer liên tục, gom nhiều track vào 1 lần renegotiate
        self._renegotiate_pending = {}  # room_id -> bool
        
        # Đánh dấu đang renegotiate và chờ answer từ giám thị
        self._renegotiate_in_progress: Dict[str, bool] = {}  # room_id -> bool
        
        # Callback khi offer renegotiate sẵn sàng (để có thể notify main.py ngay)
        self._renegotiate_callback = None
    
    def set_renegotiate_callback(self, callback):
        """Thiết lập callback được gọi khi offer renegotiate đã sẵn sàng."""
        self._renegotiate_callback = callback

    async def _send_ice_to_participant(self, room_id: str, user_id: str, candidate: 'RTCIceCandidate'):
        """Gửi ICE candidate của server tới một participant qua websocket (best-effort)."""
        try:
            if candidate is None:
                return

            # Chuyển ICE candidate của aiortc sang định dạng RTCIceCandidateInit phía trình duyệt
            if candidate_to_sdp is not None:
                cand_sdp = candidate_to_sdp(candidate)
            else:
                # Fallback: một số phiên bản aiortc có to_sdp
                cand_sdp = candidate.to_sdp()  # type: ignore[attr-defined]

            payload = {
                "type": "ice",
                "candidate": {
                    "candidate": f"candidate:{cand_sdp}",
                    "sdpMid": getattr(candidate, "sdpMid", None),
                    "sdpMLineIndex": getattr(candidate, "sdpMLineIndex", None),
                },
                "from": "server",
            }

            # Import runtime để tránh vòng lặp phụ thuộc (circular import)
            import sys
            main_module = sys.modules.get('main')
            if not main_module or not hasattr(main_module, 'rooms'):
                return
            rooms = getattr(main_module, 'rooms')
            room = await rooms.get_or_create(room_id)
            participant = room.participants.get(str(user_id))
            if participant:
                import json
                await participant.websocket.send_text(json.dumps(payload))
        except Exception as e:
            print(f"[SFU] Failed to send ICE to {user_id} in room {room_id}: {e}", flush=True)
    
    async def handle_candidate_offer(
        self, 
        room_id: str, 
        user_id: str, 
        offer_sdp: dict,
        track_info: list = None
    ) -> dict:
        """
        Xử lý offer từ thí sinh và trả về answer SDP.

        Nếu thí sinh đã có kết nối trước đó, đây là renegotiation (ví dụ: thí sinh bật chia sẻ màn hình).
        """
        if not AIORTC_AVAILABLE:
            raise RuntimeError("aiortc not available")
        
        print(f"[DEBUG] Bắt đầu handle_candidate_offer cho {user_id}", flush=True)
        
        async with self._lock:
            print(f"[DEBUG] Đã giữ lock cho {user_id}", flush=True)
            
            # Kiểm tra có phải renegotiation không (thí sinh đã kết nối từ trước)
            existing_candidates = self._candidates.get(room_id, {})
            existing_conn = existing_candidates.get(user_id)
            
            if existing_conn:
                print(f"[RENEGOTIATE] Thí sinh {user_id} đang renegotiate (ví dụ: thêm chia sẻ màn hình)", flush=True)
                # Đây là renegotiation - cập nhật kết nối hiện có
                pc = existing_conn.pc
                
                # Cập nhật track info
                if track_info:
                    for info in track_info:
                        track_id = info.get('trackId')
                        label = info.get('label')
                        if track_id and label:
                            existing_conn.track_labels[track_id] = label
                            self._track_labels[track_id] = label
                
                print(f"[RENEGOTIATE] Track info sau cập nhật: {existing_conn.track_labels}", flush=True)
                
                # Set remote description mới (offer mới từ thí sinh)
                await pc.setRemoteDescription(RTCSessionDescription(
                    sdp=offer_sdp['sdp'],
                    type=offer_sdp['type']
                ))
                
                print(f"[RENEGOTIATE] Đã set remote description mới, tạo answer", flush=True)
                
                # Tạo answer mới
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                
                print(f"[RENEGOTIATE] Đã tạo answer cho {user_id}, track sẽ được nhận trong on_track", flush=True)
                
                return {
                    "sdp": pc.localDescription.sdp,
                    "type": pc.localDescription.type
                }
            
            # Không phải renegotiation - tạo kết nối mới
            print(f"[DEBUG] Tạo kết nối mới cho {user_id}", flush=True)
            
            # Tạo peer connection cho thí sinh
            pc = RTCPeerConnection()
            print(f"[DEBUG] Đã tạo RTCPeerConnection cho {user_id}", flush=True)

            # Trickle ICE từ server -> thí sinh
            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                # Gửi về thí sinh qua websocket (best-effort)
                await self._send_ice_to_participant(room_id=room_id, user_id=user_id, candidate=candidate)
            
            # Chuẩn bị nhãn track (camera/screen/audio)
            track_labels = {}
            if track_info:
                for info in track_info:
                    track_id = info.get('trackId')
                    label = info.get('label')
                    if track_id and label:
                        track_labels[track_id] = label
                        self._track_labels[track_id] = label
            
            candidate_conn = CandidateConnection(
                pc=pc,
                user_id=user_id,
                room_id=room_id,
                track_labels=track_labels
            )
            print(f"[DEBUG] Đã tạo CandidateConnection cho {user_id}", flush=True)
            
            print(f"Candidate {user_id} track info: {track_labels}")
            
            print(f"[DEBUG] About to setup track handlers for {user_id}", flush=True)
            
            # Nhận các track từ thí sinh
            @pc.on("track")
            async def on_track(track):
                print(f"[TRACK] Received track from candidate {user_id}: kind={track.kind}, id={track.id}", flush=True)
                
                # Xác định loại track dựa vào track_info lưu trong candidate_conn
                track_label = candidate_conn.track_labels.get(track.id, '')
                print(f"[TRACK] Track label for {track.id}: '{track_label}'", flush=True)
                
                if track.kind == "video":
                    if track_label == "camera":
                        candidate_conn.camera_track = track
                        print(f"Set camera track for candidate {user_id}")
                    elif track_label == "screen":
                        candidate_conn.screen_track = track
                        print(f"Set screen track for candidate {user_id}")
                    else:
                        # Fallback: video đầu tiên = camera, video thứ hai = screen
                        if not candidate_conn.camera_track:
                            candidate_conn.camera_track = track
                            print(f"Set camera track (fallback) for {user_id}")
                        else:
                            candidate_conn.screen_track = track
                            print(f"Set screen track (fallback) for {user_id}")
                
                elif track.kind == "audio":
                    candidate_conn.audio_track = track
                    print(f"Set audio track for candidate {user_id}")
                
                # Nếu có giám thị, kích hoạt renegotiate ở background để không block on_track
                proctor_conn = self._proctors.get(room_id)
                print(f"[DEBUG] on_track: proctor_conn={proctor_conn}, renegotiate_pending={self._renegotiate_pending.get(room_id)}", flush=True)
                
                # Luôn cho phép renegotiate khi có track mới (screen share có thể bật sau)
                if proctor_conn:
                    # Kiểm tra có nên trigger renegotiate không
                    should_renegotiate = False
                    
                    if not self._renegotiate_pending.get(room_id):
                        # Hiện không renegotiate
                        should_renegotiate = True
                    elif track.kind == "video" and track_label == "screen":
                        # Thêm screen share - ép renegotiate kể cả khi đang pending
                        print("[RENEGOTIATE] Phát hiện screen track, ép renegotiate", flush=True)
                        should_renegotiate = True
                        # Chờ chút để renegotiation trước đó hoàn tất
                        await asyncio.sleep(0.3)
                    
                    if should_renegotiate:
                        self._renegotiate_pending[room_id] = True
                        print(f"[RENEGOTIATE] Trigger renegotiate cho {user_id} (track: {track_label or track.kind})", flush=True)
                        
                        # Chạy renegotiation dưới dạng background task
                        asyncio.create_task(self._do_renegotiation(
                            room_id=room_id,
                            user_id=user_id,
                            candidate_conn=candidate_conn,
                            proctor_conn=proctor_conn,
                            is_screen_track=(track.kind == "video" and track_label == "screen"),
                            rooms_manager=True  # bật gửi offer trực tiếp qua websocket
                        ))
            
            @pc.on("connectionstatechange")
            async def on_connection_state():
                print(f"[CONNSTATE] Candidate {user_id} connection state: {pc.connectionState}", flush=True)
                if pc.connectionState in ["failed", "closed"]:
                    await self._cleanup_candidate(room_id, user_id)
            
            print(f"[DEBUG] Chuẩn bị setRemoteDescription cho {user_id}", flush=True)
            
            # Set remote description (offer từ thí sinh)
            await pc.setRemoteDescription(RTCSessionDescription(
                sdp=offer_sdp['sdp'],
                type=offer_sdp['type']
            ))
            
            print(f"[DEBUG] Đã set remote description cho thí sinh {user_id}", flush=True)
            print(f"[DEBUG] Transceivers: {len(pc.getTransceivers())}", flush=True)
            for idx, transceiver in enumerate(pc.getTransceivers()):
                print(f"[DEBUG]   Transceiver {idx}: mid={transceiver.mid}, direction={transceiver.direction}, kind={transceiver.receiver.track.kind if transceiver.receiver.track else 'None'}", flush=True)
            
            print(f"[DEBUG] Chuẩn bị createAnswer cho {user_id}", flush=True)
            
            # Tạo answer
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            
            print(f"[DEBUG] Đã tạo và set answer cho {user_id}", flush=True)
            
            # Lưu connection
            if room_id not in self._candidates:
                self._candidates[room_id] = {}
            self._candidates[room_id][user_id] = candidate_conn
            
            print(f"Đã tạo answer cho thí sinh {user_id} trong phòng {room_id}")
            
            # Ghi chú: renegotiation với giám thị sẽ tự diễn ra trong on_track khi track được nhận.
            
            return {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }
    
    async def handle_proctor_offer(
        self,
        room_id: str,
        user_id: str,
        offer_sdp: dict
    ) -> dict:
        """
        Xử lý offer từ giám thị và trả về answer SDP cho offer ban đầu.

        Lưu ý quan trọng:
        - Offer của giám thị có thể không có m-line audio/video (ví dụ chỉ datachannel).
        - Nếu thêm media track trước khi trả lời có thể làm sai hướng (direction) khi aiortc negotiate.
        - Vì vậy: trả lời (answer) trước, sau đó server chủ động renegotiate để thêm các track đang có.
        """
        if not AIORTC_AVAILABLE:
            raise RuntimeError("aiortc not available")
        
        async with self._lock:
            # Tạo peer connection cho giám thị
            pc = RTCPeerConnection()

            # Trickle ICE từ server -> giám thị
            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                await self._send_ice_to_participant(room_id=room_id, user_id=user_id, candidate=candidate)
            
            proctor_conn = ProctorConnection(
                pc=pc,
                user_id=user_id,
                room_id=room_id
            )
            
            @pc.on("connectionstatechange")
            async def on_connection_state():
                print(f"Proctor {user_id} connection state: {pc.connectionState}")
                if pc.connectionState in ["failed", "closed"]:
                    await self._cleanup_proctor(room_id)
            
            # Set remote description (offer từ giám thị)
            await pc.setRemoteDescription(RTCSessionDescription(
                sdp=offer_sdp['sdp'],
                type=offer_sdp['type']
            ))
            
            # Tạo answer
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            
            # Lưu proctor connection
            self._proctors[room_id] = proctor_conn
            
            print(f"Đã tạo answer cho giám thị {user_id} trong phòng {room_id}")

            # Nếu đã có thí sinh trước đó (giám thị vào muộn), server tạo renegotiation để thêm toàn bộ track hiện có.
            asyncio.create_task(self._renegotiate_proctor_add_all_existing_tracks(room_id))
            
            return {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type
            }

    async def _renegotiate_proctor_add_all_existing_tracks(self, room_id: str):
        """Server chủ động renegotiate để thêm toàn bộ track của thí sinh đang có."""
        if not AIORTC_AVAILABLE:
            return

        try:
            # Cho client một chút thời gian áp dụng answer ban đầu.
            await asyncio.sleep(0.1)

            async with self._lock:
                proctor_conn = self._proctors.get(room_id)
                if not proctor_conn:
                    return

                # Tránh renegotiate chồng chéo.
                if self._renegotiate_in_progress.get(room_id, False):
                    return

                candidates = self._candidates.get(room_id, {})
                if not candidates:
                    return

                existing_track_ids = set()
                for sender in proctor_conn.pc.getSenders():
                    if sender.track:
                        existing_track_ids.add(sender.track.id)

                added_count = 0
                for candidate_id, candidate_conn in candidates.items():
                    if candidate_conn.camera_track and candidate_conn.camera_track.id not in existing_track_ids:
                        proctor_conn.pc.addTrack(candidate_conn.camera_track)
                        existing_track_ids.add(candidate_conn.camera_track.id)
                        added_count += 1
                    if candidate_conn.screen_track and candidate_conn.screen_track.id not in existing_track_ids:
                        proctor_conn.pc.addTrack(candidate_conn.screen_track)
                        existing_track_ids.add(candidate_conn.screen_track.id)
                        added_count += 1
                    if candidate_conn.audio_track and candidate_conn.audio_track.id not in existing_track_ids:
                        proctor_conn.pc.addTrack(candidate_conn.audio_track)
                        existing_track_ids.add(candidate_conn.audio_track.id)
                        added_count += 1

                if added_count <= 0:
                    return

                offer = await proctor_conn.pc.createOffer()
                await proctor_conn.pc.setLocalDescription(offer)

                self._renegotiate_in_progress[room_id] = True
                self._pending_renegotiate = {
                    "sdp": proctor_conn.pc.localDescription.sdp,
                    "type": proctor_conn.pc.localDescription.type,
                    "room_id": room_id,
                    "proctor_id": proctor_conn.user_id,
                    "candidate_id": "bulk"
                }

                # Gửi offer trực tiếp cho giám thị qua WebSocket (best-effort)
                try:
                    import json
                    import sys
                    main_module = sys.modules.get('main')
                    if main_module and hasattr(main_module, 'rooms'):
                        rooms = main_module.rooms
                        room = await rooms.get_or_create(room_id)
                        proctor_participant = room.participants.get(proctor_conn.user_id)
                        if proctor_participant:
                            await proctor_participant.websocket.send_text(json.dumps({
                                "type": "offer",
                                "sdp": {
                                    "sdp": self._pending_renegotiate["sdp"],
                                    "type": self._pending_renegotiate["type"],
                                },
                                "from": "server",
                                "renegotiate": True,
                                "candidate_id": "bulk",
                            }))
                            print(f"[SFU] Đã gửi bulk renegotiation offer tới giám thị {proctor_conn.user_id} (room {room_id})", flush=True)
                except Exception as e:
                    print(f"[SFU] Failed to send bulk renegotiation offer: {e}", flush=True)

        except Exception as e:
            print(f"[SFU] Bulk renegotiation error in room {room_id}: {e}", flush=True)
            import traceback
            traceback.print_exc()
    
    async def _do_renegotiation(
        self,
        room_id: str,
        user_id: str,
        candidate_conn: CandidateConnection,
        proctor_conn: ProctorConnection,
        is_screen_track: bool = False,
        rooms_manager = None  # Pass RoomManager to send directly
    ):
        """
        Thực hiện renegotiation ở background task để tránh block on_track.
        """
        try:
            # Chờ một chút để track tới đủ.
            # Với screen share (thường chỉ 1 track) thì chờ ít hơn.
            if is_screen_track:
                await asyncio.sleep(0.05)  # 50ms for screen share
            else:
                await asyncio.sleep(0.2)   # 200ms for initial connection (multiple tracks)
            
            print(f"[RENEGOTIATE] Checking tracks from {user_id} to add to proctor", flush=True)
            
            # Lấy danh sách track id đã có bên proctor
            existing_track_ids = set()
            for sender in proctor_conn.pc.getSenders():
                if sender.track:
                    existing_track_ids.add(sender.track.id)
            
            print(f"[RENEGOTIATE] Existing tracks in proctor: {existing_track_ids}", flush=True)
            
            # Chỉ add các track MỚI từ thí sinh.
            # Lưu ý: với aiortc, trong cùng process có thể dùng chung object track để add sang PC khác.
            track_count = 0
            
            if candidate_conn.camera_track and candidate_conn.camera_track.id not in existing_track_ids:
                # Add track trực tiếp (aiortc cho phép trong cùng process)
                proctor_conn.pc.addTrack(candidate_conn.camera_track)
                print(f"[RENEGOTIATE] ✅ Added camera track directly (id={candidate_conn.camera_track.id})", flush=True)
                track_count += 1
            elif candidate_conn.camera_track:
                print(f"  - Skipped camera track (already added)", flush=True)
                
            if candidate_conn.screen_track and candidate_conn.screen_track.id not in existing_track_ids:
                # Add track trực tiếp
                proctor_conn.pc.addTrack(candidate_conn.screen_track)
                print(f"[RENEGOTIATE] ✅ Added screen track directly (id={candidate_conn.screen_track.id})", flush=True)
                track_count += 1
            elif candidate_conn.screen_track:
                print(f"  - Skipped screen track (already added)", flush=True)
                
            if candidate_conn.audio_track and candidate_conn.audio_track.id not in existing_track_ids:
                # Add track trực tiếp
                proctor_conn.pc.addTrack(candidate_conn.audio_track)
                print(f"[RENEGOTIATE] ✅ Added audio track directly (id={candidate_conn.audio_track.id})", flush=True)
                track_count += 1
            elif candidate_conn.audio_track:
                print(f"  - Skipped audio track (already added)", flush=True)
            
            print(f"[RENEGOTIATE] Total NEW tracks added: {track_count}", flush=True)
            
            # Chỉ tạo offer nếu có track mới được add
            if track_count > 0:
                print(f"[RENEGOTIATE] Starting createOffer()...", flush=True)
                # Tạo offer mới để renegotiate
                offer = await proctor_conn.pc.createOffer()
                print(f"[RENEGOTIATE] createOffer() completed, setting local description...", flush=True)
                await proctor_conn.pc.setLocalDescription(offer)
                print(f"[RENEGOTIATE] setLocalDescription() completed", flush=True)
                
                # Đánh dấu đang renegotiate
                self._renegotiate_in_progress[room_id] = True
                
                # Lưu offer để gửi cho proctor
                self._pending_renegotiate = {
                    "sdp": proctor_conn.pc.localDescription.sdp,
                    "type": proctor_conn.pc.localDescription.type,
                    "room_id": room_id,
                    "proctor_id": proctor_conn.user_id,
                    "candidate_id": user_id
                }
                print(f"[RENEGOTIATE] Created offer, stored for delivery to proctor", flush=True)
                
                # Nếu có rooms_manager, gửi offer trực tiếp tới proctor
                if rooms_manager:
                    print(f"[RENEGOTIATE] Sending offer directly to proctor via WebSocket", flush=True)
                    try:
                        import json
                        # Import at runtime to avoid circular dependency
                        import sys
                        main_module = sys.modules.get('main')
                        if main_module and hasattr(main_module, 'rooms'):
                            rooms = main_module.rooms
                            room = await rooms.get_or_create(room_id)
                            proctor_participant = room.participants.get(proctor_conn.user_id)
                            if proctor_participant:
                                await proctor_participant.websocket.send_text(json.dumps({
                                    "type": "offer",
                                    "sdp": {
                                        "sdp": self._pending_renegotiate["sdp"],
                                        "type": self._pending_renegotiate["type"]
                                    },
                                    "from": "server",
                                    "renegotiate": True,
                                    "candidate_id": user_id  # thêm candidate_id để frontend map track
                                }))
                                print(f"[SFU] Sent renegotiation offer to proctor {proctor_conn.user_id} for candidate {user_id}", flush=True)
                            else:
                                print(f"[SFU] Warning: Proctor {proctor_conn.user_id} not found in room participants", flush=True)
                        else:
                            print("[RENEGOTIATE] main module chưa load, fallback polling", flush=True)
                    except Exception as e:
                        print(f"[RENEGOTIATE] Error sending offer directly: {e}", flush=True)
                        import traceback
                        traceback.print_exc()
            else:
                print("[RENEGOTIATE] Không có track mới, bỏ qua tạo offer", flush=True)
            
            self._renegotiate_pending[room_id] = False
            
        except Exception as e:
            print(f"[RENEGOTIATE] Error during renegotiation: {e}", flush=True)
            import traceback
            traceback.print_exc()
            self._renegotiate_pending[room_id] = False
    
    async def handle_proctor_answer(self, room_id: str, answer_sdp: dict):
        """Xử lý answer từ giám thị (phản hồi cho offer renegotiation)."""
        if not AIORTC_AVAILABLE:
            return
        
        async with self._lock:
            proctor_conn = self._proctors.get(room_id)
            if not proctor_conn:
                logger.warning(f"Proctor connection not found for room {room_id}")
                return
            
            pc = proctor_conn.pc
            
            # Kiểm tra signaling state trước khi apply answer
            if pc.signalingState != "have-local-offer":
                print(f"[SFU] WARNING: Cannot apply answer in signaling state '{pc.signalingState}' (expected 'have-local-offer')")
                print(f"[SFU] This is likely a race condition - answer arrived after offer was already answered")
                print(f"[SFU] Ignoring duplicate answer for room {room_id}")
                return
            
            # Kiểm tra có đang chờ answer không
            if not self._renegotiate_in_progress.get(room_id, False):
                print(f"[SFU] WARNING: Received answer but no renegotiation in progress for room {room_id}")
                print(f"[SFU] Ignoring unexpected answer")
                return
            
            # Set remote description (answer từ giám thị)
            await pc.setRemoteDescription(RTCSessionDescription(
                sdp=answer_sdp['sdp'],
                type=answer_sdp['type']
            ))
            
            # Xóa cờ renegotiation
            self._renegotiate_in_progress[room_id] = False
            
            print(f"[SFU] ✅ Applied answer from proctor in room {room_id}, state: {pc.signalingState}")
    
    def get_pending_renegotiate(self):
        """Lấy và xóa offer renegotiation đang chờ."""
        renegotiate = self._pending_renegotiate
        self._pending_renegotiate = None
        return renegotiate
    
    async def add_candidate_tracks_to_proctor(
        self, 
        room_id: str, 
        candidate_id: str,
        camera_track=None,
        screen_track=None,
        audio_track=None
    ):
        """
        Thêm track của thí sinh mới vào peer connection của giám thị.
        Sau đó tạo offer mới để trigger renegotiation.
        """
        if not AIORTC_AVAILABLE:
            return
        
        async with self._lock:
            proctor_conn = self._proctors.get(room_id)
            if not proctor_conn:
                logger.warning(f"No proctor in room {room_id} to forward tracks from {candidate_id}")
                return
            
            pc = proctor_conn.pc
            added_count = 0
            
            # Thêm các track mới
            if camera_track:
                pc.addTrack(camera_track)
                added_count += 1
                print(f"[RENEGOTIATE] Added camera track from {candidate_id} to proctor")
            
            if screen_track:
                pc.addTrack(screen_track)
                added_count += 1
                print(f"[RENEGOTIATE] Added screen track from {candidate_id} to proctor")
            
            if audio_track:
                pc.addTrack(audio_track)
                added_count += 1
                print(f"[RENEGOTIATE] Added audio track from {candidate_id} to proctor")
            
            print(f"[RENEGOTIATE] Added {added_count} tracks, creating new offer for proctor")
            
            # Tạo offer mới để trigger renegotiation
            offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            
            # Trả offer để main.py gửi cho giám thị qua WebSocket
            return {
                "sdp": pc.localDescription.sdp,
                "type": pc.localDescription.type,
                "room_id": room_id,
                "proctor_id": proctor_conn.user_id
            }
    
    async def _forward_track_to_proctor(
        self,
        room_id: str,
        track: 'MediaStreamTrack',
        candidate_id: str,
        track_label: str
    ):
        """Chuyển tiếp track mới từ thí sinh lên giám thị (cần renegotiation)."""
        proctor = self._proctors.get(room_id)
        
        if not proctor:
            print(f"Chưa có giám thị trong room {room_id}, track sẽ được add khi giám thị vào")
            return
        
        try:
            # Add track to proctor's peer connection
            proctor.pc.addTrack(track)
            print(f"Added {track_label} track from {candidate_id} to proctor, need renegotiation")
            
            # Ghi chú: renegotiation cần được trigger qua WebSocket.
            # WebSocket handler chính trong main.py sẽ gửi offer/answer tới giám thị.
            
        except Exception as e:
            logger.error(f"Failed to forward track to proctor: {e}")
    
    async def add_ice_candidate(
        self, 
        room_id: str, 
        user_id: str, 
        candidate_dict: dict, 
        is_proctor: bool = False
    ):
        """Thêm ICE candidate vào peer connection."""
        try:
            if is_proctor:
                conn = self._proctors.get(room_id)
                if not conn:
                    logger.warning(f"Proctor connection not found for room {room_id}")
                    return
                pc = conn.pc
            else:
                candidates = self._candidates.get(room_id, {})
                conn = candidates.get(user_id)
                if not conn:
                    logger.warning(f"Candidate {user_id} connection not found in room {room_id}")
                    return
                pc = conn.pc
            
            # Kiểm tra kết nối còn mở không
            if pc.connectionState in ["closed", "failed"]:
                logger.warning(f"Connection for {user_id} is {pc.connectionState}, skipping ICE candidate")
                return
            
            if pc and candidate_dict:
                # Parse ICE candidate từ format browser sang format aiortc
                candidate_str = candidate_dict.get('candidate', '')
                sdp_mid = candidate_dict.get('sdpMid')
                sdp_mline_index = candidate_dict.get('sdpMLineIndex')
                
                if candidate_str and candidate_str != '':
                    # Parse candidate string bằng parser của aiortc
                    ice_candidate = candidate_from_sdp(candidate_str.split(':', 1)[1])
                    ice_candidate.sdpMid = sdp_mid
                    ice_candidate.sdpMLineIndex = sdp_mline_index
                    
                    await pc.addIceCandidate(ice_candidate)
                    print(f"Added ICE candidate for {user_id} (proctor={is_proctor})")
                else:
                    logger.warning(f"Empty ICE candidate from {user_id}")
        
        except Exception as e:
            # Bỏ qua lỗi trong giai đoạn cleanup
            if "NoneType" not in str(e) and "call_exception_handler" not in str(e):
                logger.error(f"Failed to add ICE candidate for {user_id}: {e}")
                import traceback
                traceback.print_exc()
    
    async def _cleanup_candidate(self, room_id: str, user_id: str):
        """Dọn dẹp kết nối của thí sinh."""
        async with self._lock:
            candidates = self._candidates.get(room_id, {})
            if user_id in candidates:
                candidate_conn = candidates[user_id]
                try:
                    # Stop tất cả track trước để tránh lỗi cleanup
                    if candidate_conn.camera_track:
                        candidate_conn.camera_track.stop()
                    if candidate_conn.screen_track:
                        candidate_conn.screen_track.stop()
                    if candidate_conn.audio_track:
                        candidate_conn.audio_track.stop()
                    
                    # Đóng peer connection
                    if candidate_conn.pc.connectionState not in ["closed"]:
                        await candidate_conn.pc.close()
                except Exception as e:
                    logger.error(f"Error closing candidate PC for {user_id}: {e}")
                
                del candidates[user_id]
                
                # Xóa room trong map nếu không còn thí sinh nào
                if not candidates and room_id in self._candidates:
                    del self._candidates[room_id]
                
                print(f"Cleaned up candidate {user_id} from room {room_id}")
    
    async def _cleanup_proctor(self, room_id: str):
        """Dọn dẹp kết nối của giám thị."""
        async with self._lock:
            if room_id in self._proctors:
                proctor_conn = self._proctors[room_id]
                try:
                    # Đóng peer connection
                    if proctor_conn.pc.connectionState not in ["closed"]:
                        await proctor_conn.pc.close()
                except Exception as e:
                    logger.error(f"Error closing proctor PC: {e}")
                
                del self._proctors[room_id]
                
                # Xóa các cờ renegotiation
                self._renegotiate_pending.pop(room_id, None)
                self._renegotiate_in_progress.pop(room_id, None)
                
                print(f"Cleaned up proctor from room {room_id}")
    
    def get_candidate_connection(self, candidate_id: str, room_id: str) -> Optional['CandidateConnection']:
        """
        Lấy CandidateConnection để phục vụ AI analysis.

        Args:
            candidate_id: user_id của thí sinh
            room_id: mã phòng

        Returns:
            CandidateConnection chứa các track, hoặc None nếu không tìm thấy
        """
        candidates = self._candidates.get(room_id, {})
        return candidates.get(candidate_id)
    
    def get_room_stats(self, room_id: str) -> dict:
        """Lấy thống kê nhanh cho một phòng."""
        candidates = list(self._candidates.get(room_id, {}).keys())
        proctor = self._proctors.get(room_id)
        proctor_id = proctor.user_id if proctor else None
        
        return {
            "room_id": room_id,
            "candidates": candidates,
            "candidate_count": len(candidates),
            "proctor": proctor_id,
            "has_proctor": proctor is not None
        }
    
    def is_available(self) -> bool:
        """Kiểm tra SFU có khả dụng không (đã cài aiortc)."""
        return AIORTC_AVAILABLE


# Instance SFU manager dùng toàn cục
sfu_manager = SFUManager()
