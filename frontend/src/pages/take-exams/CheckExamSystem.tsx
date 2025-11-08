// pages/CheckExamSystem.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  CameraOutlined,
  MonitorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { Button, Card, Alert, Space, Typography, Spin } from 'antd'
import styled from '@emotion/styled'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import {
  setCamerPermission,
  setDisplayPermission,
  setError,
  setMediStream,
  setSystemCheckPassed,
} from '../../store/slices/takeExamSlice'

const { Title, Text, Paragraph } = Typography

// Styled Components
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

const CheckItemCard = styled(Card)<{ status?: string }>`
  margin-bottom: 24px;
  border-radius: 12px;
  border: 2px solid
    ${(props) =>
      props.status === 'granted'
        ? '#52c41a'
        : props.status === 'denied'
        ? '#ff4d4f'
        : '#d9d9d9'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const CheckItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const CheckItemContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
`

const IconWrapper = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: ${(props) => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .anticon {
    color: ${(props) => props.color};
    font-size: 24px;
  }
`

const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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

const ExamCodeFooter = styled.div`
  margin-top: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
`

const CheckExamSystem = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { examConfig, systemCheck, takeExamSession } = useSelector(
    (state: RootState) => state.takeExam
  )

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null) // Dùng ref thay vì state
  const [cameraChecked, setCameraChecked] = useState(false)
  const [displayChecked, setDisplayChecked] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!takeExamSession.examCode) {
      navigate('/exam-checkin')
      return
    }

    performSystemChecks()

    // Cleanup khi unmount hoặc page unload
    const cleanup = () => {
      console.log('🧹 [CheckExamSystem] Cleaning up camera')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          console.log(
            `  - Stopping ${track.kind} track, state: ${track.readyState}`
          )
          track.stop()
        })
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.load() // Force reset video element
      }
    }

    // Listen cả beforeunload để chắc chắn
    window.addEventListener('beforeunload', cleanup)

    return () => {
      cleanup()
      window.removeEventListener('beforeunload', cleanup)
    }
  }, [])

  const performSystemChecks = async () => {
    setIsChecking(true)

    // Kiểm tra camera nếu cần
    if (examConfig.requireCammera) {
      await checkCamera()
    } else {
      setCameraChecked(true)
      dispatch(setCamerPermission('granted'))
    }

    // Kiểm tra display nếu cần
    if (examConfig.requireExtendedDisplayCheck) {
      await checkExtendedDisplay()
    } else {
      setDisplayChecked(true)
      dispatch(setDisplayPermission('granted'))
    }

    setIsChecking(false)
  }

  const checkCamera = async () => {
    try {
      dispatch(setCamerPermission('pending'))

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = mediaStream
      dispatch(setCamerPermission('granted'))

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      setCameraChecked(true)
      console.log('✅ [CheckExamSystem] Camera started successfully')
    } catch (error: any) {
      console.error('❌ [CheckExamSystem] Camera error:', error)
      dispatch(setCamerPermission('denied'))

      let errorMessage = 'Không thể truy cập camera.'

      if (error.name === 'NotAllowedError') {
        errorMessage =
          'Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Không tìm thấy camera trên thiết bị của bạn.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác.'
      }

      dispatch(setError(errorMessage))
      setCameraChecked(true)
    }
  }

  const checkExtendedDisplay = async () => {
    try {
      dispatch(setDisplayPermission('pending'))

      let extendedScreenCount = 0

      // Ưu tiên: Window Management API (getScreenDetails) - detect chính xác số screens
      if ('getScreenDetails' in window) {
        try {
          // @ts-ignore - API experimental, TS chưa full support
          const screenDetails = await window.getScreenDetails()
          const totalScreens = screenDetails.screens.length
          extendedScreenCount = totalScreens - 1 // Trừ primary screen

          console.log(
            `Detected ${totalScreens} total screens (${extendedScreenCount} extended)`
          )
        } catch (apiError: any) {
          if (apiError.name === 'NotAllowedError') {
            console.warn(
              'getScreenDetails requires user gesture; falling back to estimation.'
            )
            extendedScreenCount =
              window.screen.availWidth > 1920 ||
              window.screen.availHeight > 1080
                ? 1
                : 0
          } else {
            throw apiError
          }
        }
      }
      // Fallback 1: Screen.isExtended
      else if ('isExtended' in window.screen && window.screen.isExtended) {
        extendedScreenCount = 1
        console.log('Detected extended display via isExtended')
      }
      // Fallback 2: Ước lượng
      else {
        extendedScreenCount = window.screen.availWidth > 1920 ? 1 : 0
        console.log(
          `Fallback: Estimated ${extendedScreenCount} extended screen(s)`
        )
      }

      const allowed = examConfig.allowedExtendDisplays || 0
      console.log(
        `Allowed extended displays: ${allowed}, Detected: ${extendedScreenCount}`
      )

      if (extendedScreenCount > 0) {
        dispatch(setDisplayPermission('denied'))
        dispatch(
          setError(
            `Phát hiện ${extendedScreenCount} màn hình mở rộng. ` +
              `Bài thi chỉ cho phép tối đa ${allowed} màn hình. ` +
              `Vui lòng ngắt kết nối các màn hình phụ.`
          )
        )
        setDisplayChecked(true)
        return
      }

      dispatch(setDisplayPermission('granted'))
      setDisplayChecked(true)
    } catch (error) {
      console.warn('Screen detection error:', error)
      const allowed = examConfig.allowedExtendDisplays || 0
      if (allowed === 0) {
        dispatch(setDisplayPermission('denied'))
        dispatch(
          setError(
            'Không thể xác thực màn hình hiển thị. Vui lòng đảm bảo chỉ sử dụng một màn hình và thử lại.'
          )
        )
      } else {
        dispatch(setDisplayPermission('granted'))
      }
      setDisplayChecked(true)
    }
  }

  // Kiểm tra xem có thể proceed không
  useEffect(() => {
    if (!cameraChecked || !displayChecked) return

    const cameraPass =
      !examConfig.requireCammera || systemCheck.cameraPermission === 'granted'
    const displayPass =
      !examConfig.requireExtendedDisplayCheck ||
      systemCheck.displayPermission === 'granted'

    if (cameraPass && displayPass) {
      dispatch(setSystemCheckPassed(true))
    } else {
      dispatch(setSystemCheckPassed(false))
    }
  }, [
    cameraChecked,
    displayChecked,
    systemCheck.cameraPermission,
    systemCheck.displayPermission,
  ])

  const stopCamera = () => {
    console.log('🛑 [CheckExamSystem] Stopping camera forcefully')
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      console.log(`  - Found ${tracks.length} tracks to stop`)
      tracks.forEach((track) => {
        console.log(
          `  - Stopping ${track.kind} track (state: ${track.readyState})`
        )
        track.stop()
        console.log(`  - After stop: ${track.readyState}`)
      })
      streamRef.current = null
    } else {
      console.log('  - No stream ref found')
    }

    if (videoRef.current) {
      console.log('  - Clearing video element')
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.load()
    }
    console.log('✅ [CheckExamSystem] Camera stop completed')
  }

  const handleRetry = () => {
    setCameraChecked(false)
    setDisplayChecked(false)
    dispatch(setError(null))
    dispatch(setSystemCheckPassed(false))

    stopCamera()
    performSystemChecks()
  }

  const handleNext = async () => {
    // Stop camera trước khi navigate
    console.log('🚀 [CheckExamSystem] Navigating to next screen...')
    stopCamera()

    // Đợi một chút để đảm bảo camera đã stop
    await new Promise((resolve) => setTimeout(resolve, 300))

    dispatch(setSystemCheckPassed(true))

    if (examConfig.requireIdentityVerification) {
      navigate('/identity-verification')
    } else {
      navigate('/exam-checkin/ready')
    }
  }

  const canProceed = () => {
    const cameraPass =
      !examConfig.requireCammera || systemCheck.cameraPermission === 'granted'
    const displayPass =
      !examConfig.requireExtendedDisplayCheck ||
      systemCheck.displayPermission === 'granted'
    return cameraPass && displayPass && cameraChecked && displayChecked
  }

  return (
    <Container>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <MainCard>
          <Header>
            <Title level={2} style={{ marginBottom: 8 }}>
              Kiểm tra hệ thống
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Vui lòng cho phép truy cập các thiết bị cần thiết để tiếp tục
            </Text>
          </Header>

          {isChecking && (!cameraChecked || !displayChecked) && (
            <Alert
              message={
                <Space>
                  <Spin size="small" />
                  <span>Đang kiểm tra hệ thống...</span>
                </Space>
              }
              type="info"
              showIcon={false}
              style={{ marginBottom: 24 }}
            />
          )}

          {/* Camera Check */}
          {examConfig.requireCammera && (
            <CheckItemCard
              status={systemCheck.cameraPermission}
              bordered={false}
            >
              <CheckItemHeader>
                <CheckItemContent>
                  <IconWrapper color="#1890ff">
                    <CameraOutlined />
                  </IconWrapper>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Camera
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      Camera sẽ được sử dụng để giám sát trong quá trình làm bài
                      thi. Đảm bảo khuôn mặt của bạn luôn nằm trong khung hình.
                    </Paragraph>
                  </div>
                </CheckItemContent>
                <StatusWrapper>
                  {renderStatus(systemCheck.cameraPermission)}
                </StatusWrapper>
              </CheckItemHeader>

              {systemCheck.cameraPermission === 'granted' && (
                <VideoPreview>
                  <video ref={videoRef} autoPlay playsInline muted />
                  <LiveIndicator>Camera đang hoạt động</LiveIndicator>
                </VideoPreview>
              )}

              {systemCheck.cameraPermission === 'denied' && (
                <Alert
                  message="Không thể truy cập camera"
                  description={
                    <div>
                      <p>Vui lòng kiểm tra:</p>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>Camera đã được kết nối với máy tính</li>
                        <li>Trình duyệt đã được cấp quyền truy cập camera</li>
                        <li>Không có ứng dụng nào khác đang sử dụng camera</li>
                      </ul>
                    </div>
                  }
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginTop: 16 }}
                />
              )}
            </CheckItemCard>
          )}

          {/* Display Check */}
          {examConfig.requireExtendedDisplayCheck && (
            <CheckItemCard
              status={systemCheck.displayPermission}
              bordered={false}
            >
              <CheckItemHeader>
                <CheckItemContent>
                  <IconWrapper color="#722ed1">
                    <MonitorOutlined />
                  </IconWrapper>
                  <div style={{ flex: 1 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                      Màn hình hiển thị
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {examConfig.allowedExtendDisplays === 0
                        ? 'Không được sử dụng màn hình mở rộng trong quá trình thi.'
                        : `Chỉ được sử dụng tối đa ${examConfig.allowedExtendDisplays} màn hình mở rộng.`}
                    </Paragraph>
                  </div>
                </CheckItemContent>
                <StatusWrapper>
                  {renderStatus(systemCheck.displayPermission)}
                </StatusWrapper>
              </CheckItemHeader>

              {systemCheck.displayPermission === 'denied' && (
                <Alert
                  message="Phát hiện màn hình mở rộng"
                  description="Vui lòng ngắt kết nối tất cả các màn hình phụ và chỉ sử dụng màn hình chính."
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginTop: 16 }}
                />
              )}
            </CheckItemCard>
          )}

          {/* Success Message */}
          {canProceed() && (
            <Alert
              message="Kiểm tra hệ thống thành công!"
              description="Tất cả các thiết bị đã sẵn sàng. Bạn có thể tiếp tục sang bước tiếp theo."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          {/* Action Buttons */}
          <Footer>
            <Button size="large" onClick={() => navigate('/exam-checkin')}>
              Quay lại
            </Button>

            {(systemCheck.cameraPermission === 'denied' ||
              systemCheck.displayPermission === 'denied') && (
              <Button
                type="default"
                size="large"
                onClick={handleRetry}
                loading={isChecking}
              >
                Thử lại
              </Button>
            )}

            {canProceed() && (
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
              >
                Tiếp tục
              </Button>
            )}
          </Footer>
        </MainCard>

        <ExamCodeFooter>
          Mã bài thi: <strong>{takeExamSession.examCode}</strong>
        </ExamCodeFooter>
      </div>
    </Container>
  )
}

const renderStatus = (status?: string) => {
  switch (status) {
    case 'granted':
      return (
        <>
          <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <Text strong style={{ color: '#52c41a' }}>
            Đã kiểm tra
          </Text>
        </>
      )
    case 'denied':
      return (
        <>
          <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
          <Text strong style={{ color: '#ff4d4f' }}>
            Thất bại
          </Text>
        </>
      )
    case 'pending':
      return (
        <>
          <Spin size="small" />
          <Text strong style={{ color: '#1890ff' }}>
            Đang kiểm tra
          </Text>
        </>
      )
    default:
      return (
        <>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid #d9d9d9',
            }}
          />
          <Text type="secondary">Chờ kiểm tra</Text>
        </>
      )
  }
}

export default CheckExamSystem
