import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Alert,
  Input,
  Space,
  Badge,
  Switch,
  Progress,
  List,
  Statistic,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  MessageOutlined,
  WarningOutlined,
  RobotOutlined,
  EyeOutlined,
  AppstoreOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  VideoCameraFilled,
  AudioMutedOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { RecordingService } from './js/recording'
import { SignalingClient } from './js/signaling'
import {
  addLocalStream,
  createAndSetOffer,
  createPeer,
  setRemoteDescription,
} from './js/webrtc'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { useScreenOCR } from './js/useScreen'

const SIGNALING_BASE =
  //import.meta.env.VITE_SIGNALING_URL ||
  'http://localhost:8000'

interface Checklist {
  cam: boolean
  screen: boolean
  oneDisplay: boolean
  noHeadset: boolean
}

interface Message {
  from: string
  text: string
}

interface Alert {
  message: string
  timestamp: number
  severity?: string
  type?: string
}

interface AIAnalysis {
  result?: {
    alert?: Alert
  }
}

interface AIStatus {
  candidate_id?: string
  timestamp: number
  scenario: string
  analyses?: AIAnalysis[]
}

interface UseScreenOCRParams {
  screenVideoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  sigRef: React.RefObject<{ send: (msg: any) => void } | null>
  userId?: string | null
}

// Extend RTCPeerConnection type to include custom properties
interface ExtendedRTCPeerConnection extends RTCPeerConnection {
  _trackLabels?: Map<string, string>
  _cameraSender?: RTCRtpSender
  _screenSender?: RTCRtpSender
}

// Types (giữ nguyên từ code gốc)
interface Message {
  from: string
  text: string
}

interface Alert {
  message: string
  timestamp: number
  severity?: string
  type?: string
}

interface AIAnalysis {
  result?: {
    alert?: Alert
  }
}

interface AIStatus {
  candidate_id?: string
  timestamp: number
  scenario: string
  analyses?: AIAnalysis[]
}

// Styled Components
const CandidateContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`

const VideoCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
  }
`

const VideoContainer = styled.div<{ $isScreen?: boolean }>`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: ${(props) => (props.$isScreen ? '240px' : '360px')};
  display: flex;
  align-items: center;
  justify-content: center;
`

const VideoPlaceholder = styled.div`
  color: #999;
  text-align: center;
  padding: 20px;

  .anticon {
    font-size: 32px;
    margin-bottom: 8px;
    display: block;
  }
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`

const ControlBar = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
`

const AudioLevel = styled.div<{ $level: number; $muted: boolean }>`
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${(props) => props.$level * 100}%;
    height: 100%;
    background: ${(props) => (props.$muted ? '#666' : '#52c41a')};
    transition: width 0.1s;
  }
`

const StatusBadge = styled.div<{
  $status: 'connected' | 'disconnected' | 'recording'
}>`
  padding: 4px 12px;
  background: ${(props) =>
    props.$status === 'connected'
      ? '#52c41a'
      : props.$status === 'recording'
      ? '#ff4d4f'
      : '#faad14'};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
`

const AIStatusPanel = styled(Card)<{ $hasAlerts: boolean }>`
  border-left: 4px solid
    ${(props) => (props.$hasAlerts ? '#faad14' : '#52c41a')};
  background: ${(props) => (props.$hasAlerts ? '#fffbe6' : '#f6ffed')};

  .ant-card-body {
    padding: 16px;
  }
`

const ChecklistItem = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .anticon {
    color: ${(props) => (props.$checked ? '#52c41a' : '#d9d9d9')};
    font-size: 16px;
  }
`

const ChatPanel = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`

const MessageList = styled.div`
  height: 200px;
  overflow-y: auto;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`

const MessageItem = styled.div<{ $isOwn?: boolean }>`
  margin-bottom: 8px;
  padding: 8px 12px;
  background: ${(props) => (props.$isOwn ? '#e6f7ff' : '#f5f5f5')};
  border-radius: 8px;
  border: 1px solid ${(props) => (props.$isOwn ? '#91d5ff' : '#d9d9d9')};

  .sender {
    font-weight: bold;
    font-size: 12px;
    color: #1890ff;
    margin-bottom: 4px;
  }

  .text {
    font-size: 14px;
  }
`

const ChatInputContainer = styled.div`
  padding: 16px;
  display: flex;
  gap: 8px;
`

// Component chính (giữ nguyên logic, chỉ thay đổi JSX)
export default function Candidate() {
  const { userId, userEmail, takeExamSession } = useSelector(
    (state: RootState) => state.takeExam
  )

  const roomId = takeExamSession.examCode

  const [connected, setConnected] = useState<boolean>(false)
  const [chat, setChat] = useState<string>('')
  const [msgs, setMsgs] = useState<Message[]>([])
  const [checklist, setChecklist] = useState<Checklist>({
    cam: false,
    screen: false,
    oneDisplay: false,
    noHeadset: false,
  })
  const [kycComplete, setKycComplete] = useState<boolean>(true)
  const [checkInComplete, setCheckInComplete] = useState<boolean>(true)
  const [recording, setRecording] = useState<boolean>(false)
  const [micMuted, setMicMuted] = useState<boolean>(false)
  const [camEnabled, setCamEnabled] = useState<boolean>(true)
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])

  const recordingServiceRef = useRef<RecordingService>(new RecordingService())
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<ExtendedRTCPeerConnection | null>(null)
  const sigRef = useRef<SignalingClient | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const detectionRef = useRef<{ running: boolean }>({ running: false })

  // Start OCR loop at component mount (top-level hook usage)
  useScreenOCR({ screenVideoRef, canvasRef, sigRef, userId })

  useEffect(() => {
    // Only init after KYC and check-in complete
    if (!kycComplete || !checkInComplete) {
      return
    }

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        // Wait for refs to be ready
        let retries = 0
        while (!localVideoRef.current && retries < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          retries++
        }
        if (!localVideoRef.current) {
          throw new Error('Video element not ready')
        }

        const signaling = new SignalingClient({
          baseUrl: SIGNALING_BASE,
          roomId: roomId!,
          userId: userId!,
          role: 'candidate',
        })
        sigRef.current = signaling

        signaling.on('answer', async (data: any) => {
          // Accept answer from server (SFU mode) or from proctor (P2P mode)
          if (data.to && data.to !== userId && data.from !== 'server') return

          if (pcRef.current) {
            console.log(
              'Received answer from:',
              data.from,
              'Current state:',
              pcRef.current.signalingState
            )

            // Chỉ set remote description nếu đang trong trạng thái chờ answer
            if (pcRef.current.signalingState === 'have-local-offer') {
              try {
                await setRemoteDescription(pcRef.current, data.sdp)
                console.log('Successfully set remote description')
              } catch (error) {
                console.error('Failed to set remote description:', error)
              }
            } else {
              console.warn(
                'Ignoring answer - wrong signaling state:',
                pcRef.current.signalingState
              )
            }
          }
        })
        signaling.on('ice', async (data: any) => {
          if (data.to && data.to !== userId) return
          if (pcRef.current) {
            try {
              await pcRef.current.addIceCandidate(data.candidate)
            } catch (e) {
              console.warn('ICE candidate error:', e)
            }
          }
        })
        signaling.on('control', (data: any) => {
          if (data.to && data.to !== userId) return
          if (pcRef.current) {
            if (data.action === 'pause') {
              pcRef.current
                .getSenders()
                .forEach((s) => s.track && (s.track.enabled = false))
              alert('Phiên tạm dừng bởi giám thị')
            } else if (data.action === 'end') {
              try {
                pcRef.current.close()
              } catch {}
              alert('Phiên kết thúc bởi giám thị')
            }
          }
        })
        signaling.on('chat', (data: any) => {
          setMsgs((m) => [...m, { from: data.from, text: data.text }])
        })

        // Listen for AI analysis updates
        signaling.on('ai_analysis', (data: any) => {
          console.log('[Candidate] AI Analysis received:', data)
          console.log(
            '[Candidate] Current userId:',
            userId,
            'Data candidate_id:',
            data.data?.candidate_id
          )

          // Only process if this is for current candidate
          if (data.data?.candidate_id === userId) {
            console.log(
              '[Candidate] ✅ Processing AI analysis for this candidate'
            )
            setAiStatus(data.data)

            // If there are alerts, add to recent alerts (keep last 5)
            if (data.data?.analyses) {
              const alerts: Alert[] = data.data.analyses
                .filter((a: AIAnalysis) => a.result?.alert)
                .map((a: AIAnalysis) => ({
                  ...a.result!.alert!,
                  timestamp: data.data.timestamp,
                }))

              if (alerts.length > 0) {
                console.log('[Candidate] ⚠️ Alerts found:', alerts.length)
                setRecentAlerts((prev) => [...alerts, ...prev].slice(0, 5))
              }
            }
          } else {
            console.log('[Candidate] ❌ Skipping - not for this candidate')
          }
        })

        signaling.on('close', () => {
          setConnected(false)
        })

        // Connect to signaling server
        try {
          await signaling.connect()
          console.log('WebSocket connected')
        } catch (error) {
          console.error('Failed to connect to signaling server:', error)
          alert(
            'Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.'
          )
          return
        }

        // Create peer connection
        const { pc, dc } = (await createPeer({
          onTrack: (ev: RTCTrackEvent) => {
            // Handle incoming track from proctor (if any)
            const stream = ev.streams?.[0] || new MediaStream([ev.track])
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream
            }
          },
          onIce: (candidate: RTCIceCandidate) =>
            signaling.send({ type: 'ice', candidate }),
          onDataMessage: (text: string) =>
            setMsgs((m) => [...m, { from: 'peer', text }]),
        })) as { pc: ExtendedRTCPeerConnection; dc: RTCDataChannel }
        pcRef.current = pc
        dcRef.current = dc

        // Get camera + mic stream
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720, frameRate: 24 },
            audio: { echoCancellation: true, noiseSuppression: true },
          })
        } catch (error) {
          console.error('Failed to get user media:', error)
          alert('Không thể truy cập camera/mic. Vui lòng cấp quyền.')
          return
        }

        cameraStreamRef.current = stream
        setChecklist((c) => ({ ...c, cam: true }))

        // Add camera stream to peer connection with label
        await addLocalStream(pc, stream, 'camera')
        console.log(
          'Added camera stream to PC, senders:',
          pc.getSenders().map((s) => ({
            kind: s.track?.kind,
            id: s.track?.id,
            label: pc._trackLabels?.get(s.track?.id ?? ''),
          }))
        )

        // Store camera sender for later use
        const cameraSender = pc.getSenders().find((s) => {
          if (!s.track || s.track.kind !== 'video') return false
          const label = pc._trackLabels?.get(s.track.id)
          return label === 'camera'
        })
        pcRef.current._cameraSender = cameraSender
        console.log('Camera sender stored:', cameraSender?.track?.id)

        // Setup audio level monitoring
        try {
          const ctx = new (window.AudioContext ||
            (window as any).webkitAudioContext)()
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          audioContextRef.current = ctx
          analyserRef.current = analyser

          // Monitor audio level
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const updateLevel = () => {
            if (
              analyserRef.current &&
              !micMuted &&
              audioContextRef.current?.state === 'running'
            ) {
              analyserRef.current.getByteFrequencyData(dataArray)
              const average =
                dataArray.reduce((a, b) => a + b) / dataArray.length
              setAudioLevel(average / 255)
            } else {
              setAudioLevel(0)
            }
            if (audioContextRef.current?.state === 'running') {
              requestAnimationFrame(updateLevel)
            }
          }
          updateLevel()
        } catch (e) {
          console.warn('Audio monitoring failed:', e)
        }

        // Start recording
        try {
          recordingServiceRef.current.startRecording(stream, 'camera')
          setRecording(true)
        } catch (e) {
          console.warn('Recording failed:', e)
        }

        // Create and send offer with track info metadata
        const offer = await createAndSetOffer(pc)

        // Build track info for proctor
        const trackInfo = pc
          .getSenders()
          .filter((s) => s.track && s.track.kind === 'video')
          .map((s, index) => ({
            trackId: s.track!.id,
            label:
              pc._trackLabels?.get(s.track!.id) ||
              (index === 0 ? 'camera' : 'screen'),
            kind: s.track!.kind,
          }))

        console.log(
          'Created offer, sending to signaling server. Senders:',
          pc.getSenders().length,
          'Track info:',
          trackInfo
        )
        signaling.send({ type: 'offer', sdp: offer, trackInfo })
        setConnected(true)
        setLoading(false)
        console.log('Peer connection established, waiting for answer...')
      } catch (error: any) {
        console.error('Init failed:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    init()

    return () => {
      try {
        sigRef.current?.close()
        pcRef.current?.close()
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
        screenStreamRef.current?.getTracks().forEach((t) => t.stop())
        audioContextRef.current?.close()
      } catch (e) {
        console.warn('Cleanup error:', e)
      }
    }
  }, [roomId, userId, kycComplete, checkInComplete])

  // Set camera preview when stream is ready and ref is available
  useEffect(() => {
    const setupPreview = () => {
      if (
        cameraStreamRef.current &&
        localVideoRef.current &&
        !loading &&
        connected
      ) {
        const video = localVideoRef.current
        const stream = cameraStreamRef.current

        if (video.srcObject !== stream) {
          video.srcObject = stream
          video.muted = true

          const handleLoadedMetadata = () => {
            video.play().catch((err) => {
              console.warn('Video play failed:', err)
            })
          }

          if (video.readyState >= 2) {
            handleLoadedMetadata()
          } else {
            video.onloadedmetadata = handleLoadedMetadata
          }

          console.log('Camera preview set')
        }
      }
    }

    setupPreview()
    const timer = setTimeout(setupPreview, 100)

    return () => clearTimeout(timer)
  }, [loading, connected])

  // A3: tab visibility / blur detection
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        sigRef.current?.send({
          type: 'incident',
          tag: 'A3',
          level: 'S1',
          note: 'Tab hidden/blur',
          ts: Date.now(),
          by: userId,
        })
      }
    }
    const onBlur = () =>
      sigRef.current?.send({
        type: 'incident',
        tag: 'A3',
        level: 'S1',
        note: 'Window blur',
        ts: Date.now(),
        by: userId,
      })
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [userId])

  // A1/A2: Basic face detection
  useEffect(() => {
    let rafId: number
    let noFaceSince = 0
    const FaceDetectorCtor = (window as any).FaceDetector
    if (!FaceDetectorCtor) return
    const detector = new FaceDetectorCtor({ fastMode: true })
    detectionRef.current.running = true
    const loop = async () => {
      if (!detectionRef.current.running) return
      try {
        const video = localVideoRef.current
        if (video && video.readyState >= 2) {
          const faces = await detector.detect(video)
          const count = faces?.length || 0
          if (count === 0) {
            if (noFaceSince === 0) noFaceSince = Date.now()
            if (Date.now() - noFaceSince > 30000) {
              sigRef.current?.send({
                type: 'incident',
                tag: 'A1',
                level: 'S2',
                note: 'Mất khuôn mặt >30s',
                ts: Date.now(),
                by: userId,
              })
              noFaceSince = Date.now()
            }
          } else {
            noFaceSince = 0
          }
          if (count > 1) {
            sigRef.current?.send({
              type: 'incident',
              tag: 'A2',
              level: 'S2',
              note: `Nhiều khuôn mặt (${count})`,
              ts: Date.now(),
              by: userId,
            })
          }
        }
      } catch {}
      rafId = window.setTimeout(loop, 1000)
    }
    loop()
    return () => {
      detectionRef.current.running = false
      window.clearTimeout(rafId)
    }
  }, [userId])

  // A6: Voice activity detection
  useEffect(() => {
    if (!analyserRef.current || micMuted) return

    let rafId: number
    let speakingMs = 0
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const loop = () => {
      if (!analyserRef.current || micMuted) return

      analyserRef.current.getByteTimeDomainData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / dataArray.length)
      if (rms > 0.05) {
        speakingMs += 200
        if (speakingMs >= 30000) {
          sigRef.current?.send({
            type: 'incident',
            tag: 'A6',
            level: 'S2',
            note: 'Âm thanh hội thoại kéo dài',
            ts: Date.now(),
            by: userId,
          })
          speakingMs = 0
        }
      } else {
        speakingMs = Math.max(0, speakingMs - 400)
      }
      rafId = window.setTimeout(loop, 200)
    }
    loop()
    return () => {
      window.clearTimeout(rafId)
    }
  }, [userId, micMuted])

  const sendChat = () => {
    if (!chat) return
    sigRef.current?.send({ type: 'chat', text: chat })
    setMsgs((m) => [...m, { from: userId!, text: chat }])
    setChat('')
  }

  const shareScreen = async () => {
    try {
      if (!pcRef.current) {
        alert('Chưa kết nối với server')
        return
      }

      const display = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30,
        } as MediaTrackConstraints,
        audio: false,
      })
      screenStreamRef.current = display
      const screenTrack = display.getVideoTracks()[0]

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = display
        await new Promise<void>((resolve) => {
          if (screenVideoRef.current!.readyState >= 2) {
            resolve()
          } else {
            screenVideoRef.current!.onloadedmetadata = () => resolve()
          }
        })
      }

      let screenSender = pcRef.current.getSenders().find((s) => {
        if (!s.track || s.track.kind !== 'video') return false
        const label = pcRef.current!._trackLabels?.get(s.track.id)
        return label === 'screen'
      })

      if (screenSender) {
        if (pcRef.current._trackLabels) {
          pcRef.current._trackLabels.delete(screenSender.track!.id)
          pcRef.current._trackLabels.set(screenTrack.id, 'screen')
        }
        await screenSender.replaceTrack(screenTrack)
      } else {
        await addLocalStream(pcRef.current, display, 'screen')
        screenSender = pcRef.current.getSenders().find((s) => {
          if (!s.track || s.track.kind !== 'video') return false
          const label = pcRef.current!._trackLabels?.get(s.track.id)
          return label === 'screen'
        })
        pcRef.current._screenSender = screenSender

        try {
          console.log('Renegotiating to add screen track')
          const offer = await createAndSetOffer(pcRef.current)

          const trackInfo = pcRef.current
            .getSenders()
            .filter((s) => s.track && s.track.kind === 'video')
            .map((s, index) => ({
              trackId: s.track!.id,
              label:
                pcRef.current!._trackLabels?.get(s.track!.id) ||
                (index === 0 ? 'camera' : 'screen'),
              kind: s.track!.kind,
            }))

          sigRef.current?.send({ type: 'offer', sdp: offer, trackInfo })
          console.log('Renegotiated, offer sent with trackInfo:', trackInfo)
        } catch (e) {
          console.error('Renegotiation failed:', e)
        }
      }

      setIsSharingScreen(true)
      setChecklist((c) => ({ ...c, screen: true }))

      try {
        recordingServiceRef.current.startRecording(display, 'screen')
      } catch (e) {
        console.warn('Screen recording failed:', e)
      }

      screenTrack.onended = async () => {
        try {
          await recordingServiceRef.current.stopRecording('screen')
        } catch (e) {
          console.warn('Stop screen recording failed:', e)
        }

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = null
        }
        screenStreamRef.current = null
        setIsSharingScreen(false)
        setChecklist((c) => ({ ...c, screen: false }))

        if (screenSender && pcRef.current) {
          try {
            screenTrack.stop()
            await screenSender.replaceTrack(null)
          } catch (e) {
            console.error('Failed to remove screen track:', e)
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.error('Screen share failed:', err)
        alert('Không thể chia sẻ màn hình: ' + err.message)
      }
    }
  }

  const toggleMic = () => {
    if (cameraStreamRef.current) {
      const audioTrack = cameraStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setMicMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleCamera = () => {
    if (cameraStreamRef.current) {
      const videoTrack = cameraStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setCamEnabled(videoTrack.enabled)
        setChecklist((c) => ({ ...c, cam: videoTrack.enabled }))
      }
    }
  }

  return (
    <CandidateContainer>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Phiên Thi Trực Tuyến
            </Typography.Title>
            <Typography.Text type="secondary">
              Thí sinh: {userId} • Phòng thi: {roomId}
            </Typography.Text>
          </div>
          <Space>
            <StatusBadge $status={connected ? 'connected' : 'disconnected'}>
              {connected ? '● Đã kết nối' : '○ Đang kết nối'}
            </StatusBadge>
            {recording && (
              <StatusBadge $status="recording">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'pulse 1s infinite',
                  }}
                ></div>
                Đang ghi hình
              </StatusBadge>
            )}
          </Space>
        </div>
      </Card>

      {error && (
        <Alert
          message="Lỗi kết nối"
          description={
            <div>
              <div>{error}</div>
              <div style={{ marginTop: 8, fontSize: 12 }}>
                Vui lòng đảm bảo backend đang chạy tại {SIGNALING_BASE}
              </div>
            </div>
          }
          type="error"
          action={
            <Button
              size="small"
              danger
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              Tải lại
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {loading && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress type="circle" percent={75} />
            <Typography.Title level={4} style={{ marginTop: 16 }}>
              Đang khởi tạo kết nối...
            </Typography.Title>
            <Typography.Text type="secondary">
              Đang kết nối đến server và khởi động camera/mic
            </Typography.Text>
          </div>
        </Card>
      )}

      {/* AI Monitoring Status Panel */}
      {connected && aiStatus && (
        <AIStatusPanel
          $hasAlerts={recentAlerts.length > 0}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RobotOutlined
              style={{
                fontSize: 24,
                color: recentAlerts.length > 0 ? '#faad14' : '#52c41a',
              }}
            />
            <div style={{ flex: 1 }}>
              <Typography.Text strong>
                Hệ thống AI đang giám sát phiên thi của bạn
              </Typography.Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={recentAlerts.length > 0 ? 'orange' : 'green'}>
                  {aiStatus.scenario === 'normal'
                    ? '✓ Bình thường'
                    : `⚠ ${aiStatus.scenario}`}
                </Tag>
              </div>
            </div>
            {recentAlerts.length > 0 && (
              <Badge
                count={recentAlerts.length}
                style={{ backgroundColor: '#faad14' }}
              />
            )}
          </div>

          {recentAlerts.length > 0 && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #ffe58f',
              }}
            >
              <Typography.Text type="warning" strong>
                Cảnh báo gần đây:
              </Typography.Text>
              <List
                size="small"
                dataSource={recentAlerts.slice(0, 3)}
                renderItem={(alert, idx) => (
                  <List.Item>
                    <Typography.Text type="warning" style={{ fontSize: 12 }}>
                      • {alert.message}
                    </Typography.Text>
                  </List.Item>
                )}
              />
            </div>
          )}
        </AIStatusPanel>
      )}

      {!loading && !error && (
        <MainGrid>
          {/* Left Column */}
          <div>
            {/* Camera View */}
            <VideoCard
              title={
                <Space>
                  <VideoCameraOutlined />
                  Camera View
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <VideoContainer>
                <StyledVideo
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: camEnabled && !loading ? 'block' : 'none',
                    transform: 'scaleX(-1)',
                  }}
                />
                {(!camEnabled || loading) && (
                  <VideoPlaceholder>
                    <VideoCameraOutlined />
                    <div>
                      {loading ? 'Đang tải camera...' : 'Camera đã tắt'}
                    </div>
                  </VideoPlaceholder>
                )}

                <ControlBar>
                  <Button
                    type={micMuted ? 'default' : 'primary'}
                    icon={micMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                    onClick={toggleMic}
                    size="small"
                  >
                    {micMuted ? 'Đã tắt tiếng' : 'Mic'}
                  </Button>

                  <AudioLevel $level={audioLevel} $muted={micMuted} />

                  <Button
                    type={camEnabled ? 'primary' : 'default'}
                    icon={
                      camEnabled ? (
                        <VideoCameraFilled />
                      ) : (
                        <VideoCameraOutlined />
                      )
                    }
                    onClick={toggleCamera}
                    size="small"
                  >
                    {camEnabled ? 'Camera' : 'Đã tắt'}
                  </Button>
                </ControlBar>
              </VideoContainer>
            </VideoCard>

            {/* Screen Share */}
            <VideoCard
              title={
                <Space>
                  <AppstoreOutlined />
                  Chia sẻ màn hình
                </Space>
              }
              extra={
                <Button
                  type={isSharingScreen ? 'default' : 'primary'}
                  icon={<ShareAltOutlined />}
                  onClick={shareScreen}
                  disabled={isSharingScreen}
                >
                  {isSharingScreen ? 'Đang chia sẻ' : 'Chia sẻ màn hình'}
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <VideoContainer $isScreen>
                <StyledVideo
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: isSharingScreen ? 'block' : 'none' }}
                />
                {!isSharingScreen && (
                  <VideoPlaceholder>
                    <AppstoreOutlined />
                    <div>Chưa chia sẻ màn hình</div>
                  </VideoPlaceholder>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </VideoContainer>
            </VideoCard>

            {/* Checklist */}
            <Card
              title={
                <Space>
                  <CheckCircleOutlined />
                  Checklist
                </Space>
              }
            >
              <ChecklistItem $checked={checklist.cam}>
                {checklist.cam ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
                <Typography.Text>Camera rõ mặt, ánh sáng đủ</Typography.Text>
              </ChecklistItem>

              <ChecklistItem $checked={checklist.screen}>
                {checklist.screen ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
                <Typography.Text>Đang chia sẻ màn hình</Typography.Text>
              </ChecklistItem>

              <ChecklistItem $checked={checklist.oneDisplay}>
                {checklist.oneDisplay ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
                <Typography.Text>Chỉ một màn hình</Typography.Text>
              </ChecklistItem>

              <ChecklistItem $checked={checklist.noHeadset}>
                {checklist.noHeadset ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )}
                <Typography.Text>Không sử dụng tai nghe</Typography.Text>
              </ChecklistItem>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Proctor View */}
            <VideoCard
              title={
                <Space>
                  <EyeOutlined />
                  Góc nhìn giám thị
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <VideoContainer $isScreen>
                <StyledVideo ref={remoteVideoRef} autoPlay playsInline />
                {!connected && (
                  <VideoPlaceholder>
                    <EyeOutlined />
                    <div>Chờ kết nối giám thị...</div>
                  </VideoPlaceholder>
                )}
              </VideoContainer>
              <div style={{ marginTop: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Giám thị đang xem:{' '}
                  {isSharingScreen ? 'Màn hình của bạn' : 'Camera của bạn'} + Âm
                  thanh
                </Typography.Text>
              </div>
            </VideoCard>

            {/* Chat Panel */}
            <ChatPanel
              title={
                <Space>
                  <MessageOutlined />
                  Tin nhắn với giám thị
                </Space>
              }
            >
              <MessageList>
                {msgs.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#999',
                      padding: '40px 0',
                    }}
                  >
                    <MessageOutlined
                      style={{ fontSize: 24, marginBottom: 8 }}
                    />
                    <div>Chưa có tin nhắn nào</div>
                  </div>
                ) : (
                  msgs.map((message, index) => (
                    <MessageItem key={index} $isOwn={message.from === userId}>
                      <div className="sender">
                        {message.from === userId ? 'Bạn' : message.from}
                      </div>
                      <div className="text">{message.text}</div>
                    </MessageItem>
                  ))
                )}
              </MessageList>
              <ChatInputContainer>
                <Input
                  value={chat}
                  onChange={(e) => setChat(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  onPressEnter={sendChat}
                />
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  onClick={sendChat}
                >
                  Gửi
                </Button>
              </ChatInputContainer>
            </ChatPanel>
          </div>
        </MainGrid>
      )}
    </CandidateContainer>
  )
}

// Giữ nguyên hook useScreenOCR và các hàm logic khác
