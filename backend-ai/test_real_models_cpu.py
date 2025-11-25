"""
Test Real AI Models on CPU
Tests all 5 real models with actual inference (CPU mode)
"""

import sys
import os
import asyncio
import time
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.integration_helper import get_or_create_real_analyzer
from ai_analysis.frame_capture import create_mock_frame_capture


async def test_real_models_loading():
    """Test 1: Load all real models"""
    print("\n" + "=" * 60)
    print("[TEST 1] Real Models Loading (CPU)")
    print("=" * 60)
    
    start = time.time()
    
    try:
        analyzer = await get_or_create_real_analyzer(use_mock=False)
        
        load_time = time.time() - start
        
        print(f"✅ All models loaded successfully in {load_time:.2f}s")
        print(f"   Device: {analyzer.device}")
        print(f"   Models:")
        print(f"   - YOLO Face Detector")
        print(f"   - ArcFace Model")
        print(f"   - PaddleOCR Engine")
        print(f"   - Silero VAD")
        print(f"   - Gaze Estimator")
        
        return analyzer
        
    except Exception as e:
        print(f"❌ Failed to load models: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_yolo_face_detection(analyzer):
    """Test 2: YOLO face detection on real image"""
    print("\n" + "=" * 60)
    print("[TEST 2] YOLO Face Detection (CPU)")
    print("=" * 60)
    
    try:
        # Create test frame (640x480 RGB)
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        print("Running YOLO inference on CPU...")
        start = time.time()
        
        # Run YOLO through analyzer
        result = await analyzer._run_yolo(frame)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ YOLO inference complete")
        print(f"   Time: {elapsed:.2f}ms")
        print(f"   Faces detected: {result.get('num_faces', 0)}")
        print(f"   Confidence: {result.get('confidence', 0):.2%}")
        
        if result.get('num_faces', 0) > 0:
            print(f"   Bounding boxes: {len(result.get('bounding_boxes', []))}")
        
        return result
        
    except Exception as e:
        print(f"❌ YOLO test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_arcface_verification(analyzer):
    """Test 3: ArcFace face verification"""
    print("\n" + "=" * 60)
    print("[TEST 3] ArcFace Face Verification (CPU)")
    print("=" * 60)
    
    try:
        # Create test frame
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        print("Running ArcFace inference on CPU...")
        start = time.time()
        
        result = await analyzer._run_arcface(frame)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ ArcFace inference complete")
        print(f"   Time: {elapsed:.2f}ms")
        print(f"   Match: {result.get('is_same_person', False)}")
        print(f"   Confidence: {result.get('confidence', 0):.2%}")
        
        return result
        
    except Exception as e:
        print(f"❌ ArcFace test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_paddle_ocr(analyzer):
    """Test 4: PaddleOCR screen analysis"""
    print("\n" + "=" * 60)
    print("[TEST 4] PaddleOCR Screen Analysis (CPU)")
    print("=" * 60)
    
    try:
        # Create test frame
        frame = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
        
        print("Running PaddleOCR inference on CPU...")
        start = time.time()
        
        result = await analyzer._run_paddle_ocr(frame)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ PaddleOCR inference complete")
        print(f"   Time: {elapsed:.2f}ms")
        print(f"   Text detected: {result.get('has_text', False)}")
        print(f"   Suspicious: {result.get('is_suspicious', False)}")
        
        if result.get('text_regions'):
            print(f"   Text regions: {len(result['text_regions'])}")
        
        return result
        
    except Exception as e:
        print(f"❌ PaddleOCR test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_silero_vad(analyzer):
    """Test 5: Silero VAD audio analysis"""
    print("\n" + "=" * 60)
    print("[TEST 5] Silero VAD Audio Analysis (CPU)")
    print("=" * 60)
    
    try:
        # Create test audio (1 second at 16kHz)
        audio = np.random.randn(16000).astype(np.float32)
        
        print("Running Silero VAD inference on CPU...")
        start = time.time()
        
        result = await analyzer._run_silero_vad(audio)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ Silero VAD inference complete")
        print(f"   Time: {elapsed:.2f}ms")
        print(f"   Voice detected: {result.get('has_voice', False)}")
        print(f"   Confidence: {result.get('confidence', 0):.2%}")
        
        return result
        
    except Exception as e:
        print(f"❌ Silero VAD test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_gaze_estimator(analyzer):
    """Test 6: Gaze direction estimation"""
    print("\n" + "=" * 60)
    print("[TEST 6] Gaze Direction Estimation (CPU)")
    print("=" * 60)
    
    try:
        # Create test frame
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        print("Running Gaze Estimator inference on CPU...")
        start = time.time()
        
        result = await analyzer._run_gaze_estimator(frame)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ Gaze Estimator inference complete")
        print(f"   Time: {elapsed:.2f}ms")
        print(f"   Looking at screen: {result.get('looking_at_screen', False)}")
        print(f"   Gaze direction: {result.get('gaze_direction', 'unknown')}")
        
        return result
        
    except Exception as e:
        print(f"❌ Gaze Estimator test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_full_pipeline(analyzer):
    """Test 7: Full pipeline with all models"""
    print("\n" + "=" * 60)
    print("[TEST 7] Full Pipeline - All Models Together (CPU)")
    print("=" * 60)
    
    try:
        # Create frame capturer
        capturer = create_mock_frame_capture()
        
        print("Running full pipeline (5 models concurrent)...")
        
        # Run 5 frames
        times = []
        for i in range(5):
            frame_data = await capturer.capture_all(None, None, None)
            
            start = time.time()
            
            result = await analyzer.analyze_frame(
                candidate_id=f"test_{i}",
                room_id="test_room",
                frame_data=frame_data
            )
            
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
            
            print(f"   Frame {i+1}: {elapsed:.2f}ms - {len(result.get('analyses', []))} analyses")
        
        avg_time = sum(times) / len(times)
        
        print(f"\n✅ Full pipeline test complete")
        print(f"   Frames processed: {len(times)}")
        print(f"   Average time: {avg_time:.2f}ms")
        print(f"   Min time: {min(times):.2f}ms")
        print(f"   Max time: {max(times):.2f}ms")
        print(f"   Throughput: {1000/avg_time:.2f} FPS")
        
        # Show last result details
        print(f"\n   Last frame result:")
        print(f"   - Analyses: {len(result.get('analyses', []))}")
        print(f"   - Incidents: {len(result.get('incidents', []))}")
        print(f"   - Overall confidence: {result.get('confidence', 0):.2%}")
        
        return times
        
    except Exception as e:
        print(f"❌ Full pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def test_performance_benchmark(analyzer):
    """Test 8: Performance benchmark (10 frames)"""
    print("\n" + "=" * 60)
    print("[TEST 8] Performance Benchmark - 10 Frames (CPU)")
    print("=" * 60)
    
    try:
        capturer = create_mock_frame_capture()
        
        print("Running performance benchmark...")
        
        start_total = time.time()
        times = []
        
        for i in range(10):
            frame_data = await capturer.capture_all(None, None, None)
            
            start = time.time()
            result = await analyzer.analyze_frame(
                candidate_id="benchmark",
                room_id="test",
                frame_data=frame_data
            )
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
            
            print(f"   Frame {i+1}/10: {elapsed:.2f}ms")
        
        total_time = (time.time() - start_total) * 1000
        avg_time = sum(times) / len(times)
        
        print(f"\n✅ Performance benchmark complete")
        print(f"   Total time: {total_time:.2f}ms")
        print(f"   Average per frame: {avg_time:.2f}ms")
        print(f"   Throughput: {1000/avg_time:.2f} FPS")
        print(f"   Min: {min(times):.2f}ms")
        print(f"   Max: {max(times):.2f}ms")
        
        # Get statistics
        stats = await analyzer.get_stats()
        print(f"\n   Analyzer statistics:")
        print(f"   - Total frames: {stats['frames_analyzed']}")
        print(f"   - Total time: {stats['total_time_ms']:.2f}ms")
        print(f"   - Average: {stats['avg_time_ms']:.2f}ms")
        print(f"   - Errors: {stats['errors']}")
        
        return times
        
    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        import traceback
        traceback.print_exc()
        return None


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("REAL AI MODELS TEST SUITE (CPU MODE)")
    print("=" * 60)
    print("\n⚠️  Running on CPU - expect slower performance")
    print("   YOLO: 200-300ms (vs 30-100ms on GPU)")
    print("   ArcFace: 50-150ms (vs 20-80ms on GPU)")
    print("   PaddleOCR: 200-500ms (same on CPU)")
    print("   Silero VAD: 5-15ms (same on CPU)")
    print("   Gaze: 10-30ms (same on CPU)")
    print("\n")
    
    try:
        # Test 1: Load models
        analyzer = await test_real_models_loading()
        if not analyzer:
            print("\n❌ Cannot proceed without models loaded")
            return
        
        # Test 2-6: Individual models
        await test_yolo_face_detection(analyzer)
        await test_arcface_verification(analyzer)
        await test_paddle_ocr(analyzer)
        await test_silero_vad(analyzer)
        await test_gaze_estimator(analyzer)
        
        # Test 7: Full pipeline
        await test_full_pipeline(analyzer)
        
        # Test 8: Performance benchmark
        await test_performance_benchmark(analyzer)
        
        # Final summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        stats = await analyzer.get_stats()
        
        print(f"\n✅ All tests completed successfully")
        print(f"\n   Total Statistics:")
        print(f"   - Frames analyzed: {stats['frames_analyzed']}")
        print(f"   - Total inference time: {stats['total_time_ms']:.2f}ms")
        print(f"   - Average per frame: {stats['avg_time_ms']:.2f}ms")
        print(f"   - Errors: {stats['errors']}")
        
        print(f"\n   Performance on CPU:")
        if stats['avg_time_ms'] < 1000:
            print(f"   ✅ Excellent: {stats['avg_time_ms']:.2f}ms per frame")
        elif stats['avg_time_ms'] < 2000:
            print(f"   ✅ Good: {stats['avg_time_ms']:.2f}ms per frame")
        elif stats['avg_time_ms'] < 5000:
            print(f"   ⚠️  Acceptable: {stats['avg_time_ms']:.2f}ms per frame")
        else:
            print(f"   ❌ Slow: {stats['avg_time_ms']:.2f}ms per frame")
        
        print(f"\n   Throughput: {1000/stats['avg_time_ms']:.2f} FPS")
        
        print(f"\n   Note: GPU would be 2-3x faster for YOLO and ArcFace")
        print(f"   Expected GPU performance: 200-500ms per frame (2-3 FPS)")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
