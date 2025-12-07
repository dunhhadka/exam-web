"""
YOLO Face Detector - Adapter for YOLOv8n-Face model
Detects faces in camera frames
"""

from typing import List, Dict, Optional, Tuple
import numpy as np
import logging

from .base_model import BaseModel

logger = logging.getLogger(__name__)


class YOLODetector(BaseModel):
    """
    Face detection using YOLOv8n-Face
    
    Input: RGB image (np.ndarray, HxWx3)
    Output: List of bounding boxes with confidence scores
    """
    
    def __init__(
        self, 
        model_path: Optional[str] = None,
        device: str = "cuda",
        confidence_threshold: float = 0.5,
        input_size: Tuple[int, int] = (640, 640)
    ):
        """
        Initialize YOLO face detector
        
        Args:
            model_path: Path to model weights (if None, downloads pretrained)
            device: Device to run on ("cpu" or "cuda")
            confidence_threshold: Minimum confidence for detections
            input_size: Input size for model (width, height)
        """
        super().__init__("YOLOv8n-Face", device)
        
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.input_size = input_size
        
        # Model will be loaded in load()
        self.model = None
    
    def load(self) -> bool:
        """
        Load YOLOv8 model
        
        Returns:
            bool: True if successful
        """
        try:
            # Try to import ultralytics
            try:
                from ultralytics import YOLO
            except ImportError:
                logger.error("ultralytics not installed. Run: pip install ultralytics")
                return False
            
            # Load model
            if self.model_path:
                logger.info(f"Loading YOLO from {self.model_path}")
                self.model = YOLO(self.model_path)
            else:
                # Use pretrained YOLOv8n (will be fine-tuned for faces)
                logger.info("Loading pretrained YOLOv8n")
                self.model = YOLO("yolov8n.pt")
            
            # Move to device
            self.model.to(self.device)
            
            # Enable FP16 if CUDA
            if self.device.startswith("cuda"):
                try:
                    self.model.model.half()  # Convert to FP16
                    logger.info(f"✅ {self.model_name} loaded in FP16 mode")
                except Exception as e:
                    logger.warning(f"FP16 conversion failed, using FP32: {e}")
            
            # Test inference to catch model issues early
            try:
                dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
                _ = self.model(dummy_img, imgsz=640, conf=0.5, verbose=False)
            except Exception as e:
                logger.warning(f"Model warmup warning: {e}")
                # Continue anyway - may work with real images
            
            self.is_loaded = True
            logger.info(f"✅ {self.model_name} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.model_name}: {e}")
            self.is_loaded = False
            return False
    
    def infer(self, image: np.ndarray) -> Optional[List[Dict]]:
        """
        Detect faces in image
        
        Args:
            image: RGB image (np.ndarray, HxWx3, uint8)
        
        Returns:
            List of detections:
            [
                {
                    "bbox": [x, y, width, height],
                    "confidence": float,
                    "landmarks": {...} (optional)
                },
                ...
            ]
            Returns None if inference fails
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded")
            return None
        
        # Retry logic for intermittent errors
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Run inference
                results = self.model(
                    image,
                    imgsz=self.input_size,
                    conf=self.confidence_threshold,
                    verbose=False
                )
                
                # Parse results
                detections = []
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            # Get box coordinates (xyxy format)
                            xyxy = box.xyxy[0].cpu().numpy()
                            conf = float(box.conf[0].cpu().numpy())
                            
                            # Convert to xywh format
                            x1, y1, x2, y2 = xyxy
                            x, y = int(x1), int(y1)
                            w, h = int(x2 - x1), int(y2 - y1)
                            
                            detection = {
                                "bbox": [x, y, w, h],
                                "confidence": conf
                            }
                            
                            # Add landmarks if available
                            if hasattr(box, 'keypoints') and box.keypoints is not None:
                                kpts = box.keypoints[0].cpu().numpy()
                                detection["landmarks"] = self._parse_landmarks(kpts)
                            
                            detections.append(detection)
                
                self._reset_error_count()
                return detections
                
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.debug(f"{self.model_name} error (attempt {attempt + 1}/{max_retries}): {e}")
                    continue  # Retry
                else:
                    self._handle_error(e)
                    return None
        
        return None  # All retries failed
    
    def _parse_landmarks(self, keypoints: np.ndarray) -> Dict:
        """
        Parse YOLO keypoints to standard landmark format
        
        Args:
            keypoints: Keypoints from YOLO (Nx3: x, y, confidence)
        
        Returns:
            Dict with landmark positions
        """
        # YOLO face typically has 5 keypoints:
        # 0: left eye, 1: right eye, 2: nose, 3: left mouth, 4: right mouth
        landmark_names = ["left_eye", "right_eye", "nose", "left_mouth", "right_mouth"]
        
        landmarks = {}
        for i, name in enumerate(landmark_names):
            if i < len(keypoints):
                x, y = keypoints[i][:2]
                landmarks[name] = [int(x), int(y)]
        
        return landmarks
    
    def detect_faces(self, image: np.ndarray) -> Tuple[int, List[Dict]]:
        """
        High-level API: Detect faces and return count + bboxes
        
        Args:
            image: RGB image
        
        Returns:
            Tuple of (face_count, detections)
        """
        detections = self.infer(image)
        if detections is None:
            return 0, []
        
        return len(detections), detections
    
    def warmup(self, dummy_input: Optional[np.ndarray] = None) -> None:
        """
        Warmup with dummy image
        
        Args:
            dummy_input: Optional dummy image, if None creates random
        """
        if dummy_input is None:
            # Create dummy 640x480 RGB image
            dummy_input = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        super().warmup(dummy_input)


# Convenience function for mock/testing
def create_mock_detector() -> 'MockYOLODetector':
    """Create a mock detector for testing without real model"""
    
    class MockYOLODetector(YOLODetector):
        def __init__(self):
            super().__init__(device="cpu")
            self.is_loaded = True
        
        def load(self) -> bool:
            return True
        
        def infer(self, image: np.ndarray) -> List[Dict]:
            # Mock: Always return 1 face in center
            h, w = image.shape[:2]
            return [{
                "bbox": [w//4, h//4, w//2, h//2],
                "confidence": 0.95,
                "landmarks": {
                    "left_eye": [w//3, h//3],
                    "right_eye": [2*w//3, h//3],
                    "nose": [w//2, h//2],
                    "left_mouth": [w//3, 2*h//3],
                    "right_mouth": [2*w//3, 2*h//3]
                }
            }]
    
    return MockYOLODetector()
