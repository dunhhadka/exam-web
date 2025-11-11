import React, { useState, useRef } from 'react'

interface VerificationResult {
  faceMatch: number
  livenessScore: number
  passed: boolean
  message: string
}

interface KYCFlowProps {
  onComplete?: (result: VerificationResult) => void
  onCancel?: () => void
}

/**
 * KYC Flow: ID upload + selfie + face match (mock)
 * Theo thiết kế: ID + selfie → ArcFace match → Liveness
 */
export default function KYCFlow({ onComplete, onCancel }: KYCFlowProps) {
  const [step, setStep] = useState<number>(1) // 1: ID, 2: Selfie, 3: Verify
  const [idImage, setIdImage] = useState<string | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<boolean>(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieVideoRef = useRef<HTMLVideoElement>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        if (ev.target?.result) {
          setIdImage(ev.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const captureSelfie = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          if (selfieVideoRef.current) {
            selfieVideoRef.current.onloadedmetadata = () => resolve()
          }
        })
        // Capture frame
        const canvas = selfieCanvasRef.current
        const video = selfieVideoRef.current
        if (canvas && video) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0)
            const dataUrl = canvas.toDataURL('image/jpeg')
            setSelfieImage(dataUrl)
          }
        }
        // Stop stream
        stream.getTracks().forEach((t) => t.stop())
        setStep(3)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert('Không thể truy cập camera: ' + errorMessage)
    }
  }

  const verify = async (): Promise<void> => {
    setVerifying(true)
    // Mock verification: simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    // Mock result: 90% match, liveness pass
    const mockResult: VerificationResult = {
      faceMatch: 0.92, // cosine similarity
      livenessScore: 0.95,
      passed: true,
      message: 'Xác thực thành công',
    }
    setResult(mockResult)
    setVerifying(false)
    if (mockResult.passed) {
      setTimeout(() => onComplete?.(mockResult), 1500)
    }
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 24,
        border: '1px solid #ddd',
        borderRadius: 8,
      }}
    >
      <h2>Xác thực danh tính (KYC)</h2>

      {step === 1 && (
        <div>
          <h3>Bước 1: Upload ảnh CMND/CCCD</h3>
          <input
            type="file"
            accept="image/*"
            ref={idInputRef}
            onChange={handleIDUpload}
            style={{ marginBottom: 12 }}
          />
          {idImage && (
            <div>
              <img
                src={idImage}
                alt="ID"
                style={{ maxWidth: '100%', border: '1px solid #ccc' }}
              />
              <button onClick={() => setStep(2)} style={{ marginTop: 12 }}>
                Tiếp tục
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Bước 2: Chụp ảnh selfie</h3>
          <video
            ref={selfieVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', maxWidth: 400 }}
          />
          <canvas ref={selfieCanvasRef} style={{ display: 'none' }} />
          <div style={{ marginTop: 12 }}>
            <button onClick={captureSelfie}>Chụp ảnh</button>
            <button onClick={() => setStep(1)} style={{ marginLeft: 8 }}>
              Quay lại
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>Bước 3: Xác minh</h3>
          {selfieImage && (
            <img
              src={selfieImage}
              alt="Selfie"
              style={{
                maxWidth: '100%',
                border: '1px solid #ccc',
                marginBottom: 12,
              }}
            />
          )}
          {!verifying && !result && (
            <div>
              <button onClick={verify}>Xác minh</button>
              <button onClick={() => setStep(2)} style={{ marginLeft: 8 }}>
                Chụp lại
              </button>
            </div>
          )}
          {verifying && <div>Đang xác minh...</div>}
          {result && (
            <div
              style={{
                padding: 12,
                background: result.passed ? '#d4edda' : '#f8d7da',
                borderRadius: 4,
              }}
            >
              <div>
                <strong>{result.message}</strong>
              </div>
              <div>Face Match: {(result.faceMatch * 100).toFixed(1)}%</div>
              <div>Liveness: {(result.livenessScore * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      {onCancel && (
        <button onClick={onCancel} style={{ marginTop: 12 }}>
          Hủy
        </button>
      )}
    </div>
  )
}
