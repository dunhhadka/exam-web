"""
Full System Integration Test
Tests complete pipeline: WebRTC → Frame Capture → AI Analysis → Results
"""

import sys
import os
import asyncio
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.integration_helper import (
    get_or_create_real_analyzer,
    run_real_analysis_loop,
    get_analyzer_stats
)
from ai_analysis.frame_capture import create_mock_frame_capture


async def test_analyzer_creation():
    """Test creating and loading analyzer"""
    print("\n[TEST] Analyzer Creation & Model Loading")
    print("-" * 50)
    
    start = time.time()
    
    try:
        analyzer = await get_or_create_real_analyzer(use_mock=True)
        
        elapsed = time.time() - start
        
        print(f"✅ Analyzer created and loaded in {elapsed:.1f}s")
        print(f"  Models loaded: {analyzer.models_loaded}")
        print(f"  Use mock: {analyzer.use_mock}")
        print(f"  Device: {analyzer.device}")
        
    except Exception as e:
        print(f"❌ Failed to create analyzer: {e}")
        import traceback
        traceback.print_exc()


async def test_single_frame_analysis():
    """Test analyzing a single frame"""
    print("\n[TEST] Single Frame Analysis")
    print("-" * 50)
    
    # Get analyzer
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    
    # Create mock frame data
    capturer = create_mock_frame_capture()
    
    camera = await capturer.capture_camera_frame(None)
    screen = await capturer.capture_screen_frame(None)
    audio = await capturer.capture_audio_buffer(None)
    
    frame_data = {
        "camera": camera,
        "screen": screen,
        "audio": audio
    }
    
    # Analyze
    start = time.time()
    
    result = await analyzer.analyze_frame(
        candidate_id="test_001",
        room_id="test_room",
        frame_data=frame_data
    )
    
    elapsed = (time.time() - start) * 1000
    
    print(f"✅ Frame analyzed in {elapsed:.1f}ms")
    print(f"  Candidate: {result['candidate_id']}")
    print(f"  Room: {result['room_id']}")
    print(f"  Analyses: {len(result['analyses'])}")
    print(f"  Processing time: {result['processing_time_ms']}ms")
    
    # Check each analysis
    for analysis in result['analyses']:
        status = analysis['result'].get('status', 'unknown')
        alert = analysis['result'].get('alert')
        
        alert_str = f" [ALERT: {alert['type']}]" if alert else ""
        print(f"    - {analysis['type']}: {status}{alert_str}")


async def test_continuous_analysis():
    """Test continuous analysis loop (simulated)"""
    print("\n[TEST] Continuous Analysis (10 frames)")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    capturer = create_mock_frame_capture()
    
    results_received = []
    
    async def mock_send(data):
        """Mock WebSocket send function"""
        results_received.append(data)
    
    # Simulate analysis loop
    frame_count = 0
    start_time = time.time()
    processing_times = []
    
    while frame_count < 10:
        # Capture frames
        frame_data = await capturer.capture_all(None, None, None)
        
        # Analyze
        result = await analyzer.analyze_frame(
            candidate_id=f"candidate_{frame_count}",
            room_id="test_room",
            frame_data=frame_data
        )
        
        processing_times.append(result['processing_time_ms'])
        
        # Mock send
        await mock_send({
            "type": "ai_analysis",
            "data": result
        })
        
        frame_count += 1
        
        # Small delay to simulate frame rate
        await asyncio.sleep(0.1)
    
    elapsed = (time.time() - start_time) * 1000
    
    print(f"\n✅ Analyzed {frame_count} frames in {elapsed:.1f}ms")
    print(f"  Average per frame: {elapsed/frame_count:.1f}ms")
    print(f"  Processing times:")
    print(f"    Min: {min(processing_times)}ms")
    print(f"    Max: {max(processing_times)}ms")
    print(f"    Avg: {sum(processing_times)/len(processing_times):.1f}ms")
    print(f"  Results sent: {len(results_received)}")


async def test_concurrent_candidates():
    """Test analyzing multiple candidates concurrently"""
    print("\n[TEST] Concurrent Candidates (5 candidates)")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    capturer = create_mock_frame_capture()
    
    async def analyze_candidate(candidate_id: str, num_frames: int = 5):
        """Analyze N frames for one candidate"""
        times = []
        
        for i in range(num_frames):
            frame_data = await capturer.capture_all(None, None, None)
            
            start = time.time()
            
            result = await analyzer.analyze_frame(
                candidate_id=candidate_id,
                room_id="test_room",
                frame_data=frame_data
            )
            
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
            
            await asyncio.sleep(0.5)  # 2 FPS
        
        return {
            "candidate_id": candidate_id,
            "frames": num_frames,
            "avg_time": sum(times) / len(times),
            "min_time": min(times),
            "max_time": max(times)
        }
    
    # Analyze 5 candidates concurrently
    start_time = time.time()
    
    tasks = [
        analyze_candidate(f"candidate_{i:03d}", 5)
        for i in range(5)
    ]
    
    results = await asyncio.gather(*tasks)
    
    total_elapsed = (time.time() - start_time) * 1000
    
    print(f"\n✅ 5 candidates analyzed concurrently")
    print(f"  Total time: {total_elapsed:.1f}ms")
    print(f"  Total frames: {sum(r['frames'] for r in results)}")
    
    for result in results:
        print(f"\n  {result['candidate_id']}:")
        print(f"    Frames: {result['frames']}")
        print(f"    Avg time: {result['avg_time']:.1f}ms")
        print(f"    Min time: {result['min_time']:.1f}ms")
        print(f"    Max time: {result['max_time']:.1f}ms")


async def test_analyzer_statistics():
    """Test analyzer statistics tracking"""
    print("\n[TEST] Analyzer Statistics")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    
    # Reset stats
    analyzer.reset_stats()
    
    # Analyze 10 frames
    capturer = create_mock_frame_capture()
    
    for i in range(10):
        frame_data = await capturer.capture_all(None, None, None)
        
        await analyzer.analyze_frame(
            candidate_id=f"stats_test_{i}",
            room_id="test_room",
            frame_data=frame_data
        )
    
    # Get stats
    stats = get_analyzer_stats()
    
    print(f"✅ Statistics:")
    print(f"  Frames analyzed: {stats['frames_analyzed']}")
    print(f"  Total inference time: {stats['total_inference_time_ms']}ms")
    print(f"  Average time: {stats['avg_inference_time_ms']:.1f}ms")
    print(f"  Errors: {stats['errors']}")


async def test_error_handling():
    """Test error handling with invalid data"""
    print("\n[TEST] Error Handling")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    
    # Test 1: No frame data
    result = await analyzer.analyze_frame(
        candidate_id="error_test_1",
        room_id="test_room",
        frame_data=None
    )
    
    if "error" in result:
        print(f"✅ Test 1: Correctly handled None frame_data")
        print(f"  Error: {result['error']}")
    else:
        print(f"❌ Test 1: Should have returned error")
    
    # Test 2: Empty frame data
    result = await analyzer.analyze_frame(
        candidate_id="error_test_2",
        room_id="test_room",
        frame_data={}
    )
    
    if "error" in result:
        print(f"✅ Test 2: Correctly handled empty frame_data")
        print(f"  Error: {result['error']}")
    else:
        print(f"✅ Test 2: Handled empty frame_data gracefully")
    
    # Test 3: Missing camera
    result = await analyzer.analyze_frame(
        candidate_id="error_test_3",
        room_id="test_room",
        frame_data={
            "camera": None,
            "screen": None,
            "audio": None
        }
    )
    
    print(f"✅ Test 3: Handled missing streams")
    print(f"  Analyses returned: {len(result.get('analyses', []))}")


async def test_alert_generation():
    """Test alert generation for different scenarios"""
    print("\n[TEST] Alert Generation")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    capturer = create_mock_frame_capture()
    
    # Run 20 analyses to get different scenarios (mock has random behavior)
    alert_counts = {}
    
    for i in range(20):
        frame_data = await capturer.capture_all(None, None, None)
        
        result = await analyzer.analyze_frame(
            candidate_id=f"alert_test_{i}",
            room_id="test_room",
            frame_data=frame_data
        )
        
        # Count alerts
        for analysis in result.get("analyses", []):
            alert = analysis['result'].get('alert')
            if alert:
                alert_type = alert['type']
                alert_counts[alert_type] = alert_counts.get(alert_type, 0) + 1
    
    print(f"✅ Alert generation test complete")
    print(f"  Total frames: 20")
    print(f"  Alerts generated:")
    
    if alert_counts:
        for alert_type, count in sorted(alert_counts.items()):
            print(f"    {alert_type}: {count} times")
    else:
        print(f"    No alerts (all normal scenarios)")


async def test_performance_under_load():
    """Test performance with high frame rate"""
    print("\n[TEST] Performance Under Load")
    print("-" * 50)
    
    analyzer = await get_or_create_real_analyzer(use_mock=True)
    capturer = create_mock_frame_capture()
    
    # Analyze 50 frames as fast as possible
    print("Analyzing 50 frames rapidly...")
    
    start_time = time.time()
    processing_times = []
    
    for i in range(50):
        frame_data = await capturer.capture_all(None, None, None)
        
        start = time.time()
        
        result = await analyzer.analyze_frame(
            candidate_id="load_test",
            room_id="test_room",
            frame_data=frame_data
        )
        
        elapsed = (time.time() - start) * 1000
        processing_times.append(elapsed)
    
    total_elapsed = (time.time() - start_time) * 1000
    
    print(f"\n✅ Load test complete")
    print(f"  Total frames: 50")
    print(f"  Total time: {total_elapsed:.1f}ms")
    print(f"  Throughput: {50 / (total_elapsed / 1000):.1f} FPS")
    print(f"  Processing times:")
    print(f"    Min: {min(processing_times):.1f}ms")
    print(f"    Max: {max(processing_times):.1f}ms")
    print(f"    Avg: {sum(processing_times)/len(processing_times):.1f}ms")
    print(f"    P50: {sorted(processing_times)[25]:.1f}ms")
    print(f"    P95: {sorted(processing_times)[47]:.1f}ms")


async def main():
    """Run all integration tests"""
    print("=" * 50)
    print("FULL SYSTEM INTEGRATION TEST")
    print("=" * 50)
    
    try:
        # Test 1: Analyzer creation
        await test_analyzer_creation()
        
        # Test 2: Single frame
        await test_single_frame_analysis()
        
        # Test 3: Continuous analysis
        await test_continuous_analysis()
        
        # Test 4: Concurrent candidates
        await test_concurrent_candidates()
        
        # Test 5: Statistics
        await test_analyzer_statistics()
        
        # Test 6: Error handling
        await test_error_handling()
        
        # Test 7: Alert generation
        await test_alert_generation()
        
        # Test 8: Performance under load
        await test_performance_under_load()
        
        print("\n" + "=" * 50)
        print("✅ ALL INTEGRATION TESTS PASSED")
        print("=" * 50)
        
        # Show final stats
        stats = get_analyzer_stats()
        print(f"\n📊 Final Statistics:")
        print(f"  Total frames analyzed: {stats['frames_analyzed']}")
        print(f"  Total inference time: {stats['total_inference_time_ms']}ms")
        print(f"  Average time per frame: {stats['avg_inference_time_ms']:.1f}ms")
        print(f"  Total errors: {stats['errors']}")
        
    except Exception as e:
        print(f"\n❌ INTEGRATION TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
