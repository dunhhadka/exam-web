from __future__ import annotations

import asyncio
import json
import logging
import warnings
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from rules_engine import rules_engine
from fastapi import UploadFile, File, Form
import shutil
import numpy as np
import httpx
import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError
from kyc_service import (
    save_kyc_profile,
    get_kyc_embedding,
    delete_kyc_profile,
    get_whitelist_images,
    check_session_student_whitelist,
)
from ai_analysis.model_adapters.arcface_model import ArcFaceModel
from ai_analysis.model_adapters.yolo_detector import YOLODetector
import os


def _load_env_file() -> None:
    """Load environment variables from a local .env file (best-effort).

    - No external dependency (python-dotenv) required.
    - Does not override variables already present in the process environment.
    """
    try:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if not os.path.exists(env_path):
            return

        with open(env_path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if not key:
                    continue
                os.environ.setdefault(key, value)
    except Exception as e:
        print(f"[STARTUP] Failed to load .env: {e}")


_load_env_file()
KYC_THRESHOLD = float(os.getenv("KYC_THRESHOLD", "0.5"))
arcface_singleton = None
yolo_singleton = None

_s3_client = None

# Khởi tạo S3 client để làm việc với MinIO (tương thích S3).
def _get_s3_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    endpoint_url = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
    access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    region_name = os.getenv("MINIO_REGION", "us-east-1")

    _s3_client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region_name,
        config=BotoConfig(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    return _s3_client


async def _fetch_whitelist_image_bytes(url_or_key: str) -> Optional[bytes]:
    """Lấy bytes của ảnh từ 2 nguồn:

    - Nếu là URL http(s) thì tải trực tiếp bằng HTTP.
    - Nếu là "key" (đường dẫn object trong MinIO/S3) thì tải qua S3 API.

    Lưu ý: Với bucket MinIO private, bắt buộc dùng credential để gọi S3 API.
    """
    if not url_or_key or not isinstance(url_or_key, str):
        return None

    # Trường hợp 1: URL http(s)
    if url_or_key.startswith("http://") or url_or_key.startswith("https://"):
        async with httpx.AsyncClient() as client:
            resp = await client.get(url_or_key, timeout=10.0)
            if resp.status_code != 200:
                try:
                    ctype = resp.headers.get("content-type")
                except Exception:
                    ctype = None
                print(
                    f"[KYC] Whitelist fetch non-200: url={url_or_key} status={resp.status_code} content-type={ctype}",
                    flush=True,
                )
                return None
            return bytes(resp.content)

    # Trường hợp 2: object key (MinIO/S3)
    bucket = os.getenv("MINIO_BUCKET", "exam-bucket")
    key = url_or_key.lstrip("/")
    try:
        s3 = _get_s3_client()
        obj = s3.get_object(Bucket=bucket, Key=key)
        return obj["Body"].read()
    except (BotoCoreError, ClientError) as e:
        print(f"[KYC] MinIO get_object failed: bucket={bucket} key={key} err={e}", flush=True)
        return None

    # Ẩn một số warning của aioice/asyncio hay xuất hiện lúc cleanup (không ảnh hưởng nghiệp vụ).
warnings.filterwarnings("ignore", message=".*NoneType.*has no attribute.*")
logging.getLogger("aioice").setLevel(logging.ERROR)

try:
    from ml_service import router as ml_router
except ImportError:
    ml_router = None

try:
    from sfu_service import sfu_manager, AIORTC_AVAILABLE
    # Bật SFU khi thư viện aiortc có sẵn.
    SFU_ENABLED = AIORTC_AVAILABLE
    if SFU_ENABLED:
        print("[STARTUP] SFU enabled - aiortc available")
    else:
        print("[STARTUP] SFU disabled - aiortc not available")
except ImportError:
    sfu_manager = None
    SFU_ENABLED = False
    AIORTC_AVAILABLE = False
    print("[STARTUP] SFU disabled - sfu_service import failed")

# Mock AI (để tham khảo) - hiện đang tắt và dùng Real AI.
# try:
#     from ai_analysis import MockAIAnalyzer
#     mock_analyzer = MockAIAnalyzer()
#     AI_ANALYSIS_ENABLED = True
# except ImportError:
#     mock_analyzer = None
#     AI_ANALYSIS_ENABLED = False

# Tích hợp Real AI
try:
    from ai_analysis.integration_helper import (
        run_real_analysis_loop,
        cleanup_analyzer,
        get_analyzer_stats,
        record_heartbeat
    )
    AI_ANALYSIS_ENABLED = True
except ImportError:
    AI_ANALYSIS_ENABLED = False
    print("[ERROR] Real AI integration_helper not found!")


@dataclass
class Participant:
    websocket: WebSocket
    role: str  # Vai trò: "proctor" | "candidate" | "observer"
    user_id: str
    attempt_id: Optional[int] = None


@dataclass
class Room:
    room_id: str
    participants: Dict[str, Participant] = field(default_factory=dict)
    incidents: List[dict] = field(default_factory=list)

    async def broadcast(self, sender_id: str, message: dict):
        target_id = message.get("to")
        payload = json.dumps({"from": sender_id, **message})
        if target_id:
            # Nếu có "to" thì chỉ gửi đúng người nhận.
            target = self.participants.get(str(target_id))
            if target:
                try:
                    await target.websocket.send_text(payload)
                except RuntimeError:
                    pass
                return

            # Debug: trường hợp UI gửi tới participant_id không tồn tại trong phòng.
            try:
                print(
                    f"[WS] target_not_found room={self.room_id} sender={sender_id} to={target_id} type={message.get('type')}",
                    flush=True,
                )
            except Exception:
                pass
            return
        # Không có "to": broadcast cho tất cả trừ người gửi.
        for pid, participant in list(self.participants.items()):
            if pid == sender_id:
                continue
            try:
                await participant.websocket.send_text(payload)
            except RuntimeError:
                # Bỏ qua nếu websocket đã đóng.
                pass


class RoomManager:
    def __init__(self):
        self._rooms: Dict[str, Room] = {}
        self._lock = asyncio.Lock()

    async def get_or_create(self, room_id: str) -> Room:
        async with self._lock:
            if room_id not in self._rooms:
                self._rooms[room_id] = Room(room_id=room_id)
            return self._rooms[room_id]

    async def remove_if_empty(self, room_id: str):
        async with self._lock:
            room = self._rooms.get(room_id)
            if room and not room.participants:
                del self._rooms[room_id]


rooms = RoomManager()

# Map quản lý task phân tích nền: candidate_id -> asyncio.Task
analysis_tasks: Dict[str, asyncio.Task] = {}

# Handler lỗi tùy biến để "nuốt" một số lỗi cleanup ICE (aioice) gây nhiễu log.
def custom_exception_handler(loop, context):
    """Bỏ qua lỗi cleanup của aioice/asyncio (thường gặp khi đóng kết nối WebRTC)."""
    exception = context.get('exception')
    message = context.get('message', '')
    
    # Bỏ qua một số lỗi cleanup đã biết.
    if exception and isinstance(exception, AttributeError):
        error_msg = str(exception)
        if "NoneType" in error_msg and ("sendto" in error_msg or "call_exception_handler" in error_msg):
            # Lỗi cleanup đã biết của aioice: an toàn để bỏ qua.
            return
    
    # Các lỗi khác: để handler mặc định xử lý.
    loop.default_exception_handler(context)

# Gắn handler tùy biến cho event loop.
try:
    loop = asyncio.get_event_loop()
    loop.set_exception_handler(custom_exception_handler)
except RuntimeError:
    # Nếu chưa có event loop, FastAPI sẽ tạo và gắn ở startup.
    pass

app = FastAPI(title="Proctoring Signaling Server", version="0.1.0")

# Serve evidence/kyc images so the frontend can display proof images.
try:
    evidence_dir = os.getenv("EVIDENCE_DIR") or os.path.join(os.getcwd(), "evidence_images")
    os.makedirs(evidence_dir, exist_ok=True)
    app.mount("/evidence_images", StaticFiles(directory=evidence_dir), name="evidence_images")

    kyc_dir = os.path.join(os.getcwd(), "kyc_images")
    os.makedirs(kyc_dir, exist_ok=True)
    app.mount("/kyc_images", StaticFiles(directory=kyc_dir), name="kyc_images")
except Exception as e:
    print(f"[STARTUP] StaticFiles mount failed: {e}")

@app.on_event("startup")
async def startup_event():
    """Gắn exception handler; model AI sẽ được load lazy (khi cần)."""
    loop = asyncio.get_event_loop()
    loop.set_exception_handler(custom_exception_handler)
    print("[STARTUP] Real AI models will be loaded on first use")

@app.post("/api/kyc/upload")
async def kyc_upload(candidateId: str = Form(...), image: UploadFile = File(...)):
    # Lưu ảnh KYC xuống ổ đĩa (phục vụ debug/đối soát).
    kyc_dir = os.path.join(os.getcwd(), "kyc_images")
    os.makedirs(kyc_dir, exist_ok=True)
    image_path = os.path.join(kyc_dir, f"{candidateId}.jpg")
    with open(image_path, "wb") as f:
        shutil.copyfileobj(image.file, f)
    # Đọc ảnh bằng OpenCV.
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    # Lấy model ArcFace (dùng singleton để tái sử dụng).
    global arcface_singleton
    if 'arcface_singleton' not in globals() or arcface_singleton is None:
        arcface_singleton = ArcFaceModel(device="cpu")
        arcface_singleton.load()
    embedding = arcface_singleton.infer(img_rgb)
    if embedding is None:
        raise HTTPException(status_code=500, detail="Failed to extract embedding")
    embedding_list = embedding.tolist()
    ok = save_kyc_profile(candidateId, embedding_list, image_path)
    if not ok:
        raise HTTPException(status_code=500, detail="DB error saving KYC")
    return {"status": "ok", "candidateId": candidateId}

@app.post("/api/kyc/check-whitelist")
async def check_whitelist(
    email: str = Form(...),
    session_id: int = Form(...)
):
    """
    Kiểm tra thí sinh có nằm trong whitelist của ca thi và có ảnh avatar hay không.

    Trả về:
        - exists: có trong danh sách của ca thi
        - has_avatar: có ít nhất 1 ảnh avatar
        - avatar_count: số lượng ảnh avatar
    """
    exists_in_session, whitelist_urls = check_session_student_whitelist(email, session_id)
    return {
        "exists": exists_in_session,
        "has_avatar": len(whitelist_urls) > 0,
        "avatar_count": len(whitelist_urls),
    }

@app.post("/api/kyc/verify")
async def kyc_verify(
    candidateId: str = Form(...),
    id_image: Optional[UploadFile] = File(None),
    selfie: UploadFile = File(...),
    email: Optional[str] = Form(None),
    session_id: Optional[int] = Form(None)
):
    kyc_dir = os.path.join(os.getcwd(), "kyc_images")
    os.makedirs(kyc_dir, exist_ok=True)
    
    selfie_path = os.path.join(kyc_dir, f"{candidateId}_selfie.jpg")
    
    # Lưu ảnh selfie.
    with open(selfie_path, "wb") as f:
        shutil.copyfileobj(selfie.file, f)
        
    # Đọc ảnh selfie.
    import cv2
    selfie_bgr = cv2.imread(selfie_path, cv2.IMREAD_COLOR)
    if selfie_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid selfie image")
    selfie_rgb = cv2.cvtColor(selfie_bgr, cv2.COLOR_BGR2RGB)

    def ensure_rgb3(img: np.ndarray) -> np.ndarray:
        """Chuẩn hóa ảnh về dạng RGB 3 kênh (HxWx3) cho các model phía sau."""
        if img is None or not isinstance(img, np.ndarray) or img.size == 0:
            raise ValueError("Empty image")
        if img.ndim == 2:
            return cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        if img.ndim == 3 and img.shape[2] == 1:
            return cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        if img.ndim == 3 and img.shape[2] == 4:
            # RGBA -> RGB
            return cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        return img

    try:
        selfie_rgb = ensure_rgb3(selfie_rgb)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid selfie image")

    # Đảm bảo model đã được load.
    global arcface_singleton, yolo_singleton
    if arcface_singleton is None:
        arcface_singleton = ArcFaceModel(device="cpu")
        arcface_singleton.load()
    if yolo_singleton is None:
        yolo_singleton = YOLODetector(device="cpu", confidence_threshold=0.4)
        yolo_singleton.load()

    # Fast-path: nếu selfie không có mặt thì trả về thông báo rõ ràng.
    # Mục tiêu: tránh rơi vào pipeline phía dưới gây warning OpenCV khó hiểu.
    try:
        selfie_bgr_for_detect = cv2.cvtColor(selfie_rgb, cv2.COLOR_RGB2BGR)
        faces = arcface_singleton.app.get(selfie_bgr_for_detect)
        if not faces or len(faces) == 0:
            raise HTTPException(status_code=400, detail="Ảnh selfie không có mặt")
    except HTTPException:
        raise
    except Exception:
        # Nếu detector lỗi vì lý do nào đó, vẫn tiếp tục pipeline trích xuất embedding (best-effort).
        pass

    def extract_embedding(img_rgb):
        try:
            img_rgb = ensure_rgb3(img_rgb)
        except Exception:
            return None

        # Ưu tiên 1: dùng detector nội bộ của ArcFace.
        emb = arcface_singleton.infer(img_rgb)
        if emb is not None:
            return emb
        # Ưu tiên 2: thử xoay ảnh (trường hợp ảnh bị rotate).
        try:
            for k in [1, 2, 3]:  # 90, 180, 270 degrees
                rotated = np.ascontiguousarray(np.rot90(img_rgb, k))
                emb = arcface_singleton.infer(rotated)
                if emb is not None:
                    return emb
        except Exception:
            pass
        # Ưu tiên 3: downscale về kích thước hợp lý (giảm lỗi/giảm tải).
        try:
            h, w = img_rgb.shape[:2]
            for target in [1024, 800, 640]:
                scale = min(target / max(h, w), 1.0)
                if scale < 1.0:
                    new_w = max(1, int(round(w * scale)))
                    new_h = max(1, int(round(h * scale)))
                    if new_w <= 1 or new_h <= 1:
                        continue
                    resized = cv2.resize(img_rgb, (new_w, new_h))
                    emb = arcface_singleton.infer(resized)
                    if emb is not None:
                        return emb
        except Exception:
            pass
        # Fallback: dùng YOLO detect mặt, crop khuôn mặt lớn nhất rồi infer lại.
        try:
            detections = yolo_singleton.infer(img_rgb)
            if detections and len(detections) > 0:
                # Chọn bbox có confidence cao nhất.
                best = max(detections, key=lambda d: d.get("confidence", 0.0))
                x, y, w, h = best["bbox"]
                h_img, w_img = img_rgb.shape[:2]
                x1 = max(0, x); y1 = max(0, y)
                x2 = min(w_img, x + w); y2 = min(h_img, y + h)
                face_crop = img_rgb[y1:y2, x1:x2]
                if face_crop.size > 0:
                    return arcface_singleton.infer(face_crop)
        except Exception:
            pass
        return None

    # 1) Trích xuất embedding từ selfie
    selfie_emb = extract_embedding(selfie_rgb)
    if selfie_emb is None:
        raise HTTPException(status_code=400, detail="Ảnh selfie không có mặt")

    # 2) Xác định ảnh tham chiếu: ưu tiên whitelist, nếu không được thì dùng ảnh CCCD/ID upload.
    reference_emb = None
    used_whitelist = False
    found_whitelist_images = False
    
    # Case A: thử whitelist nếu có email & session_id
    if email and session_id:
        print(f"[KYC] Checking whitelist for {email} in session {session_id}")
        whitelist_urls = get_whitelist_images(email, session_id)
        if whitelist_urls:
            found_whitelist_images = True
            print(f"[KYC] Found {len(whitelist_urls)} whitelist images")
            for url_or_key in whitelist_urls:
                try:
                    content = await _fetch_whitelist_image_bytes(str(url_or_key))
                    if not content:
                        continue
                    arr = np.asarray(bytearray(content), dtype=np.uint8)
                    ref_img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    if ref_img is None:
                        print(f"[KYC] Whitelist image decode failed: {url_or_key}", flush=True)
                        continue

                    ref_rgb = cv2.cvtColor(ref_img, cv2.COLOR_BGR2RGB)
                    try:
                        ref_rgb = ensure_rgb3(ref_rgb)
                    except Exception:
                        continue

                    reference_emb = extract_embedding(ref_rgb)
                    if reference_emb is None:
                        print(f"[KYC] Whitelist image has no face/embedding: {url_or_key}", flush=True)
                        continue

                    used_whitelist = True
                    print(f"[KYC] Successfully used whitelist image: {url_or_key}", flush=True)
                    break
                except Exception as e:
                    print(f"[KYC] Error processing whitelist image {url_or_key}: {e}", flush=True)
        else:
            print(f"[KYC] No whitelist images found")

    if found_whitelist_images and reference_emb is None:
        print("[KYC] Whitelist entries exist but none usable; will require id_image fallback", flush=True)

    # Case B: dùng ảnh upload thủ công (khi whitelist không có/không dùng được)
    if reference_emb is None:
        if id_image is None:
             detail = "ID image required (no whitelist found)"
             if found_whitelist_images:
                 detail = "ID image required (whitelist not usable)"
             raise HTTPException(status_code=400, detail=detail)
        
        id_path = os.path.join(kyc_dir, f"{candidateId}_id.jpg")
        with open(id_path, "wb") as f:
            shutil.copyfileobj(id_image.file, f)
            
        id_bgr = cv2.imread(id_path, cv2.IMREAD_COLOR)
        if id_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid ID image")
        id_rgb = cv2.cvtColor(id_bgr, cv2.COLOR_BGR2RGB)
        try:
            id_rgb = ensure_rgb3(id_rgb)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ID image")
        
        reference_emb = extract_embedding(id_rgb)
        if reference_emb is None:
            raise HTTPException(status_code=400, detail="Failed to extract embedding from ID image")

    # 3) So khớp (so sánh embedding)
    sim = arcface_singleton.compute_similarity(reference_emb, selfie_emb)
    passed = sim >= KYC_THRESHOLD
    
    # Chỉ lưu KYC khi đạt ngưỡng.
    saved = False
    if passed:
        saved = save_kyc_profile(candidateId, selfie_emb.tolist(), selfie_path)
        
    return {
        "passed": passed, 
        "similarity": float(sim), 
        "threshold": KYC_THRESHOLD, 
        "saved": saved,
        "method": "whitelist" if used_whitelist else "manual"
    }

@app.get("/api/kyc/{candidate_id}")
async def kyc_get(candidate_id: str):
    emb = get_kyc_embedding(candidate_id)
    if emb is None:
        return {"exists": False}
    return {"exists": True, "embedding_dim": len(emb)}

@app.delete("/api/kyc/{candidate_id}")
async def kyc_delete(candidate_id: str):
    ok = delete_kyc_profile(candidate_id)
    return {"deleted": ok}
@app.on_event("shutdown")
async def shutdown_event():
    """Dọn tài nguyên AI khi server tắt."""
    if AI_ANALYSIS_ENABLED:
        print("[SHUTDOWN] Cleaning up AI analyzer...")
        try:
            await cleanup_analyzer()
            print("[SHUTDOWN] AI analyzer cleaned up successfully")
        except Exception as e:
            print(f"[SHUTDOWN] Error cleaning up analyzer: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if ml_router:
    app.include_router(ml_router)


@app.get("/health")
async def health():
    return {
        "ok": True,
        "sfu_enabled": SFU_ENABLED,
        "ai_analysis_enabled": AI_ANALYSIS_ENABLED,
        "mode": "SFU" if SFU_ENABLED else "P2P"
    }


# ==================== CÁC ENDPOINT PHÂN TÍCH AI ====================

async def _run_real_analysis(room_id: str, candidate_id: str, websocket: WebSocket):
    """
    Task chạy nền phân tích Real AI (dùng đầy đủ 3 nhóm model).
    """
    if not AI_ANALYSIS_ENABLED:
        print(f"[REAL AI] AI Analysis not enabled")
        return
    
    print(f"[REAL AI] Started analysis for {candidate_id} in room {room_id}")
    
    try:
        # Chạy vòng lặp phân tích Real AI
        await run_real_analysis_loop(
            candidate_id=candidate_id,
            room_id=room_id,
            sfu_manager=sfu_manager,
            websocket_send_func=lambda data: websocket.send_text(json.dumps(data)),
            rooms_manager=rooms,  # truyền rooms manager để broadcast cho proctor
            use_mock_models=False,  # False = dùng model thật
            frame_skip=15 # 30 FPS / 15 ~= 2 FPS phân tích
        )
    
    except asyncio.CancelledError:
        print(f"[REAL AI] Analysis cancelled for {candidate_id}")
    except Exception as e:
        print(f"[REAL AI] Error in analysis loop for {candidate_id}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print(f"[REAL AI] Stopped analysis for {candidate_id}")

#Sẽ được gọi tự động khi candidate kết nối SFU
@app.post("/api/analysis/start/{room_id}/{candidate_id}")
async def start_real_analysis(room_id: str, candidate_id: str):
    """
    Bắt đầu phân tích Real AI cho một thí sinh.
    
    API này tạo một background task chạy phân tích theo chu kỳ, gồm các thành phần:
    - YOLO: phát hiện khuôn mặt
    - ArcFace: nhận dạng/đối sánh khuôn mặt
    - Gaze Estimator: ước lượng hướng nhìn/hành vi
    """
    if not AI_ANALYSIS_ENABLED:
        raise HTTPException(status_code=503, detail="AI Analysis not available")
    
    # Nếu đã có task chạy rồi thì không tạo thêm.
    if candidate_id in analysis_tasks:
        return {
            "status": "already_running",
            "candidate_id": candidate_id,
            "room_id": room_id
        }
    
    # Lấy websocket của candidate trong phòng.
    room = await rooms.get_or_create(room_id)
    candidate_ws = None
    for participant in room.participants.values():
        if participant.user_id == candidate_id:
            candidate_ws = participant.websocket
            break
    
    if not candidate_ws:
        return {"ok": False, "error": "Candidate not found in room"}
    
    # Tạo background task chạy Real AI.
    task = asyncio.create_task(_run_real_analysis(room_id, candidate_id, candidate_ws))
    analysis_tasks[candidate_id] = task
    
    print(f"[API] Started REAL AI analysis for {candidate_id} in room {room_id}")
    
    return {
        "status": "started",
        "candidate_id": candidate_id,
        "room_id": room_id
    }


@app.post("/api/analysis/stop/{candidate_id}")
async def stop_mock_analysis(candidate_id: str):
    """
    Dừng phân tích AI đang chạy cho thí sinh.

    Lưu ý: tên hàm giữ nguyên để tương thích, nhưng thực tế đang dừng Real AI task.
    """
    if candidate_id not in analysis_tasks:
        return {
            "status": "not_running",
            "candidate_id": candidate_id
        }
    
    # Hủy task.
    task = analysis_tasks[candidate_id]
    task.cancel()
    
    # Chờ một chút cho việc cancel hoàn tất.
    try:
        await asyncio.wait_for(task, timeout=1.0)
    except (asyncio.CancelledError, asyncio.TimeoutError):
        pass
    
    # Xóa khỏi map quản lý.
    del analysis_tasks[candidate_id]
    
    print(f"[API] Stopped REAL AI analysis for {candidate_id}")
    
    return {
        "status": "stopped",
        "candidate_id": candidate_id
    }


@app.get("/api/analysis/stats")
async def get_analysis_stats():
    """
    Lấy thống kê hoạt động của Real AI analyzer.
    
    Trả về ví dụ:
        - frames_analyzed: tổng số frame đã xử lý
        - total_time_ms: tổng thời gian inference
        - avg_time_ms: thời gian trung bình mỗi frame
        - errors: số lỗi
    """
    if not AI_ANALYSIS_ENABLED:
        return {"error": "AI Analysis not enabled"}
    
    try:
        stats = await get_analyzer_stats()
        return {
            "ok": True,
            "stats": stats
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }

#Lịch sử vi phạm sẽ được lấy bên Java ko dùng hàm này
@app.get("/api/analysis/history/{room_id}/{candidate_id}")
async def get_analysis_history(
    room_id: str,
    candidate_id: str,
    from_ts: Optional[int] = None,
    to_ts: Optional[int] = None,
    level: Optional[str] = None,
    type: Optional[str] = None
):
    """
    Lấy lịch sử vi phạm (incidents) của một thí sinh.
    
    Query params:
    - from_ts: lọc từ mốc thời gian này (ms)
    - to_ts: lọc đến mốc thời gian này (ms)
    - level: lọc theo mức độ (S1/S2/S3/S4)
    - type: lọc theo loại (A1/A2/B1/...)
    """
    try:
        # Lấy incidents từ rules_engine.
        session_summary = rules_engine.get_session_summary(room_id, candidate_id)
        incidents = session_summary.get("incidents", [])
        
        # Áp dụng filter.
        if from_ts:
            incidents = [i for i in incidents if i.get("ts", 0) >= from_ts]
        
        if to_ts:
            incidents = [i for i in incidents if i.get("ts", 0) <= to_ts]
        
        if level:
            incidents = [i for i in incidents if i.get("level") == level]
        
        if type:
            incidents = [i for i in incidents if i.get("tag") == type]
        
        # Tính thống kê theo severity.
        summary = {
            "S1": len([i for i in incidents if i.get("level") == "S1"]),
            "S2": len([i for i in incidents if i.get("level") == "S2"]),
            "S3": len([i for i in incidents if i.get("level") == "S3"]),
            "S4": len([i for i in incidents if i.get("level") == "S4"])
        }
        
        return {
            "candidate_id": candidate_id,
            "room_id": room_id,
            "total_incidents": len(incidents),
            "summary": summary,
            "incidents": incidents
        }
    
    except KeyError:
        raise HTTPException(status_code=404, detail="Candidate not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ENDPOINT WEBSOCKET ====================

@app.websocket("/ws/{room_id}")
async def ws_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    participant: Optional[Participant] = None
    room: Optional[Room] = None
    try:
        # Message đầu tiên bắt buộc là join: {type:"join", userId, role}
        join_raw = await websocket.receive_text()
        join_msg = json.loads(join_raw)
        if join_msg.get("type") != "join":
            await websocket.send_text(json.dumps({"type": "error", "reason": "expected_join"}))
            await websocket.close()
            return

        user_id = str(join_msg.get("userId"))
        role = str(join_msg.get("role", "candidate"))
        if not user_id:
            await websocket.send_text(json.dumps({"type": "error", "reason": "missing_userId"}))
            await websocket.close()
            return

        room = await rooms.get_or_create(room_id)
        participant = Participant(websocket=websocket, role=role, user_id=user_id)
        room.participants[user_id] = participant

        # Gửi danh sách participant hiện tại cho client mới vào.
        roster = [
            {"userId": p.user_id, "role": p.role}
            for p in room.participants.values()
        ]
        await websocket.send_text(json.dumps({"type": "roster", "participants": roster}))

        # Broadcast sự kiện join cho các client còn lại.
        join_event = {"type": "participant_joined", "userId": user_id, "role": role}
        for pid, p in room.participants.items():
            if pid != user_id:
                try:
                    await p.websocket.send_text(json.dumps(join_event))
                except RuntimeError:
                    pass
        
        # Tự động start Real AI cho candidate khi chạy SFU và AI_ANALYSIS_ENABLED.
        if role == "candidate" and SFU_ENABLED and AI_ANALYSIS_ENABLED:
            print(f"[AUTO] Checking auto-start for {user_id}, current tasks: {list(analysis_tasks.keys())}")
            if user_id not in analysis_tasks:
                print(f"[AUTO] Auto-starting REAL AI analysis for candidate {user_id}")
                task = asyncio.create_task(_run_real_analysis(room_id, user_id, websocket))
                analysis_tasks[user_id] = task
            else:
                print(f"[AUTO] Analysis already running for {user_id}")
        else:
            print(f"[AUTO] Not starting analysis: role={role}, SFU={SFU_ENABLED}, AI={AI_ANALYSIS_ENABLED}")

        # Vòng lặp chính nhận/gửi message signaling.
        while True:
            text = await websocket.receive_text()
            msg = json.loads(text)
            mtype = msg.get("type")

            if mtype == "candidate_context":
            # Expect: {type:"candidate_context", attemptId, userId?}
                raw_attempt_id = msg.get("attemptId")
                try:
                    attempt_id = int(raw_attempt_id)
                except Exception:
                    attempt_id = None

                if attempt_id is None or attempt_id <= 0:
                    await websocket.send_text(
                        json.dumps({"type": "candidate_context_ack", "ok": False, "reason": "invalid_attemptId"})
                    )
                    continue

                try:
                    participant.attempt_id = attempt_id  # type: ignore[union-attr]
                    await websocket.send_text(
                        json.dumps({"type": "candidate_context_ack", "ok": True, "attemptId": attempt_id})
                    )
                    try:
                        print(f"[WS] candidate_context room={room_id} user={user_id} attemptId={attempt_id}", flush=True)
                    except Exception:
                        pass
                except Exception as e:
                    await websocket.send_text(
                        json.dumps({"type": "candidate_context_ack", "ok": False, "reason": str(e)})
                    )
                continue

            # Chuyển tiếp (relay) message signaling/chat/control cho các participant khác trong phòng.
            # NOTE: có thể gửi riêng (unicast) bằng cách set message["to"].
            if mtype in {"offer", "answer", "ice", "chat", "control", "force_submit"}:
                # Nếu bật SFU: xử lý signaling WebRTC thông qua SFU.
                if SFU_ENABLED and mtype == "offer":
                    track_info = msg.get("trackInfo", [])
                    print(f"[SFU] Received offer from {user_id} (role={role})")
                    
                    if role == "candidate":
                        # Candidate gửi stream lên backend.
                        try:
                            print(f"[SFU] Handling candidate offer from {user_id}", flush=True)
                            print(f"[DEBUG] About to call handle_candidate_offer", flush=True)
                            print(f"[DEBUG] sfu_manager = {sfu_manager}", flush=True)
                            print(f"[DEBUG] offer_sdp type = {type(msg.get('sdp'))}", flush=True)
                            result = await sfu_manager.handle_candidate_offer(
                                room_id=room_id,
                                user_id=user_id,
                                offer_sdp=msg.get("sdp"),
                                track_info=track_info
                            )
                            
                            # Lấy SDP answer.
                            answer_sdp = {
                                "sdp": result["sdp"],
                                "type": result["type"]
                            }
                            
                            # Gửi answer về candidate.
                            await websocket.send_text(json.dumps({
                                "type": "answer",
                                "sdp": answer_sdp,
                                "from": "server"
                            }))
                            print(f"[SFU] Sent answer to candidate {user_id}", flush=True)
                            
                            # Khi SFU đã kết nối xong, auto-start phân tích AI.
                            if AI_ANALYSIS_ENABLED and user_id not in analysis_tasks:
                                print(f"[AUTO] Auto-starting REAL AI analysis for candidate {user_id} (SFU connected)")
                                task = asyncio.create_task(_run_real_analysis(room_id, user_id, websocket))
                                analysis_tasks[user_id] = task
                            
                            # Kiểm tra có renegotiation pending không (track mới nhận trong on_track).
                            # Poll với interval dài hơn để chờ offer được tạo.
                            print(f"[DEBUG] Polling for renegotiation offer...", flush=True)
                            await asyncio.sleep(0.4)  # chờ lần đầu: 400ms
                            renegotiate_offer = sfu_manager.get_pending_renegotiate()
                            
                            # Poll nhiều lần.
                            poll_count = 1
                            while not renegotiate_offer and poll_count < 5:
                                print(f"[DEBUG] No offer yet, polling again (attempt {poll_count + 1}/5)...", flush=True)
                                await asyncio.sleep(0.3)  # chờ giữa các lần poll: 300ms
                                renegotiate_offer = sfu_manager.get_pending_renegotiate()
                                poll_count += 1
                            
                            if renegotiate_offer:
                                proctor_id = renegotiate_offer.get("proctor_id")
                                candidate_id = renegotiate_offer.get("candidate_id")  # lấy candidate_id từ offer lưu tạm
                                print(f"[SFU] Renegotiating: sending new offer to proctor {proctor_id} for candidate {candidate_id}")
                                
                                # Tìm websocket của proctor trong phòng.
                                room = await rooms.get_or_create(room_id)
                                proctor_participant = room.participants.get(proctor_id)
                                if proctor_participant:
                                    await proctor_participant.websocket.send_text(json.dumps({
                                        "type": "offer",
                                        "sdp": {
                                            "sdp": renegotiate_offer["sdp"],
                                            "type": renegotiate_offer["type"]
                                        },
                                        "from": "server",
                                        "renegotiate": True,
                                        "candidate_id": candidate_id  # kèm candidate_id để FE dễ map
                                    }))
                                    print(f"[SFU] Sent renegotiation offer to proctor {proctor_id} for candidate {candidate_id}")
                                else:
                                    print(f"[SFU] Warning: Proctor {proctor_id} not found in room participants")
                            
                        except Exception as e:
                            print(f"[SFU] Candidate offer error: {e}")
                            import traceback
                            traceback.print_exc()
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "reason": f"sfu_error: {str(e)}"
                            }))
                    
                    elif role == "proctor":
                        # Proctor yêu cầu stream từ backend.
                        try:
                            print(f"[SFU] Handling proctor offer from {user_id}")
                            answer = await sfu_manager.handle_proctor_offer(
                                room_id=room_id,
                                user_id=user_id,
                                offer_sdp=msg.get("sdp")
                            )
                            # Gửi answer về proctor.
                            await websocket.send_text(json.dumps({
                                "type": "answer",
                                "sdp": answer,
                                "from": "server"
                            }))
                            print(f"[SFU] Sent answer to proctor {user_id}")
                        except Exception as e:
                            print(f"[SFU] Proctor offer error: {e}")
                            import traceback
                            traceback.print_exc()
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "reason": f"sfu_error: {str(e)}"
                            }))
                
                elif SFU_ENABLED and mtype == "ice":
                    # Xử lý ICE candidate qua SFU.
                    is_proctor = (role == "proctor")
                    print(f"[SFU] Received ICE candidate from {user_id} (proctor={is_proctor})")
                    try:
                        await sfu_manager.add_ice_candidate(
                            room_id=room_id,
                            user_id=user_id,
                            candidate_dict=msg.get("candidate"),
                            is_proctor=is_proctor
                        )
                    except Exception as e:
                        print(f"[SFU] ICE error: {e}")
                
                elif SFU_ENABLED and mtype == "answer":
                    # Nhận answer từ proctor (phục vụ renegotiation).
                    if role == "proctor":
                        print(f"[SFU] Received answer from proctor {user_id} (renegotiation)")
                        try:
                            await sfu_manager.handle_proctor_answer(
                                room_id=room_id,
                                answer_sdp=msg.get("sdp")
                            )
                            print(f"[SFU] Applied proctor answer")
                        except Exception as e:
                            print(f"[SFU] Proctor answer error: {e}")
                            import traceback
                            traceback.print_exc()
                
                else:
                    # Fallback: P2P mode hoặc chat - relay cho participant khác.
                    await room.broadcast(sender_id=user_id, message=msg)
            elif mtype == "heartbeat":
                # Cập nhật heartbeat để phục vụ rule A11 (idle).
                try:
                    ts = int(msg.get("ts") or 0) or int(asyncio.get_event_loop().time() * 1000)
                except Exception:
                    ts = int(asyncio.get_event_loop().time() * 1000)
                try:
                    record_heartbeat(room_id, user_id, ts)
                except Exception as e:
                    print(f"[HEARTBEAT] record failed: {e}")
                # (Tuỳ chọn) phản hồi ack.
                # await websocket.send_text(json.dumps({"type":"heartbeat_ack","ts":ts}))
            elif mtype == "leave":
                break
            elif mtype == "incident":
                # Payload mẫu: {type:"incident", tag, level, note, ts, by}
                incident = {
                    "roomId": room.room_id,
                    "by": msg.get("by", user_id),
                    "tag": msg.get("tag"),
                    "level": msg.get("level"),
                    "note": msg.get("note"),
                    "ts": msg.get("ts"),
                }
                # Cho rules engine xử lý (tính điểm/chuẩn hóa dữ liệu, ...)
                processed = rules_engine.process_incident(room.room_id, user_id, incident)
                room.incidents.append(processed)
                # Broadcast để đồng bộ realtime.
                await room.broadcast(sender_id=user_id, message={"type": "incident", **processed})
            else:
                await websocket.send_text(json.dumps({"type": "error", "reason": "unknown_type"}))

    except WebSocketDisconnect:
        pass
    finally:
        if room and participant:
            # Dọn task AI của candidate khi disconnect.
            if AI_ANALYSIS_ENABLED and participant.role == "candidate":
                if user_id in analysis_tasks:
                    print(f"[AUTO] Auto-stopping REAL AI analysis for candidate {user_id}")
                    task = analysis_tasks[user_id]
                    task.cancel()
                    try:
                        await asyncio.wait_for(task, timeout=1.0)
                    except (asyncio.CancelledError, asyncio.TimeoutError):
                        pass
                    del analysis_tasks[user_id]
            
            # Dọn kết nối SFU.
            if SFU_ENABLED:
                try:
                    role = participant.role
                    if role == "candidate":
                        await sfu_manager._cleanup_candidate(room_id, user_id)
                        print(f"[SFU] Cleaned up candidate {user_id} connection", flush=True)
                    elif role == "proctor":
                        await sfu_manager._cleanup_proctor(room_id)
                        print(f"[SFU] Cleaned up proctor connection", flush=True)
                except Exception as e:
                    print(f"[SFU] Error during cleanup: {e}", flush=True)
            
            room.participants.pop(participant.user_id, None)
            # Thông báo cho những người còn lại.
            leave_event = {"type": "participant_left", "userId": participant.user_id}
            for p in list(room.participants.values()):
                try:
                    await p.websocket.send_text(json.dumps(leave_event))
                except RuntimeError:
                    pass
            await rooms.remove_if_empty(room.room_id)


@app.get("/rooms/{room_id}/incidents")
async def get_incidents(room_id: str):
    room = await rooms.get_or_create(room_id)
    return JSONResponse(room.incidents)


@app.post("/rooms/{room_id}/incidents")
async def post_incident(room_id: str, body: dict):
    room = await rooms.get_or_create(room_id)
    required = ["tag", "level", "note", "ts", "by"]
    if not all(k in body for k in required):
        raise HTTPException(status_code=400, detail="missing fields")
    incident = {"roomId": room_id, **body}
    room.incidents.append(incident)
    return {"ok": True}


@app.get("/rooms/{room_id}/sessions/{user_id}/summary")
async def get_session_summary(room_id: str, user_id: str):
    """Lấy tổng hợp phiên (summary) từ rules engine."""
    summary = rules_engine.get_session_summary(room_id, user_id)
    return JSONResponse(summary)


@app.get("/rooms/{room_id}/sfu/stats")
async def get_sfu_stats(room_id: str):
    """Lấy thống kê SFU theo phòng."""
    if not SFU_ENABLED:
        raise HTTPException(status_code=503, detail="SFU not enabled")
    stats = sfu_manager.get_room_stats(room_id)
    return JSONResponse(stats)


# Chạy local: uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Ghi chú: import ml_service có thể fail nếu thiếu dependency; MVP vẫn chạy được.

