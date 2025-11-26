"""
Test YOLO with CPU (fallback mode)
Since CUDA is not available, test with CPU inference
"""

import sys
import os
import asyncio
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_analysis.real_analyzer import RealAIAnalyzer
from ai_analysis.model_adapters import (
    YOLODetector,
    create_mock_arcface,
    create_mock_ocr,
    create_mock_vad,
    create_mock_gaze
)


async def test_yolo_cpu():
    """Test YOLO with CPU inference"""
    print("\n[TEST] YOLO with CPU")
    print("-" * 50)
    
    # Create analyzer with CPU
    print("Loading YOLO model (CPU mode)...")
    analyzer = RealAIAnalyzer(use_mock=False, device="cpu")
    
    # Load YOLO on CPU
    analyzer.yolo_detector = YOLODetector(device="cpu")
    
    try:
        analyzer.yolo_detector.load()
        print("✅ YOLO loaded on CPU")
    except Exception as e:
        print(f"❌ Failed to load YOLO: {e}")
        return
    
    # Use mock for others
    analyzer.arcface_model = create_mock_arcface()
    analyzer.paddle_ocr = create_mock_ocr()
    analyzer.silero_vad = create_mock_vad()
    analyzer.gaze_estimator = create_mock_gaze()
    analyzer.models_loaded = True
    
    # Create synthetic face image
    camera_image = create_synthetic_face_image()
    
    # Save for inspection
    cv2.imwrite("test_face_synthetic.jpg", cv2.cvtColor(camera_image, cv2.COLOR_RGB2BGR))
    print("💾 Saved test_face_synthetic.jpg")
    
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
    print("\nRunning YOLO detection (CPU)...")
    import time
    start = time.time()
    
    result = await analyzer.analyze_frame(
        candidate_id="test_cpu",
        room_id="test_room",
        frame_data=frame_data
    )
    
    elapsed = (time.time() - start) * 1000
    
    print(f"\n✅ Analysis complete in {elapsed:.1f}ms")
    print(f"  Processing time: {result['processing_time_ms']}ms")
    
    # Check results
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
        else:
            print("  No bounding boxes returned")
    
    # Test with webcam
    try:
        print("\n\nTrying webcam capture...")
        cap = cv2.VideoCapture(0)
        
        if cap.isOpened():
            ret, frame = cap.read()
            cap.release()
            
            if ret and frame is not None:
                print(f"✅ Captured webcam frame: {frame.shape}")
                
                # Convert and resize
                camera_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                camera_image = cv2.resize(camera_image, (640, 480))
                
                # Save for inspection
                cv2.imwrite("test_face_webcam.jpg", frame)
                print("💾 Saved test_face_webcam.jpg")
                
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
                
                # Analyze webcam frame
                print("\nRunning YOLO on webcam frame...")
                start = time.time()
                
                result = await analyzer.analyze_frame(
                    candidate_id="webcam_cpu",
                    room_id="test_room",
                    frame_data=frame_data
                )
                
                elapsed = (time.time() - start) * 1000
                
                print(f"✅ Webcam analysis: {elapsed:.1f}ms")
                
                face_detection = next(
                    (a for a in result['analyses'] if a['type'] == 'face_detection'),
                    None
                )
                
                if face_detection:
                    res = face_detection['result']
                    print(f"\n📊 Webcam Face Detection:")
                    print(f"  Faces detected: {res['faces_detected']}")
                    print(f"  Confidence: {res.get('confidence', 0):.3f}")
                    
                    if res.get('bounding_boxes'):
                        for i, bbox in enumerate(res['bounding_boxes']):
                            print(f"  Face {i+1}: ({bbox['x']}, {bbox['y']}) "
                                  f"{bbox['width']}x{bbox['height']} "
                                  f"conf={bbox['confidence']:.3f}")
        else:
            print("⚠️  Webcam not available")
    except Exception as e:
        print(f"⚠️  Webcam test error: {e}")
    
    # Cleanup
    await analyzer.cleanup()


async def test_direct_yolo():
    """Test YOLO detector directly"""
    print("\n[TEST] Direct YOLO Test")
    print("-" * 50)
    
    print("Loading YOLO detector...")
    detector = YOLODetector(device="cpu")
    
    try:
        detector.load()
        print("✅ YOLO loaded")
        
        # Create test image
        image = create_synthetic_face_image()
        
        # Detect
        print("\nRunning face detection...")
        import time
        start = time.time()
        
        count, detections = detector.detect_faces(image)
        
        elapsed = (time.time() - start) * 1000
        
        print(f"✅ Detection complete: {elapsed:.1f}ms")
        print(f"  Faces found: {count}")
        
        for i, det in enumerate(detections):
            print(f"  Face {i+1}:")
            print(f"    BBox: {det['bbox']}")
            print(f"    Confidence: {det['confidence']:.3f}")
            if 'landmarks' in det:
                print(f"    Landmarks: {len(det['landmarks'])} points")
        
        # Cleanup
        detector.cleanup()
        
    except Exception as e:
        print(f"❌ YOLO test failed: {e}")
        import traceback
        traceback.print_exc()


def create_synthetic_face_image() -> np.ndarray:
    """Create synthetic image with face"""
    # Blank canvas
    image = np.ones((480, 640, 3), dtype=np.uint8) * 200
    
    # Face oval
    center = (320, 240)
    axes = (80, 100)
    cv2.ellipse(image, center, axes, 0, 0, 360, (255, 220, 180), -1)
    
    # Eyes
    cv2.circle(image, (280, 220), 10, (50, 50, 50), -1)
    cv2.circle(image, (360, 220), 10, (50, 50, 50), -1)
    
    # Eyebrows
    cv2.ellipse(image, (280, 200), (15, 8), 0, 0, 180, (80, 60, 40), 2)
    cv2.ellipse(image, (360, 200), (15, 8), 0, 0, 180, (80, 60, 40), 2)
    
    # Nose
    cv2.line(image, (320, 240), (320, 270), (200, 150, 150), 2)
    cv2.ellipse(image, (310, 275), (8, 5), 0, 0, 360, (200, 150, 150), -1)
    cv2.ellipse(image, (330, 275), (8, 5), 0, 0, 360, (200, 150, 150), -1)
    
    # Mouth
    cv2.ellipse(image, (320, 295), (30, 15), 0, 0, 180, (150, 100, 100), 2)
    
    # Hair
    cv2.ellipse(image, (320, 160), (90, 60), 0, 0, 180, (80, 60, 40), -1)
    
    return image


async def main():
    """Run tests"""
    print("=" * 50)
    print("YOLO CPU INFERENCE TEST")
    print("=" * 50)
    
    print("\n⚠️  NOTE: Running on CPU (CUDA not available)")
    print("For GPU acceleration, install PyTorch with CUDA:")
    print("  pip uninstall torch torchvision")
    print("  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121")
    print("")
    
    try:
        # Test direct YOLO
        await test_direct_yolo()
        
        # Test with analyzer
        await test_yolo_cpu()
        
        print("\n" + "=" * 50)
        print("✅ CPU TESTS COMPLETED")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
