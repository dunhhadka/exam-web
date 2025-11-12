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
  List,
  Switch,
  Progress,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  PushpinOutlined,
  PushpinFilled,
  MessageOutlined,
  WarningOutlined,
  RobotOutlined,
  EyeOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  SendOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { SignalingClient } from './js/signaling'
import {
  createAndSetAnswer,
  createAndSetOffer,
  createPeer,
  setRemoteDescription,
} from './js/webrtc'

// Types
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

interface CandidateVideoProps {
  candidateId: string
  stream: MediaStream | null
  type: 'camera' | 'screen'
  videoRefsRef: React.MutableRefObject<
    Map<
      string,
      { camera?: HTMLVideoElement | null; screen?: HTMLVideoElement | null }
    >
  >
  style?: React.CSSProperties
}

interface Message {
  from: string
  text: string
}

interface Incident {
  id: string | number
  from?: string
  by?: string
  userId?: string
  type?: string
  tag?: string
  level: string
  message?: string
  note?: string
  ts?: number
  timestamp?: number
  escalated?: number
  roomId?: string
}

interface AIAnalysis {
  candidate_id?: string
  scenario?: string
  timestamp?: number
  analyses?: Array<{
    result?: {
      alert?: {
        type: string
        level: string
        message: string
      }
    }
  }>
}

interface RemoteStreams {
  [userId: string]: {
    camera: MediaStream | null
    screen: MediaStream | null
    audio?: MediaStream | null
  }
}

interface TrackInfo {
  trackId: string
  label: string
}

// Styled Components
const ProctorContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`

const CandidateCard = styled(Card)<{
  $selected?: boolean
  $hasIncidents?: boolean
}>`
  border: 2px solid
    ${(props) =>
      props.$selected
        ? '#1890ff'
        : props.$hasIncidents
        ? '#ff4d4f'
        : '#f0f0f0'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #1890ff;
  }

  .ant-card-body {
    padding: 16px;
  }
`

const FocusedView = styled(Card)`
  margin-bottom: 16px;
  border: 2px solid #1890ff;

  .ant-card-body {
    padding: 16px;
  }
`

const VideoContainer = styled.div<{ $isScreen?: boolean }>`
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: ${(props) => (props.$isScreen ? '240px' : '200px')};
  display: flex;
  align-items: center;
  justify-content: center;
`

const VideoPlaceholder = styled.div`
  color: #999;
  text-align: center;
  padding: 20px;

  .anticon {
    font-size: 24px;
    margin-bottom: 8px;
    display: block;
  }
`

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`

const ControlPanel = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`

const StatusBadge = styled.div<{ $status: 'online' | 'warning' | 'error' }>`
  position: absolute;
  top: 8px;
  left: 8px;
  background: ${(props) =>
    props.$status === 'online'
      ? '#52c41a'
      : props.$status === 'warning'
      ? '#faad14'
      : '#ff4d4f'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 10;
`

const AIBadge = styled.div<{ $hasAlerts?: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${(props) =>
    props.$hasAlerts ? '#faad14' : 'rgba(0, 0, 0, 0.7)'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
`

const IncidentIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
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

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const AnalysisPanel = styled(Card)`
  .ant-card-body {
    padding: 16px;
  }
`

const IncidentList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`

const IncidentItem = styled.div<{ $level: string }>`
  padding: 12px;
  margin-bottom: 8px;
  border-left: 4px solid
    ${(props) =>
      props.$level === 'S3'
        ? '#ff4d4f'
        : props.$level === 'S2'
        ? '#faad14'
        : '#1890ff'};
  background: #fafafa;
  border-radius: 4px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .meta {
    font-size: 11px;
    color: #666;
  }

  .message {
    font-size: 13px;
    margin-top: 4px;
  }
`

const ViewToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  .ant-btn {
    flex: 1;
  }
`

// Component để render video với auto-update khi stream thay đổi
function CandidateVideo({
  candidateId,
  stream,
  type,
  videoRefsRef,
  style,
}: CandidateVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Store ref
    if (!videoRefsRef.current.has(candidateId)) {
      videoRefsRef.current.set(candidateId, {})
    }
    const refs = videoRefsRef.current.get(candidateId)
    if (refs) {
      refs[type] = videoRef.current
    }

    return () => {
      // Cleanup
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
      if (currentStream !== stream) {
        video.srcObject = stream
        video.play().catch((e) => {
          console.warn(`Failed to play ${type} video for ${candidateId}:`, e)
        })
      }
    } else {
      video.srcObject = null
    }
  }, [stream, candidateId, type])

  if (!stream) {
    return (
      <VideoPlaceholder>
        {type === 'camera' ? <EyeOutlined /> : <AppstoreOutlined />}
        <div>{type === 'camera' ? 'Chờ camera...' : 'Chưa share'}</div>
      </VideoPlaceholder>
    )
  }

  return <StyledVideo ref={videoRef} autoPlay playsInline style={style} />
}

const SIGNALING_BASE =
  //import.meta.env.VITE_SIGNALING_URL ||
  'http://localhost:8000'

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
  { code: 'A11', name: 'Không phản hồi', level: 'S1' },
]

interface ProctorParams {
  roomId: string
  userId: string
}

const { Title, Text } = Typography

export default function Proctor() {
  const { roomId, userId } = useParams()
  const [msgs, setMsgs] = useState<Message[]>([])
  const [chat, setChat] = useState<string>('')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [note, setNote] = useState<string>('')
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [filterIncidents, setFilterIncidents] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  )
  const [aiAnalysis, setAiAnalysis] = useState<{
    [candidateId: string]: AIAnalysis
  }>({})

  const localVideoRef = useRef<HTMLDivElement>(null)
  const pcsRef = useRef(new Map<string, RTCPeerConnection>())
  const streamMapsRef = useRef(
    new Map<
      string,
      {
        camera: MediaStream | null
        screen: MediaStream | null
        trackInfo?: { [trackId: string]: string }
      }
    >()
  )
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({})
  const videoRefsRef = useRef(
    new Map<
      string,
      { camera?: HTMLVideoElement | null; screen?: HTMLVideoElement | null }
    >()
  )
  const sigRef = useRef<SignalingClient | null>(null)

  useEffect(() => {
    const init = async () => {
      if (!roomId || !userId) return

      const signaling = new SignalingClient({
        baseUrl: SIGNALING_BASE,
        roomId,
        userId,
        role: 'proctor',
      })
      sigRef.current = signaling

      // Check if backend supports SFU mode
      let sfuMode = false
      try {
        const healthResp = await fetch(`${SIGNALING_BASE}/health`)
        const health = await healthResp.json()
        sfuMode = health.sfu_enabled === true
        console.log('Backend mode:', health.mode, 'SFU enabled:', sfuMode)
      } catch (e) {
        console.warn('Could not check SFU mode, defaulting to P2P')
      }

      if (sfuMode) {
        // SFU Mode: Proctor connects first, receives tracks as candidates join via renegotiation
        console.log('=== SFU MODE ===')

        // Register message listeners BEFORE connecting
        signaling.on('chat', (data: any) => {
          setMsgs((m) => [...m, { from: data.from, text: data.text }])
        })

        signaling.on('incident', (data: any) => {
          setIncidents((list) => [
            ...list,
            { ...data, id: Date.now() + Math.random() },
          ])
        })

        signaling.on('ai_analysis', (data: any) => {
          console.log('[AI Analysis] Received:', data)
          // Store latest analysis for this candidate
          setAiAnalysis((prev) => ({
            ...prev,
            [data.data?.candidate_id || 'unknown']: data.data,
          }))

          // If there are alerts, add them as incidents
          if (data.data?.analyses) {
            data.data.analyses.forEach((analysis: any) => {
              const alert = analysis.result?.alert
              if (alert) {
                console.log('[AI Analysis] Alert:', alert)
                setIncidents((list) => [
                  ...list,
                  {
                    id: Date.now() + Math.random(),
                    userId: data.data.candidate_id,
                    type: alert.type,
                    level: alert.level,
                    message: alert.message,
                    timestamp: data.data.timestamp,
                  },
                ])
              }
            })
          }
        })

        await signaling.connect()

        console.log(
          'Proctor establishing SFU connection (will receive tracks when candidates join)'
        )

        // Create single peer connection to backend
        const peer = await createPeer({
          onTrack: (ev: RTCTrackEvent) => {
            console.log('=== SFU onTrack ===', ev)
            const track = ev.track
            console.log('Received track from SFU:', {
              trackId: track.id,
              trackKind: track.kind,
              trackLabel: track.label,
              streamId: ev.streams?.[0]?.id,
            })

            // In SFU mode, all tracks come through one connection
            // We need to differentiate between camera and screen tracks

            if (track.kind === 'video') {
              // Get or create stream for this track
              const stream = ev.streams?.[0] || new MediaStream([track])

              console.log('Processing video track:', {
                trackId: track.id,
                streamId: stream.id,
                streamTrackCount: stream.getTracks().length,
              })

              // Count existing video tracks to determine if this is camera or screen
              // First video track = camera, second = screen
              setRemoteStreams((prev) => {
                const current = prev['sfu-all'] || {
                  camera: null,
                  screen: null,
                }

                // Check if this track already exists in our state
                const existingCameraTracks =
                  current.camera?.getVideoTracks() || []
                const existingScreenTracks =
                  current.screen?.getVideoTracks() || []

                const isInCamera = existingCameraTracks.some(
                  (t) => t.id === track.id
                )
                const isInScreen = existingScreenTracks.some(
                  (t) => t.id === track.id
                )

                if (isInCamera || isInScreen) {
                  console.log('Track already added, skipping')
                  return prev
                }

                // Determine if this is camera or screen
                let newState = { ...current }

                if (!current.camera) {
                  // First video track = camera
                  newState.camera = new MediaStream([track])
                  console.log('Added camera stream:', newState.camera.id)
                } else if (!current.screen) {
                  // Second video track = screen
                  newState.screen = new MediaStream([track])
                  console.log('Added screen stream:', newState.screen.id)
                } else {
                  // Already have both - this is likely a replacement
                  console.log('Replacing screen stream with new track')
                  newState.screen = new MediaStream([track])
                }

                return {
                  ...prev,
                  'sfu-all': newState,
                }
              })
            } else if (track.kind === 'audio') {
              // Handle audio track
              const stream = ev.streams?.[0] || new MediaStream([track])
              setRemoteStreams((prev) => ({
                ...prev,
                'sfu-all': {
                  ...(prev['sfu-all'] || {}),
                  audio: stream,
                },
              }))
              console.log('Added audio stream')
            }
          },
          onIce: (candidate: RTCIceCandidate) => {
            console.log('Proctor ICE candidate:', candidate)
            signaling.send({ type: 'ice', candidate })
          },
        })

        pcsRef.current.set('server', peer.pc)

        // Create and send offer to backend
        const offer = await createAndSetOffer(peer.pc)
        console.log('Sending offer to SFU backend', offer)
        signaling.send({
          type: 'offer',
          sdp: {
            sdp: offer.sdp,
            type: offer.type,
          },
        })

        // Wait for answer from backend
        signaling.on('answer', async (data: any) => {
          if (data.from === 'server') {
            console.log('Received answer from SFU backend')
            await setRemoteDescription(peer.pc, data.sdp)
          }
        })

        // Handle renegotiation offers from backend (when new candidates join)
        signaling.on('offer', async (data: any) => {
          if (data.from === 'server' && data.renegotiate) {
            console.log(
              '[RENEGOTIATE] Received new offer from backend due to candidate join'
            )

            // Set remote description (new offer)
            await peer.pc.setRemoteDescription(
              new RTCSessionDescription({
                type: data.sdp.type,
                sdp: data.sdp.sdp,
              })
            )

            // Create answer
            const answer = await peer.pc.createAnswer()
            await peer.pc.setLocalDescription(answer)

            // Send answer back to backend
            signaling.send({
              type: 'answer',
              sdp: {
                type: answer.type,
                sdp: answer.sdp,
              },
            })
            console.log('[RENEGOTIATE] Sent answer back to backend')
          }
        })
      } else {
        // P2P Mode: Original logic (receive offers from candidates)
        console.log('=== P2P MODE ===')

        signaling.on('offer', async (data: any) => {
          const candidateId = data.from
          const trackInfo: TrackInfo[] = data.trackInfo || []
          let pc = pcsRef.current.get(candidateId)

          // Store track info for this candidate
          if (!streamMapsRef.current.has(candidateId)) {
            streamMapsRef.current.set(candidateId, {
              camera: null,
              screen: null,
              trackInfo: {},
            })
          }

          // Build trackInfo map: trackId -> label
          const trackInfoMap: { [trackId: string]: string } = {}
          trackInfo.forEach((info) => {
            trackInfoMap[info.trackId] = info.label
          })
          const streamMap = streamMapsRef.current.get(candidateId)
          if (streamMap) {
            streamMap.trackInfo = trackInfoMap
          }
          console.log(
            'Received offer with trackInfo:',
            trackInfo,
            'Map:',
            trackInfoMap
          )

          // Create per-candidate PC if not exists
          if (!pc) {
            // Initialize stream map for this candidate
            streamMapsRef.current.set(candidateId, {
              camera: null,
              screen: null,
            })

            // Create PC first
            const peer = await createPeer({
              onTrack: (ev: RTCTrackEvent) => {
                console.log('=== onTrack CALLED ===', { candidateId, ev })
                // Handle multiple tracks (camera and screen)
                const track = ev.track
                console.log('onTrack event:', {
                  candidateId,
                  trackId: track.id,
                  trackKind: track.kind,
                  trackLabel: track.label,
                  streamId: ev.streams?.[0]?.id,
                })

                // Get stream map for this candidate
                let streamMap = streamMapsRef.current.get(candidateId)
                if (!streamMap) {
                  streamMap = { camera: null, screen: null }
                  streamMapsRef.current.set(candidateId, streamMap)
                }

                // Get the peer connection from ref (should be set by now)
                const candidatePc = pcsRef.current.get(candidateId)
                if (!candidatePc) {
                  console.warn(
                    'PC not found for candidate',
                    candidateId,
                    'in onTrack - will retry'
                  )
                  // Store track temporarily and retry after PC is set
                  setTimeout(() => {
                    const retryPc = pcsRef.current.get(candidateId)
                    if (retryPc && track.readyState === 'live') {
                      // Retry processing
                      console.log('Retrying track processing for', candidateId)
                    }
                  }, 500)
                  return
                }

                // Identify track using trackInfo from candidate (if available)
                let isScreen = false
                let isCamera = false

                const trackLabel = track.label || ''

                // Get trackInfo map for this candidate (reuse streamMap from above)
                const trackInfoMap = streamMap?.trackInfo || {}

                console.log('Track received:', {
                  trackLabel,
                  trackId: track.id,
                  candidateId,
                  trackKind: track.kind,
                  trackInfoLabel: trackInfoMap[track.id],
                })

                if (track.kind === 'video') {
                  // First, try to use trackInfo from candidate
                  const infoLabel = trackInfoMap[track.id]

                  if (infoLabel === 'camera') {
                    isCamera = true
                  } else if (infoLabel === 'screen') {
                    isScreen = true
                  } else {
                    // Fallback: use transceiver order
                    const transceivers = candidatePc.getTransceivers()
                    const currentTransceiver = transceivers.find(
                      (t) =>
                        t.receiver.track && t.receiver.track.id === track.id
                    )

                    if (currentTransceiver) {
                      // Get all video transceivers sorted by mid
                      const videoTransceivers = transceivers
                        .filter(
                          (t) =>
                            t.receiver.track &&
                            t.receiver.track.kind === 'video'
                        )
                        .sort((a, b) => {
                          const midA = parseInt(a.mid || '0') || 0
                          const midB = parseInt(b.mid || '0') || 0
                          return midA - midB
                        })

                      const index = videoTransceivers.findIndex(
                        (t) => t.receiver.track.id === track.id
                      )

                      console.log('Video transceiver analysis (fallback):', {
                        candidateId,
                        trackId: track.id,
                        currentMid: currentTransceiver.mid,
                        index,
                        totalVideoTransceivers: videoTransceivers.length,
                        allMids: videoTransceivers.map((t) => t.mid),
                      })

                      // First video track (index 0) = camera
                      // Second video track (index 1) = screen
                      if (index === 0) {
                        isCamera = true
                      } else if (index >= 1) {
                        isScreen = true
                      }
                    } else {
                      console.warn(
                        'Could not find transceiver for track',
                        track.id
                      )
                      // Last fallback: check if we already have camera
                      const hasCamera = streamMap.camera !== null
                      if (!hasCamera) {
                        isCamera = true
                      } else {
                        isScreen = true
                      }
                    }
                  }
                }

                console.log('Track identified:', {
                  trackLabel,
                  isScreen,
                  isCamera,
                  trackId: track.id,
                  candidateId,
                })

                if (isScreen) {
                  // Screen track - create new stream or update existing
                  let screenStream = streamMap.screen
                  if (!screenStream) {
                    screenStream = new MediaStream([track])
                  } else {
                    // Add track to existing stream if not already there
                    const existingTrack = screenStream
                      .getVideoTracks()
                      .find((t) => t.id === track.id)
                    if (!existingTrack) {
                      screenStream.addTrack(track)
                    }
                  }
                  streamMap.screen = screenStream
                  streamMapsRef.current.set(candidateId, streamMap)
                  console.log(
                    'Screen stream updated for',
                    candidateId,
                    'track:',
                    track.id
                  )

                  // Update video element immediately
                  const videoRefs = videoRefsRef.current.get(candidateId)
                  if (videoRefs?.screen) {
                    videoRefs.screen.srcObject = screenStream
                    videoRefs.screen
                      .play()
                      .catch((e) =>
                        console.warn('Screen video play failed:', e)
                      )
                  }
                } else if (isCamera) {
                  // Camera track - create new stream or update existing
                  let cameraStream = streamMap.camera
                  if (!cameraStream) {
                    cameraStream = new MediaStream([track])
                  } else {
                    // Add track to existing stream if not already there
                    const existingTrack = cameraStream
                      .getVideoTracks()
                      .find((t) => t.id === track.id)
                    if (!existingTrack) {
                      cameraStream.addTrack(track)
                    }
                  }
                  streamMap.camera = cameraStream
                  streamMapsRef.current.set(candidateId, streamMap)
                  console.log(
                    'Camera stream updated for',
                    candidateId,
                    'track:',
                    track.id
                  )

                  // Update video element immediately
                  const videoRefs = videoRefsRef.current.get(candidateId)
                  if (videoRefs?.camera) {
                    videoRefs.camera.srcObject = cameraStream
                    videoRefs.camera
                      .play()
                      .catch((e) =>
                        console.warn('Camera video play failed:', e)
                      )
                  }
                }

                // Update state with current streams (trigger re-render)
                setRemoteStreams((curr) => {
                  const currentMap = streamMapsRef.current.get(candidateId) || {
                    camera: null,
                    screen: null,
                  }
                  const updated = {
                    ...curr,
                    [candidateId]: {
                      camera: currentMap.camera || curr[candidateId]?.camera,
                      screen: currentMap.screen || curr[candidateId]?.screen,
                    },
                  }
                  return updated
                })
              },
              onIce: (candidate: RTCIceCandidate) =>
                sigRef.current?.send({
                  type: 'ice',
                  candidate,
                  to: candidateId,
                }),
            })
            pc = peer.pc

            pc = peer.pc

            // Thêm null check ở đây
            if (pc) {
              // Monitor connection state
              pc.onconnectionstatechange = () => {
                if (pc && pc.connectionState === 'connected') {
                  // Check for existing tracks
                  const transceivers = pc.getTransceivers()
                  transceivers.forEach((transceiver) => {
                    if (
                      transceiver.receiver.track &&
                      transceiver.receiver.track.readyState === 'live'
                    ) {
                      console.log('Found existing track after connection:', {
                        trackId: transceiver.receiver.track.id,
                        kind: transceiver.receiver.track.kind,
                        label: transceiver.receiver.track.label,
                      })
                      // Process existing tracks manually
                      const track = transceiver.receiver.track
                      const streams =
                        transceiver.receiver.track.readyState === 'live'
                          ? [new MediaStream([track])]
                          : []

                      const ev: RTCTrackEvent = new RTCTrackEvent('track', {
                        track: track,
                        streams: streams,
                        transceiver: transceiver,
                        receiver: transceiver.receiver,
                      })
                      // Re-use the onTrack handler logic
                      if (peer.pc.ontrack) {
                        peer.pc.ontrack(ev)
                      }
                    }
                  })
                }
              }

              // Monitor ICE connection state
              pc.oniceconnectionstatechange = () => {
                console.log(
                  `ICE connection state for ${candidateId}:`,
                  pc && pc.iceConnectionState
                )
              }
            } else {
              console.error('Failed to create peer connection for', candidateId)
            }

            // Store PC immediately BEFORE handling offer, so onTrack can access it
            pcsRef.current.set(candidateId, pc)
          }

          // Handle offer (initial or renegotiation)
          console.log('Processing offer from', candidateId)
          await setRemoteDescription(pc, data.sdp)
          const answer = await createAndSetAnswer(pc)
          signaling.send({ type: 'answer', sdp: answer, to: candidateId })
          console.log(
            'Sent answer to',
            candidateId,
            'transceivers:',
            pc.getTransceivers().length
          )

          // Log transceivers after answer and check for tracks
          setTimeout(() => {
            if (pc) {
              const transceivers = pc.getTransceivers()
              // console.log(
              //   'Transceivers after answer for',
              //   candidateId,
              //   ':',
              //   transceivers.map((t) => ({
              //     mid: t.mid,
              //     kind: t.receiver.track?.kind,
              //     trackId: t.receiver.track?.id,
              //     trackLabel: t.receiver.track?.label,
              //     trackState: t.receiver.track?.readyState,
              //   }))
              // )

              // Check if we have tracks but streams not set
              transceivers.forEach((transceiver) => {
                if (
                  transceiver.receiver.track &&
                  transceiver.receiver.track.readyState === 'live'
                ) {
                  const track = transceiver.receiver.track
                  const streamMap = streamMapsRef.current.get(candidateId)
                  if (streamMap) {
                    // Process this track
                    console.log('Processing existing track:', track.id)
                  }
                }
              })
            }
          }, 1000)
        })

        signaling.on('ice', async (data: any) => {
          const candidateId = data.from
          const pc = pcsRef.current.get(candidateId)
          if (pc) {
            try {
              await pc.addIceCandidate(data.candidate)
            } catch {}
          }
        })

        signaling.on('chat', (data: any) => {
          setMsgs((m) => [...m, { from: data.from, text: data.text }])
        })

        signaling.on('incident', (data: any) => {
          setIncidents((list) => [
            ...list,
            { ...data, id: Date.now() + Math.random() },
          ])
        })

        signaling.on('ai_analysis', (data: any) => {
          console.log('[AI Analysis] Received:', data)
          // Store latest analysis for this candidate
          setAiAnalysis((prev) => ({
            ...prev,
            [data.candidate_id || 'unknown']: data,
          }))

          // If there are alerts, add them as incidents
          if (data.analyses) {
            data.analyses.forEach((analysis: any) => {
              const alert = analysis.result?.alert
              if (alert) {
                console.log('[AI Analysis] Alert:', alert)
                setIncidents((list) => [
                  ...list,
                  {
                    id: Date.now() + Math.random(),
                    userId: data.candidate_id,
                    type: alert.type,
                    level: alert.level,
                    message: alert.message,
                    timestamp: data.timestamp,
                  },
                ])
              }
            })
          }
        })

        await signaling.connect()

        // Optional: Proctor can also send mic for talk-back on each pc created later
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          })
          if (localVideoRef.current) {
            localVideoRef.current.textContent = 'Mic live'
          }
          // Attach to future PCs upon creation
          ;(pcsRef.current as any).__talkbackStream = stream
        } catch {}
      } // End of P2P mode else block
    }

    init()

    return () => {
      try {
        sigRef.current?.close()
      } catch {}

      pcsRef.current.forEach((pc) => {
        try {
          pc.close()
        } catch {}
      })

      pcsRef.current.clear()
    }
  }, [roomId, userId])

  // Hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const macros: { [key: string]: string } = {
          S1: 'Đây là nhắc nhở cấp S1, vui lòng tuân thủ ngay.',
          S2: 'Đây là cảnh báo cấp S2. Nếu tái diễn sẽ tạm dừng/kết thúc phiên.',
          S3: 'Phiên có thể bị kết thúc do vi phạm nghiêm trọng.',
        }
        if (e.key === '1') {
          e.preventDefault()
          const text = macros.S1
          sigRef.current?.send({ type: 'chat', text })
          setMsgs((m) => [...m, { from: userId || 'proctor', text }])
        }
        if (e.key === '2') {
          e.preventDefault()
          const text = macros.S2
          sigRef.current?.send({ type: 'chat', text })
          setMsgs((m) => [...m, { from: userId || 'proctor', text }])
        }
        if (e.key === '3') {
          e.preventDefault()
          const text = macros.S3
          sigRef.current?.send({ type: 'chat', text })
          setMsgs((m) => [...m, { from: userId || 'proctor', text }])
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [userId])

  const sendChat = () => {
    if (!chat) return
    sigRef.current?.send({ type: 'chat', text: chat })
    setMsgs((m) => [...m, { from: userId || 'proctor', text: chat }])
    setChat('')
  }

  const controlCandidate = (candidateId: string, action: string) => {
    sigRef.current?.send({ type: 'control', action, to: candidateId })
  }

  const getSeverityColor = (level: string): string => {
    if (level === 'S3') return '#ff4d4f'
    if (level === 'S2') return '#faad14'
    return '#1890ff'
  }

  const getIncidentsByCandidate = (candidateId: string): Incident[] => {
    return incidents.filter(
      (it) =>
        it.from === candidateId ||
        it.by === candidateId ||
        it.userId === candidateId
    )
  }

  const groupedIncidents = Object.keys(remoteStreams).reduce((acc, uid) => {
    acc[uid] = getIncidentsByCandidate(uid)
    return acc
  }, {} as { [candidateId: string]: Incident[] })

  const macros = {
    S1: 'Đây là nhắc nhở cấp S1, vui lòng tuân thủ ngay.',
    S2: 'Đây là cảnh báo cấp S2. Nếu tái diễn sẽ tạm dừng/kết thúc phiên.',
    S3: 'Phiên có thể bị kết thúc do vi phạm nghiêm trọng.',
  }

  const sendMacro = (level: string) => {
    const text = macros[level as keyof typeof macros]
    if (!text) return
    sigRef.current?.send({ type: 'chat', text })
    setMsgs((m) => [...m, { from: userId || 'proctor', text }])
  }

  const getCandidateStatus = (
    candidateId: string
  ): 'online' | 'warning' | 'error' => {
    const candIncidents = groupedIncidents[candidateId] || []
    if (candIncidents.some((i) => i.level === 'S3')) return 'error'
    if (candIncidents.some((i) => i.level === 'S2')) return 'warning'
    return 'online'
  }

  return (
    <ProctorContainer>
      <MainContent>
        {/* Main Video Area */}
        <div>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                Proctor Dashboard
              </Title>
              <Text type="secondary">
                Room: {roomId} | User: {userId}
              </Text>
            </div>

            {focusedId ? (
              <FocusedView
                title={
                  <Space>
                    <PushpinFilled style={{ color: '#1890ff' }} />
                    Đang theo dõi: {focusedId}
                  </Space>
                }
                extra={
                  <Button
                    icon={<PushpinOutlined />}
                    onClick={() => setFocusedId(null)}
                  >
                    Bỏ pin
                  </Button>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Camera View</Text>
                    <VideoContainer>
                      <CandidateVideo
                        candidateId={focusedId}
                        stream={remoteStreams[focusedId]?.camera || null}
                        type="camera"
                        videoRefsRef={videoRefsRef}
                      />
                    </VideoContainer>
                  </Col>
                  <Col span={12}>
                    <Text strong>Screen Share</Text>
                    <VideoContainer $isScreen>
                      <CandidateVideo
                        candidateId={focusedId}
                        stream={remoteStreams[focusedId]?.screen || null}
                        type="screen"
                        videoRefsRef={videoRefsRef}
                      />
                    </VideoContainer>
                  </Col>
                </Row>
                <ControlPanel>
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={() => controlCandidate(focusedId, 'pause')}
                  >
                    Tạm dừng
                  </Button>
                  <Button
                    icon={<StopOutlined />}
                    danger
                    onClick={() => controlCandidate(focusedId, 'end')}
                  >
                    Kết thúc
                  </Button>
                </ControlPanel>
              </FocusedView>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Switch
                      checked={filterIncidents}
                      onChange={setFilterIncidents}
                    />
                    <Text>Chỉ hiển thị thí sinh có sự cố</Text>
                  </Space>
                </div>

                <VideoGrid>
                  {Object.entries(remoteStreams)
                    .filter(
                      ([uid]) =>
                        !filterIncidents ||
                        incidents.some(
                          (it) =>
                            it.from === uid ||
                            it.by === uid ||
                            it.userId === uid
                        )
                    )
                    .map(([uid, streams]) => {
                      const candIncidents = groupedIncidents[uid] || []
                      const s3Count = candIncidents.filter(
                        (i) => i.level === 'S3'
                      ).length
                      const s2Count = candIncidents.filter(
                        (i) => i.level === 'S2'
                      ).length
                      const analysis = aiAnalysis[uid]
                      const hasAlerts = analysis?.analyses?.some(
                        (a) => a.result?.alert
                      )

                      return (
                        <CandidateCard
                          key={uid}
                          $selected={selectedCandidate === uid}
                          $hasIncidents={candIncidents.length > 0}
                          title={
                            <Space>
                              <Text strong>{uid}</Text>
                              {s3Count > 0 && (
                                <Badge
                                  count={s3Count}
                                  style={{ backgroundColor: '#ff4d4f' }}
                                />
                              )}
                              {s2Count > 0 && (
                                <Badge
                                  count={s2Count}
                                  style={{ backgroundColor: '#faad14' }}
                                />
                              )}
                            </Space>
                          }
                          extra={
                            <Space>
                              <Button
                                size="small"
                                icon={<PushpinOutlined />}
                                onClick={() => setFocusedId(uid)}
                              >
                                Pin
                              </Button>
                              <Button
                                size="small"
                                type={
                                  selectedCandidate === uid
                                    ? 'primary'
                                    : 'default'
                                }
                                onClick={() =>
                                  setSelectedCandidate(
                                    uid === selectedCandidate ? null : uid
                                  )
                                }
                              >
                                Chọn
                              </Button>
                            </Space>
                          }
                        >
                          <div style={{ position: 'relative' }}>
                            <StatusBadge $status={getCandidateStatus(uid)}>
                              {getCandidateStatus(uid).toUpperCase()}
                            </StatusBadge>

                            {analysis && (
                              <AIBadge $hasAlerts={hasAlerts}>
                                <RobotOutlined />
                                AI
                              </AIBadge>
                            )}

                            <Row gutter={8}>
                              <Col span={12}>
                                <VideoContainer>
                                  <CandidateVideo
                                    candidateId={uid}
                                    stream={streams.camera}
                                    type="camera"
                                    videoRefsRef={videoRefsRef}
                                  />
                                </VideoContainer>
                              </Col>
                              <Col span={12}>
                                <VideoContainer $isScreen>
                                  <CandidateVideo
                                    candidateId={uid}
                                    stream={streams.screen}
                                    type="screen"
                                    videoRefsRef={videoRefsRef}
                                  />
                                </VideoContainer>
                              </Col>
                            </Row>
                          </div>
                        </CandidateCard>
                      )
                    })}
                </VideoGrid>

                {Object.keys(remoteStreams).length === 0 && (
                  <Alert
                    message="Chưa có thí sinh nào kết nối"
                    description="Các thí sinh sẽ xuất hiện ở đây khi họ tham gia phòng thi"
                    type="info"
                    showIcon
                  />
                )}
              </>
            )}

            {/* Chat Panel */}
            <ChatPanel title="Tin nhắn" style={{ marginTop: 16 }}>
              <MessageList>
                {msgs.map((message, index) => (
                  <MessageItem key={index} $isOwn={message.from === userId}>
                    <div className="sender">{message.from}</div>
                    <div className="text">{message.text}</div>
                  </MessageItem>
                ))}
                {msgs.length === 0 && (
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
                  icon={<SendOutlined />}
                  onClick={sendChat}
                >
                  Gửi
                </Button>
                <Space>
                  <Button size="small" onClick={() => sendMacro('S1')}>
                    S1
                  </Button>
                  <Button size="small" onClick={() => sendMacro('S2')}>
                    S2
                  </Button>
                  <Button size="small" danger onClick={() => sendMacro('S3')}>
                    S3
                  </Button>
                </Space>
              </ChatInputContainer>
            </ChatPanel>
          </Card>
        </div>

        {/* Sidebar */}
        <Sidebar>
          {/* AI Analysis Panel */}
          <AnalysisPanel
            title={
              <Space>
                <RobotOutlined />
                AI Monitoring
              </Space>
            }
          >
            {Object.keys(aiAnalysis).length === 0 ? (
              <Alert
                message="Đang chờ kết nối"
                description="AI sẽ bắt đầu giám sát khi thí sinh tham gia"
                type="info"
                showIcon
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(aiAnalysis).map(([candidateId, analysis]) => {
                  const alertCount =
                    analysis?.analyses?.filter((a) => a.result?.alert).length ||
                    0
                  return (
                    <Alert
                      key={candidateId}
                      message={candidateId}
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">
                            {analysis.scenario || 'Unknown scenario'}
                          </Text>
                          {alertCount > 0 && (
                            <Text type="warning">
                              <WarningOutlined /> {alertCount} cảnh báo
                            </Text>
                          )}
                        </Space>
                      }
                      type={alertCount > 0 ? 'warning' : 'info'}
                      showIcon
                    />
                  )
                })}
              </Space>
            )}
          </AnalysisPanel>

          {/* Incidents Panel */}
          <Card
            title={
              <Space>
                <WarningOutlined />
                Sự cố & Cảnh báo
              </Space>
            }
            extra={<Text type="secondary">{incidents.length} sự cố</Text>}
          >
            <ViewToggle>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                type={viewMode === 'timeline' ? 'primary' : 'default'}
                icon={<OrderedListOutlined />}
                onClick={() => setViewMode('timeline')}
              >
                Timeline
              </Button>
            </ViewToggle>

            <IncidentList>
              {incidents
                .filter(
                  (it) =>
                    !selectedCandidate ||
                    it.from === selectedCandidate ||
                    it.by === selectedCandidate ||
                    it.userId === selectedCandidate
                )
                .sort((a, b) => (b.ts || 0) - (a.ts || 0))
                .map((incident, index) => (
                  <IncidentItem
                    key={incident.id || index}
                    $level={incident.level}
                  >
                    <div className="header">
                      <Tag
                        color={
                          incident.level === 'S3'
                            ? 'red'
                            : incident.level === 'S2'
                            ? 'orange'
                            : 'blue'
                        }
                      >
                        {incident.level}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(
                          incident.ts || incident.timestamp || Date.now()
                        ).toLocaleTimeString()}
                      </Text>
                    </div>
                    <div className="meta">
                      {incident.tag || incident.type} •{' '}
                      {incident.by || incident.from || incident.userId}
                    </div>
                    <div className="message">
                      {incident.message || incident.note || 'Không có mô tả'}
                    </div>
                  </IncidentItem>
                ))}

              {incidents.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '40px 0',
                  }}
                >
                  <WarningOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div>Chưa có sự cố nào</div>
                </div>
              )}
            </IncidentList>
          </Card>
        </Sidebar>
      </MainContent>
    </ProctorContainer>
  )
}
