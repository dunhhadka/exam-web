"""
PaddleOCR Engine - Adapter for PaddleOCR text detection and recognition
Extracts text from screen captures
"""

from typing import List, Dict, Optional, Tuple
import numpy as np
import logging

from .base_model import BaseModel

logger = logging.getLogger(__name__)


class PaddleOCREngine(BaseModel):
    """
    OCR using PaddleOCR
    
    Input: RGB screenshot image
    Output: Extracted text and bounding boxes
    """
    
    def __init__(
        self,
        lang: str = "en",
        device: str = "cpu",
        use_angle_cls: bool = True,
        use_gpu: bool = False
    ):
        """
        Initialize PaddleOCR
        
        Args:
            lang: Language(s) to recognize ("en", "vi", "en,vi")
            device: Device to run on (PaddleOCR uses its own device management)
            use_angle_cls: Whether to use angle classification
            use_gpu: Whether to use GPU (separate from device param)
        """
        super().__init__("PaddleOCR-v2.7", device)
        
        self.lang = lang
        self.use_angle_cls = use_angle_cls
        self.use_gpu = use_gpu and device.startswith("cuda")
    
    def load(self) -> bool:
        """
        Load PaddleOCR model
        
        Returns:
            bool: True if successful
        """
        try:
            # Try to import paddleocr
            try:
                from paddleocr import PaddleOCR
            except ImportError:
                logger.error("paddleocr not installed. Run: pip install paddleocr")
                return False
            
            # Initialize PaddleOCR
            logger.info(f"Loading {self.model_name} for language: {self.lang}")
            
            self.model = PaddleOCR(
                lang=self.lang,
                use_angle_cls=self.use_angle_cls,
                use_gpu=self.use_gpu,
                show_log=False  # Suppress verbose logging
            )
            
            self.is_loaded = True
            logger.info(f"✅ {self.model_name} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.model_name}: {e}")
            self.is_loaded = False
            return False
    
    def infer(self, image: np.ndarray) -> Optional[List[Dict]]:
        """
        Extract text from image
        
        Args:
            image: RGB image (np.ndarray, HxWx3)
        
        Returns:
            List of text regions:
            [
                {
                    "bbox": [[x1,y1], [x2,y2], [x3,y3], [x4,y4]],
                    "text": str,
                    "confidence": float
                },
                ...
            ]
            Returns None if inference fails
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded")
            return None
        
        try:
            # Run OCR
            # PaddleOCR returns: [[[bbox], (text, confidence)], ...]
            result = self.model.ocr(image, cls=self.use_angle_cls)
            
            if result is None or len(result) == 0:
                return []
            
            # Parse results
            text_regions = []
            for line in result[0]:  # result is nested list
                if line is None:
                    continue
                
                bbox, (text, confidence) = line
                
                text_region = {
                    "bbox": bbox,  # 4 corner points
                    "text": text,
                    "confidence": float(confidence)
                }
                
                text_regions.append(text_region)
            
            self._reset_error_count()
            return text_regions
            
        except Exception as e:
            self._handle_error(e)
            return None
    
    def extract_text(self, image: np.ndarray) -> Tuple[str, List[Dict]]:
        """
        High-level API: Extract all text as single string + regions
        
        Args:
            image: RGB image
        
        Returns:
            Tuple of (full_text, text_regions)
        """
        text_regions = self.infer(image)
        
        if text_regions is None:
            return "", []
        
        # Concatenate all text
        full_text = " ".join([region["text"] for region in text_regions])
        
        return full_text, text_regions
    
    def detect_keywords(
        self,
        image: np.ndarray,
        keywords: List[str],
        case_sensitive: bool = False
    ) -> Tuple[str, List[str]]:
        """
        Extract text and detect specific keywords
        
        Args:
            image: RGB image
            keywords: List of keywords to detect
            case_sensitive: Whether to match case-sensitively
        
        Returns:
            Tuple of (full_text, detected_keywords)
        """
        full_text, _ = self.extract_text(image)
        
        if not case_sensitive:
            full_text_lower = full_text.lower()
            keywords_lower = [kw.lower() for kw in keywords]
        else:
            full_text_lower = full_text
            keywords_lower = keywords
        
        # Find matching keywords
        detected = []
        for i, kw in enumerate(keywords_lower):
            if kw in full_text_lower:
                detected.append(keywords[i])  # Return original case
        
        return full_text, detected
    
    def warmup(self, dummy_input: Optional[np.ndarray] = None) -> None:
        """
        Warmup with dummy screenshot
        
        Args:
            dummy_input: Optional dummy image, if None creates random
        """
        if dummy_input is None:
            # Create dummy 1920x1080 RGB image
            dummy_input = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
        
        super().warmup(dummy_input)


# Convenience function for mock/testing
def create_mock_ocr() -> 'MockPaddleOCR':
    """Create a mock OCR engine for testing"""
    
    class MockPaddleOCR(PaddleOCREngine):
        def __init__(self):
            super().__init__(device="cpu")
            self.is_loaded = True
        
        def load(self) -> bool:
            return True
        
        def infer(self, image: np.ndarray) -> List[Dict]:
            # Mock: Return sample text
            h, w = image.shape[:2]
            return [{
                "bbox": [[100, 100], [500, 100], [500, 150], [100, 150]],
                "text": "Sample OCR text from screen",
                "confidence": 0.95
            }]
    
    return MockPaddleOCR()
