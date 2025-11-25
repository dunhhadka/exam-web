"""
Base Model - Abstract interface for individual model adapters
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
import logging

logger = logging.getLogger(__name__)


class BaseModel(ABC):
    """
    Abstract base class for model adapters
    
    Each model (YOLO, ArcFace, OCR, etc.) should inherit from this
    and implement the core inference methods.
    """
    
    def __init__(self, model_name: str, device: str = "cpu"):
        """
        Initialize model adapter
        
        Args:
            model_name: Name/identifier of the model
            device: Device to run on ("cpu", "cuda", "cuda:0", etc.)
        """
        self.model_name = model_name
        self.device = device
        self.model = None
        self.is_loaded = False
        self.error_count = 0
        self.max_errors = 3
        
        logger.info(f"Initializing {model_name} on {device}")
    
    @abstractmethod
    def load(self) -> bool:
        """
        Load model weights and initialize
        
        Returns:
            bool: True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    def infer(self, input_data: Any) -> Optional[Any]:
        """
        Run inference on input data
        
        Args:
            input_data: Model-specific input (image, audio, etc.)
        
        Returns:
            Model-specific output, or None if inference failed
        """
        pass
    
    def warmup(self, dummy_input: Any) -> None:
        """
        Run dummy inference to warm up model
        Initializes CUDA kernels, JIT compilation, etc.
        
        Args:
            dummy_input: Model-specific dummy input
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded, skipping warmup")
            return
        
        logger.info(f"Warming up {self.model_name}...")
        try:
            self.infer(dummy_input)
            logger.info(f"✅ {self.model_name} warmup complete")
        except Exception as e:
            logger.error(f"Warmup failed for {self.model_name}: {e}")
    
    def cleanup(self) -> None:
        """
        Cleanup model resources
        Override if model needs special cleanup
        """
        if self.model is not None:
            del self.model
            self.model = None
            self.is_loaded = False
            logger.info(f"Cleaned up {self.model_name}")
    
    def _handle_error(self, error: Exception) -> None:
        """
        Handle inference error with retry logic
        
        Args:
            error: Exception that occurred
        """
        self.error_count += 1
        logger.error(f"{self.model_name} error ({self.error_count}/{self.max_errors}): {error}")
        
        if self.error_count >= self.max_errors:
            logger.critical(f"{self.model_name} persistently failing, marking as unavailable")
            self.is_loaded = False
    
    def _reset_error_count(self) -> None:
        """Reset error count after successful inference"""
        if self.error_count > 0:
            self.error_count = 0
