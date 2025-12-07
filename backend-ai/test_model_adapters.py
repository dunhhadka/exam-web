"""
Test script for model adapters
Run individual tests without loading full models
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
from ai_analysis.model_adapters import (
    create_mock_detector,
    create_mock_arcface,
    create_mock_ocr,
    create_mock_vad,
    create_mock_gaze
)


def test_yolo_detector():
    """Test YOLO face detector (mock)"""
    print("\n[TEST] YOLODetector (Mock)")
    print("-" * 50)
    
    detector = create_mock_detector()
    
    # Create dummy image
    image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    # Test detection
    faces_count, detections = detector.detect_faces(image)
    
    print(f"✅ Detected {faces_count} face(s)")
    for i, det in enumerate(detections):
        print(f"  Face {i+1}: bbox={det['bbox']}, conf={det['confidence']:.2f}")
        if 'landmarks' in det:
            print(f"    Landmarks: {list(det['landmarks'].keys())}")


def test_arcface_model():
    """Test ArcFace face recognition (mock)"""
    print("\n[TEST] ArcFaceModel (Mock)")
    print("-" * 50)
    
    recognizer = create_mock_arcface()
    
    # Create dummy face images
    face1 = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    face2 = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    
    # Test embedding extraction
    emb1 = recognizer.infer(face1)
    emb2 = recognizer.infer(face2)
    
    print(f"✅ Embedding shape: {emb1.shape}")
    print(f"✅ Embedding norm: {np.linalg.norm(emb1):.4f}")
    
    # Test similarity
    similarity = recognizer.compute_similarity(emb1, emb2)
    print(f"✅ Similarity between two faces: {similarity:.4f}")
    
    # Test verification
    is_match, score = recognizer.verify_face(face1, emb2, threshold=0.45)
    print(f"✅ Verification: match={is_match}, score={score:.4f}")


def test_paddle_ocr():
    """Test PaddleOCR (mock)"""
    print("\n[TEST] PaddleOCREngine (Mock)")
    print("-" * 50)
    
    ocr = create_mock_ocr()
    
    # Create dummy screenshot
    screenshot = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
    
    # Test text extraction
    full_text, text_regions = ocr.extract_text(screenshot)
    
    print(f"✅ Extracted text: \"{full_text}\"")
    print(f"✅ Number of text regions: {len(text_regions)}")
    
    # Test keyword detection
    keywords = ["google", "chatgpt", "search"]
    text, detected = ocr.detect_keywords(screenshot, keywords)
    print(f"✅ Detected keywords: {detected}")


def test_silero_vad():
    """Test Silero VAD (mock)"""
    print("\n[TEST] SileroVAD (Mock)")
    print("-" * 50)
    
    vad = create_mock_vad()
    
    # Create dummy audio (1 second @ 16kHz)
    audio = np.random.randn(16000).astype(np.float32)
    
    # Test voice detection
    result = vad.infer(audio)
    
    print(f"✅ Speaking: {result['speaking']}")
    print(f"✅ Confidence: {result['confidence']:.2f}")
    print(f"✅ Speaking duration: {result['speaking_duration']:.2f}s")
    print(f"✅ Number of segments: {len(result['speech_segments'])}")


def test_gaze_estimator():
    """Test Gaze Estimator (mock)"""
    print("\n[TEST] GazeEstimator (Mock)")
    print("-" * 50)
    
    gaze = create_mock_gaze()
    
    # Create dummy face image
    face = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    
    # Test gaze estimation
    result = gaze.infer(face)
    
    print(f"✅ Gaze direction: {result['gaze_direction']}")
    print(f"✅ Gaze angles: yaw={result['gaze_angles']['yaw']:.1f}°, pitch={result['gaze_angles']['pitch']:.1f}°")
    print(f"✅ Head pose: yaw={result['head_pose']['yaw']:.1f}°, pitch={result['head_pose']['pitch']:.1f}°, roll={result['head_pose']['roll']:.1f}°")
    print(f"✅ Confidence: {result['confidence']:.2f}")


def main():
    """Run all tests"""
    print("=" * 50)
    print("MODEL ADAPTER TESTS (Mock Mode)")
    print("=" * 50)
    
    try:
        test_yolo_detector()
        test_arcface_model()
        test_paddle_ocr()
        test_silero_vad()
        test_gaze_estimator()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
