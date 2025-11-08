import React, { useEffect, useRef, useState } from 'react'
import { Button, Card, Upload, Alert, Space, Typography, message } from 'antd'
import {
  CameraOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import type { UploadProps } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { setVerificationResult } from '../../store/slices/takeExamSlice'
import { useNavigate } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography

// ===== Styled components (giống CheckExamSystem) =====
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const MainCard = styled(Card)`
  max-width: 900px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .ant-card-body {
    padding: 48px;
  }
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`

const SectionCard = styled(Card)`
  border-radius: 12px;
  border: 2px solid #d9d9d9;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const VideoPreview = styled.div`
  margin-top: 20px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  video {
    width: 100%;
    max-width: 500px;
    display: block;
    margin: 0 auto;
  }
`

const LiveIndicator = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: #52c41a;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

const Footer = styled.div`
  margin-top: 32px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`

// ===== Component chính =====
const CheckExamIdentity: React.FC = () => {
  const [idCardImage, setIdCardImage] = useState<string | null>(null)
  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCaptured, setIsCaptured] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { takeExamSession } = useSelector((state: RootState) => state.takeExam)

  // Gán stream vào video khi camera bật
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  // Upload ID card
  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => setIdCardImage(e.target?.result as string)
      reader.readAsDataURL(file)
      return false
    },
    onRemove: () => {
      setIdCardImage(null)
    },
  }

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(s)
      setIsCameraOn(true)
      setIsCaptured(false)
    } catch (err) {
      message.error('Không thể bật camera. Vui lòng kiểm tra quyền truy cập.')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
    setStream(null)
    setIsCameraOn(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const imgData = canvas.toDataURL('image/png')
    setFaceImage(imgData)
    setIsCaptured(true)
    stopCamera()
  }

  const handleContinue = () => {
    console.log('🪪 ID Card Image:', idCardImage)
    console.log('📸 Face Image:', faceImage)
    message.success('Đã log dữ liệu ảnh ra console!')

    dispatch(setVerificationResult({ matched: true }))

    navigate('/exam-checkin?code=' + takeExamSession.examCode)
  }

  return (
    <Container>
      <MainCard>
        <Header>
          <Title level={2}>Xác thực danh tính</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Vui lòng tải ảnh CMND/CCCD và chụp ảnh khuôn mặt của bạn
          </Text>
        </Header>

        {/* Upload ID Card */}
        <SectionCard bordered={false}>
          <Title level={4}>Tải ảnh CMND/CCCD</Title>
          <Paragraph type="secondary">
            Hãy chọn ảnh rõ nét, không bị mờ hoặc thiếu góc.
          </Paragraph>
          <Upload {...uploadProps} accept="image/*" maxCount={1}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
          {idCardImage && (
            <img
              src={idCardImage}
              alt="ID Card"
              width={300}
              style={{
                marginTop: 16,
                borderRadius: 12,
                border: '1px solid #ddd',
              }}
            />
          )}
        </SectionCard>

        {/* Capture Face */}
        <SectionCard bordered={false}>
          <Title level={4}>Chụp ảnh khuôn mặt</Title>
          <Paragraph type="secondary">
            Giữ khuôn mặt của bạn trong khung hình, đảm bảo ánh sáng đầy đủ.
          </Paragraph>

          {!isCameraOn && !isCaptured && (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={startCamera}
            >
              Bật Camera
            </Button>
          )}

          {isCameraOn && (
            <VideoPreview>
              <video ref={videoRef} autoPlay playsInline />
              <LiveIndicator>Camera đang hoạt động</LiveIndicator>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Button type="primary" onClick={capturePhoto}>
                  Chụp ảnh
                </Button>
              </div>
            </VideoPreview>
          )}

          <canvas
            ref={canvasRef}
            width={300}
            height={225}
            style={{ display: 'none' }}
          />

          {isCaptured && faceImage && (
            <div style={{ marginTop: 16 }}>
              <img
                src={faceImage}
                alt="Captured Face"
                width={300}
                style={{
                  borderRadius: 12,
                  border: '1px solid #ddd',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </div>
          )}
        </SectionCard>

        {idCardImage && faceImage && (
          <Alert
            message="Ảnh đã sẵn sàng!"
            description="Bạn có thể tiếp tục sang bước xác thực."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        )}

        <Footer>
          <Button onClick={() => window.history.back()}>Quay lại</Button>
          {idCardImage && faceImage && (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleContinue}
            >
              Tiếp tục
            </Button>
          )}
        </Footer>
      </MainCard>
    </Container>
  )
}

export default CheckExamIdentity
