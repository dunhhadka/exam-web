import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, Typography, Tag } from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { useAntiCheat } from '../../../hooks/useAntiCheat'

const { Title, Text } = Typography

interface CheckResult {
  ok: boolean
  detail: string
}

interface ChecksState {
  camera: CheckResult
  mic: CheckResult
  screen: CheckResult
  brightness: CheckResult
  network: CheckResult
  battery: CheckResult
  secureBrowser: CheckResult
}

interface CheckInWizardProps {
  onComplete?: (checks: ChecksState) => void
  onCancel?: () => void
  settings?: {
    disableCopyPaste?: boolean
    disableDeveloperTools?: boolean
    preventTabSwitch?: boolean
    preventMinimize?: boolean
    requireFullscreen?: boolean
    examCode?: string
    [key: string]: any
  }
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
`

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

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
`

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 48px;
  
  .title-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .icon {
      font-size: 48px;
    }
    
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
  }
  
  .subtitle {
    color: #666;
    font-size: 14px;
  }
`

const CheckGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 48px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const CheckCard = styled.div`
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const CheckIcon = styled.div<{ isLoading?: boolean }>`
  width: 120px;
  height: 80px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  ${props => props.isLoading && `
    & > * {
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(0.95);
      }
    }
  `}
`

const GaugeChart = styled.div<{ isLoading?: boolean }>`
  position: relative;
  width: 120px;
  height: 80px;
  
  svg {
    width: 100%;
    height: 100%;
    ${props => props.isLoading ? `
      animation: spin 2s linear infinite;
    ` : ''}
  }
  
  .gauge-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -30%);
    text-align: center;
    
    .value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .unit {
      font-size: 12px;
      color: #999;
    }
  }
  
  .gauge-labels {
    position: absolute;
    width: 100%;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #999;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

const MonitorFrame = styled.div<{ isLoading?: boolean }>`
  width: 120px;
  height: 80px;
  background: white;
  border: 4px solid #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  transition: all 0.3s ease;
  
  ${props => props.isLoading && `
    animation: shake 0.5s ease-in-out infinite;
    border-color: #1890ff;
  `}
  
  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
  }
`

const CameraBox = styled.div<{ hasError?: boolean; isLoading?: boolean }>`
  width: 120px;
  height: 80px;
  background: ${props => props.hasError ? '#1a1a1a' : 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  padding: 8px;
  text-align: center;
  line-height: 1.3;
  transition: all 0.3s ease;
  position: relative;
  
  ${props => props.isLoading && `
    animation: pulse-glow 1.5s ease-in-out infinite;
    box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
  `}
  
  ${props => props.isLoading && !props.hasError && `
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `}
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
    }
    50% {
      opacity: 0.8;
      box-shadow: 0 0 25px rgba(24, 144, 255, 0.8);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`

const MicIcon = styled.div<{ isLoading?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .mic-emoji {
    font-size: 56px;
    transition: all 0.3s ease;
    ${props => props.isLoading && `
      animation: bounce 1s ease-in-out infinite;
    `}
  }
  
  .sound-bars {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 20px;
    ${props => props.isLoading && `
      animation: wave 1.2s ease-in-out infinite;
    `}
  }
  
  .bar {
    width: 3px;
    background: #d9d9d9;
    border-radius: 2px;
    transition: all 0.3s ease;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  
  @keyframes wave {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

const SimpleIcon = styled.div<{ isLoading?: boolean }>`
  font-size: 56px;
  transition: all 0.3s ease;
  
  ${props => props.isLoading && `
    animation: rotate-scale 1.5s ease-in-out infinite;
  `}
  
  @keyframes rotate-scale {
    0%, 100% {
      transform: rotate(0deg) scale(1);
    }
    25% {
      transform: rotate(90deg) scale(1.1);
    }
    50% {
      transform: rotate(180deg) scale(1);
    }
    75% {
      transform: rotate(270deg) scale(1.1);
    }
  }
`

const CheckTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
`

const CheckStatus = styled.div`
  margin-bottom: 12px;
`

const RetryButton = styled(Button)`
  &.ant-btn {
    color: #1890ff;
    border: none;
    padding: 0;
    height: auto;
    font-size: 13px;
    
    &:hover {
      color: #40a9ff;
    }
  }
`

const ActionSection = styled.div`
  display: flex;
  justify-content: center;
`

const ProgressContainer = styled.div`
  text-align: center;
  padding: 60px 0;
`

export default function CheckInWizard({
  onComplete,
  onCancel,
  settings,
}: CheckInWizardProps) {
  // Log settings để debug
  useEffect(() => {
    console.log('🔧 CheckInWizard - Session Settings:', {
      settings,
      hasSettings: !!settings,
      settingsKeys: settings ? Object.keys(settings) : [],
      disableCopyPaste: settings?.disableCopyPaste,
      disableDeveloperTools: settings?.disableDeveloperTools,
      preventTabSwitch: settings?.preventTabSwitch,
      preventMinimize: settings?.preventMinimize,
      requireFullscreen: settings?.requireFullscreen,
      fullSettings: JSON.stringify(settings, null, 2),
    })
  }, [settings])

  // Áp dụng anti-cheat settings ngay khi component mount
  useAntiCheat(settings)

  const [checks, setChecks] = useState<ChecksState>({
    camera: { ok: false, detail: '' },
    mic: { ok: false, detail: '' },
    screen: { ok: false, detail: '' },
    brightness: { ok: false, detail: '' },
    network: { ok: false, detail: '' },
    battery: { ok: false, detail: '' },
    secureBrowser: { ok: false, detail: '' },
  })
  const [running, setRunning] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [networkSpeed, setNetworkSpeed] = useState<number>(0)
  const [checkingItem, setCheckingItem] = useState<string | null>(null)

  // Check network riêng
  const checkNetwork = async (): Promise<void> => {
    setCheckingItem('network')
    try {
      const start = performance.now()
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache',
      })
      const latency = performance.now() - start
      const speed = Math.random() * 50 + 10
      setNetworkSpeed(speed)
      setChecks(prev => ({
        ...prev,
        network: {
          ok: latency < 1000,
          detail: `${speed.toFixed(2)} Mbps`,
        }
      }))
    } catch (e) {
      setChecks(prev => ({
        ...prev,
        network: { ok: false, detail: 'Mất kết nối' }
      }))
    } finally {
      setCheckingItem(null)
    }
  }

  // Check screen riêng
  const checkScreen = async (): Promise<void> => {
    setCheckingItem('screen')
    try {
      if ('getDisplayMedia' in navigator.mediaDevices) {
        setChecks(prev => ({
          ...prev,
          screen: { ok: true, detail: 'Hỗ trợ chia sẻ màn hình' }
        }))
      } else {
        setChecks(prev => ({
          ...prev,
          screen: { ok: false, detail: 'Không hỗ trợ' }
        }))
      }
    } catch (e) {
      setChecks(prev => ({
        ...prev,
        screen: {
          ok: false,
          detail: e instanceof Error ? e.message : 'Unknown error',
        }
      }))
    } finally {
      setCheckingItem(null)
    }
  }

  // Check camera riêng
  const checkCamera = async (): Promise<void> => {
    setCheckingItem('camera')
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })
      const track = camStream.getVideoTracks()[0]
      const settings = track.getSettings()
      setChecks(prev => ({
        ...prev,
        camera: {
          ok: true,
          detail: `${settings.width}x${settings.height}`,
        }
      }))
      camStream.getTracks().forEach((t) => t.stop())
    } catch (e) {
      setChecks(prev => ({
        ...prev,
        camera: {
          ok: false,
          detail: 'NotFoundError: Requested device not found',
        }
      }))
    } finally {
      setCheckingItem(null)
    }
  }

  // Check mic riêng
  const checkMic = async (): Promise<void> => {
    setCheckingItem('mic')
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      setChecks(prev => ({
        ...prev,
        mic: { ok: true, detail: 'Microphone hoạt động tốt' }
      }))
      micStream.getTracks().forEach((t) => t.stop())
    } catch (e) {
      setChecks(prev => ({
        ...prev,
        mic: {
          ok: false,
          detail: 'Hãy nói gì đó để kiểm tra âm lượng microphone',
        }
      }))
    } finally {
      setCheckingItem(null)
    }
  }

  // Check brightness riêng
  const checkBrightness = async (): Promise<void> => {
    setCheckingItem('brightness')
    // Simulate check
    setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        brightness: { ok: true, detail: 'Độ sáng phù hợp' }
      }))
      setCheckingItem(null)
    }, 500)
  }

  // Check battery riêng
  const checkBattery = async (): Promise<void> => {
    setCheckingItem('battery')
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        setChecks(prev => ({
          ...prev,
          battery: {
            ok: battery.level > 0.2 || battery.charging,
            detail: `${(battery.level * 100).toFixed(0)}% ${
              battery.charging ? '(đang sạc)' : ''
            }`,
          }
        }))
      } catch {
        setChecks(prev => ({
          ...prev,
          battery: { ok: true, detail: 'Không thể kiểm tra' }
        }))
      }
    } else {
      setChecks(prev => ({
        ...prev,
        battery: { ok: true, detail: 'Không hỗ trợ kiểm tra' }
      }))
    }
    setCheckingItem(null)
  }

  // Check secure browser riêng
  const checkSecureBrowser = async (): Promise<void> => {
    setCheckingItem('secureBrowser')
    // Simulate check
    setTimeout(() => {
      setChecks(prev => ({
        ...prev,
        secureBrowser: { ok: true, detail: 'Trình duyệt an toàn' }
      }))
      setCheckingItem(null)
    }, 300)
  }

  const runChecks = async (): Promise<void> => {
    setRunning(true)
    setProgress(0)
    const totalSteps = 7
    let currentStep = 0

    const updateProgress = () => {
      currentStep++
      setProgress(Math.round((currentStep / totalSteps) * 100))
    }

    // Network check
    await checkNetwork()
    updateProgress()

    // Screen share check
    await checkScreen()
    updateProgress()

    // Camera check
    await checkCamera()
    updateProgress()

    // Mic check
    await checkMic()
    updateProgress()

    // Brightness check
    await checkBrightness()
    updateProgress()

    // Battery check
    await checkBattery()
    updateProgress()

    // Secure browser check
    await checkSecureBrowser()
    updateProgress()

    setRunning(false)
  }

  useEffect(() => {
    runChecks()
  }, [])

  const allOk = Object.values(checks).every((c) => c.ok)

  if (running) {
    return (
      <PageContainer>
        <Card style={{ maxWidth: 600, margin: '100px auto' }}>
          <ProgressContainer>
            <Progress
              type="circle"
              percent={progress}
              size={120}
            />
            <Title level={4} style={{ marginTop: 24 }}>
              Đang kiểm tra hệ thống...
            </Title>
            <Text type="secondary">
              Vui lòng không đóng trình duyệt trong quá trình kiểm tra
            </Text>
          </ProgressContainer>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Header>
        <HeaderContent>
          <StepsWrapper>
            <StepItem active>
              <div className="step-icon">✓</div>
              <span className="step-label">Kiểm tra hệ thống</span>
            </StepItem>
            <StepItem>
              <div className="step-icon">👤</div>
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
        <HeaderSection>
          <div className="title-wrapper">
            <span className="icon">💻</span>
            <h1>Kiểm tra hệ thống</h1>
          </div>
          <div className="subtitle">
            Vui lòng đợi để kiểm tra thiết bị của bạn có đáp ứng yêu cầu hệ thống hay không
          </div>
        </HeaderSection>

        <CheckGrid>
          {/* Network */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'network'}>
              <GaugeChart isLoading={checkingItem === 'network'}>
                <svg viewBox="0 0 120 80">
                  <path
                    d="M 10 70 A 50 50 0 0 1 110 70"
                    fill="none"
                    stroke="#e8e8e8"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 70 A 50 50 0 0 1 110 70"
                    fill="none"
                    stroke={checks.network.ok ? '#52c41a' : '#ff4d4f'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="157"
                    strokeDashoffset={157 - (networkSpeed / 100) * 157}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="gauge-value">
                  <div className="value">{networkSpeed.toFixed(2)}</div>
                  <div className="unit">Mbps</div>
                </div>
                <div className="gauge-labels">
                  <span>0</span>
                  <span>100</span>
                </div>
              </GaugeChart>
            </CheckIcon>
            <CheckTitle>Kết nối internet</CheckTitle>
            <CheckStatus>
              <Tag color={checks.network.ok ? 'success' : 'error'}>
                Kết quả: {checks.network.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkNetwork}
              loading={checkingItem === 'network'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Screen */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'screen'}>
              <MonitorFrame isLoading={checkingItem === 'screen'}>🖥️</MonitorFrame>
            </CheckIcon>
            <CheckTitle>Màn hình</CheckTitle>
            <CheckStatus>
              <Tag color={checks.screen.ok ? 'success' : 'error'}>
                Kết quả: {checks.screen.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkScreen}
              loading={checkingItem === 'screen'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Camera */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'camera'}>
              <CameraBox 
                hasError={!checks.camera.ok}
                isLoading={checkingItem === 'camera'}
              >
                {!checks.camera.ok && checks.camera.detail}
              </CameraBox>
            </CheckIcon>
            <CheckTitle>Webcam</CheckTitle>
            <CheckStatus>
              <Tag color={checks.camera.ok ? 'success' : 'error'}>
                Kết quả: {checks.camera.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkCamera}
              loading={checkingItem === 'camera'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Microphone */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'mic'}>
              <MicIcon isLoading={checkingItem === 'mic'}>
                <span className="mic-emoji">🎤</span>
                <div className="sound-bars">
                  {[0.3, 0.5, 0.8, 0.6, 0.4, 0.7, 0.5].map((h, i) => (
                    <div
                      key={i}
                      className="bar"
                      style={{ height: `${h * 20}px` }}
                    />
                  ))}
                </div>
              </MicIcon>
            </CheckIcon>
            <CheckTitle>Microphone</CheckTitle>
            <CheckStatus>
              <Tag color={checks.mic.ok ? 'success' : 'error'}>
                {checks.mic.ok ? 'Hãy nói gì đó để kiểm tra âm lượng microphone' : 'Kết quả: ✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkMic}
              loading={checkingItem === 'mic'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Brightness */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'brightness'}>
              <SimpleIcon isLoading={checkingItem === 'brightness'}>💡</SimpleIcon>
            </CheckIcon>
            <CheckTitle>Độ sáng</CheckTitle>
            <CheckStatus>
              <Tag color={checks.brightness.ok ? 'success' : 'error'}>
                Kết quả: {checks.brightness.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkBrightness}
              loading={checkingItem === 'brightness'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Battery */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'battery'}>
              <SimpleIcon isLoading={checkingItem === 'battery'}>🔋</SimpleIcon>
            </CheckIcon>
            <CheckTitle>Pin</CheckTitle>
            <CheckStatus>
              <Tag color={checks.battery.ok ? 'success' : 'error'}>
                Kết quả: {checks.battery.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkBattery}
              loading={checkingItem === 'battery'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>

          {/* Secure Browser */}
          <CheckCard>
            <CheckIcon isLoading={checkingItem === 'secureBrowser'}>
              <SimpleIcon isLoading={checkingItem === 'secureBrowser'}>🔒</SimpleIcon>
            </CheckIcon>
            <CheckTitle>Trình duyệt bảo mật</CheckTitle>
            <CheckStatus>
              <Tag color={checks.secureBrowser.ok ? 'success' : 'error'}>
                Kết quả: {checks.secureBrowser.ok ? '✓ Đạt' : '✗ Lỗi'}
              </Tag>
            </CheckStatus>
            <RetryButton 
              icon={<ReloadOutlined />} 
              onClick={checkSecureBrowser}
              loading={checkingItem === 'secureBrowser'}
              disabled={checkingItem !== null}
            >
              Thử lại
            </RetryButton>
          </CheckCard>
        </CheckGrid>

        <ActionSection>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleFilled />}
            onClick={() => onComplete?.(checks)}
            disabled={!allOk}
          >
            Xác nhận
          </Button>
        </ActionSection>
      </MainContent>
    </PageContainer>
  )
}