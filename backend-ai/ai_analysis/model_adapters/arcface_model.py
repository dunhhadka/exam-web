"""
ArcFace Model - Adapter for ArcFace face recognition
Extracts face embeddings and compares with KYC
"""

from typing import Optional, Tuple, List
import numpy as np
import logging

from .base_model import BaseModel

logger = logging.getLogger(__name__)


class ArcFaceModel(BaseModel):
    """
    Face recognition using ArcFace
    
    Input: Cropped face image (RGB, typically 112x112)
    Output: 512-dimensional embedding vector
    """
    
    def __init__(
        self,
        model_path: Optional[str] = None,
        device: str = "cuda",
        embedding_size: int = 512
    ):
        """
        Initialize ArcFace model
        
        Args:
            model_path: Path to model weights
            device: Device to run on
            embedding_size: Size of embedding vector (typically 512)
        """
        super().__init__("ArcFace-R100", device)
        
        self.model_path = model_path
        self.embedding_size = embedding_size
        self.input_size = (112, 112)  # Standard ArcFace input
    
    def load(self) -> bool:
        """
        Load ArcFace model
        
        Returns:
            bool: True if successful
        """
        try:
            # Try to import insightface
            try:
                import insightface
                from insightface.app import FaceAnalysis
            except ImportError:
                logger.error("insightface not installed. Run: pip install insightface")
                return False
            
            # Initialize face analysis app
            logger.info(f"Loading {self.model_name}...")
            
            # FaceAnalysis includes detection + recognition
            # We'll use only the recognition part
            self.app = FaceAnalysis(
                name='buffalo_l',  # Model pack name
                providers=['CUDAExecutionProvider'] if self.device.startswith('cuda') else ['CPUExecutionProvider']
            )
            self.app.prepare(ctx_id=0 if self.device.startswith('cuda') else -1)
            
            # Get recognition model
            self.model = self.app.models['recognition']
            
            # Enable FP16 if CUDA
            if self.device.startswith("cuda"):
                try:
                    # InsightFace uses ONNX Runtime, check if FP16 supported
                    logger.info(f"✅ {self.model_name} loaded with GPU acceleration")
                except Exception as e:
                    logger.warning(f"GPU optimization failed: {e}")
            
            self.is_loaded = True
            logger.info(f"✅ {self.model_name} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.model_name}: {e}")
            self.is_loaded = False
            return False
    
    def infer(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding
        
        Args:
            face_image: Cropped face image (RGB, HxWx3)
                       Will be resized to 112x112 internally
        
        Returns:
            np.ndarray: 512-dimensional normalized embedding
            Returns None if inference fails
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded")
            return None
        
        try:
            import cv2
            if face_image is None:
                logger.warning("infer received None face_image")
                return None
            if not isinstance(face_image, np.ndarray):
                logger.warning("infer received non-numpy face_image")
                return None
            if face_image.size == 0 or face_image.ndim < 2:
                logger.warning("infer received empty face_image")
                return None

            # Ensure HxWx3 RGB
            if face_image.ndim == 2:
                try:
                    face_image = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
                except Exception as e:
                    logger.warning(f"failed to convert gray->rgb: {e}")
                    return None
            elif face_image.ndim == 3 and face_image.shape[2] == 1:
                try:
                    face_image = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
                except Exception as e:
                    logger.warning(f"failed to convert 1ch->rgb: {e}")
                    return None
            elif face_image.ndim == 3 and face_image.shape[2] == 4:
                # Assume RGBA
                try:
                    face_image = cv2.cvtColor(face_image, cv2.COLOR_RGBA2RGB)
                except Exception as e:
                    logger.warning(f"failed to convert rgba->rgb: {e}")
                    return None
            elif face_image.ndim == 3 and face_image.shape[2] != 3:
                logger.warning(f"infer received unexpected channel count: {face_image.shape}")
                return None

            h, w = face_image.shape[:2]
            if h == 0 or w == 0:
                logger.warning("infer received zero-dimension face_image")
                return None
            
            # Resize to standard input size
            if face_image.shape[:2] != self.input_size:
                try:
                    face_image = cv2.resize(face_image, self.input_size)
                except Exception as e:
                    logger.warning(f"resize failed in infer: {e}")
                    return None
            
            # Convert RGB to BGR (insightface expects BGR)
            face_bgr = cv2.cvtColor(face_image, cv2.COLOR_RGB2BGR)
            
            # Use insightface app.get() to detect face and get embedding
            # This works even on cropped faces
            faces = self.app.get(face_bgr)
            
            if len(faces) == 0:
                # No face detected in crop - try alternative approach
                # Use the recognition model directly with dummy face box
                try:
                    # Get the recognition model from app
                    rec_model = self.app.models['recognition']
                    
                    # Prepare image (normalize, transpose)
                    img = face_bgr.astype(np.float32)
                    if face_bgr.shape[:2] != self.input_size:
                        try:
                            face_bgr = cv2.resize(face_bgr, self.input_size)
                            img = face_bgr.astype(np.float32)
                        except Exception as e:
                            logger.warning(f"resize failed before direct recognition: {e}")
                            return None
                    img = (img - 127.5) / 128.0
                    img = img.transpose(2, 0, 1)  # HWC to CHW
                    img = np.expand_dims(img, axis=0)  # Add batch dim
                    
                    # Get embedding
                    embedding = rec_model.get_feat(img)
                    if embedding is not None:
                        embedding = embedding.flatten()
                    
                except Exception as e:
                    logger.warning(f"Direct recognition model failed: {e}")
                    return None
            else:
                # Face detected, get embedding
                embedding = faces[0].embedding
            
            if embedding is None:
                logger.warning("Failed to extract embedding")
                return None
            
            # Normalize embedding
            embedding = embedding / np.linalg.norm(embedding)
            
            self._reset_error_count()
            return embedding
            
        except Exception as e:
            self._handle_error(e)
            return None
    
    def compute_similarity(
        self, 
        embedding1: np.ndarray, 
        embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding (512-dim)
            embedding2: Second embedding (512-dim)
        
        Returns:
            float: Similarity score in [0, 1] (higher = more similar)
        """
        # Cosine similarity for normalized vectors is just dot product
        similarity = np.dot(embedding1, embedding2)
        
        # Clamp to [0, 1]
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    
    def verify_face(
        self,
        face_or_embedding: np.ndarray,
        kyc_embedding: np.ndarray,
        threshold: float = 0.45
    ) -> Tuple[bool, float]:
        """
        Verify if face matches KYC embedding
        
        Args:
            face_image: Current face image
            kyc_embedding: Reference KYC embedding
            threshold: Similarity threshold for match (default: 0.45)
        
        Returns:
            Tuple of (is_match, similarity_score)
        """
        if face_or_embedding is None:
            return False, 0.0
        if isinstance(face_or_embedding, np.ndarray) and face_or_embedding.ndim == 1 and face_or_embedding.shape[0] == self.embedding_size:
            current_embedding = face_or_embedding.astype(np.float32)
            norm = np.linalg.norm(current_embedding)
            if norm > 0:
                current_embedding = current_embedding / norm
        else:
            current_embedding = self.infer(face_or_embedding)
        
        if current_embedding is None:
            return False, 0.0
        
        # Compute similarity
        similarity = self.compute_similarity(current_embedding, kyc_embedding)
        
        # Check if match
        is_match = similarity >= threshold
        
        return is_match, similarity
    
    def warmup(self, dummy_input: Optional[np.ndarray] = None) -> None:
        """
        Warmup with dummy face image
        
        Args:
            dummy_input: Optional dummy image, if None creates random
        """
        if dummy_input is None:
            # Create dummy 112x112 RGB image
            dummy_input = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
        
        super().warmup(dummy_input)


# Convenience function for mock/testing
def create_mock_arcface() -> 'MockArcFaceModel':
    """Create a mock ArcFace model for testing"""
    
    class MockArcFaceModel(ArcFaceModel):
        def __init__(self):
            super().__init__(device="cpu")
            self.is_loaded = True
        
        def load(self) -> bool:
            return True
        
        def infer(self, face_image: np.ndarray) -> np.ndarray:
            # Mock: Return random normalized 512-dim vector
            embedding = np.random.randn(512).astype(np.float32)
            embedding = embedding / np.linalg.norm(embedding)
            return embedding
    
    return MockArcFaceModel()
