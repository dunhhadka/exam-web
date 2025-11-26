"""
Model Adapters - Wrappers for individual AI models
Each adapter provides a clean interface for one specific model
"""

from .base_model import BaseModel
from .yolo_detector import YOLODetector, create_mock_detector
from .arcface_model import ArcFaceModel, create_mock_arcface
from .paddle_ocr import PaddleOCREngine, create_mock_ocr
from .silero_vad import SileroVAD, create_mock_vad
from .gaze_estimator import GazeEstimator, create_mock_gaze

__all__ = [
    "BaseModel",
    "YOLODetector",
    "ArcFaceModel", 
    "PaddleOCREngine",
    "SileroVAD",
    "GazeEstimator",
    # Mock functions
    "create_mock_detector",
    "create_mock_arcface",
    "create_mock_ocr",
    "create_mock_vad",
    "create_mock_gaze"
]
