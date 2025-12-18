import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SignalingClient } from '../take-exams/js/signaling'
import { createPeer, addLocalStream, createAndSetAnswer, createAndSetOffer, setRemoteDescription } from '../take-exams/js/webrtc'
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
  Select,
  List,
  Modal,
  FloatButton,
  Avatar,
  Progress,
  Tooltip
} from 'antd'
import {
  MessageOutlined,
  WarningOutlined,
  RobotOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  UserOutlined,
  FilterOutlined,
  LayoutOutlined,
  ClockCircleOutlined,
  SoundOutlined
} from '@ant-design/icons'
import styled from '@emotion/styled'

const SIGNALING_BASE = 'http://localhost:8000'

// Styled Components
const ProctorContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 24px;
  height: calc(100vh - 120px);
`

const CandidatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  overflow-y: auto;
  max-height: 100%;
`

const CandidateCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
  }
  
  border: ${props => props.$selected ? '2px solid #1890ff' : '1px solid #d9d9d9'};
  box-shadow: ${props => props.$selected ? '0 4px 12px rgba(24, 144, 255, 0.2)' : 'none'};
`

const VideoContainer = styled.div`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 180px;
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

const StatusBadge = styled.div`
  padding: 4px 8px;
  background: ${props => 
    props.$status === 'connected' ? '#52c41a' : 
    props.$status === 'warning' ? '#faad14' : 
    '#fa541c'};
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
`

const AIStatusPanel = styled(Card)`
  border-left: 4px solid ${props => props.$hasAlerts ? '#faad14' : '#52c41a'};
  background: ${props => props.$hasAlerts ? '#fffbe6' : '#f6ffed'};
  margin-bottom: 16px;

  .ant-card-body {
    padding: 16px;
  }
`

const IncidentItem = styled.div`
  padding: 12px;
  margin-bottom: 8px;
  border-left: 4px solid ${props => props.$color};
  background: #fafafa;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    background: #f0f0f0;
    transform: translateX(4px);
  }
`

const ControlBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: center;
`

const FocusView = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 2px solid #1890ff;
`

const ChatPanel = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  height: 300px;
  display: flex;
  flex-direction: column;
`

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  padding-right: 8px;
`

const MessageItem = styled.div`
  margin-bottom: 8px;
  padding: 8px 12px;
  background: ${props => props.$isOwn ? '#e6f7ff' : '#f5f5f5'};
  border-radius: 8px;
  border: 1px solid ${props => props.$isOwn ? '#91d5ff' : '#d9d9d9'};
`

// Component để render video với auto-update khi stream thay đổi
function CandidateVideo({ candidateId, stream, type, videoRefsRef, style }) {
  const videoRef = useRef(null)
  
  useEffect(() => {
    if (!videoRefsRef.current.has(candidateId)) {
      videoRefsRef.current.set(candidateId, {})
    }
    const refs = videoRefsRef.current.get(candidateId)
    refs[type] = videoRef.current
    
    return () => {
      const refs = videoRefsRef.current.get(candidateId)
      if (refs) {
        delete refs[type]
      }
    }
  }, [candidateId, type, videoRefsRef])
  
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    if (stream) {
      const currentStream = video.srcObject
      const tracks = stream.getTracks()
      
      if (currentStream !== stream) {
        video.srcObject = stream
        video.play().catch(e => {
          console.warn(`Failed to play ${type} video for ${candidateId}:`, e)
        })
      }
    } else {
      video.srcObject = null
    }
  }, [stream, candidateId, type])
  
  return <StyledVideo ref={videoRef} autoPlay playsInline style={style} />
}

const INCIDENT_TAGS = [
  { code: 'A1', name: 'Mất khuôn mặt', level: 'S1' },
  { code: 'A2', name: 'Nhiều khuôn mặt', level: 'S2' },
  { code: 'A3', name: 'Chuyển tab', level: 'S1' },
  { code: 'A4', name: 'Không chia sẻ màn hình', level: 'S2' },
  { code: 'A5', name: 'Tài liệu cấm (OCR)', level: 'S2' },
  { code: 'A6', name: 'Âm thanh hội thoại', level: 'S2' },
  { code: 'A7', name: 'Thiết bị phụ', level: 'S2' },
  { code: 'A8', name: 'VPN / IP lạ', level: 'S1' },
  { code: 'A9', name: 'Vi phạm Secure Browser', level: 'S2' },
  { code: 'A10', name: 'Nghi ngờ giả mạo', level: 'S3' },
  { code: 'A11', name: 'Không phản hồi', level: 'S1' }
]

export default function Proctor() {
  const { roomId, userId } = useParams()
  const [msgs, setMsgs] = useState([])
  const [chat, setChat] = useState('')
  const [incidents, setIncidents] = useState([])
  const [note, setNote] = useState('')
  const [focusedId, setFocusedId] = useState(null)
  const [filterIncidents, setFilterIncidents] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState({})
  const [chatModalVisible, setChatModalVisible] = useState(false)
  const [participants, setParticipants] = useState([])
  const [isSfuMode, setIsSfuMode] = useState(false)

  const localVideoRef = useRef(null)
  const pcsRef = useRef(new Map())
  const streamMapsRef = useRef(new Map())
  const [remoteStreams, setRemoteStreams] = useState({})
  const videoRefsRef = useRef(new Map())
  const sigRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const signaling = new SignalingClient({ baseUrl: SIGNALING_BASE, roomId, userId, role: 'proctor' })
      sigRef.current = signaling

      // Track roster so we can target specific candidates even in SFU mode.
      signaling.on('roster', (data) => {
        const list = Array.isArray(data?.participants) ? data.participants : []
        setParticipants(list)
      })
      signaling.on('participant_joined', (data) => {
        const pid = String(data?.userId ?? '')
        const role = String(data?.role ?? '')
        if (!pid) return
        setParticipants((prev) => {
          const exists = prev.some((p) => String(p?.userId) === pid)
          if (exists) return prev
          return [...prev, { userId: pid, role }]
        })
      })
      signaling.on('participant_left', (data) => {
        const pid = String(data?.userId ?? '')
        if (!pid) return
        setParticipants((prev) => prev.filter((p) => String(p?.userId) !== pid))
      })
      
      let sfuMode = false
      try {
        const healthResp = await fetch(`${SIGNALING_BASE}/health`)
        const health = await healthResp.json()
        sfuMode = health.sfu_enabled === true
      } catch (e) {
        console.warn('Could not check SFU mode, defaulting to P2P')
      }

      setIsSfuMode(sfuMode)
      
      if (sfuMode) {
        console.log('=== SFU MODE ===')
        
        signaling.on('chat', (data) => {
          setMsgs(m => [...m, { from: data.from, text: data.text }])
        })
        
        signaling.on('incident', (data) => {
          setIncidents(list => [...list, { ...data, id: Date.now() + Math.random() }])
        })
        
        signaling.on('ai_analysis', (data) => {
          console.log('[AI Analysis] Received:', data)
          setAiAnalysis(prev => ({
            ...prev,
            [data.data?.candidate_id || 'unknown']: data.data
          }))
          
          if (data.data?.analyses) {
            data.data.analyses.forEach(analysis => {
              const alert = analysis.result?.alert
              if (alert) {
                setIncidents(list => [...list, {
                  id: Date.now() + Math.random(),
                  userId: data.data.candidate_id,
                  type: alert.type,
                  level: alert.level,
                  message: alert.message,
                  timestamp: data.data.timestamp
                }])
              }
            })
          }
        })
        
        await signaling.connect()
        
        const peer = await createPeer({
          onTrack: (ev) => {
            console.log('=== SFU onTrack ===', ev)
            const track = ev.track
            
            if (track.kind === 'video') {
              const stream = ev.streams?.[0] || new MediaStream([track])
              
              setRemoteStreams(prev => {
                const current = prev['sfu-all'] || { camera: null, screen: null }
                
                const existingCameraTracks = current.camera?.getVideoTracks() || []
                const existingScreenTracks = current.screen?.getVideoTracks() || []
                
                const isInCamera = existingCameraTracks.some(t => t.id === track.id)
                const isInScreen = existingScreenTracks.some(t => t.id === track.id)
                
                if (isInCamera || isInScreen) {
                  return prev
                }
                
                let newState = { ...current }
                
                if (!current.camera) {
                  newState.camera = new MediaStream([track])
                } else if (!current.screen) {
                  newState.screen = new MediaStream([track])
                } else {
                  newState.screen = new MediaStream([track])
                }
                
                return {
                  ...prev,
                  'sfu-all': newState
                }
              })
            } else if (track.kind === 'audio') {
              const stream = ev.streams?.[0] || new MediaStream([track])
              setRemoteStreams(prev => ({
                ...prev,
                'sfu-all': {
                  ...(prev['sfu-all'] || {}),
                  audio: stream
                }
              }))
            }
          },
          onIce: (candidate) => {
            signaling.send({ type: 'ice', candidate })
          }
        })
        
        pcsRef.current.set('server', peer.pc)
        
        const offer = await createAndSetOffer(peer.pc)
        signaling.send({ 
          type: 'offer', 
          sdp: { 
            sdp: offer.sdp, 
            type: offer.type 
          } 
        })
        
        signaling.on('answer', async (data) => {
          if (data.from === 'server') {
            await setRemoteDescription(peer.pc, data.sdp)
          }
        })
        
        signaling.on('offer', async (data) => {
          if (data.from === 'server' && data.renegotiate) {
            await peer.pc.setRemoteDescription(new RTCSessionDescription({
              type: data.sdp.type,
              sdp: data.sdp.sdp
            }))
            
            const answer = await peer.pc.createAnswer()
            await peer.pc.setLocalDescription(answer)
            
            signaling.send({
              type: 'answer',
              sdp: {
                type: answer.type,
                sdp: answer.sdp
              }
            })
          }
        })
        
      } else {
        console.log('=== P2P MODE ===')
        
        signaling.on('offer', async (data) => {
          const candidateId = data.from
          const trackInfo = data.trackInfo || []
          let pc = pcsRef.current.get(candidateId)
          
          if (!streamMapsRef.current.has(candidateId)) {
            streamMapsRef.current.set(candidateId, { camera: null, screen: null, trackInfo: {} })
          }
          
          const trackInfoMap = {}
          trackInfo.forEach(info => {
            trackInfoMap[info.trackId] = info.label
          })
          const streamMap = streamMapsRef.current.get(candidateId)
          streamMap.trackInfo = trackInfoMap
          
          if (!pc) {
            streamMapsRef.current.set(candidateId, { camera: null, screen: null })
            
            const peer = await createPeer({
              onTrack: (ev) => {
                const track = ev.track
                
                let streamMap = streamMapsRef.current.get(candidateId)
                if (!streamMap) {
                  streamMap = { camera: null, screen: null }
                  streamMapsRef.current.set(candidateId, streamMap)
                }
                
                const candidatePc = pcsRef.current.get(candidateId)
                if (!candidatePc) {
                  setTimeout(() => {
                    const retryPc = pcsRef.current.get(candidateId)
                    if (retryPc && track.readyState === 'live') {
                      console.log('Retrying track processing for', candidateId)
                    }
                  }, 500)
                  return
                }
                
                let isScreen = false
                let isCamera = false
                
                const trackLabel = track.label || ''
                const trackInfoMap = streamMap?.trackInfo || {}
                
                if (track.kind === 'video') {
                  const infoLabel = trackInfoMap[track.id]
                  
                  if (infoLabel === 'camera') {
                    isCamera = true
                  } else if (infoLabel === 'screen') {
                    isScreen = true
                  } else {
                    const transceivers = candidatePc.getTransceivers()
                    const currentTransceiver = transceivers.find(t => 
                      t.receiver.track && t.receiver.track.id === track.id
                    )
                    
                    if (currentTransceiver) {
                      const videoTransceivers = transceivers
                        .filter(t => t.receiver.track && t.receiver.track.kind === 'video')
                        .sort((a, b) => {
                          const midA = parseInt(a.mid) || 0
                          const midB = parseInt(b.mid) || 0
                          return midA - midB
                        })
                      
                      const index = videoTransceivers.findIndex(t => t.receiver.track.id === track.id)
                      
                      if (index === 0) {
                        isCamera = true
                      } else if (index >= 1) {
                        isScreen = true
                      }
                    } else {
                      const hasCamera = streamMap.camera !== null
                      if (!hasCamera) {
                        isCamera = true
                      } else {
                        isScreen = true
                      }
                    }
                  }
                }
                
                if (isScreen) {
                  let screenStream = streamMap.screen
                  if (!screenStream) {
                    screenStream = new MediaStream([track])
                  } else {
                    const existingTrack = screenStream.getVideoTracks().find(t => t.id === track.id)
                    if (!existingTrack) {
                      screenStream.addTrack(track)
                    }
                  }
                  streamMap.screen = screenStream
                  streamMapsRef.current.set(candidateId, streamMap)
                  
                  const videoRefs = videoRefsRef.current.get(candidateId)
                  if (videoRefs?.screen) {
                    videoRefs.screen.srcObject = screenStream
                    videoRefs.screen.play().catch(e => console.warn('Screen video play failed:', e))
                  }
                } else if (isCamera) {
                  let cameraStream = streamMap.camera
                  if (!cameraStream) {
                    cameraStream = new MediaStream([track])
                  } else {
                    const existingTrack = cameraStream.getVideoTracks().find(t => t.id === track.id)
                    if (!existingTrack) {
                      cameraStream.addTrack(track)
                    }
                  }
                  streamMap.camera = cameraStream
                  streamMapsRef.current.set(candidateId, streamMap)
                  
                  const videoRefs = videoRefsRef.current.get(candidateId)
                  if (videoRefs?.camera) {
                    videoRefs.camera.srcObject = cameraStream
                    videoRefs.camera.play().catch(e => console.warn('Camera video play failed:', e))
                  }
                }
                
                setRemoteStreams((curr) => {
                  const currentMap = streamMapsRef.current.get(candidateId) || { camera: null, screen: null }
                  const updated = {
                    ...curr,
                    [candidateId]: {
                      camera: currentMap.camera || curr[candidateId]?.camera,
                      screen: currentMap.screen || curr[candidateId]?.screen
                    }
                  }
                  return updated
                })
              },
              onIce: (candidate) => sigRef.current?.send({ type: 'ice', candidate, to: candidateId })
            })
            pc = peer.pc
            
            pc.onconnectionstatechange = () => {
              if (pc.connectionState === 'connected') {
                const transceivers = pc.getTransceivers()
                transceivers.forEach(transceiver => {
                  if (transceiver.receiver.track && transceiver.receiver.track.readyState === 'live') {
                    const track = transceiver.receiver.track
                    const ev = { 
                      track: track, 
                      streams: transceiver.receiver.track.streams?.length > 0 
                        ? transceiver.receiver.track.streams 
                        : [new MediaStream([track])]
                    }
                    if (peer.pc.ontrack) {
                      peer.pc.ontrack(ev)
                    }
                  }
                })
              }
            }
            
            pcsRef.current.set(candidateId, pc)
          }
          
          await setRemoteDescription(pc, data.sdp)
          const answer = await createAndSetAnswer(pc)
          signaling.send({ type: 'answer', sdp: answer, to: candidateId })
        })
        
        signaling.on('ice', async (data) => {
          const candidateId = data.from
          const pc = pcsRef.current.get(candidateId)
          if (pc) {
            try { await pc.addIceCandidate(data.candidate) } catch {}
          }
        })
        
        signaling.on('chat', (data) => {
          setMsgs(m => [...m, { from: data.from, text: data.text }])
        })
        
        signaling.on('incident', (data) => {
          setIncidents(list => [...list, { ...data, id: Date.now() + Math.random() }])
        })
        
        signaling.on('ai_analysis', (data) => {
          setAiAnalysis(prev => ({
            ...prev,
            [data.candidate_id || 'unknown']: data
          }))
          
          if (data.analyses) {
            data.analyses.forEach(analysis => {
              const alert = analysis.result?.alert
              if (alert) {
                setIncidents(list => [...list, {
                  id: Date.now() + Math.random(),
                  userId: data.candidate_id,
                  type: alert.type,
                  level: alert.level,
                  message: alert.message,
                  timestamp: data.timestamp
                }])
              }
            })
          }
        })
        
        await signaling.connect()

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          localVideoRef.current.textContent = 'Mic live'
          pcsRef.current.__talkbackStream = stream
        } catch {}
      }
    }
    init()
    return () => {
      try { sigRef.current?.close() } catch {}
      for (const pc of pcsRef.current.values()) {
        try { pc.close() } catch {}
      }
      pcsRef.current.clear()
    }
  }, [roomId, userId])

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const macros = {
          S1: 'Đây là nhắc nhở cấp S1, vui lòng tuân thủ ngay.',
          S2: 'Đây là cảnh báo cấp S2. Nếu tái diễn sẽ tạm dừng/kết thúc phiên.',
          S3: 'Phiên có thể bị kết thúc do vi phạm nghiêm trọng.'
        }
        if (e.key === '1') { 
          e.preventDefault()
          const text = macros.S1
          sigRef.current?.send({ type: 'chat', text })
          setMsgs(m => [...m, { from: userId, text }])
        }
        if (e.key === '2') { 
          e.preventDefault()
          const text = macros.S2
          sigRef.current?.send({ type: 'chat', text })
          setMsgs(m => [...m, { from: userId, text }])
        }
        if (e.key === '3') { 
          e.preventDefault()
          const text = macros.S3
          sigRef.current?.send({ type: 'chat', text })
          setMsgs(m => [...m, { from: userId, text }])
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [userId])

  const sendChat = () => {
    if (!chat) return
    sigRef.current?.send({ type: 'chat', text: chat })
    setMsgs(m => [...m, { from: userId, text: chat }])
    setChat('')
  }

  const tagIncident = (tag) => {
    const payload = { type: 'incident', tag: tag.code, level: tag.level, note, ts: Date.now(), by: userId }
    sigRef.current?.send(payload)
    setIncidents(list => [...list, { ...payload, roomId }])
    setNote('')
  }

  const macros = {
    S1: 'Đây là nhắc nhở cấp S1, vui lòng tuân thủ ngay.',
    S2: 'Đây là cảnh báo cấp S2. Nếu tái diễn sẽ tạm dừng/kết thúc phiên.',
    S3: 'Phiên có thể bị kết thúc do vi phạm nghiêm trọng.'
  }

  const sendMacro = (level) => {
    const text = macros[level]
    if (!text) return
    sigRef.current?.send({ type: 'chat', text })
    setMsgs(m => [...m, { from: userId, text }])
  }

  const controlCandidate = (candidateId, action) => {
    sigRef.current?.send({ type: 'control', action, to: candidateId })
  }

  const requestForceSubmit = (candidateId) => {
    const candidateIds = participants
      .filter((p) => String(p?.role) === 'candidate')
      .map((p) => String(p?.userId))
      .filter(Boolean)

    const normalized = candidateId ? String(candidateId) : ''
    let targetId = normalized

    // In SFU mode, the UI stream key can be "sfu-all" which is not a real participant id.
    if (isSfuMode && (!targetId || targetId === 'sfu-all')) {
      if (selectedCandidate) targetId = String(selectedCandidate)
      else if (candidateIds.length === 1) targetId = candidateIds[0]
    }

    console.log('[Proctor] force_submit request', {
      isSfuMode,
      focusedCandidateId: candidateId,
      selectedCandidate,
      resolvedTargetId: targetId,
      candidateIds,
    })

    // Safety: if still not resolved (or invalid), ask proctor to select.
    if (!targetId || (candidateIds.length > 0 && !candidateIds.includes(targetId))) {
      alert('Vui lòng chọn đúng thí sinh để yêu cầu nộp bài.')
      return
    }

    sigRef.current?.send({
      type: 'force_submit',
      to: targetId,
      timeoutSeconds: 30,
      ts: Date.now(),
    })
  }

  useEffect(() => {
    // Convenience: auto-select when exactly 1 candidate is connected.
    const candidateIds = participants
      .filter((p) => String(p?.role) === 'candidate')
      .map((p) => String(p?.userId))
      .filter(Boolean)
    if (!selectedCandidate && candidateIds.length === 1) {
      setSelectedCandidate(candidateIds[0])
    }
  }, [participants, selectedCandidate])

  const getSeverityColor = (level) => {
    if (level === 'S3') return '#ff4d4f'
    if (level === 'S2') return '#faad14'
    return '#1890ff'
  }

  const getIncidentsByCandidate = (candidateId) => {
    return incidents.filter(it => it.from === candidateId || it.by === candidateId)
  }

  const groupedIncidents = Object.keys(remoteStreams).reduce((acc, uid) => {
    acc[uid] = getIncidentsByCandidate(uid)
    return acc
  }, {})

  return (
    <ProctorContainer>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Giám Thị Trực Tuyến
            </Typography.Title>
            <Typography.Text type="secondary">
              Phòng thi: {roomId} • Giám thị: {userId}
            </Typography.Text>
          </div>
          <Space>
            <StatusBadge $status="connected">
              ● Đang hoạt động
            </StatusBadge>
            <Badge count={Object.keys(remoteStreams).length} showZero>
              <Tag color="blue">Thí sinh: {Object.keys(remoteStreams).length}</Tag>
            </Badge>
          </Space>
        </div>
      </Card>

      <MainGrid>
        {/* Left Column - Candidates View */}
        <div>
          {/* Focus View */}
          {focusedId && (
            <FocusView>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  👁️ Đang theo dõi: {focusedId}
                </Typography.Title>
                <Button onClick={() => setFocusedId(null)}>Thoát chế độ theo dõi</Button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: remoteStreams[focusedId]?.screen ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <Card title="📹 Camera View" size="small">
                    <VideoContainer>
                      <CandidateVideo 
                        candidateId={focusedId}
                        stream={remoteStreams[focusedId]?.camera}
                        type="camera"
                        videoRefsRef={videoRefsRef}
                        style={{ width: '100%', minHeight: 300 }}
                      />
                    </VideoContainer>
                  </Card>
                </div>
                
                {remoteStreams[focusedId]?.screen && (
                  <div>
                    <Card title="🖥️ Screen Share" size="small">
                      <VideoContainer>
                        <CandidateVideo 
                          candidateId={focusedId}
                          stream={remoteStreams[focusedId]?.screen}
                          type="screen"
                          videoRefsRef={videoRefsRef}
                          style={{ width: '100%', minHeight: 300 }}
                        />
                      </VideoContainer>
                    </Card>
                  </div>
                )}
              </div>
              
              <ControlBar>
                {isSfuMode && (
                  <Select
                    value={selectedCandidate}
                    placeholder="Chọn thí sinh"
                    onChange={(v) => setSelectedCandidate(v)}
                    style={{ minWidth: 180 }}
                    options={participants
                      .filter((p) => String(p?.role) === 'candidate')
                      .map((p) => ({
                        value: String(p.userId),
                        label: String(p.userId),
                      }))}
                  />
                )}
                <Button 
                  type="primary" 
                  icon={<PauseCircleOutlined />}
                  onClick={() => controlCandidate(focusedId, 'pause')}
                >
                  Tạm dừng
                </Button>
                <Button 
                  danger 
                  icon={<StopOutlined />}
                  onClick={() => controlCandidate(focusedId, 'end')}
                >
                  Kết thúc
                </Button>
                <Button
                  danger
                  onClick={() => requestForceSubmit(focusedId)}
                >
                  Yêu cầu nộp bài
                </Button>
                <Button 
                  icon={<MessageOutlined />}
                  onClick={() => setChatModalVisible(true)}
                >
                  Nhắn tin
                </Button>
              </ControlBar>
            </FocusView>
          )}

          {/* Candidates Grid */}
          {!focusedId && (
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  Danh sách thí sinh
                  <Badge count={Object.keys(remoteStreams).length} showZero />
                </Space>
              }
              extra={
                <Space>
                  <Switch 
                    checked={filterIncidents}
                    onChange={setFilterIncidents}
                    checkedChildren="Có vi phạm"
                    unCheckedChildren="Tất cả"
                  />
                  <Button 
                    icon={<LayoutOutlined />}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
                  >
                    {viewMode === 'grid' ? 'Dạng lưới' : 'Dạng thời gian'}
                  </Button>
                </Space>
              }
            >
              <CandidatesGrid>
                {Object.entries(remoteStreams)
                  .filter(([uid]) => !filterIncidents || incidents.some(it => it.from === uid || it.by === uid))
                  .map(([uid, streams]) => {
                    const candIncidents = groupedIncidents[uid] || []
                    const s3Count = candIncidents.filter(i => i.level === 'S3').length
                    const s2Count = candIncidents.filter(i => i.level === 'S2').length
                    const analysis = aiAnalysis[uid]
                    
                    return (
                      <CandidateCard 
                        key={uid} 
                        $selected={selectedCandidate === uid}
                        hoverable
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <div>
                              <Typography.Text strong style={{ fontSize: 14 }}>
                                {uid}
                              </Typography.Text>
                              <div style={{ fontSize: 12, color: '#666' }}>
                                {streams?.camera ? '📹 Đang kết nối' : '⏳ Chờ camera...'}
                              </div>
                            </div>
                          </div>
                          
                          <Space direction="vertical" size={0}>
                            {s3Count > 0 && (
                              <Badge count={`S3: ${s3Count}`} style={{ backgroundColor: '#ff4d4f' }} />
                            )}
                            {s2Count > 0 && (
                              <Badge count={`S2: ${s2Count}`} style={{ backgroundColor: '#faad14' }} />
                            )}
                          </Space>
                        </div>

                        {/* AI Status */}
                        {analysis && (
                          <div style={{ 
                            background: '#f0f8ff', 
                            padding: '4px 8px', 
                            borderRadius: 4, 
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12
                          }}>
                            <RobotOutlined style={{ color: '#1890ff' }} />
                            <span>AI: {analysis.scenario}</span>
                            {analysis.analyses?.some(a => a.result?.alert) && (
                              <Badge size="small" count="!" style={{ backgroundColor: '#faad14', marginLeft: 'auto' }} />
                            )}
                          </div>
                        )}

                        {/* Video Streams */}
                        <div style={{ display: 'grid', gridTemplateColumns: streams?.screen ? '1fr 1fr' : '1fr', gap: 8 }}>
                          {/* Camera */}
                          <div style={{ position: 'relative' }}>
                            <VideoContainer>
                              <CandidateVideo 
                                candidateId={uid}
                                stream={streams?.camera}
                                type="camera"
                                videoRefsRef={videoRefsRef}
                                style={{ width: '100%', minHeight: 120 }}
                              />
                              {!streams?.camera && (
                                <VideoPlaceholder>
                                  <VideoCameraOutlined />
                                  <div style={{ fontSize: 12 }}>Chờ camera...</div>
                                </VideoPlaceholder>
                              )}
                            </VideoContainer>
                          </div>

                          {/* Screen */}
                          <div style={{ position: 'relative' }}>
                            <VideoContainer>
                              {streams?.screen ? (
                                <CandidateVideo 
                                  candidateId={uid}
                                  stream={streams?.screen}
                                  type="screen"
                                  videoRefsRef={videoRefsRef}
                                  style={{ width: '100%', minHeight: 120 }}
                                />
                              ) : (
                                <VideoPlaceholder>
                                  <AppstoreOutlined />
                                  <div style={{ fontSize: 12 }}>Chưa chia sẻ</div>
                                </VideoPlaceholder>
                              )}
                            </VideoContainer>
                          </div>
                        </div>

                        {/* Actions */}
                        <ControlBar>
                          <Button 
                            size="small" 
                            icon={<EyeOutlined />}
                            onClick={() => setFocusedId(uid)}
                          >
                            Theo dõi
                          </Button>
                          <Button 
                            size="small"
                            type={selectedCandidate === uid ? 'primary' : 'default'}
                            onClick={() => setSelectedCandidate(uid === selectedCandidate ? null : uid)}
                          >
                            Chọn
                          </Button>
                          <Button 
                            size="small"
                            icon={<MessageOutlined />}
                            onClick={() => setChatModalVisible(true)}
                          >
                            Chat
                          </Button>
                        </ControlBar>
                      </CandidateCard>
                    )
                  })}
                
                {Object.keys(remoteStreams).length === 0 && (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center', 
                    padding: 40, 
                    color: '#999' 
                  }}>
                    <UserOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                    <Typography.Text type="secondary">
                      Chưa có thí sinh nào kết nối
                    </Typography.Text>
                  </div>
                )}
              </CandidatesGrid>
            </Card>
          )}
        </div>

        {/* Right Column - Monitoring & Controls */}
        <div>
          {/* AI Monitoring Status */}
          <AIStatusPanel 
            title={
              <Space>
                <RobotOutlined />
                Giám sát AI
              </Space>
            }
            $hasAlerts={Object.values(aiAnalysis).some(a => a?.analyses?.some(x => x.result?.alert))}
          >
            {Object.keys(aiAnalysis).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                <RobotOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                Chờ thí sinh kết nối...
              </div>
            ) : (
              <List
                size="small"
                dataSource={Object.entries(aiAnalysis)}
                renderItem={([candidateId, analysis]) => {
                  const hasAlert = analysis?.analyses?.some(a => a.result?.alert)
                  const alertCount = analysis?.analyses?.filter(a => a.result?.alert).length || 0
                  
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            size="small" 
                            style={{ 
                              backgroundColor: hasAlert ? '#faad14' : '#52c41a',
                              animation: hasAlert ? 'pulse 2s infinite' : 'none'
                            }}
                          >
                            <UserOutlined />
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Typography.Text strong style={{ fontSize: 12 }}>
                              {candidateId}
                            </Typography.Text>
                            {alertCount > 0 && (
                              <Badge count={alertCount} size="small" style={{ backgroundColor: '#faad14' }} />
                            )}
                          </Space>
                        }
                        description={
                          <Typography.Text type={hasAlert ? 'warning' : 'secondary'} style={{ fontSize: 11 }}>
                            {analysis?.scenario || 'unknown'}
                          </Typography.Text>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </AIStatusPanel>

          {/* Incidents Panel */}
          <Card
            title={
              <Space>
                <WarningOutlined />
                Sự kiện & Vi phạm
                <Badge count={incidents.length} showZero />
              </Space>
            }
            extra={
              <Button 
                size="small"
                icon={<ClockCircleOutlined />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
              >
                {viewMode === 'grid' ? 'Thời gian' : 'Lưới'}
              </Button>
            }
            style={{ height: 400 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ height: 340, overflow: 'auto', padding: 16 }}>
              {incidents.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                  <WarningOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                  Chưa có sự kiện nào
                </div>
              ) : viewMode === 'timeline' ? (
                incidents
                  .sort((a, b) => b.ts - a.ts)
                  .map((it) => (
                    <IncidentItem key={it.id || it.ts} $color={getSeverityColor(it.level)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Typography.Text strong>
                            {it.tag || it.type}
                          </Typography.Text>
                          <Tag color={getSeverityColor(it.level)} style={{ marginLeft: 8, fontSize: 10 }}>
                            {it.level}
                          </Tag>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            {it.by || it.from || it.userId}
                          </div>
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(it.ts || it.timestamp).toLocaleTimeString()}
                        </Typography.Text>
                      </div>
                      <Typography.Text style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        {it.message || it.note}
                      </Typography.Text>
                    </IncidentItem>
                  ))
              ) : (
                incidents
                  .filter(it => !selectedCandidate || it.from === selectedCandidate || it.by === selectedCandidate)
                  .map((it) => (
                    <IncidentItem key={it.id || it.ts} $color={getSeverityColor(it.level)}>
                      <Typography.Text strong>
                        {it.tag || it.type}
                      </Typography.Text>
                      <Tag color={getSeverityColor(it.level)} style={{ marginLeft: 8, fontSize: 10 }}>
                        {it.level}
                      </Tag>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        {it.by || it.from || it.userId} • {new Date(it.ts || it.timestamp).toLocaleTimeString()}
                      </div>
                      <Typography.Text style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        {it.message || it.note}
                      </Typography.Text>
                    </IncidentItem>
                  ))
              )}
            </div>
          </Card>
        </div>
      </MainGrid>

      {/* Chat Modal */}
      <Modal
        title="Tin nhắn với thí sinh"
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={null}
        width={500}
      >
        <ChatPanel>
          <MessageList>
            {msgs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                <MessageOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                Chưa có tin nhắn nào
              </div>
            ) : (
              msgs.map((message, index) => (
                <MessageItem key={index} $isOwn={message.from === userId}>
                  <div style={{ fontWeight: 'bold', fontSize: 12, color: '#1890ff', marginBottom: 4 }}>
                    {message.from === userId ? 'Bạn' : message.from}
                  </div>
                  <div style={{ fontSize: 14 }}>{message.text}</div>
                </MessageItem>
              ))
            )}
          </MessageList>
          
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onPressEnter={sendChat}
            />
            <Button type="primary" onClick={sendChat}>
              Gửi
            </Button>
          </Space.Compact>
          
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button size="small" onClick={() => sendMacro('S1')}>
              S1 - Nhắc nhở
            </Button>
            <Button size="small" onClick={() => sendMacro('S2')}>
              S2 - Cảnh báo
            </Button>
            <Button size="small" danger onClick={() => sendMacro('S3')}>
              S3 - Nghiêm trọng
            </Button>
          </div>
        </ChatPanel>
      </Modal>

      {/* Floating Actions */}
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
        <FloatButton
          icon={<MessageOutlined />}
          onClick={() => setChatModalVisible(true)}
        />
        <FloatButton
          icon={<SoundOutlined />}
          tooltip="Quick Macros"
        />
      </FloatButton.Group>
    </ProctorContainer>
  )
}