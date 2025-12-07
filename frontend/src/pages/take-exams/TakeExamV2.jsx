import React, { useEffect, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'
import { useParams } from 'react-router-dom'
import { SignalingClient } from '../take-exams/js/signaling'
import { createPeer, addLocalStream, createAndSetOffer, setRemoteDescription } from '../take-exams/js/webrtc'
import { RecordingService } from '../take-exams/js/recording'
import { useSelector } from 'react-redux'
import TakeExamContent, { CheatLevelAutoSubmit } from './ExamContent'
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
  Modal,
  FloatButton,
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
import { useToast } from '../../hooks/useToast'
import { set } from 'react-hook-form'

const SIGNALING_BASE = (
  // import.meta.env.VITE_SIGNALING_URL || 
  'http://localhost:8000')

// Styled Components
const CandidateContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 75% 25%;
  gap: 24px;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 200px);

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`

const ExamSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
`

const MonitoringSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
`

const VideoCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
  }
`

const VideoContainer = styled.div`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: ${props => props.$isScreen ? '200px' : '250px'};
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

const AudioLevel = styled.div`
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.$level * 100}%;
    height: 100%;
    background: ${props => props.$muted ? '#666' : '#52c41a'};
    transition: width 0.1s;
  }
`

const StatusBadge = styled.div`
  padding: 4px 12px;
  background: ${props => 
    props.$status === 'connected' ? '#52c41a' : 
    props.$status === 'recording' ? '#ff4d4f' : '#faad14'};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
`

const AIStatusPanel = styled(Card)`
  border-left: 4px solid ${props => props.$hasAlerts ? '#faad14' : '#52c41a'};
  background: ${props => props.$hasAlerts ? '#fffbe6' : '#f6ffed'};

  .ant-card-body {
    padding: 16px;
  }
`

const ChatModal = styled(Modal)`
  .ant-modal-body {
    padding: 0;
  }
`

const MessageList = styled.div`
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
`

const MessageItem = styled.div`
  margin-bottom: 8px;
  padding: 8px 12px;
  background: ${props => props.$isOwn ? '#e6f7ff' : '#f5f5f5'};
  border-radius: 8px;
  border: 1px solid ${props => props.$isOwn ? '#91d5ff' : '#d9d9d9'};

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

export default function Candidate() {
  const { userId, takeExamSession } = useSelector(
    (state) => state.takeExam
  )

  const roomId = takeExamSession.examCode
  const [connected, setConnected] = useState(false)
  const [chat, setChat] = useState('')
  const [msgs, setMsgs] = useState([])
  const [checklist, setChecklist] = useState({ cam: false, screen: false, oneDisplay: false, noHeadset: false })
  const [kycComplete, setKycComplete] = useState(true)
  const [checkInComplete, setCheckInComplete] = useState(true)
  const [recording, setRecording] = useState(false)
  const [micMuted, setMicMuted] = useState(false)
  const [camEnabled, setCamEnabled] = useState(true)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiStatus, setAiStatus] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [chatModalVisible, setChatModalVisible] = useState(false)

  const recordingServiceRef = useRef(new RecordingService())
  const cameraStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)

  const localVideoRef = useRef(null)
  const screenVideoRef = useRef(null)
  const canvasRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const sigRef = useRef(null)
  const dcRef = useRef(null)
  const detectionRef = useRef({ running: false })

  const [cheatLevel, setCheatLevel] = useState({level: "none", message: ""});

  const [autoSubmitCheatVisible, setAutoSubmitCheatVisible] = useState(false);

  console.log('Render Candidate Component - cheatLevel:', cheatLevel, autoSubmitCheatVisible);

  const toast = useToast()

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
          await new Promise(resolve => setTimeout(resolve, 100))
          retries++
        }
        if (!localVideoRef.current) {
          throw new Error('Video element not ready')
        }

        const signaling = new SignalingClient({ baseUrl: SIGNALING_BASE, roomId, userId, role: 'candidate' })
        sigRef.current = signaling
        
        signaling.on('answer', async (data) => {
          if (data.to && data.to !== userId && data.from !== 'server') return
          if (pcRef.current) {
            console.log('Received answer from:', data.from)
            await setRemoteDescription(pcRef.current, data.sdp)
          }
        })
        signaling.on('ice', async (data) => {
          if (data.to && data.to !== userId) return
          if (pcRef.current) {
            try { await pcRef.current.addIceCandidate(data.candidate) } catch (e) {
              console.warn('ICE candidate error:', e)
            }
          }
        })
        signaling.on('control', (data) => {
          if (data.to && data.to !== userId) return
          if (pcRef.current) {
            if (data.action === 'pause') {
              pcRef.current.getSenders().forEach(s => s.track && (s.track.enabled = false))
              alert('Phiên tạm dừng bởi giám thị')
            } else if (data.action === 'end') {
              try { pcRef.current.close() } catch {}
              alert('Phiên kết thúc bởi giám thị')
            }
          }
        })
        signaling.on('chat', (data) => {
          setMsgs(m => [...m, { from: data.from, text: data.text }])
        })
        
        signaling.on('ai_analysis', (data) => {
          console.log('[Candidate] AI Analysis received:', data)
          console.log('[Candidate] Current userId:', userId, 'Data candidate_id:', data.data?.candidate_id)
          
          if (data.data?.candidate_id === userId && cheatLevel.level !== CheatLevelAutoSubmit) {
            console.log('[Candidate] ✅ Processing AI analysis for this candidate')
            setAiStatus(data.data)
            
            if (data.data?.analyses) {
              const alerts = data.data.analyses
                .filter(a => a.result?.alert)
                .map(a => ({
                  ...a.result.alert,
                  timestamp: data.data.timestamp
                }))
              
              if (alerts.length > 0) {
                console.log('[Candidate] ⚠️ Alerts found:', alerts.length)
                setRecentAlerts(prev => [...alerts, ...prev].slice(0, 5))
                console.log('[Candidate] Recent alerts updated:', alerts)

                const messages = alerts?.map(a => a.message).join(', ') || 'Có hành vi đáng ngờ được phát hiện trong phiên thi.'
                toast.warning(messages)

                if(alerts[0].level === CheatLevelAutoSubmit) {
                  setCheatLevel({level: CheatLevelAutoSubmit, message: alerts[0].message || ''});
                }
              }
            }
          } else {
            console.log('[Candidate] ❌ Skipping - not for this candidate')
          }
        })
        
        signaling.on('close', () => {
          setConnected(false)
        })

        try {
          await signaling.connect()
          console.log('WebSocket connected')
        } catch (error) {
          console.error('Failed to connect to signaling server:', error)
          alert('Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.')
          return
        }

        const { pc, dc } = await createPeer({
          onTrack: (ev) => { 
            const stream = ev.streams?.[0] || new MediaStream([ev.track])
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream
            }
          },
          onIce: (candidate) => signaling.send({ type: 'ice', candidate }),
          onDataMessage: (text) => setMsgs(m => [...m, { from: 'peer', text }])
        })
        pcRef.current = pc
        dcRef.current = dc

        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720, frameRate: 24 },
            audio: { echoCancellation: true, noiseSuppression: true }
          })
        } catch (error) {
          console.error('Failed to get user media:', error)
          alert('Không thể truy cập camera/mic. Vui lòng cấp quyền.')
          return
        }

        cameraStreamRef.current = stream
        setChecklist(c => ({ ...c, cam: true }))
        
        await addLocalStream(pc, stream, 'camera')
        console.log('Added camera stream to PC, senders:', pc.getSenders().map(s => ({
          kind: s.track?.kind,
          id: s.track?.id,
          label: pc._trackLabels?.get(s.track?.id)
        })))

        const cameraSender = pc.getSenders().find(s => {
          if (!s.track || s.track.kind !== 'video') return false
          const label = pc._trackLabels?.get(s.track.id)
          return label === 'camera'
        })
        pcRef.current._cameraSender = cameraSender
        console.log('Camera sender stored:', cameraSender?.track?.id)
        
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          audioContextRef.current = ctx
          analyserRef.current = analyser
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const updateLevel = () => {
            if (analyserRef.current && !micMuted && audioContextRef.current?.state === 'running') {
              analyserRef.current.getByteFrequencyData(dataArray)
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length
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
        
        try {
          recordingServiceRef.current.startRecording(stream, 'camera')
          setRecording(true)
        } catch (e) {
          console.warn('Recording failed:', e)
        }

        const offer = await createAndSetOffer(pc)
        
        const trackInfo = pc.getSenders()
          .filter(s => s.track && s.track.kind === 'video')
          .map((s, index) => ({
            trackId: s.track.id,
            label: pc._trackLabels?.get(s.track.id) || (index === 0 ? 'camera' : 'screen'),
            kind: s.track.kind
          }))
        
        console.log('Created offer, sending to signaling server. Senders:', pc.getSenders().length, 'Track info:', trackInfo)
        signaling.send({ type: 'offer', sdp: offer, trackInfo })
        setConnected(true)
        setLoading(false)
        console.log('Peer connection established, waiting for answer...')
      } catch (error) {
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
        cameraStreamRef.current?.getTracks().forEach(t => t.stop())
        screenStreamRef.current?.getTracks().forEach(t => t.stop())
        audioContextRef.current?.close()
      } catch (e) {
        console.warn('Cleanup error:', e)
      }
    }
  }, [roomId, userId, kycComplete, checkInComplete, cheatLevel])

  useEffect(() => {
    const setupPreview = () => {
      if (cameraStreamRef.current && localVideoRef.current && !loading && connected) {
        const video = localVideoRef.current
        const stream = cameraStreamRef.current
        
        if (video.srcObject !== stream) {
          video.srcObject = stream
          video.muted = true
          
          const handleLoadedMetadata = () => {
            video.play().catch(err => {
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

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        sigRef.current?.send({ type: 'incident', tag: 'A3', level: 'S1', note: 'Tab hidden/blur', ts: Date.now(), by: userId })
      }
    }
    const onBlur = () => sigRef.current?.send({ type: 'incident', tag: 'A3', level: 'S1', note: 'Window blur', ts: Date.now(), by: userId })
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [userId])

  useEffect(() => {
    let rafId
    let noFaceSince = 0
    const FaceDetectorCtor = window.FaceDetector
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
              sigRef.current?.send({ type: 'incident', tag: 'A1', level: 'S2', note: 'Mất khuôn mặt >30s', ts: Date.now(), by: userId })
              noFaceSince = Date.now()
            }
          } else {
            noFaceSince = 0
          }
          if (count > 1) {
            sigRef.current?.send({ type: 'incident', tag: 'A2', level: 'S2', note: `Nhiều khuôn mặt (${count})`, ts: Date.now(), by: userId })
          }
        }
      } catch {}
      rafId = window.setTimeout(loop, 1000)
    }
    loop()
    return () => { detectionRef.current.running = false; window.clearTimeout(rafId) }
  }, [userId])

  useEffect(() => {
    if (!analyserRef.current || micMuted) return
    
    let rafId
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
          sigRef.current?.send({ type: 'incident', tag: 'A6', level: 'S2', note: 'Âm thanh hội thoại kéo dài', ts: Date.now(), by: userId })
          speakingMs = 0
        }
      } else {
        speakingMs = Math.max(0, speakingMs - 400)
      }
      rafId = window.setTimeout(loop, 200)
    }
    loop()
    return () => { window.clearTimeout(rafId) }
  }, [userId, micMuted, analyserRef.current])

  const sendChat = () => {
    if (!chat) return
    sigRef.current?.send({ type: 'chat', text: chat })
    setMsgs(m => [...m, { from: userId, text: chat }])
    setChat('')
  }

  const shareScreen = async () => {
    try {
      if (!pcRef.current) {
        alert('Chưa kết nối với server')
        return
      }

      const display = await navigator.mediaDevices.getDisplayMedia({ 
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: false
      })
      screenStreamRef.current = display
      const screenTrack = display.getVideoTracks()[0]
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = display
        await new Promise((resolve) => {
          if (screenVideoRef.current.readyState >= 2) {
            resolve()
          } else {
            screenVideoRef.current.onloadedmetadata = resolve
          }
        })
      }
      
      let screenSender = pcRef.current.getSenders().find(s => {
        if (!s.track || s.track.kind !== 'video') return false
        const label = pcRef.current._trackLabels?.get(s.track.id)
        return label === 'screen'
      })
      
      if (screenSender) {
        if (pcRef.current._trackLabels) {
          pcRef.current._trackLabels.delete(screenSender.track.id)
          pcRef.current._trackLabels.set(screenTrack.id, 'screen')
        }
        await screenSender.replaceTrack(screenTrack)
      } else {
        await addLocalStream(pcRef.current, display, 'screen')
        screenSender = pcRef.current.getSenders().find(s => {
          if (!s.track || s.track.kind !== 'video') return false
          const label = pcRef.current._trackLabels?.get(s.track.id)
          return label === 'screen'
        })
        pcRef.current._screenSender = screenSender
        
        try {
          console.log('Renegotiating to add screen track. Current senders:', pcRef.current.getSenders().map(s => ({
            kind: s.track?.kind,
            id: s.track?.id,
            label: pcRef.current._trackLabels?.get(s.track?.id)
          })))
          const offer = await createAndSetOffer(pcRef.current)
          
          const trackInfo = pcRef.current.getSenders()
            .filter(s => s.track && s.track.kind === 'video')
            .map((s, index) => ({
              trackId: s.track.id,
              label: pcRef.current._trackLabels?.get(s.track.id) || (index === 0 ? 'camera' : 'screen'),
              kind: s.track.kind
            }))
          
          sigRef.current?.send({ type: 'offer', sdp: offer, trackInfo })
          console.log('Renegotiated to add screen track, offer sent with trackInfo:', trackInfo)
        } catch (e) {
          console.error('Renegotiation failed:', e)
        }
      }
      
      setIsSharingScreen(true)
      setChecklist(c => ({ ...c, screen: true }))
      
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
        setChecklist(c => ({ ...c, screen: false }))
        
        if (screenSender && pcRef.current) {
          try {
            screenTrack.stop()
            await screenSender.replaceTrack(null)
          } catch (e) {
            console.error('Failed to remove screen track:', e)
          }
        }
      }
    } catch (err) {
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
        setChecklist(c => ({ ...c, cam: videoTrack.enabled }))
      }
    }
  }

  return (
    <CandidateContainer>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }}></div>
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

      {!loading && !error && (
        <MainGrid>
          {/* Left Column - Phần làm bài kiểm tra (75%) */}
          <ExamSection>
                      {/* Phần làm bài kiểm tra - ĐÁNH DẤU */}
                      <Card
                        title={
                          <Space>
                            <CheckCircleOutlined />
                            Phần làm Bài Kiểm Tra
                          </Space>
                        }
                        style={{ flex: 1 }}
                      >
                        <TakeExamContent 
                        // cheatLevel={cheatLevel.level} cheatMessage={cheatLevel.message} onCheatAutoSubmit={() => {
                        //   setAutoSubmitCheatVisible(true);
                        // }}
                        cheatDetected={{
                          level: cheatLevel.level,
                          message: cheatLevel.message
                        }}
                        />
                      </Card>
                    </ExamSection>

          {/* Right Column - Tất cả phần camera và giám sát (25%) */}
          <MonitoringSection>
            {/* Camera View */}
            <VideoCard
              title={
                <Space>
                  <VideoCameraOutlined />
                  Camera View
                </Space>
              }
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
                    <div>{loading ? 'Đang tải camera...' : 'Camera đã tắt'}</div>
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
                    icon={camEnabled ? <VideoCameraFilled /> : <VideoCameraOutlined />}
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
                  size="small"
                >
                  {isSharingScreen ? 'Đang chia sẻ' : 'Chia sẻ'}
                </Button>
              }
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
          </MonitoringSection>
        </MainGrid>
      )}

      {/* Floating Chat Button */}
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => setChatModalVisible(true)}
      />

      {/* Chat Modal */}
      <ChatModal
        title="Tin nhắn với giám thị"
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={400}
      >
        <MessageList>
          {msgs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
              <MessageOutlined style={{ fontSize: 24, marginBottom: 8 }} />
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
          <Button type="primary" icon={<MessageOutlined />} onClick={sendChat}>
            Gửi
          </Button>
        </ChatInputContainer>
      </ChatModal>
    </CandidateContainer>
  )
}

// A5 OCR sampling loop
function useScreenOCR({ screenVideoRef, canvasRef, sigRef, userId }) {
  useEffect(() => {
    let timer
    const blacklist = (
      //import.meta.env.VITE_OCR_BLACKLIST ||
       'cheat,answer,google,chatgpt,stack overflow').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
    const run = async () => {
      const video = screenVideoRef.current
      if (!video || !video.srcObject) return
      const canvas = canvasRef.current
      const w = Math.min(1280, video.videoWidth || 1280)
      const h = Math.min(720, video.videoHeight || 720)
      if (!w || !h) return
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, w, h)
      try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'eng')
        const lower = (text || '').toLowerCase()
        if (lower && blacklist.some(k => lower.includes(k))) {
          sigRef.current?.send({ type: 'incident', tag: 'A5', level: 'S2', note: 'OCR match blacklist', ts: Date.now(), by: userId })
        }
      } catch {}
    }
    const loop = () => {
      run()
      timer = window.setTimeout(loop, parseInt(
        //import.meta.env.VITE_OCR_INTERVAL_MS ||
          '6000', 10))
    }
    loop()
    return () => window.clearTimeout(timer)
  }, [screenVideoRef.current])
}