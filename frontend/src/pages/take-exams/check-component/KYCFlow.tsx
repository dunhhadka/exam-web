import React, { useState, useRef } from 'react'
import {
  Card,
  Button,
  Progress,
  Steps,
  Typography,
  Row,
  Col,
  Image,
  Space,
  Alert,
  Result,
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
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #f0f0f0;
`

const SelfieVideo = styled.video`
  width: 100%;
  max-width: 400px;
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

/**
 * KYC Flow: ID upload + selfie + face match (mock)
 * Theo thiết kế: ID + selfie → ArcFace match → Liveness
 */
export default function KYCFlow({ onComplete, onCancel }: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(0)
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      })

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
        setCurrentStep(2)
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

  const handleRetakeSelfie = () => {
    setSelfieImage(null)
    setCurrentStep(1)
  }

  const handleBackToID = () => {
    setIdImage(null)
    setCurrentStep(0)
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
            Hoàn thành 3 bước đơn giản để xác minh danh tính của bạn
          </Text>
        </div>

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 32 }}
        />

        {/* Step 1: ID Upload */}
        {currentStep === 0 && (
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

            <VideoContainer>
              <SelfieVideo ref={selfieVideoRef} autoPlay playsInline />
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
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBackToID}
                size="large"
              >
                Quay lại
              </Button>
            </ActionButtons>
          </StepContent>
        )}

        {/* Step 3: Verification */}
        {currentStep === 2 && (
          <StepContent>
            <Title level={3}>🔍 Xác minh thông tin</Title>

            <Row gutter={[24, 24]} justify="center">
              <Col xs={24} md={12}>
                <Text strong>Ảnh CMND/CCCD</Text>
                <PreviewImage
                  src={idImage ?? ''}
                  alt="ID Document"
                  width={200}
                />
              </Col>
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
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToID}
                  size="large"
                >
                  Thay đổi ID
                </Button>
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
                    <Alert
                      message="Xác thực thành công"
                      description="Bạn đã hoàn thành quá trình xác thực danh tính"
                      type="success"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
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
