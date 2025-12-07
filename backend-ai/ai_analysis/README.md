# AI Analysis Module

This module provides AI-powered analysis for online exam proctoring, detecting various types of violations and suspicious behaviors.

## Architecture

```
ai_analysis/
├── __init__.py              # Module exports
├── base_analyzer.py         # Abstract base class for all analyzers
├── mock_analyzer.py         # Mock analyzer for testing/development
├── incident_types.py        # Incident definitions and enums
├── schemas.py              # Pydantic models for I/O validation
├── model_adapters/         # Individual model wrappers
│   ├── __init__.py
│   ├── base_model.py       # Abstract base class for models
│   ├── yolo_detector.py    # Face detection (YOLOv8n-Face)
│   ├── arcface_model.py    # Face recognition (ArcFace)
│   ├── paddle_ocr.py       # Screen OCR (PaddleOCR)
│   ├── silero_vad.py       # Voice activity detection (Silero VAD)
│   └── gaze_estimator.py   # Gaze/head pose estimation
└── real_analyzer.py        # Real AI analyzer (TODO: implement)
```

## Model Adapters

### BaseModel Interface

All model adapters inherit from `BaseModel` and implement:

- `load()`: Load model weights and initialize
- `infer(input_data)`: Run inference on input
- `warmup(dummy_input)`: Warm up model with dummy data
- `cleanup()`: Release model resources

### Available Adapters

#### 1. YOLODetector
- **Model**: YOLOv8n-Face
- **Input**: RGB image (HxWx3 numpy array)
- **Output**: List of face bounding boxes with confidence
- **Device**: GPU (CUDA)
- **Precision**: FP16

```python
from ai_analysis.model_adapters import YOLODetector

detector = YOLODetector(device="cuda")
detector.load()

faces_count, detections = detector.detect_faces(image)
```

#### 2. ArcFaceModel
- **Model**: ArcFace-R100
- **Input**: Cropped face image (112x112 RGB)
- **Output**: 512-dimensional embedding vector
- **Device**: GPU (CUDA)
- **Precision**: FP16

```python
from ai_analysis.model_adapters import ArcFaceModel

recognizer = ArcFaceModel(device="cuda")
recognizer.load()

embedding = recognizer.infer(face_image)
is_match, similarity = recognizer.verify_face(face_image, kyc_embedding)
```

#### 3. PaddleOCREngine
- **Model**: PaddleOCR v2.7
- **Input**: RGB screenshot image
- **Output**: Extracted text and bounding boxes
- **Device**: CPU
- **Languages**: English, Vietnamese

```python
from ai_analysis.model_adapters import PaddleOCREngine

ocr = PaddleOCREngine(lang="en,vi", device="cpu")
ocr.load()

full_text, text_regions = ocr.extract_text(screenshot)
text, keywords = ocr.detect_keywords(screenshot, ["google", "chatgpt"])
```

#### 4. SileroVAD
- **Model**: Silero VAD 3.1
- **Input**: Audio waveform (float32, mono, 16kHz)
- **Output**: Speech segments with timestamps
- **Device**: CPU

```python
from ai_analysis.model_adapters import SileroVAD

vad = SileroVAD(device="cpu", threshold=0.5)
vad.load()

result = vad.infer(audio_waveform)
# result["speaking"], result["speech_segments"], result["speaking_duration"]
```

#### 5. GazeEstimator
- **Model**: MediaPipe Face Mesh
- **Input**: RGB face image
- **Output**: Gaze direction and head pose angles
- **Device**: CPU

```python
from ai_analysis.model_adapters import GazeEstimator

gaze = GazeEstimator(device="cpu", model_type="mediapipe")
gaze.load()

result = gaze.infer(face_image)
# result["gaze_direction"], result["gaze_angles"], result["head_pose"]
```

## Usage

### Mock Analyzer (Current)

```python
from ai_analysis import MockAIAnalyzer

analyzer = MockAIAnalyzer()
results = analyzer.analyze_frame(candidate_id="user123", room_id="room456")
```

### Real Analyzer (Future)

```python
from ai_analysis import RealAIAnalyzer

analyzer = RealAIAnalyzer()
analyzer.warmup()  # Initialize models

# Analyze with real frames
results = analyzer.analyze_frame(
    candidate_id="user123",
    room_id="room456",
    frame_data={
        "camera": {"image": camera_frame, "timestamp": 1234567890},
        "screen": {"image": screen_frame, "timestamp": 1234567890},
        "audio": {"buffer": audio_buffer, "timestamp": 1234567890}
    }
)
```

## Output Format

All analyzers return a standardized format:

```python
{
    "timestamp": 1699804800123,
    "candidate_id": "user123",
    "room_id": "room456",
    "analyses": [
        {
            "type": "face_detection",
            "result": {
                "faces_detected": 1,
                "confidence": 0.95,
                "bounding_boxes": [...],
                "status": "normal",
                "alert": None
            }
        },
        {
            "type": "face_recognition",
            "result": {
                "is_verified": True,
                "similarity_score": 0.82,
                "status": "verified",
                "alert": None
            }
        },
        {
            "type": "screen_analysis",
            "result": {
                "ocr_text": "...",
                "suspicious_score": 0.0,
                "status": "clean",
                "alert": None
            }
        },
        {
            "type": "audio_analysis",
            "result": {
                "voice_detected": False,
                "num_speakers": 0,
                "status": "silent",
                "alert": None
            }
        },
        {
            "type": "behavior_analysis",
            "result": {
                "gaze_direction": "center",
                "looking_away_duration": 0,
                "status": "normal",
                "alert": None
            }
        }
    ]
}
```

## Alert Format

When violations are detected, `alert` field contains:

```python
{
    "type": "A1",  # Incident code (A1-D3)
    "level": "S2",  # Severity (S1-S4)
    "message": "Không phát hiện khuôn mặt - thí sinh có thể đã rời khỏi vùng camera"
}
```

## Incident Types

- **A1-A4**: Face-related (no face, multiple faces, mismatch, turned)
- **B1-B4**: Screen-related (search engine, chat app, suspicious text, exam content)
- **C1-C2**: Audio-related (voice detected, multiple speakers)
- **D1-D3**: Behavior-related (looking away, left camera, excessive movement)

See `incident_types.py` for full definitions.

## Testing

### Unit Tests

```bash
# Test individual models
pytest backend/ai_analysis/model_adapters/test_yolo_detector.py
pytest backend/ai_analysis/model_adapters/test_arcface_model.py

# Test analyzers
pytest backend/ai_analysis/test_mock_analyzer.py
pytest backend/ai_analysis/test_real_analyzer.py
```

### Mock Models for Testing

Each adapter provides a mock version for testing without loading real models:

```python
from ai_analysis.model_adapters.yolo_detector import create_mock_detector
from ai_analysis.model_adapters.arcface_model import create_mock_arcface

mock_detector = create_mock_detector()
mock_arcface = create_mock_arcface()
```

## Dependencies

### Required
```
fastapi>=0.110.0
pydantic>=2.0.0
numpy>=1.24.0
```

### For Real Models
```
torch>=2.0.0
torchvision>=0.15.0
ultralytics>=8.0.0       # YOLO
insightface>=0.7.0       # ArcFace
paddleocr>=2.7.0         # OCR
onnxruntime-gpu>=1.15.0  # For optimized inference
mediapipe>=0.10.0        # Gaze estimation
opencv-python>=4.8.0
```

### Installation

```bash
# Basic (mock only)
pip install -r requirements.txt

# With real AI models
pip install -r requirements-ai.txt
```

## Configuration

Models can be configured via `config/inference.yaml`:

```yaml
models:
  face_detection:
    model: yolov8n-face
    device: cuda
    precision: fp16
    confidence_threshold: 0.5
  
  face_recognition:
    model: arcface-r100
    device: cuda
    precision: fp16
    similarity_threshold: 0.45
  
  ocr:
    model: paddleocr
    device: cpu
    languages: [en, vi]
  
  vad:
    model: silero-vad
    device: cpu
    threshold: 0.5
  
  gaze:
    model: mediapipe
    device: cpu
```

## Performance

Target performance on RTX 3070 8GB:

| Model | Device | Latency | Memory |
|-------|--------|---------|--------|
| YOLOv8n-Face | GPU (FP16) | ~100ms | ~6MB |
| ArcFace-R100 | GPU (FP16) | ~150ms | ~130MB |
| PaddleOCR | CPU | ~300ms | ~20MB |
| Silero VAD | CPU | ~50ms | ~4MB |
| Gaze Estimation | CPU | ~100ms | ~10MB |
| **Total** | - | **~700ms** | **~170MB** |

## Roadmap

- [x] Todo #1: System survey
- [x] Todo #2: I/O contracts
- [x] Todo #3: Inference architecture
- [x] Todo #4: Model adapters (THIS)
- [ ] Todo #5: Frame capture pipeline
- [ ] Todo #6: RealAIAnalyzer implementation
- [ ] Todo #7: Integrate first model (YOLO)
- [ ] Todo #8: Testing & validation
- [ ] Todo #9: Integrate remaining models

## License

See individual model licenses:
- YOLOv8: AGPL-3.0
- ArcFace (InsightFace): MIT
- PaddleOCR: Apache-2.0
- Silero VAD: MIT
- MediaPipe: Apache-2.0
