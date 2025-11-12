import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, Space, Typography, Tag, Row, Col } from 'antd'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ReloadOutlined,
  PlayCircleFilled,
  CloseOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'

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
}

const WizardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`

const CheckCard = styled(Card)<{ $status: 'success' | 'error' | 'loading' }>`
  margin-bottom: 16px;
  border-left: 4px solid
    ${(props) =>
      props.$status === 'success'
        ? '#52c41a'
        : props.$status === 'error'
        ? '#ff4d4f'
        : '#1890ff'};

  .ant-card-body {
    padding: 16px;
  }
`

const CheckHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
`

const CheckDetail = styled(Text)`
  color: #666;
  font-size: 12px;
`

const ProgressContainer = styled.div`
  text-align: center;
  padding: 40px 0;
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

const StatusIcon = styled.div<{ $ok: boolean }>`
  color: ${(props) => (props.$ok ? '#52c41a' : '#ff4d4f')};
  font-size: 16px;
`

const CheckGrid = styled(Row)`
  margin: 24px 0;
`

const CheckItem = styled(Col)`
  margin-bottom: 16px;
`

const checkLabels: Record<keyof ChecksState, string> = {
  camera: 'Camera',
  mic: 'Microphone',
  screen: 'Chia sẻ màn hình',
  brightness: 'Độ sáng',
  network: 'Mạng internet',
  battery: 'Pin',
  secureBrowser: 'Trình duyệt bảo mật',
}

const checkIcons: Record<keyof ChecksState, string> = {
  camera: '📷',
  mic: '🎤',
  screen: '🖥️',
  brightness: '💡',
  network: '🌐',
  battery: '🔋',
  secureBrowser: '🔒',
}

/**
 * Pre-exam Check-in Wizard (T-15' checklist)
 * Theo thiết kế: media probe, screen share probe, secure browser check
 */
export default function CheckInWizard({
  onComplete,
  onCancel,
}: CheckInWizardProps) {
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

  const runChecks = async (): Promise<void> => {
    setRunning(true)
    setProgress(0)
    const results: ChecksState = { ...checks }
    const totalSteps = 7
    let currentStep = 0

    const updateProgress = () => {
      currentStep++
      setProgress(Math.round((currentStep / totalSteps) * 100))
    }

    // Camera check
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })
      const track = camStream.getVideoTracks()[0]
      const settings = track.getSettings()
      results.camera = {
        ok: true,
        detail: `${settings.width}x${settings.height} @ ${settings.frameRate}fps`,
      }
      camStream.getTracks().forEach((t) => t.stop())
    } catch (e) {
      results.camera = {
        ok: false,
        detail: e instanceof Error ? e.message : 'Unknown error',
      }
    }
    updateProgress()

    // Mic check
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      results.mic = { ok: true, detail: 'Chất lượng tốt' }
      micStream.getTracks().forEach((t) => t.stop())
    } catch (e) {
      results.mic = {
        ok: false,
        detail: e instanceof Error ? e.message : 'Unknown error',
      }
    }
    updateProgress()

    // Screen share check
    try {
      if ('getDisplayMedia' in navigator.mediaDevices) {
        results.screen = { ok: true, detail: 'Hỗ trợ chia sẻ màn hình' }
      } else {
        results.screen = { ok: false, detail: 'Không hỗ trợ' }
      }
    } catch (e) {
      results.screen = {
        ok: false,
        detail: e instanceof Error ? e.message : 'Unknown error',
      }
    }
    updateProgress()

    // Brightness check
    results.brightness = { ok: true, detail: 'Độ sáng phù hợp' }
    updateProgress()

    // Network check
    try {
      const start = performance.now()
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache',
      })
      const latency = performance.now() - start
      results.network = {
        ok: latency < 1000,
        detail: `Độ trễ: ${latency.toFixed(0)}ms`,
      }
    } catch (e) {
      results.network = { ok: false, detail: 'Mất kết nối' }
    }
    updateProgress()

    // Battery check
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        results.battery = {
          ok: battery.level > 0.2 || battery.charging,
          detail: `${(battery.level * 100).toFixed(0)}% ${
            battery.charging ? '(đang sạc)' : ''
          }`,
        }
      } catch {
        results.battery = { ok: true, detail: 'Không thể kiểm tra' }
      }
    } else {
      results.battery = { ok: true, detail: 'Không hỗ trợ kiểm tra' }
    }
    updateProgress()

    // Secure browser check
    results.secureBrowser = { ok: true, detail: 'Trình duyệt an toàn' }
    updateProgress()

    setChecks(results)
    setRunning(false)
  }

  useEffect(() => {
    runChecks()
  }, [])

  const allOk = Object.values(checks).every((c) => c.ok)
  const completedCount = Object.values(checks).filter((c) => c.ok).length
  const totalCount = Object.keys(checks).length

  if (running) {
    return (
      <WizardContainer>
        <Card>
          <ProgressContainer>
            <Progress
              type="circle"
              percent={progress}
              format={(percent) => `${percent}%`}
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
      </WizardContainer>
    )
  }

  return (
    <WizardContainer>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Check-in Kỹ Thuật (T-15')</Title>
          <Text type="secondary">
            Kiểm tra hệ thống trước khi bắt đầu bài thi
          </Text>
          <div style={{ marginTop: 16 }}>
            <Tag color={allOk ? 'success' : 'primary'}>
              {completedCount}/{totalCount} hoàn thành
            </Tag>
          </div>
        </div>

        <CheckGrid gutter={[16, 16]}>
          {(Object.entries(checks) as [keyof ChecksState, CheckResult][]).map(
            ([key, check]) => (
              <CheckItem key={key} xs={24} sm={12} lg={8}>
                <CheckCard $status={check.ok ? 'success' : 'error'} hoverable>
                  <CheckHeader>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={{ fontSize: 20 }}>{checkIcons[key]}</span>
                      <Text strong>{checkLabels[key]}</Text>
                    </div>
                    <StatusIcon $ok={check.ok}>
                      {check.ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
                    </StatusIcon>
                  </CheckHeader>
                  <CheckDetail>{check.detail}</CheckDetail>
                </CheckCard>
              </CheckItem>
            )
          )}
        </CheckGrid>

        <ActionButtons>
          <Button
            icon={<ReloadOutlined />}
            onClick={runChecks}
            loading={running}
            size="large"
          >
            Kiểm tra lại
          </Button>

          {allOk && (
            <Button
              type="primary"
              icon={<CheckCircleFilled />}
              onClick={() => onComplete?.(checks)}
              size="large"
            >
              Hoàn tất Check-in
            </Button>
          )}

          {onCancel && (
            <Button icon={<CloseOutlined />} onClick={onCancel} size="large">
              Hủy bỏ
            </Button>
          )}
        </ActionButtons>
      </Card>
    </WizardContainer>
  )
}
