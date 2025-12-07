"""
Frame Capture Pipeline - Extract frames from WebRTC tracks
Converts MediaStreamTrack (aiortc) to numpy arrays for AI inference
"""

import asyncio
import logging
from typing import Optional, Dict, Tuple
import numpy as np
import time

logger = logging.getLogger(__name__)

# Check if aiortc is available
try:
    from aiortc import MediaStreamTrack
    import av
    AIORTC_AVAILABLE = True
except ImportError:
    AIORTC_AVAILABLE = False
    MediaStreamTrack = None
    av = None
    logger.warning("aiortc not available - frame capture disabled")


class FrameCaptureError(Exception):
    """Base exception for frame capture errors"""
    pass


class TrackNotAvailableError(FrameCaptureError):
    """Track is not available or has ended"""
    pass


class FrameDecodeError(FrameCaptureError):
    """Failed to decode frame from track"""
    pass


class FrameCapture:
    """
    Captures frames from WebRTC MediaStreamTracks
    
    Supports:
    - Camera video (av.VideoFrame → RGB numpy)
    - Screen video (av.VideoFrame → RGB numpy)
    - Audio (av.AudioFrame → PCM float32 numpy)
    """
    
    def __init__(self):
        """Initialize frame capture"""
        if not AIORTC_AVAILABLE:
            logger.error("aiortc not available - frame capture will not work")
        
        self.stats = {
            "camera_frames_captured": 0,
            "screen_frames_captured": 0,
            "audio_frames_captured": 0,
            "capture_errors": 0
        }
    
    async def capture_camera_frame(
        self, 
        camera_track: Optional[MediaStreamTrack],
        timeout: float = 1.0
    ) -> Optional[Dict]:
        """
        Capture one frame from camera track
        
        Args:
            camera_track: Camera MediaStreamTrack from aiortc
            timeout: Max time to wait for frame (seconds)
        
        Returns:
            Dict containing:
            {
                "image": np.ndarray (HxWx3, uint8, RGB),
                "width": int,
                "height": int,
                "timestamp": int (milliseconds)
            }
            Returns None if capture fails
        """
        if not AIORTC_AVAILABLE:
            logger.error("aiortc not available")
            return None
        
        if camera_track is None:
            logger.debug("Camera track is None")
            return None
        
        try:
            # Receive frame from track (with timeout)
            frame = await asyncio.wait_for(
                camera_track.recv(),
                timeout=timeout
            )
            
            # Convert av.VideoFrame to numpy array
            image = self._video_frame_to_numpy(frame)
            
            if image is None:
                logger.warning("Failed to convert camera frame to numpy")
                self.stats["capture_errors"] += 1
                return None
            
            self.stats["camera_frames_captured"] += 1
            
            return {
                "image": image,
                "width": image.shape[1],
                "height": image.shape[0],
                "timestamp": int(time.time() * 1000),
                "format": "rgb24"
            }
            
        except asyncio.TimeoutError:
            logger.debug(f"Camera frame capture timeout ({timeout}s)")
            return None
        
        except Exception as e:
            logger.error(f"Camera frame capture error: {e}")
            self.stats["capture_errors"] += 1
            return None
    
    async def capture_screen_frame(
        self,
        screen_track: Optional[MediaStreamTrack],
        timeout: float = 1.0
    ) -> Optional[Dict]:
        """
        Capture one frame from screen track
        
        Args:
            screen_track: Screen MediaStreamTrack from aiortc
            timeout: Max time to wait for frame (seconds)
        
        Returns:
            Dict containing:
            {
                "image": np.ndarray (HxWx3, uint8, RGB),
                "width": int,
                "height": int,
                "timestamp": int (milliseconds)
            }
            Returns None if capture fails
        """
        if not AIORTC_AVAILABLE:
            logger.error("aiortc not available")
            return None
        
        if screen_track is None:
            logger.debug("Screen track is None")
            return None
        
        try:
            # Receive frame from track (with timeout)
            frame = await asyncio.wait_for(
                screen_track.recv(),
                timeout=timeout
            )
            
            # Convert av.VideoFrame to numpy array
            image = self._video_frame_to_numpy(frame)
            
            if image is None:
                logger.warning("Failed to convert screen frame to numpy")
                self.stats["capture_errors"] += 1
                return None
            
            self.stats["screen_frames_captured"] += 1
            
            return {
                "image": image,
                "width": image.shape[1],
                "height": image.shape[0],
                "timestamp": int(time.time() * 1000),
                "format": "rgb24"
            }
            
        except asyncio.TimeoutError:
            logger.debug(f"Screen frame capture timeout ({timeout}s)")
            return None
        
        except Exception as e:
            logger.error(f"Screen frame capture error: {e}")
            self.stats["capture_errors"] += 1
            return None
    
    async def capture_audio_buffer(
        self,
        audio_track: Optional[MediaStreamTrack],
        duration_ms: int = 1000,
        timeout: float = 2.0
    ) -> Optional[Dict]:
        """
        Capture audio buffer from audio track
        
        Args:
            audio_track: Audio MediaStreamTrack from aiortc
            duration_ms: Desired buffer duration (milliseconds)
            timeout: Max time to wait for audio (seconds)
        
        Returns:
            Dict containing:
            {
                "buffer": np.ndarray (float32, mono or stereo),
                "sample_rate": int,
                "channels": int,
                "duration_ms": int,
                "timestamp": int (milliseconds)
            }
            Returns None if capture fails
        """
        if not AIORTC_AVAILABLE:
            logger.error("aiortc not available")
            return None
        
        if audio_track is None:
            logger.debug("Audio track is None")
            return None
        
        try:
            # Receive audio frame from track (with timeout)
            frame = await asyncio.wait_for(
                audio_track.recv(),
                timeout=timeout
            )
            
            # Convert av.AudioFrame to numpy array
            audio_data, sample_rate, channels = self._audio_frame_to_numpy(frame)
            
            if audio_data is None:
                logger.warning("Failed to convert audio frame to numpy")
                self.stats["capture_errors"] += 1
                return None
            
            # Calculate actual duration
            actual_duration_ms = int((len(audio_data) / sample_rate) * 1000)
            
            self.stats["audio_frames_captured"] += 1
            
            return {
                "buffer": audio_data,
                "sample_rate": sample_rate,
                "channels": channels,
                "duration_ms": actual_duration_ms,
                "timestamp": int(time.time() * 1000),
                "format": "float32"
            }
            
        except asyncio.TimeoutError:
            logger.debug(f"Audio capture timeout ({timeout}s)")
            return None
        
        except Exception as e:
            logger.error(f"Audio capture error: {e}")
            self.stats["capture_errors"] += 1
            return None
    
    async def capture_all(
        self,
        camera_track: Optional[MediaStreamTrack] = None,
        screen_track: Optional[MediaStreamTrack] = None,
        audio_track: Optional[MediaStreamTrack] = None,
        timeout: float = 2.0
    ) -> Dict:
        """
        Capture frames from all available tracks
        
        Args:
            camera_track: Optional camera track
            screen_track: Optional screen track
            audio_track: Optional audio track
            timeout: Max time to wait for each track
        
        Returns:
            Dict containing:
            {
                "camera": {...} or None,
                "screen": {...} or None,
                "audio": {...} or None,
                "capture_time_ms": int
            }
        """
        start_time = time.time()
        
        # Capture all tracks concurrently
        results = await asyncio.gather(
            self.capture_camera_frame(camera_track, timeout),
            self.capture_screen_frame(screen_track, timeout),
            self.capture_audio_buffer(audio_track, timeout),
            return_exceptions=True
        )
        
        # Unpack results
        camera_frame = results[0] if not isinstance(results[0], Exception) else None
        screen_frame = results[1] if not isinstance(results[1], Exception) else None
        audio_buffer = results[2] if not isinstance(results[2], Exception) else None
        
        capture_time_ms = int((time.time() - start_time) * 1000)
        
        return {
            "camera": camera_frame,
            "screen": screen_frame,
            "audio": audio_buffer,
            "capture_time_ms": capture_time_ms
        }
    
    def _video_frame_to_numpy(self, frame) -> Optional[np.ndarray]:
        """
        Convert av.VideoFrame to numpy array (RGB)
        
        Args:
            frame: av.VideoFrame from aiortc
        
        Returns:
            np.ndarray with shape (H, W, 3) and dtype uint8 (RGB)
            Returns None if conversion fails
        """
        if frame is None:
            return None
        
        try:
            # Convert to RGB24 format
            # aiortc VideoFrame has to_ndarray method
            image = frame.to_ndarray(format="rgb24")
            
            # Verify shape
            if len(image.shape) != 3 or image.shape[2] != 3:
                logger.error(f"Invalid image shape: {image.shape}")
                return None
            
            return image
            
        except Exception as e:
            logger.error(f"Failed to convert video frame: {e}")
            return None
    
    def _audio_frame_to_numpy(self, frame) -> Tuple[Optional[np.ndarray], int, int]:
        """
        Convert av.AudioFrame to numpy array (float32)
        
        Args:
            frame: av.AudioFrame from aiortc
        
        Returns:
            Tuple of (audio_data, sample_rate, channels)
            audio_data: np.ndarray with dtype float32, shape (samples,) or (samples, channels)
            sample_rate: int (e.g., 16000)
            channels: int (1 for mono, 2 for stereo)
            Returns (None, 0, 0) if conversion fails
        """
        if frame is None:
            return None, 0, 0
        
        try:
            # Get audio properties
            sample_rate = frame.sample_rate
            channels = len(frame.layout.channels)
            
            # Convert to numpy array
            # av.AudioFrame.to_ndarray() returns float32 by default
            audio_data = frame.to_ndarray()
            
            # Reshape: av gives (channels, samples), we want (samples,) or (samples, channels)
            if audio_data.ndim == 2:
                # Transpose to (samples, channels)
                audio_data = audio_data.T
                
                # If mono, flatten to 1D
                if channels == 1:
                    audio_data = audio_data.flatten()
            
            # Ensure float32
            audio_data = audio_data.astype(np.float32)
            
            # Normalize to [-1, 1] if needed
            if audio_data.max() > 1.0 or audio_data.min() < -1.0:
                audio_data = audio_data / 32768.0  # Assuming int16 range
            
            return audio_data, sample_rate, channels
            
        except Exception as e:
            logger.error(f"Failed to convert audio frame: {e}")
            return None, 0, 0
    
    def get_stats(self) -> Dict:
        """Get capture statistics"""
        return self.stats.copy()
    
    def reset_stats(self):
        """Reset capture statistics"""
        self.stats = {
            "camera_frames_captured": 0,
            "screen_frames_captured": 0,
            "audio_frames_captured": 0,
            "capture_errors": 0
        }


# Helper functions for convenience

async def capture_frames_from_candidate(
    candidate_conn,
    timeout: float = 2.0
) -> Optional[Dict]:
    """
    Convenience function to capture frames from CandidateConnection
    
    Args:
        candidate_conn: CandidateConnection from sfu_service
        timeout: Max time to wait for frames
    
    Returns:
        Dict with camera, screen, audio frames (or None for each)
    """
    if candidate_conn is None:
        return None
    
    capturer = FrameCapture()
    
    return await capturer.capture_all(
        camera_track=candidate_conn.camera_track,
        screen_track=candidate_conn.screen_track,
        audio_track=candidate_conn.audio_track,
        timeout=timeout
    )


# Mock version for testing without aiortc

class MockFrameCapture(FrameCapture):
    """Mock frame capture for testing without WebRTC"""
    
    def __init__(self):
        super().__init__()
    
    async def capture_camera_frame(
        self,
        camera_track: Optional[MediaStreamTrack],
        timeout: float = 1.0
    ) -> Optional[Dict]:
        """Mock: Return random camera frame"""
        await asyncio.sleep(0.01)  # Simulate capture delay
        
        # Generate random 640x480 RGB image
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        self.stats["camera_frames_captured"] += 1
        
        return {
            "image": image,
            "width": 640,
            "height": 480,
            "timestamp": int(time.time() * 1000),
            "format": "rgb24"
        }
    
    async def capture_screen_frame(
        self,
        screen_track: Optional[MediaStreamTrack],
        timeout: float = 1.0
    ) -> Optional[Dict]:
        """Mock: Return random screen frame"""
        await asyncio.sleep(0.01)  # Simulate capture delay
        
        # Generate random 1920x1080 RGB image
        image = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
        
        self.stats["screen_frames_captured"] += 1
        
        return {
            "image": image,
            "width": 1920,
            "height": 1080,
            "timestamp": int(time.time() * 1000),
            "format": "rgb24"
        }
    
    async def capture_audio_buffer(
        self,
        audio_track: Optional[MediaStreamTrack],
        duration_ms: int = 1000,
        timeout: float = 2.0
    ) -> Optional[Dict]:
        """Mock: Return random audio buffer"""
        await asyncio.sleep(0.01)  # Simulate capture delay
        
        # Generate random 1 second audio @ 16kHz
        sample_rate = 16000
        samples = int(sample_rate * duration_ms / 1000)
        audio_data = np.random.randn(samples).astype(np.float32) * 0.1
        
        self.stats["audio_frames_captured"] += 1
        
        return {
            "buffer": audio_data,
            "sample_rate": sample_rate,
            "channels": 1,
            "duration_ms": duration_ms,
            "timestamp": int(time.time() * 1000),
            "format": "float32"
        }


def create_mock_frame_capture() -> MockFrameCapture:
    """Create mock frame capture for testing"""
    return MockFrameCapture()
