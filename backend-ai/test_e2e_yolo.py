"""
End-to-End Test with Real YOLO Model
Tests the complete pipeline: Frame Capture → RealAIAnalyzer → YOLO Detection
"""

import sys
import os
import asyncio
import numpy as np
import cv2

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.real_analyzer import RealAIAnalyzer
from ai_analysis.frame_capture import create_mock_frame_capture


async def test_yolo_with_synthetic_face():
    """Test YOLO with synthetic face image"""
    print("\n[TEST] YOLO with Synthetic Face")
    print("-" * 50)
    
    # Create analyzer with YOLO (others mock)
    print("Loading YOLO model...")
    analyzer = RealAIAnalyzer(use_mock=False, device="cuda")
    
    # Override to use only YOLO (keep others mock)
    from ai_analysis.model_adapters import (
        YOLODetector,
        create_mock_arcface,
        create_mock_ocr,
        create_mock_vad,
        create_mock_gaze
    )
    
    # Load only YOLO
    analyzer.yolo_detector = YOLODetector(device="cuda")
    print("Loading YOLOv8n-Face...")
    analyzer.yolo_detector.load()
    print("✅ YOLO loaded")
    
    # Use mock for others
    analyzer.arcface_model = create_mock_arcface()
    analyzer.paddle_ocr = create_mock_ocr()
    analyzer.silero_vad = create_mock_vad()
    analyzer.gaze_estimator = create_mock_gaze()
    analyzer.models_loaded = True
    
    # Create synthetic face image (simple oval)
    camera_image = create_synthetic_face_image()
    
    frame_data = {
        "camera": {
            "image": camera_image,
            "width": 640,
            "height": 480,
            "timestamp": 1700000000000
        },
        "screen": None,
        "audio": None
    }
    
    # Analyze
    print("\nRunning YOLO detection...")
    import time
    start = time.time()
    
    result = await analyzer.analyze_frame(
        candidate_id="test_yolo_001",
        room_id="test_room",
        frame_data=frame_data
    )
    
    elapsed = (time.time() - start) * 1000
    
    print(f"\n✅ Analysis complete in {elapsed:.1f}ms")
    print(f"  Processing time: {result['processing_time_ms']}ms")
    
    # Check face detection result
    face_detection = next(
        (a for a in result['analyses'] if a['type'] == 'face_detection'),
        None
    )
    
    if face_detection:
        res = face_detection['result']
        print(f"\n📊 Face Detection Results:")
        print(f"  Faces detected: {res['faces_detected']}")
        print(f"  Confidence: {res.get('confidence', 0):.3f}")
        print(f"  Status: {res['status']}")
        
        if res.get('bounding_boxes'):
            for i, bbox in enumerate(res['bounding_boxes']):
                print(f"  Face {i+1}: ({bbox['x']}, {bbox['y']}) "
                      f"{bbox['width']}x{bbox['height']} "
                      f"conf={bbox['confidence']:.3f}")
    
    # Cleanup
    await analyzer.cleanup()


async def test_yolo_with_webcam():
    """Test YOLO with webcam capture (if available)"""
    print("\n[TEST] YOLO with Webcam")
    print("-" * 50)
    
    try:
        # Try to open webcam
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("⚠️  Webcam not available, skipping test")
            return
        
        # Capture one frame
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            print("⚠️  Failed to capture frame, skipping test")
            return
        
        print(f"✅ Captured frame: {frame.shape}")
        
        # Convert BGR to RGB
        camera_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Resize to 640x480 if needed
        if camera_image.shape[:2] != (480, 640):
            camera_image = cv2.resize(camera_image, (640, 480))
        
        # Create analyzer
        print("\nLoading YOLO model...")
        analyzer = RealAIAnalyzer(use_mock=False, device="cuda")
        
        from ai_analysis.model_adapters import (
            YOLODetector,
            create_mock_arcface,
            create_mock_ocr,
            create_mock_vad,
            create_mock_gaze
        )
        
        analyzer.yolo_detector = YOLODetector(device="cuda")
        analyzer.yolo_detector.load()
        print("✅ YOLO loaded")
        
        analyzer.arcface_model = create_mock_arcface()
        analyzer.paddle_ocr = create_mock_ocr()
        analyzer.silero_vad = create_mock_vad()
        analyzer.gaze_estimator = create_mock_gaze()
        analyzer.models_loaded = True
        
        # Analyze
        frame_data = {
            "camera": {
                "image": camera_image,
                "width": 640,
                "height": 480,
                "timestamp": 1700000000000
            },
            "screen": None,
            "audio": None
        }
        
        print("\nRunning YOLO detection on webcam frame...")
        import time
        start = time.time()
        
        result = await analyzer.analyze_frame(
            candidate_id="webcam_test",
            room_id="test_room",
            frame_data=frame_data
        )
        
        elapsed = (time.time() - start) * 1000
        
        print(f"\n✅ Analysis complete in {elapsed:.1f}ms")
        
        # Show results
        face_detection = next(
            (a for a in result['analyses'] if a['type'] == 'face_detection'),
            None
        )
        
        if face_detection:
            res = face_detection['result']
            print(f"\n📊 Webcam Face Detection:")
            print(f"  Faces detected: {res['faces_detected']}")
            print(f"  Confidence: {res.get('confidence', 0):.3f}")
            print(f"  Status: {res['status']}")
            
            if res.get('bounding_boxes'):
                for i, bbox in enumerate(res['bounding_boxes']):
                    print(f"  Face {i+1}: ({bbox['x']}, {bbox['y']}) "
                          f"{bbox['width']}x{bbox['height']} "
                          f"conf={bbox['confidence']:.3f}")
        
        # Cleanup
        await analyzer.cleanup()
        
    except Exception as e:
        print(f"⚠️  Webcam test failed: {e}")


async def test_yolo_performance_benchmark():
    """Benchmark YOLO performance with multiple frames"""
    print("\n[TEST] YOLO Performance Benchmark")
    print("-" * 50)
    
    # Create analyzer
    print("Loading YOLO model...")
    analyzer = RealAIAnalyzer(use_mock=False, device="cuda")
    
    from ai_analysis.model_adapters import (
        YOLODetector,
        create_mock_arcface,
        create_mock_ocr,
        create_mock_vad,
        create_mock_gaze
    )
    
    analyzer.yolo_detector = YOLODetector(device="cuda")
    analyzer.yolo_detector.load()
    print("✅ YOLO loaded")
    
    analyzer.arcface_model = create_mock_arcface()
    analyzer.paddle_ocr = create_mock_ocr()
    analyzer.silero_vad = create_mock_vad()
    analyzer.gaze_estimator = create_mock_gaze()
    analyzer.models_loaded = True
    
    # Generate 10 random frames
    print("\nGenerating 10 test frames...")
    frames = []
    for i in range(10):
        # Random image
        camera_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Add synthetic face to half of them
        if i % 2 == 0:
            camera_image = add_synthetic_face(camera_image)
        
        frames.append({
            "camera": {
                "image": camera_image,
                "width": 640,
                "height": 480,
                "timestamp": 1700000000000 + i * 500
            },
            "screen": None,
            "audio": None
        })
    
    # Benchmark
    print("\nRunning benchmark (10 frames)...")
    import time
    times = []
    
    for i, frame_data in enumerate(frames):
        start = time.time()
        
        result = await analyzer.analyze_frame(
            candidate_id=f"bench_{i}",
            room_id="test_room",
            frame_data=frame_data
        )
        
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)
        
        face_detection = next(
            (a for a in result['analyses'] if a['type'] == 'face_detection'),
            None
        )
        faces = face_detection['result']['faces_detected'] if face_detection else 0
        
        print(f"  Frame {i+1}: {elapsed:.1f}ms (faces={faces})")
    
    # Statistics
    print(f"\n📊 Benchmark Results:")
    print(f"  Total frames: {len(times)}")
    print(f"  Min time: {min(times):.1f}ms")
    print(f"  Max time: {max(times):.1f}ms")
    print(f"  Average time: {sum(times)/len(times):.1f}ms")
    print(f"  Median time: {sorted(times)[len(times)//2]:.1f}ms")
    
    # Check if within budget
    avg_time = sum(times) / len(times)
    target_time = 100  # Target: <100ms for YOLO
    
    if avg_time < target_time:
        print(f"\n✅ Performance PASSED (avg {avg_time:.1f}ms < {target_time}ms)")
    else:
        print(f"\n⚠️  Performance WARNING (avg {avg_time:.1f}ms > {target_time}ms)")
    
    # Cleanup
    await analyzer.cleanup()


async def test_yolo_gpu_memory():
    """Check YOLO GPU memory usage"""
    print("\n[TEST] YOLO GPU Memory Usage")
    print("-" * 50)
    
    try:
        import torch
        
        if not torch.cuda.is_available():
            print("⚠️  CUDA not available, skipping GPU memory test")
            return
        
        # Get initial GPU memory
        torch.cuda.reset_peak_memory_stats()
        initial_memory = torch.cuda.memory_allocated() / (1024**3)  # GB
        
        print(f"Initial GPU memory: {initial_memory:.2f} GB")
        
        # Load YOLO
        print("\nLoading YOLO model...")
        from ai_analysis.model_adapters import YOLODetector
        
        detector = YOLODetector(device="cuda")
        detector.load()
        
        after_load_memory = torch.cuda.memory_allocated() / (1024**3)
        load_memory = after_load_memory - initial_memory
        
        print(f"After YOLO load: {after_load_memory:.2f} GB (+{load_memory:.2f} GB)")
        
        # Run inference
        camera_image = create_synthetic_face_image()
        
        count, detections = detector.detect_faces(camera_image)
        
        after_infer_memory = torch.cuda.memory_allocated() / (1024**3)
        peak_memory = torch.cuda.max_memory_allocated() / (1024**3)
        
        print(f"After inference: {after_infer_memory:.2f} GB")
        print(f"Peak memory: {peak_memory:.2f} GB")
        print(f"YOLO memory footprint: ~{load_memory:.2f} GB")
        
        # Check if within budget
        target_memory = 2.0  # Target: <2GB for YOLO
        
        if load_memory < target_memory:
            print(f"\n✅ Memory PASSED ({load_memory:.2f} GB < {target_memory} GB)")
        else:
            print(f"\n⚠️  Memory WARNING ({load_memory:.2f} GB > {target_memory} GB)")
        
        # Cleanup
        detector.cleanup()
        torch.cuda.empty_cache()
        
    except ImportError:
        print("⚠️  PyTorch not available, skipping GPU memory test")
    except Exception as e:
        print(f"⚠️  GPU memory test failed: {e}")


def create_synthetic_face_image() -> np.ndarray:
    """Create synthetic image with oval face shape"""
    # Create blank image
    image = np.ones((480, 640, 3), dtype=np.uint8) * 200  # Light gray background
    
    # Draw oval face
    center = (320, 240)
    axes = (80, 100)  # width, height
    cv2.ellipse(image, center, axes, 0, 0, 360, (255, 220, 180), -1)  # Skin tone
    
    # Add eyes
    cv2.circle(image, (280, 220), 10, (50, 50, 50), -1)  # Left eye
    cv2.circle(image, (360, 220), 10, (50, 50, 50), -1)  # Right eye
    
    # Add nose
    cv2.line(image, (320, 240), (320, 270), (200, 150, 150), 2)
    
    # Add mouth
    cv2.ellipse(image, (320, 290), (30, 15), 0, 0, 180, (150, 100, 100), 2)
    
    return image


def add_synthetic_face(image: np.ndarray) -> np.ndarray:
    """Add synthetic face to existing image"""
    # Copy image
    result = image.copy()
    
    # Draw small face
    center = (320, 240)
    axes = (60, 80)
    cv2.ellipse(result, center, axes, 0, 0, 360, (255, 220, 180), -1)
    
    # Eyes
    cv2.circle(result, (300, 220), 8, (50, 50, 50), -1)
    cv2.circle(result, (340, 220), 8, (50, 50, 50), -1)
    
    # Mouth
    cv2.ellipse(result, (320, 270), (20, 10), 0, 0, 180, (150, 100, 100), 2)
    
    return result


async def main():
    """Run all tests"""
    print("=" * 50)
    print("END-TO-END TEST: REAL YOLO INTEGRATION")
    print("=" * 50)
    
    try:
        # Test 1: Synthetic face
        await test_yolo_with_synthetic_face()
        
        # Test 2: Webcam (if available)
        await test_yolo_with_webcam()
        
        # Test 3: Performance benchmark
        await test_yolo_performance_benchmark()
        
        # Test 4: GPU memory
        await test_yolo_gpu_memory()
        
        print("\n" + "=" * 50)
        print("✅ ALL E2E TESTS COMPLETED")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
