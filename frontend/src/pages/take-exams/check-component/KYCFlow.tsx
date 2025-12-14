import React, { useState, useRef, useEffect } from 'react'
import {
  Card,
  Button,
  Progress,
  Steps,
  Typography,
  Row,
  Col,
  Image,
  Alert,
} from 'antd'
import {
  UploadOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import axios from 'axios'

const { Title, Text } = Typography

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 0;
`

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`

const StepsWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: 16px 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 28px;
    left: 60px;
    right: 60px;
    height: 2px;
    background: #d9d9d9;
    z-index: 0;
  }
`

const StepItem = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 1;
  
  .step-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.active ? '#1890ff' : 'white'};
    color: ${props => props.active ? 'white' : '#999'};
    font-size: 14px;
    border: 2px solid ${props => props.active ? '#1890ff' : '#d9d9d9'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .step-label {
    color: ${props => props.active ? '#1890ff' : '#999'};
    font-size: 13px;
    text-align: center;
    margin-top: 4px;
  }
`

interface VerificationResult {
  faceMatch: number
  livenessScore: number
  passed: boolean
  message: string
}

interface KYCFlowProps {
  onComplete?: (result: VerificationResult) => void
  onCancel?: () => void
  isWhitelistMode?: boolean
  email?: string
  sessionId?: number
  candidateId?: string
}

const FlowContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
`

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
`

const StepContent = styled(Card)`
  margin-top: 24px;
  text-align: center;
`

const PreviewImage = styled(Image)`
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  margin: 16px 0;
`

const VideoContainer = styled.div`
  position: relative;
  margin: 16px 0;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #f0f0f0;
`

const SelfieVideo = styled.video`
  width: 100%;
  display: block;
  margin: 0 auto;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const ResultCard = styled(Card)<{ $passed: boolean }>`
  margin: 24px 0;
  border-left: 4px solid ${(props) => (props.$passed ? '#52c41a' : '#ff4d4f')};
`

const ScoreItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`

const steps = [
  {
    title: 'Upload ID',
    icon: <UploadOutlined />,
    description: 'CMND/CCCD',
  },
  {
    title: 'Chụp Selfie',
    icon: <CameraOutlined />,
    description: 'Xác thực khuôn mặt',
  },
  {
    title: 'Xác minh',
    icon: <SafetyCertificateOutlined />,
    description: 'So khớp thông tin',
  },
]

export default function KYCFlow({ 
  onComplete, 
  onCancel, 
  isWhitelistMode = false,
  email,
  sessionId,
  candidateId = "unknown"
}: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [idImage, setIdImage] = useState<string | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null)
  const [verifying, setVerifying] = useState<boolean>(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieVideoRef = useRef<HTMLVideoElement>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null)
  const selfieStreamRef = useRef<MediaStream | null>(null)

  // Skip ID upload step if in whitelist mode
  useEffect(() => {
    if (isWhitelistMode) {
      console.log('[KYC] Whitelist Mode Active. Email:', email, 'SessionID:', sessionId)
      if (currentStep === 0) {
        setCurrentStep(1)
      }
    } else {
      // If not whitelist mode (or fallback to manual), ensure we start at step 0
      if (currentStep === 1 && !idImage && !idFile) {
         setCurrentStep(0)
      }
    }
  }, [isWhitelistMode, currentStep, email, sessionId, idImage, idFile])

  const stopSelfieCamera = () => {
    const stream = selfieStreamRef.current
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      selfieStreamRef.current = null
    }
    if (selfieVideoRef.current) {
      selfieVideoRef.current.srcObject = null
    }
  }

  const startSelfieCamera = async (): Promise<void> => {
    setCameraError(null)

    if (selfieStreamRef.current) {
      // Already started
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })

      selfieStreamRef.current = stream

      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          if (!selfieVideoRef.current) return resolve()
          // If metadata already loaded, resolve immediately
          if (selfieVideoRef.current.readyState >= 2) return resolve()
          selfieVideoRef.current.onloadedmetadata = () => resolve()
        })
        await selfieVideoRef.current.play().catch(() => {
          // Some browsers may block autoplay; user can still press "Chụp ảnh"
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setCameraError('Không thể truy cập camera: ' + errorMessage)
      stopSelfieCamera()
    }
  }

  // Auto-start camera preview on selfie step
  useEffect(() => {
    if (currentStep === 1) {
      void startSelfieCamera()
      return
    }

    // Stop camera when leaving selfie step
    stopSelfieCamera()
  }, [currentStep])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSelfieCamera()
  }, [])

  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
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
      // Ensure camera is started (for cases where autoplay is blocked)
      if (!selfieStreamRef.current) {
        await startSelfieCamera()
      }

      // Capture frame from active video
      const canvas = selfieCanvasRef.current
      const video = selfieVideoRef.current
      if (!canvas || !video) return

      // Wait for actual video dimensions
      if (!video.videoWidth || !video.videoHeight) {
        await new Promise<void>((resolve) => {
          if (!video) return resolve()
          video.onloadedmetadata = () => resolve()
        })
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setSelfieImage(dataUrl)

        // Convert to blob for upload
        canvas.toBlob((blob) => {
          if (blob) setSelfieBlob(blob)
        }, 'image/jpeg', 0.95)
      }

      // Stop camera after capture
      stopSelfieCamera()
      setCurrentStep(2)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setCameraError('Không thể truy cập camera: ' + errorMessage)
    }
  }

  const verify = async (): Promise<void> => {
    if (!selfieBlob) return
    if (!isWhitelistMode && !idFile) return

    setVerifying(true)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('candidateId', candidateId)
      formData.append('selfie', selfieBlob, 'selfie.jpg')
      
      if (isWhitelistMode) {
        if (email) formData.append('email', email)
        if (sessionId) formData.append('session_id', sessionId.toString())
      } else if (idFile) {
        formData.append('id_image', idFile)
      }

      // Call Real AI Backend
      const response = await axios.post('http://localhost:8000/api/kyc/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const data = response.data
      
      const verificationResult: VerificationResult = {
        faceMatch: data.similarity,
        livenessScore: 1.0, // Backend doesn't return liveness yet, assume 1.0 if passed
        passed: data.passed,
        message: data.passed ? 'Xác thực thành công' : 'Xác thực thất bại',
      }
      
      setResult(verificationResult)

      // Do not auto-advance. Show "Tiếp tục" button on success.
    } catch (error) {
      console.error('KYC Verification error:', error)

      const backendMessage = (() => {
        if (axios.isAxiosError(error)) {
          const data: any = error.response?.data
          return (
            data?.detail ||
            data?.message ||
            (typeof data === 'string' ? data : null) ||
            error.message
          )
        }
        if (error instanceof Error) return error.message
        return 'Lỗi không xác định'
      })()

      setResult({
        faceMatch: 0,
        livenessScore: 0,
        passed: false,
        message: backendMessage || 'Lỗi kết nối server hoặc xác thực thất bại',
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleContinue = () => {
    if (result?.passed) {
      onComplete?.(result)
    }
  }

  const handleRetakeSelfie = () => {
    setSelfieImage(null)
    setSelfieBlob(null)
    setResult(null)
    setCurrentStep(1)
  }

  const handleBackToID = () => {
    if (isWhitelistMode) {
      // If whitelist mode, back means cancel or retake selfie? 
      // Actually we can't go back to ID upload.
      handleRetakeSelfie()
    } else {
      setIdImage(null)
      setIdFile(null)
      setResult(null)
      setCurrentStep(0)
    }
  }

  return (
    <FlowContainer>
      <Header>
        <HeaderContent>
          <StepsWrapper>
            <StepItem>
              <div className="step-icon">✓</div>
              <span className="step-label">Kiểm tra hệ thống</span>
            </StepItem>
            <StepItem active>
              <div className="step-icon">✓</div>
              <span className="step-label">Xác minh danh tính</span>
            </StepItem>
            <StepItem>
              <div className="step-icon">📋</div>
              <span className="step-label">Thông tin thí sinh</span>
            </StepItem>
            <StepItem>
              <div className="step-icon">📝</div>
              <span className="step-label">Tham dự bài thi</span>
            </StepItem>
          </StepsWrapper>
        </HeaderContent>
      </Header>

      <MainContent>
        <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Xác thực danh tính (KYC)</Title>
          <Text type="secondary">
            Hoàn thành các bước để xác minh danh tính của bạn
          </Text>
        </div>

        <Steps
          current={currentStep}
          items={isWhitelistMode ? steps.slice(1) : steps}
          style={{ marginBottom: 32 }}
        />

        {/* Step 1: ID Upload (Skipped if Whitelist Mode) */}
        {currentStep === 0 && !isWhitelistMode && (
          <StepContent>
            <Title level={3}>📷 Upload ảnh CMND/CCCD</Title>
            <Text
              type="secondary"
              style={{ display: 'block', marginBottom: 24 }}
            >
              Vui lòng upload ảnh chụp rõ mặt trước và mặt sau CMND/CCCD của bạn
            </Text>

            <input
              type="file"
              accept="image/*"
              ref={idInputRef}
              onChange={handleIDUpload}
              style={{ display: 'none' }}
            />

            {!idImage ? (
              <div>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  size="large"
                  onClick={() => idInputRef.current?.click()}
                >
                  Chọn ảnh CMND/CCCD
                </Button>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Định dạng: JPG, PNG • Dung lượng tối đa: 5MB
                  </Text>
                </div>
              </div>
            ) : (
              <div>
                <PreviewImage src={idImage} alt="ID Document" width={300} />
                <ActionButtons>
                  <Button
                    type="primary"
                    onClick={() => setCurrentStep(1)}
                    size="large"
                  >
                    Tiếp tục
                  </Button>
                  <Button
                    onClick={() => idInputRef.current?.click()}
                    size="large"
                  >
                    Chọn ảnh khác
                  </Button>
                </ActionButtons>
              </div>
            )}
          </StepContent>
        )}

        {/* Step 2: Selfie Capture */}
        {currentStep === 1 && (
          <StepContent>
            <Title level={3}>📸 Chụp ảnh selfie</Title>
            <Text
              type="secondary"
              style={{ display: 'block', marginBottom: 24 }}
            >
              Đảm bảo khuôn mặt được nhìn thấy rõ ràng trong khung hình
            </Text>

            {cameraError && (
              <Alert
                type="error"
                showIcon
                message={cameraError}
                style={{ marginBottom: 16, textAlign: 'left' }}
              />
            )}

            <VideoContainer>
              <SelfieVideo ref={selfieVideoRef} autoPlay playsInline muted />
            </VideoContainer>
            <canvas ref={selfieCanvasRef} style={{ display: 'none' }} />

            <ActionButtons>
              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={captureSelfie}
                size="large"
              >
                Chụp ảnh
              </Button>
              {!isWhitelistMode && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToID}
                  size="large"
                >
                  Quay lại
                </Button>
              )}
            </ActionButtons>
          </StepContent>
        )}

        {/* Step 3: Verification */}
        {currentStep === 2 && (
          <StepContent>
            <Title level={3}>🔍 Xác minh thông tin</Title>

            <Row gutter={[24, 24]} justify="center">
              {!isWhitelistMode && (
                <Col xs={24} md={12}>
                  <Text strong>Ảnh CMND/CCCD</Text>
                  <PreviewImage
                    src={idImage ?? ''}
                    alt="ID Document"
                    width={200}
                  />
                </Col>
              )}
              <Col xs={24} md={12}>
                <Text strong>Ảnh Selfie</Text>
                <PreviewImage
                  src={selfieImage ?? ''}
                  alt="Selfie"
                  width={200}
                />
              </Col>
            </Row>

            {!verifying && !result && (
              <ActionButtons>
                <Button
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={verify}
                  size="large"
                >
                  Bắt đầu xác minh
                </Button>
                <Button onClick={handleRetakeSelfie} size="large">
                  Chụp lại selfie
                </Button>
                {!isWhitelistMode && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToID}
                    size="large"
                  >
                    Thay đổi ID
                  </Button>
                )}
              </ActionButtons>
            )}

            {verifying && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Progress type="circle" percent={75} />
                <Title level={4} style={{ marginTop: 24 }}>
                  Đang xác minh...
                </Title>
                <Text type="secondary">
                  Đang so khớp khuôn mặt và kiểm tra tính xác thực
                </Text>
              </div>
            )}

            {result && (
              <ResultCard $passed={result.passed}>
                <div style={{ textAlign: 'center' }}>
                  {result.passed ? (
                    <CheckCircleFilled
                      style={{ fontSize: 48, color: '#52c41a' }}
                    />
                  ) : (
                    <CloseCircleFilled
                      style={{ fontSize: 48, color: '#ff4d4f' }}
                    />
                  )}
                  <Title level={3} style={{ marginTop: 16 }}>
                    {result.message}
                  </Title>

                  <div style={{ maxWidth: 300, margin: '0 auto' }}>
                    <ScoreItem>
                      <Text>Độ khớp khuôn mặt:</Text>
                      <Text strong>{(result.faceMatch * 100).toFixed(1)}%</Text>
                    </ScoreItem>
                    <ScoreItem>
                      <Text>Độ tin cậy:</Text>
                      <Text strong>
                        {(result.livenessScore * 100).toFixed(1)}%
                      </Text>
                    </ScoreItem>
                  </div>

                  {result.passed && (
                    <>
                      <Alert
                        message="Xác thực thành công"
                        description="Bạn đã hoàn thành quá trình xác thực danh tính"
                        type="success"
                        showIcon
                        style={{ marginTop: 16 }}
                      />

                      <div style={{ marginTop: 16 }}>
                        <Button type="primary" onClick={handleContinue}>
                          Tiếp tục
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {!result.passed && (
                     <Button onClick={handleRetakeSelfie} style={{marginTop: 16}}>
                        Thử lại
                     </Button>
                  )}
                </div>
              </ResultCard>
            )}
          </StepContent>
        )}

        {onCancel && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button onClick={onCancel}>Hủy bỏ</Button>
          </div>
        )}
        </Card>
      </MainContent>
    </FlowContainer>
  )
}
