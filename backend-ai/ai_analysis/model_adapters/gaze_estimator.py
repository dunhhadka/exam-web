"""
Gaze Estimator - Estimates gaze direction and head pose
Uses lightweight models for behavior analysis
"""

from typing import Dict, Optional, Tuple
import numpy as np
import logging

from .base_model import BaseModel

logger = logging.getLogger(__name__)


class GazeEstimator(BaseModel):
    """
    Gaze and head pose estimation
    
    Input: Face image with landmarks
    Output: Gaze direction, head pose angles
    """
    
    def __init__(
        self,
        device: str = "cpu",
        model_type: str = "mediapipe"  # or "dlib", "opencv"
    ):
        """
        Initialize gaze estimator
        
        Args:
            device: Device to run on (typically CPU is sufficient)
            model_type: Backend to use ("mediapipe", "dlib", "opencv")
        """
        super().__init__(f"GazeEstimator-{model_type}", device)
        
        self.model_type = model_type
        self.face_mesh = None
    
    def load(self) -> bool:
        """
        Load gaze estimation model
        
        Returns:
            bool: True if successful
        """
        try:
            if self.model_type == "mediapipe":
                # Try to import mediapipe
                try:
                    import mediapipe as mp
                except ImportError:
                    logger.error("mediapipe not installed. Run: pip install mediapipe")
                    return False
                
                logger.info(f"Loading {self.model_name}...")
                
                # Initialize MediaPipe Face Mesh
                mp_face_mesh = mp.solutions.face_mesh
                self.face_mesh = mp_face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5
                )
                
            elif self.model_type == "opencv":
                # Use OpenCV's basic face landmark detector
                import cv2
                
                logger.info(f"Loading {self.model_name}...")
                # Would load OpenCV cascade or DNN models here
                self.face_mesh = None  # Placeholder
                
            else:
                logger.error(f"Unknown model type: {self.model_type}")
                return False
            
            self.is_loaded = True
            logger.info(f"✅ {self.model_name} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.model_name}: {e}")
            self.is_loaded = False
            return False
    
    def infer(self, face_image: np.ndarray) -> Optional[Dict]:
        """
        Estimate gaze direction and head pose
        
        Args:
            face_image: RGB face image (np.ndarray, HxWx3)
        
        Returns:
            Dict containing:
            {
                "gaze_direction": str ("center", "left", "right", "up", "down"),
                "gaze_angles": {"yaw": float, "pitch": float},
                "head_pose": {"yaw": float, "pitch": float, "roll": float},
                "confidence": float
            }
            Returns None if inference fails
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded")
            return None
        
        try:
            if self.model_type == "mediapipe":
                return self._infer_mediapipe(face_image)
            else:
                return self._infer_simple(face_image)
                
        except Exception as e:
            self._handle_error(e)
            return None
    
    def _infer_mediapipe(self, face_image: np.ndarray) -> Dict:
        """Use MediaPipe Face Mesh for gaze estimation"""
        import cv2
        
        # Convert RGB to BGR for MediaPipe
        face_bgr = cv2.cvtColor(face_image, cv2.COLOR_RGB2BGR)
        
        # Process image
        results = self.face_mesh.process(face_bgr)
        
        if not results.multi_face_landmarks:
            # No face detected
            return {
                "gaze_direction": "unknown",
                "gaze_angles": {"yaw": 0.0, "pitch": 0.0},
                "head_pose": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0},
                "confidence": 0.0
            }
        
        # Get first face landmarks
        face_landmarks = results.multi_face_landmarks[0]
        
        # Estimate head pose from landmarks
        # This is simplified - real implementation would use PnP algorithm
        h, w = face_image.shape[:2]
        
        # Get key landmarks for pose estimation
        nose_tip = face_landmarks.landmark[1]
        left_eye = face_landmarks.landmark[33]
        right_eye = face_landmarks.landmark[263]
        
        # Simple heuristic for gaze direction
        nose_x = nose_tip.x * w
        nose_y = nose_tip.y * h
        
        center_x = w / 2
        center_y = h / 2
        
        # Calculate yaw and pitch
        yaw = (nose_x - center_x) / (w / 2) * 45  # Normalize to degrees
        pitch = (nose_y - center_y) / (h / 2) * 30
        
        # Determine direction
        direction = self._angles_to_direction(yaw, pitch)
        
        result = {
            "gaze_direction": direction,
            "gaze_angles": {"yaw": float(yaw), "pitch": float(pitch)},
            "head_pose": {"yaw": float(yaw), "pitch": float(pitch), "roll": 0.0},
            "confidence": 0.8
        }
        
        self._reset_error_count()
        return result
    
    def _infer_simple(self, face_image: np.ndarray) -> Dict:
        """Simple heuristic-based estimation (fallback)"""
        # Very basic estimation based on face brightness distribution
        h, w = face_image.shape[:2]
        
        # Split face into regions
        left_half = face_image[:, :w//2]
        right_half = face_image[:, w//2:]
        top_half = face_image[:h//2, :]
        bottom_half = face_image[h//2:, :]
        
        # Compare brightness (eyes are darker)
        left_bright = left_half.mean()
        right_bright = right_half.mean()
        top_bright = top_half.mean()
        bottom_bright = bottom_half.mean()
        
        # Estimate direction
        yaw = (right_bright - left_bright) / 255 * 30
        pitch = (bottom_bright - top_bright) / 255 * 20
        
        direction = self._angles_to_direction(yaw, pitch)
        
        return {
            "gaze_direction": direction,
            "gaze_angles": {"yaw": float(yaw), "pitch": float(pitch)},
            "head_pose": {"yaw": float(yaw), "pitch": float(pitch), "roll": 0.0},
            "confidence": 0.5
        }
    
    def _angles_to_direction(self, yaw: float, pitch: float) -> str:
        """Convert angles to direction label"""
        # Thresholds (degrees)
        YAW_THRESHOLD = 15
        PITCH_THRESHOLD = 10
        
        if abs(yaw) < YAW_THRESHOLD and abs(pitch) < PITCH_THRESHOLD:
            return "center"
        elif yaw < -YAW_THRESHOLD:
            return "left"
        elif yaw > YAW_THRESHOLD:
            return "right"
        elif pitch < -PITCH_THRESHOLD:
            return "up"
        elif pitch > PITCH_THRESHOLD:
            return "down"
        else:
            return "center"
    
    def estimate_looking_away_duration(
        self,
        direction: str,
        previous_duration: float = 0.0,
        frame_interval: float = 1.0
    ) -> float:
        """
        Track duration of looking away
        
        Args:
            direction: Current gaze direction
            previous_duration: Duration from previous frame
            frame_interval: Time between frames (seconds)
        
        Returns:
            Updated duration (seconds)
        """
        if direction != "center":
            return previous_duration + frame_interval
        else:
            return 0.0
    
    def warmup(self, dummy_input: Optional[np.ndarray] = None) -> None:
        """
        Warmup with dummy face image
        
        Args:
            dummy_input: Optional dummy image, if None creates random
        """
        if dummy_input is None:
            # Create dummy 224x224 RGB face image
            dummy_input = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        super().warmup(dummy_input)


# Convenience function for mock/testing
def create_mock_gaze() -> 'MockGazeEstimator':
    """Create a mock gaze estimator for testing"""
    
    class MockGazeEstimator(GazeEstimator):
        def __init__(self):
            super().__init__(device="cpu")
            self.is_loaded = True
        
        def load(self) -> bool:
            return True
        
        def infer(self, face_image: np.ndarray) -> Dict:
            # Mock: Always return center gaze
            return {
                "direction": "center",
                "gaze_angles": {"yaw": 0.0, "pitch": 0.0},
                "head_pose": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0},
                "confidence": 0.9
            }
    
    return MockGazeEstimator()
