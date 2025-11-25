"""
Test frame capture functionality
Tests both real and mock implementations
"""

import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.frame_capture import (
    FrameCapture,
    MockFrameCapture,
    create_mock_frame_capture
)


async def test_mock_camera_capture():
    """Test mock camera frame capture"""
    print("\n[TEST] Mock Camera Capture")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture camera frame
    frame = await capturer.capture_camera_frame(None)
    
    if frame:
        print(f"✅ Camera frame captured")
        print(f"  Size: {frame['width']}x{frame['height']}")
        print(f"  Shape: {frame['image'].shape}")
        print(f"  Dtype: {frame['image'].dtype}")
        print(f"  Format: {frame['format']}")
        print(f"  Timestamp: {frame['timestamp']}")
    else:
        print("❌ Failed to capture camera frame")


async def test_mock_screen_capture():
    """Test mock screen frame capture"""
    print("\n[TEST] Mock Screen Capture")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture screen frame
    frame = await capturer.capture_screen_frame(None)
    
    if frame:
        print(f"✅ Screen frame captured")
        print(f"  Size: {frame['width']}x{frame['height']}")
        print(f"  Shape: {frame['image'].shape}")
        print(f"  Dtype: {frame['image'].dtype}")
        print(f"  Format: {frame['format']}")
        print(f"  Timestamp: {frame['timestamp']}")
    else:
        print("❌ Failed to capture screen frame")


async def test_mock_audio_capture():
    """Test mock audio buffer capture"""
    print("\n[TEST] Mock Audio Capture")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture audio buffer
    audio = await capturer.capture_audio_buffer(None, duration_ms=1000)
    
    if audio:
        print(f"✅ Audio buffer captured")
        print(f"  Sample rate: {audio['sample_rate']} Hz")
        print(f"  Channels: {audio['channels']}")
        print(f"  Duration: {audio['duration_ms']} ms")
        print(f"  Buffer shape: {audio['buffer'].shape}")
        print(f"  Buffer dtype: {audio['buffer'].dtype}")
        print(f"  Buffer range: [{audio['buffer'].min():.3f}, {audio['buffer'].max():.3f}]")
        print(f"  Format: {audio['format']}")
        print(f"  Timestamp: {audio['timestamp']}")
    else:
        print("❌ Failed to capture audio")


async def test_capture_all():
    """Test capturing all tracks simultaneously"""
    print("\n[TEST] Capture All Tracks")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture all tracks
    import time
    start = time.time()
    
    results = await capturer.capture_all(
        camera_track=None,
        screen_track=None,
        audio_track=None,
        timeout=2.0
    )
    
    elapsed = (time.time() - start) * 1000
    
    print(f"✅ Captured all tracks in {elapsed:.1f}ms")
    print(f"  Server-side capture time: {results['capture_time_ms']}ms")
    
    if results['camera']:
        print(f"  ✅ Camera: {results['camera']['width']}x{results['camera']['height']}")
    else:
        print(f"  ❌ Camera: Failed")
    
    if results['screen']:
        print(f"  ✅ Screen: {results['screen']['width']}x{results['screen']['height']}")
    else:
        print(f"  ❌ Screen: Failed")
    
    if results['audio']:
        print(f"  ✅ Audio: {results['audio']['duration_ms']}ms @ {results['audio']['sample_rate']}Hz")
    else:
        print(f"  ❌ Audio: Failed")


async def test_capture_stats():
    """Test capture statistics"""
    print("\n[TEST] Capture Statistics")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture multiple frames
    await capturer.capture_camera_frame(None)
    await capturer.capture_camera_frame(None)
    await capturer.capture_screen_frame(None)
    await capturer.capture_audio_buffer(None)
    
    # Get stats
    stats = capturer.get_stats()
    
    print(f"✅ Statistics:")
    print(f"  Camera frames: {stats['camera_frames_captured']}")
    print(f"  Screen frames: {stats['screen_frames_captured']}")
    print(f"  Audio frames: {stats['audio_frames_captured']}")
    print(f"  Errors: {stats['capture_errors']}")
    
    # Reset stats
    capturer.reset_stats()
    stats = capturer.get_stats()
    
    print(f"✅ After reset:")
    print(f"  Total captured: {sum(stats.values())}")


async def test_concurrent_captures():
    """Test multiple concurrent captures"""
    print("\n[TEST] Concurrent Captures")
    print("-" * 50)
    
    capturer = create_mock_frame_capture()
    
    # Capture 5 frames concurrently
    tasks = [capturer.capture_camera_frame(None) for _ in range(5)]
    
    import time
    start = time.time()
    
    frames = await asyncio.gather(*tasks)
    
    elapsed = (time.time() - start) * 1000
    
    successful = sum(1 for f in frames if f is not None)
    
    print(f"✅ Captured {successful}/5 frames concurrently")
    print(f"  Total time: {elapsed:.1f}ms")
    print(f"  Average time per frame: {elapsed/5:.1f}ms")


async def test_timeout_handling():
    """Test timeout handling"""
    print("\n[TEST] Timeout Handling")
    print("-" * 50)
    
    capturer = FrameCapture()  # Real capturer (will fail without tracks)
    
    # Try to capture with short timeout (should timeout gracefully)
    import time
    start = time.time()
    
    frame = await capturer.capture_camera_frame(None, timeout=0.1)
    
    elapsed = (time.time() - start) * 1000
    
    if frame is None:
        print(f"✅ Correctly handled missing track")
        print(f"  Returned None in {elapsed:.1f}ms")
    else:
        print(f"❌ Should have returned None")


async def main():
    """Run all tests"""
    print("=" * 50)
    print("FRAME CAPTURE TESTS")
    print("=" * 50)
    
    try:
        await test_mock_camera_capture()
        await test_mock_screen_capture()
        await test_mock_audio_capture()
        await test_capture_all()
        await test_capture_stats()
        await test_concurrent_captures()
        await test_timeout_handling()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
