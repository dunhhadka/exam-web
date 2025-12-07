"""
Pydantic schemas for AI Analysis I/O validation
Based on TODO_02_IO_CONTRACTS.md specification
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Literal, Union
from enum import Enum
import base64


# ==================== ENUMS ====================

class ImageFormat(str, Enum):
    """Supported image formats"""
    JPEG = "jpeg"
    PNG = "png"


class AudioFormat(str, Enum):
    """Supported audio formats"""
    PCM_S16LE = "pcm_s16le"
    PCM_F32LE = "pcm_f32le"


class AnalysisMode(str, Enum):
    """Analysis processing modes"""
    FULL = "full"      # All 5 analysis types
    FAST = "fast"      # Skip OCR, use lightweight models
    MINIMAL = "minimal"  # Face detection + behavior only


class IncidentCode(str, Enum):
    """Incident type codes (A1-D3)"""
    # Face Analysis (A1-A4)
    A1 = "A1"  # No face
    A2 = "A2"  # Multiple faces
    A3 = "A3"  # Face mismatch
    A4 = "A4"  # Face turned
    
    # Screen Analysis (B1-B4)
    B1 = "B1"  # Search engine
    B2 = "B2"  # Chat app
    B3 = "B3"  # Suspicious text
    B4 = "B4"  # Exam content
    
    # Audio Analysis (C1-C2)
    C1 = "C1"  # Voice detected
    C2 = "C2"  # Multiple speakers
    
    # Behavior Analysis (D1-D3)
    D1 = "D1"  # Looking away
    D2 = "D2"  # Left camera
    D3 = "D3"  # Excessive movement


class SeverityLevel(str, Enum):
    """Alert severity levels"""
    S1 = "S1"  # Info
    S2 = "S2"  # Warning
    S3 = "S3"  # Serious
    S4 = "S4"  # Critical


# ==================== INPUT SCHEMAS ====================

class CameraFrame(BaseModel):
    """Camera frame from candidate"""
    image: str = Field(..., description="Base64 encoded JPEG/PNG")
    format: ImageFormat = ImageFormat.JPEG
    width: int = Field(..., ge=320, le=1920, description="Image width in pixels")
    height: int = Field(..., ge=240, le=1080, description="Image height in pixels")
    timestamp: int = Field(..., gt=0, description="Capture time (Unix ms)")
    quality: int = Field(85, ge=1, le=100, description="JPEG quality")
    metadata: Optional[Dict] = Field(None, description="Stream metadata (fps, codec, etc.)")

    @validator('image')
    def validate_base64_image(cls, v):
        """Validate base64 encoding and size limit"""
        try:
            decoded = base64.b64decode(v, validate=True)
            if len(decoded) > 2 * 1024 * 1024:  # 2MB limit
                raise ValueError("Camera image exceeds 2MB limit")
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 image encoding: {str(e)}")

    class Config:
        schema_extra = {
            "example": {
                "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "format": "jpeg",
                "width": 640,
                "height": 480,
                "timestamp": 1699804800123,
                "quality": 85
            }
        }


class ScreenFrame(BaseModel):
    """Screen capture from candidate"""
    image: str = Field(..., description="Base64 encoded JPEG/PNG")
    format: ImageFormat = ImageFormat.JPEG
    width: int = Field(..., ge=1024, le=3840, description="Screen width in pixels")
    height: int = Field(..., ge=768, le=2160, description="Screen height in pixels")
    timestamp: int = Field(..., gt=0, description="Capture time (Unix ms)")
    quality: int = Field(75, ge=1, le=100, description="JPEG quality")
    metadata: Optional[Dict] = Field(None, description="Display metadata")

    @validator('image')
    def validate_base64_image(cls, v):
        """Validate base64 encoding and size limit"""
        try:
            decoded = base64.b64decode(v, validate=True)
            if len(decoded) > 5 * 1024 * 1024:  # 5MB limit
                raise ValueError("Screen image exceeds 5MB limit")
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 image encoding: {str(e)}")

    class Config:
        schema_extra = {
            "example": {
                "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "format": "jpeg",
                "width": 1920,
                "height": 1080,
                "timestamp": 1699804800123,
                "quality": 75
            }
        }


class AudioBuffer(BaseModel):
    """Audio buffer from candidate"""
    buffer: str = Field(..., description="Base64 encoded PCM audio")
    format: AudioFormat = AudioFormat.PCM_S16LE
    sample_rate: Literal[8000, 16000, 48000] = Field(16000, description="Sampling rate in Hz")
    channels: Literal[1, 2] = Field(1, description="Number of audio channels (1=mono, 2=stereo)")
    duration_ms: int = Field(..., ge=100, le=5000, description="Buffer duration in milliseconds")
    timestamp: int = Field(..., gt=0, description="Capture time (Unix ms)")
    metadata: Optional[Dict] = Field(None, description="Audio metadata")

    @validator('buffer')
    def validate_base64_audio(cls, v):
        """Validate base64 encoding and size limit"""
        try:
            decoded = base64.b64decode(v, validate=True)
            if len(decoded) > 1024 * 1024:  # 1MB limit
                raise ValueError("Audio buffer exceeds 1MB limit")
            return v
        except Exception as e:
            raise ValueError(f"Invalid base64 audio encoding: {str(e)}")

    class Config:
        schema_extra = {
            "example": {
                "buffer": "AAABAAEAAQABAAEAAQABAAEA...",
                "format": "pcm_s16le",
                "sample_rate": 16000,
                "channels": 1,
                "duration_ms": 1000,
                "timestamp": 1699804800123
            }
        }


class FrameData(BaseModel):
    """Combined media streams data"""
    camera: Optional[CameraFrame] = Field(None, description="Camera frame")
    screen: Optional[ScreenFrame] = Field(None, description="Screen capture")
    audio: Optional[AudioBuffer] = Field(None, description="Audio buffer")

    @validator('audio', always=True)
    def at_least_one_stream(cls, v, values):
        """Ensure at least one stream is provided"""
        if not any([values.get('camera'), values.get('screen'), v]):
            raise ValueError("At least one stream (camera, screen, or audio) must be provided")
        return v


class AnalysisContext(BaseModel):
    """Additional context for analysis"""
    session_start: Optional[int] = Field(None, description="Session start time (Unix ms)")
    kyc_embedding: Optional[List[float]] = Field(
        None, 
        min_items=512, 
        max_items=512,
        description="KYC face embedding (512-dimensional)"
    )
    exam_id: Optional[str] = Field(None, max_length=100, description="Exam identifier")
    analysis_mode: AnalysisMode = Field(AnalysisMode.FULL, description="Analysis processing mode")


class AnalysisRequest(BaseModel):
    """Complete analysis request"""
    request_id: str = Field(
        ..., 
        regex=r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        description="UUID v4 request identifier"
    )
    timestamp: int = Field(..., gt=0, description="Request timestamp (Unix ms)")
    candidate_id: str = Field(..., min_length=1, max_length=100, description="Candidate user ID")
    room_id: str = Field(..., min_length=1, max_length=100, description="Room identifier")
    frame_data: FrameData = Field(..., description="Media streams data")
    context: Optional[AnalysisContext] = Field(None, description="Additional context")

    class Config:
        schema_extra = {
            "example": {
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": 1699804800123,
                "candidate_id": "user_12345",
                "room_id": "room_abcdef",
                "frame_data": {
                    "camera": {"image": "base64...", "format": "jpeg", "width": 640, "height": 480, "timestamp": 1699804800123},
                    "screen": {"image": "base64...", "format": "jpeg", "width": 1920, "height": 1080, "timestamp": 1699804800123}
                }
            }
        }


# ==================== OUTPUT SCHEMAS ====================

class Alert(BaseModel):
    """Alert for violation detection"""
    type: IncidentCode = Field(..., description="Incident type code (A1-D3)")
    level: SeverityLevel = Field(..., description="Severity level (S1-S4)")
    message: str = Field(..., min_length=1, max_length=500, description="Vietnamese alert message")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence")
    timestamp: int = Field(..., gt=0, description="Detection time (Unix ms)")
    metadata: Optional[Dict] = Field(None, description="Additional alert metadata")

    class Config:
        schema_extra = {
            "example": {
                "type": "A1",
                "level": "S2",
                "message": "Không phát hiện khuôn mặt - thí sinh có thể đã rời khỏi vùng camera",
                "confidence": 0.95,
                "timestamp": 1699804800123,
                "metadata": {"duration_seconds": 5.2}
            }
        }


class BoundingBox(BaseModel):
    """Bounding box for detected objects/faces"""
    x: int = Field(..., description="Top-left X coordinate")
    y: int = Field(..., description="Top-left Y coordinate")
    width: int = Field(..., gt=0, description="Box width")
    height: int = Field(..., gt=0, description="Box height")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence")
    landmarks: Optional[Dict[str, List[int]]] = Field(None, description="Facial landmarks (if face)")

    class Config:
        schema_extra = {
            "example": {
                "x": 120,
                "y": 85,
                "width": 200,
                "height": 240,
                "confidence": 0.95,
                "landmarks": {
                    "left_eye": [150, 120],
                    "right_eye": [280, 120],
                    "nose": [215, 180]
                }
            }
        }


class FaceDetectionResult(BaseModel):
    """Face detection analysis result"""
    faces_detected: int = Field(..., ge=0, description="Number of faces detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall detection confidence")
    bounding_boxes: List[BoundingBox] = Field(default_factory=list, description="Detected face bounding boxes")
    status: Literal["normal", "no_face", "multiple_faces"] = Field(..., description="Detection status")
    alert: Optional[Alert] = Field(None, description="Alert if violation detected")


class FaceRecognitionResult(BaseModel):
    """Face recognition/verification result"""
    is_verified: bool = Field(..., description="Whether face matches KYC")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity with KYC")
    threshold: float = Field(0.45, ge=0.0, le=1.0, description="Verification threshold")
    kyc_image_id: Optional[str] = Field(None, description="KYC reference image ID")
    embedding: Optional[List[float]] = Field(
        None, 
        min_items=512, 
        max_items=512,
        description="Face embedding (512-dimensional)"
    )
    status: Literal["verified", "not_verified", "no_face"] = Field(..., description="Verification status")
    alert: Optional[Alert] = Field(None, description="Alert if mismatch detected")


class ScreenAnalysisResult(BaseModel):
    """Screen content analysis result"""
    ocr_text: str = Field("", description="Extracted text from screen")
    detected_apps: List[str] = Field(default_factory=list, description="Detected application names")
    detected_windows: List[Dict] = Field(default_factory=list, description="Detected window information")
    suspicious_keywords: List[str] = Field(default_factory=list, description="Found suspicious keywords")
    suspicious_urls: List[str] = Field(default_factory=list, description="Found suspicious URLs")
    suspicious_score: float = Field(..., ge=0.0, le=1.0, description="Overall suspicion score")
    status: Literal["clean", "suspicious", "violation"] = Field(..., description="Screen status")
    alert: Optional[Alert] = Field(None, description="Alert if violation detected")


class AudioAnalysisResult(BaseModel):
    """Audio/voice analysis result"""
    voice_detected: bool = Field(..., description="Whether voice activity detected")
    speaking_duration: float = Field(..., ge=0.0, description="Total speaking duration in seconds")
    num_speakers: int = Field(..., ge=0, description="Number of speakers detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="VAD confidence")
    speech_segments: List[Dict] = Field(default_factory=list, description="Speech segment timings")
    status: Literal["silent", "speaking", "multiple_speakers"] = Field(..., description="Audio status")
    alert: Optional[Alert] = Field(None, description="Alert if violation detected")


class BehaviorAnalysisResult(BaseModel):
    """Behavior/gaze analysis result"""
    gaze_direction: Literal["center", "left", "right", "up", "down", "unknown"] = Field(..., description="Gaze direction")
    gaze_angles: Optional[Dict[str, float]] = Field(None, description="Gaze angles (yaw, pitch)")
    looking_away_duration: float = Field(..., ge=0.0, description="Duration looking away in seconds")
    left_camera: bool = Field(..., description="Whether candidate left camera view")
    head_pose: Optional[Dict[str, float]] = Field(None, description="Head pose angles (yaw, pitch, roll)")
    movement_score: float = Field(..., ge=0.0, le=1.0, description="Movement intensity score")
    status: Literal["normal", "looking_away", "left_camera", "excessive_movement"] = Field(..., description="Behavior status")
    alert: Optional[Alert] = Field(None, description="Alert if violation detected")


class Analysis(BaseModel):
    """Single analysis component result"""
    type: Literal["face_detection", "face_recognition", "screen_analysis", "audio_analysis", "behavior_analysis"]
    model: str = Field(..., description="Model name and version")
    processing_time_ms: int = Field(..., ge=0, description="Processing time in milliseconds")
    result: Union[
        FaceDetectionResult,
        FaceRecognitionResult,
        ScreenAnalysisResult,
        AudioAnalysisResult,
        BehaviorAnalysisResult
    ] = Field(..., description="Analysis result")

    class Config:
        schema_extra = {
            "example": {
                "type": "face_detection",
                "model": "yolov8n-face-1.0.0",
                "processing_time_ms": 45,
                "result": {
                    "faces_detected": 1,
                    "confidence": 0.95,
                    "bounding_boxes": [],
                    "status": "normal",
                    "alert": None
                }
            }
        }


class AnalysisSummary(BaseModel):
    """Overall analysis summary"""
    total_alerts: int = Field(..., ge=0, description="Total number of alerts")
    alert_types: List[IncidentCode] = Field(default_factory=list, description="List of alert types")
    highest_severity: Optional[SeverityLevel] = Field(None, description="Highest severity level")
    recommendation: Literal["continue", "warning", "review", "terminate"] = Field(
        ..., 
        description="Action recommendation"
    )


class AnalysisResponse(BaseModel):
    """Complete analysis response"""
    request_id: str = Field(..., description="Request UUID from input")
    timestamp: int = Field(..., gt=0, description="Response timestamp (Unix ms)")
    candidate_id: str = Field(..., description="Candidate user ID")
    room_id: str = Field(..., description="Room identifier")
    processing_time_ms: int = Field(..., ge=0, description="Total processing time")
    model_versions: Dict[str, str] = Field(..., description="Model names and versions used")
    analyses: List[Analysis] = Field(..., description="List of analysis results")
    summary: AnalysisSummary = Field(..., description="Analysis summary")

    class Config:
        schema_extra = {
            "example": {
                "request_id": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": 1699804801357,
                "candidate_id": "user_12345",
                "room_id": "room_abcdef",
                "processing_time_ms": 1234,
                "model_versions": {
                    "face_detector": "yolov8n-face-1.0.0",
                    "face_recognizer": "arcface-r100-1.0.0"
                },
                "analyses": [],
                "summary": {
                    "total_alerts": 0,
                    "alert_types": [],
                    "highest_severity": None,
                    "recommendation": "continue"
                }
            }
        }


# ==================== ERROR SCHEMAS ====================

class ErrorDetail(BaseModel):
    """Detailed error information"""
    field: Optional[str] = Field(None, description="Field that caused error")
    message: str = Field(..., description="Error message")
    value: Optional[str] = Field(None, description="Invalid value")
    constraint: Optional[str] = Field(None, description="Constraint that was violated")


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = Field(False, description="Always false for errors")
    error: Dict = Field(..., description="Error details")

    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input data",
                    "details": {
                        "field": "frame_data.camera.width",
                        "message": "Width must be between 320 and 1920",
                        "value": "2560"
                    },
                    "request_id": "550e8400-e29b-41d4-a716-446655440000",
                    "timestamp": 1699804800123
                }
            }
        }


# ==================== MODEL ENDPOINT SCHEMAS ====================

class FaceDetectRequest(BaseModel):
    """Request for face detection endpoint"""
    image: str = Field(..., description="Base64 encoded image")
    options: Optional[Dict] = Field(None, description="Detection options")


class FaceDetectResponse(BaseModel):
    """Response from face detection endpoint"""
    success: bool = True
    model: str = Field(..., description="Model version")
    processing_time_ms: int = Field(..., ge=0)
    faces: List[BoundingBox] = Field(default_factory=list)
    count: int = Field(..., ge=0)


class FaceEmbedRequest(BaseModel):
    """Request for face embedding endpoint"""
    image: str = Field(..., description="Base64 encoded image")
    face_bbox: Optional[List[int]] = Field(None, description="Face bounding box [x, y, w, h]")


class FaceEmbedResponse(BaseModel):
    """Response from face embedding endpoint"""
    success: bool = True
    model: str = Field(..., description="Model version")
    processing_time_ms: int = Field(..., ge=0)
    embedding: List[float] = Field(..., min_items=512, max_items=512)
    norm: float = Field(..., ge=0.0)


class FaceMatchRequest(BaseModel):
    """Request for face matching endpoint"""
    embedding1: List[float] = Field(..., min_items=512, max_items=512)
    embedding2: List[float] = Field(..., min_items=512, max_items=512)
    threshold: float = Field(0.45, ge=0.0, le=1.0)


class FaceMatchResponse(BaseModel):
    """Response from face matching endpoint"""
    success: bool = True
    similarity: float = Field(..., ge=0.0, le=1.0)
    match: bool
    threshold: float


class OCRRequest(BaseModel):
    """Request for OCR endpoint"""
    image: str = Field(..., description="Base64 encoded image")
    languages: List[str] = Field(["en", "vi"], description="Languages to detect")
    options: Optional[Dict] = Field(None, description="OCR options")


class OCRResponse(BaseModel):
    """Response from OCR endpoint"""
    success: bool = True
    model: str = Field(..., description="Model version")
    processing_time_ms: int = Field(..., ge=0)
    text: str = Field(..., description="Extracted text")
    regions: List[Dict] = Field(default_factory=list, description="Text regions with bounding boxes")
    detected_language: Optional[str] = None


class VADRequest(BaseModel):
    """Request for Voice Activity Detection endpoint"""
    audio: str = Field(..., description="Base64 encoded PCM audio")
    sample_rate: Literal[8000, 16000, 48000] = 16000
    options: Optional[Dict] = Field(None, description="VAD options")


class VADResponse(BaseModel):
    """Response from VAD endpoint"""
    success: bool = True
    model: str = Field(..., description="Model version")
    processing_time_ms: int = Field(..., ge=0)
    speaking: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    speech_segments: List[Dict] = Field(default_factory=list)
