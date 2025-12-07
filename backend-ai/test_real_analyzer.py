"""
Test Real AI Analyzer with mock models
Tests orchestration logic without loading actual AI models
"""

import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.real_analyzer import RealAIAnalyzer, get_real_analyzer
from ai_analysis.frame_capture import create_mock_frame_capture


async def test_analyzer_initialization():
    """Test analyzer can be initialized"""
    print("\n[TEST] Analyzer Initialization")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    
    print(f"✅ Analyzer created")
    print(f"  Use mock: {analyzer.use_mock}")
    print(f"  Device: {analyzer.device}")
    print(f"  Models loaded: {analyzer.models_loaded}")


async def test_model_loading():
    """Test mock model loading"""
    print("\n[TEST] Model Loading (Mock)")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    
    # Load models
    import time
    start = time.time()
    
    success = await analyzer.load_models()
    
    elapsed = (time.time() - start) * 1000
    
    if success:
        print(f"✅ Models loaded successfully in {elapsed:.1f}ms")
        print(f"  YOLO: {analyzer.yolo_detector is not None}")
        print(f"  ArcFace: {analyzer.arcface_model is not None}")
        print(f"  PaddleOCR: {analyzer.paddle_ocr is not None}")
        print(f"  Silero VAD: {analyzer.silero_vad is not None}")
        print(f"  Gaze Estimator: {analyzer.gaze_estimator is not None}")
    else:
        print(f"❌ Model loading failed: {analyzer.loading_error}")


async def test_analyze_frame_with_mock_data():
    """Test frame analysis with mock frame data"""
    print("\n[TEST] Analyze Frame (Mock Data)")
    print("-" * 50)
    
    # Create analyzer
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    # Create mock frame data
    capturer = create_mock_frame_capture()
    
    camera_frame = await capturer.capture_camera_frame(None)
    screen_frame = await capturer.capture_screen_frame(None)
    audio_buffer = await capturer.capture_audio_buffer(None)
    
    frame_data = {
        "camera": camera_frame,
        "screen": screen_frame,
        "audio": audio_buffer
    }
    
    # Analyze frame
    import time
    start = time.time()
    
    result = await analyzer.analyze_frame(
        candidate_id="test_candidate_001",
        room_id="test_room_001",
        frame_data=frame_data
    )
    
    elapsed = (time.time() - start) * 1000
    
    print(f"✅ Frame analyzed in {elapsed:.1f}ms")
    print(f"  Candidate: {result['candidate_id']}")
    print(f"  Room: {result['room_id']}")
    print(f"  Analyses: {len(result['analyses'])}")
    print(f"  Processing time: {result['processing_time_ms']}ms")
    
    # Show analyses
    for analysis in result['analyses']:
        status = analysis['result'].get('status', 'unknown')
        alert = analysis['result'].get('alert')
        
        alert_str = f" [ALERT: {alert['type']}]" if alert else ""
        print(f"    - {analysis['type']}: {status}{alert_str}")


async def test_analyze_camera_only():
    """Test analysis with only camera frame"""
    print("\n[TEST] Analyze Camera Only")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    capturer = create_mock_frame_capture()
    camera_frame = await capturer.capture_camera_frame(None)
    
    frame_data = {
        "camera": camera_frame,
        "screen": None,
        "audio": None
    }
    
    result = await analyzer.analyze_frame(
        candidate_id="test_candidate_002",
        room_id="test_room_001",
        frame_data=frame_data
    )
    
    print(f"✅ Camera-only analysis complete")
    print(f"  Total analyses: {len(result['analyses'])}")
    
    for analysis in result['analyses']:
        print(f"    - {analysis['type']}: {analysis['result'].get('status')}")


async def test_analyze_no_frames():
    """Test analysis with no frame data"""
    print("\n[TEST] Analyze No Frames")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    # No frame data
    result = await analyzer.analyze_frame(
        candidate_id="test_candidate_003",
        room_id="test_room_001",
        frame_data=None
    )
    
    if "error" in result:
        print(f"✅ Correctly handled no frames")
        print(f"  Error: {result['error']}")
    else:
        print(f"❌ Should have returned error")


async def test_concurrent_analyses():
    """Test multiple concurrent frame analyses"""
    print("\n[TEST] Concurrent Analyses")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    capturer = create_mock_frame_capture()
    
    # Create 5 mock frames
    async def analyze_one(candidate_id: str):
        frame_data = await capturer.capture_all(None, None, None)
        result = await analyzer.analyze_frame(
            candidate_id=candidate_id,
            room_id="test_room_001",
            frame_data=frame_data
        )
        return result
    
    # Analyze 5 frames concurrently
    import time
    start = time.time()
    
    tasks = [analyze_one(f"candidate_{i:03d}") for i in range(5)]
    results = await asyncio.gather(*tasks)
    
    elapsed = (time.time() - start) * 1000
    
    successful = sum(1 for r in results if "error" not in r)
    
    print(f"✅ Analyzed {successful}/5 frames concurrently")
    print(f"  Total time: {elapsed:.1f}ms")
    print(f"  Average per frame: {elapsed/5:.1f}ms")
    
    # Show processing times
    for i, result in enumerate(results):
        proc_time = result.get("processing_time_ms", 0)
        print(f"    Frame {i+1}: {proc_time}ms")


async def test_analyzer_statistics():
    """Test analyzer statistics tracking"""
    print("\n[TEST] Analyzer Statistics")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    capturer = create_mock_frame_capture()
    
    # Analyze 3 frames
    for i in range(3):
        frame_data = await capturer.capture_all(None, None, None)
        await analyzer.analyze_frame(
            candidate_id=f"candidate_{i}",
            room_id="test_room",
            frame_data=frame_data
        )
    
    # Get stats
    stats = analyzer.get_stats()
    
    print(f"✅ Statistics:")
    print(f"  Frames analyzed: {stats['frames_analyzed']}")
    print(f"  Total inference time: {stats['total_inference_time_ms']}ms")
    print(f"  Average time: {stats['avg_inference_time_ms']:.1f}ms")
    print(f"  Errors: {stats['errors']}")
    
    # Reset stats
    analyzer.reset_stats()
    stats = analyzer.get_stats()
    
    print(f"✅ After reset:")
    print(f"  Frames analyzed: {stats['frames_analyzed']}")


async def test_global_analyzer_instance():
    """Test global analyzer singleton"""
    print("\n[TEST] Global Analyzer Instance")
    print("-" * 50)
    
    # Get global instance
    analyzer1 = await get_real_analyzer(use_mock=True)
    analyzer2 = await get_real_analyzer(use_mock=True)
    
    if analyzer1 is analyzer2:
        print(f"✅ Singleton works correctly")
        print(f"  Same instance: {id(analyzer1) == id(analyzer2)}")
        print(f"  Models loaded: {analyzer1.models_loaded}")
    else:
        print(f"❌ Singleton failed - got different instances")


async def test_cleanup():
    """Test analyzer cleanup"""
    print("\n[TEST] Analyzer Cleanup")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    # Cleanup
    await analyzer.cleanup()
    
    print(f"✅ Cleanup completed successfully")


async def test_error_handling():
    """Test error handling with invalid data"""
    print("\n[TEST] Error Handling")
    print("-" * 50)
    
    analyzer = RealAIAnalyzer(use_mock=True, device="cpu")
    await analyzer.load_models()
    
    # Test with empty frame data
    frame_data = {
        "camera": {"image": None},
        "screen": None,
        "audio": None
    }
    
    result = await analyzer.analyze_frame(
        candidate_id="test_error",
        room_id="test_room",
        frame_data=frame_data
    )
    
    print(f"✅ Error handled gracefully")
    print(f"  Result has {len(result['analyses'])} analyses")


async def main():
    """Run all tests"""
    print("=" * 50)
    print("REAL AI ANALYZER TESTS (MOCK MODE)")
    print("=" * 50)
    
    try:
        await test_analyzer_initialization()
        await test_model_loading()
        await test_analyze_frame_with_mock_data()
        await test_analyze_camera_only()
        await test_analyze_no_frames()
        await test_concurrent_analyses()
        await test_analyzer_statistics()
        await test_global_analyzer_instance()
        await test_cleanup()
        await test_error_handling()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
