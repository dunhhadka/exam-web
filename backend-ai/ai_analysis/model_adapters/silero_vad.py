"""
Silero VAD - Voice Activity Detection using Silero VAD model
Detects speech segments in audio
"""

from typing import List, Dict, Optional, Tuple
import numpy as np
import logging

from .base_model import BaseModel

logger = logging.getLogger(__name__)


class SileroVAD(BaseModel):
    """
    Voice Activity Detection using Silero VAD
    
    Input: Audio waveform (float32, mono, 16kHz)
    Output: Speech segments with timestamps
    """
    
    def __init__(
        self,
        device: str = "cpu",
        threshold: float = 0.5,
        sampling_rate: int = 16000,
        min_speech_duration_ms: int = 250,
        min_silence_duration_ms: int = 100
    ):
        """
        Initialize Silero VAD
        
        Args:
            device: Device to run on (VAD is fast on CPU)
            threshold: Speech detection threshold (0-1)
            sampling_rate: Audio sampling rate (Hz)
            min_speech_duration_ms: Minimum speech segment duration
            min_silence_duration_ms: Minimum silence between segments
        """
        super().__init__("Silero-VAD-3.1", device)
        
        self.threshold = threshold
        self.sampling_rate = sampling_rate
        self.min_speech_duration_ms = min_speech_duration_ms
        self.min_silence_duration_ms = min_silence_duration_ms
    
    def load(self) -> bool:
        """
        Load Silero VAD model
        
        Returns:
            bool: True if successful
        """
        try:
            # Try to import torch (Silero uses PyTorch)
            try:
                import torch
            except ImportError:
                logger.error("torch not installed. Run: pip install torch")
                return False
            
            # Load Silero VAD from torchhub
            logger.info(f"Loading {self.model_name}...")
            
            self.model, utils = torch.hub.load(
                repo_or_dir='snakers4/silero-vad',
                model='silero_vad',
                force_reload=False,
                onnx=False
            )
            
            # Get utility functions
            (self.get_speech_timestamps,
             self.save_audio,
             self.read_audio,
             self.VADIterator,
             self.collect_chunks) = utils
            
            # Move model to device
            self.model.to(self.device)
            
            self.is_loaded = True
            logger.info(f"✅ {self.model_name} loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load {self.model_name}: {e}")
            self.is_loaded = False
            return False
    
    def infer(self, audio_waveform: np.ndarray) -> Optional[Dict]:
        """
        Detect speech in audio waveform
        
        Args:
            audio_waveform: Audio data (np.ndarray, float32, mono)
                           Expected shape: (num_samples,)
                           Expected range: [-1.0, 1.0]
        
        Returns:
            Dict containing:
            {
                "speaking": bool,
                "confidence": float,
                "speech_segments": [{"start_ms": int, "end_ms": int}, ...],
                "speaking_duration": float (seconds)
            }
            Returns None if inference fails
        """
        if not self.is_loaded:
            logger.warning(f"{self.model_name} not loaded")
            return None
        
        try:
            import torch
            
            # Ensure audio is 1D
            if audio_waveform.ndim > 1:
                audio_waveform = audio_waveform.flatten()
            
            # Convert to torch tensor
            audio_tensor = torch.from_numpy(audio_waveform).float()
            
            # Get speech timestamps
            speech_timestamps = self.get_speech_timestamps(
                audio_tensor,
                self.model,
                threshold=self.threshold,
                sampling_rate=self.sampling_rate,
                min_speech_duration_ms=self.min_speech_duration_ms,
                min_silence_duration_ms=self.min_silence_duration_ms
            )
            
            # Parse results
            speaking = len(speech_timestamps) > 0
            
            speech_segments = []
            total_speech_duration = 0.0
            
            for segment in speech_timestamps:
                start_sample = segment['start']
                end_sample = segment['end']
                
                start_ms = int((start_sample / self.sampling_rate) * 1000)
                end_ms = int((end_sample / self.sampling_rate) * 1000)
                
                speech_segments.append({
                    "start_ms": start_ms,
                    "end_ms": end_ms
                })
                
                total_speech_duration += (end_sample - start_sample) / self.sampling_rate
            
            # Compute average confidence (simplified)
            confidence = 0.9 if speaking else 0.1
            
            result = {
                "speaking": speaking,
                "confidence": confidence,
                "speech_segments": speech_segments,
                "speaking_duration": total_speech_duration
            }
            
            self._reset_error_count()
            return result
            
        except Exception as e:
            self._handle_error(e)
            return None
    
    def detect_multiple_speakers(
        self,
        audio_waveform: np.ndarray
    ) -> Tuple[bool, int]:
        """
        Estimate number of speakers (simple heuristic)
        
        Note: Silero VAD doesn't do speaker diarization
        This is a simplified heuristic based on segment patterns
        
        Args:
            audio_waveform: Audio data
        
        Returns:
            Tuple of (multiple_speakers_detected, estimated_count)
        """
        result = self.infer(audio_waveform)
        
        if result is None or not result["speaking"]:
            return False, 0
        
        # Simple heuristic: if many short segments, possibly multiple speakers
        segments = result["speech_segments"]
        
        if len(segments) > 5:
            # Many segments might indicate conversation
            return True, 2
        else:
            return False, 1
    
    def warmup(self, dummy_input: Optional[np.ndarray] = None) -> None:
        """
        Warmup with dummy audio
        
        Args:
            dummy_input: Optional dummy audio, if None creates random
        """
        if dummy_input is None:
            # Create dummy 1 second audio @ 16kHz
            dummy_input = np.random.randn(16000).astype(np.float32)
        
        super().warmup(dummy_input)


# Convenience function for mock/testing
def create_mock_vad() -> 'MockSileroVAD':
    """Create a mock VAD for testing"""
    
    class MockSileroVAD(SileroVAD):
        def __init__(self):
            super().__init__(device="cpu")
            self.is_loaded = True
        
        def load(self) -> bool:
            return True
        
        def infer(self, audio_waveform: np.ndarray) -> Dict:
            # Mock: Randomly decide if speaking
            import random
            speaking = random.random() > 0.7
            
            if speaking:
                duration = len(audio_waveform) / self.sampling_rate
                return {
                    "speaking": True,
                    "confidence": 0.9,
                    "duration": duration,
                    "speech_segments": [{
                        "start_ms": 0,
                        "end_ms": int(duration * 1000)
                    }],
                    "duration": duration
                }
            else:
                return {
                    "speaking": False,
                    "confidence": 0.95,
                    "speech_segments": [],
                    "duration": 0.0
                }
    
    return MockSileroVAD()
