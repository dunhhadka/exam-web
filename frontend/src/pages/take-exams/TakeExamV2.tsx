// @ts-ignore
import Tesseract from 'tesseract.js'
import React, { useEffect, useRef, useState } from 'react'
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
            console.log('Received answer from:', data.from)
            await setRemoteDescription(pcRef.current, data.sdp)
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
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2>Exam Session - Candidate: {userId}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                padding: '4px 12px',
                background: connected ? '#28a745' : '#dc3545',
                color: 'white',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {connected ? '● Connected' : '○ Disconnected'}
            </div>
            {recording && (
              <div
                style={{
                  padding: '4px 12px',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>●</span> Recording
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 16,
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: 4,
              marginBottom: 16,
              border: '1px solid #f5c6cb',
            }}
          >
            <strong>Lỗi:</strong> {error}
            <br />
            <small>
              Vui lòng đảm bảo backend đang chạy tại {SIGNALING_BASE}
            </small>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginLeft: 12,
                padding: '6px 12px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Tải lại trang
            </button>
          </div>
        )}

        {loading && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              background: '#f8f9fa',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              Đang khởi tạo kết nối...
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Đang kết nối đến server và khởi động camera/mic
            </div>
          </div>
        )}

        {/* AI Monitoring Status Panel */}
        {connected && aiStatus && (
          <div
            style={{
              padding: 12,
              background: recentAlerts.length > 0 ? '#fff3cd' : '#d4edda',
              border: `1px solid ${
                recentAlerts.length > 0 ? '#ffc107' : '#28a745'
              }`,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: recentAlerts.length > 0 ? '#ff9800' : '#28a745',
                  animation: 'pulse 2s infinite',
                }}
              ></span>
              <strong style={{ fontSize: 14 }}>
                🤖 AI đang theo dõi phiên thi của bạn
              </strong>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              Trạng thái:{' '}
              <span style={{ fontWeight: 'bold' }}>
                {aiStatus.scenario === 'normal'
                  ? '✓ Bình thường'
                  : `⚠ ${aiStatus.scenario}`}
              </span>
            </div>
            {recentAlerts.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid #ffc107',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: '#856404',
                    marginBottom: 4,
                  }}
                >
                  Cảnh báo gần đây:
                </div>
                {recentAlerts.slice(0, 3).map((alert, idx) => (
                  <div
                    key={idx}
                    style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}
                  >
                    • {alert.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 16,
            }}
          >
            {/* Left: Camera & Screen */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Camera View</h3>
                <div
                  style={{
                    position: 'relative',
                    background: '#000',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      minHeight: 360,
                      display: camEnabled && !loading ? 'block' : 'none',
                      transform: 'scaleX(-1)',
                    }}
                  />
                  {(!camEnabled || loading) && (
                    <div
                      style={{
                        width: '100%',
                        minHeight: 360,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#111',
                        color: '#fff',
                      }}
                    >
                      {loading ? 'Đang tải...' : 'Camera đã tắt'}
                    </div>
                  )}
                  {/* Audio level indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '8px 12px',
                      borderRadius: 4,
                    }}
                  >
                    <button
                      onClick={toggleMic}
                      style={{
                        padding: '6px 12px',
                        background: micMuted ? '#dc3545' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {micMuted ? '🎤 Muted' : '🎤 Mic'}
                    </button>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: '#333',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${audioLevel * 100}%`,
                          height: '100%',
                          background: micMuted ? '#666' : '#28a745',
                          transition: 'width 0.1s',
                        }}
                      />
                    </div>
                    <button
                      onClick={toggleCamera}
                      style={{
                        padding: '6px 12px',
                        background: camEnabled ? '#28a745' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {camEnabled ? '📹 Camera' : '📹 Off'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Screen Share */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <h3>Screen Share</h3>
                  <button
                    onClick={shareScreen}
                    disabled={isSharingScreen}
                    style={{
                      padding: '8px 16px',
                      background: isSharingScreen ? '#28a745' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: isSharingScreen ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSharingScreen ? '● Đang chia sẻ' : 'Chia sẻ màn hình'}
                  </button>
                </div>
                <div
                  style={{
                    position: 'relative',
                    background: '#111',
                    borderRadius: 8,
                    overflow: 'hidden',
                    minHeight: 240,
                  }}
                >
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      display: isSharingScreen ? 'block' : 'none',
                    }}
                  />
                  {!isSharingScreen && (
                    <div
                      style={{
                        width: '100%',
                        minHeight: 240,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                      }}
                    >
                      Chưa chia sẻ màn hình
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              </div>

              {/* Checklist */}
              <div
                style={{ padding: 16, background: '#f8f9fa', borderRadius: 8 }}
              >
                <h4 style={{ marginTop: 0 }}>Checklist</h4>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={checklist.cam}
                    onChange={(e) =>
                      setChecklist((c) => ({ ...c, cam: e.target.checked }))
                    }
                  />{' '}
                  Camera rõ mặt, ánh sáng đủ
                </label>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={checklist.screen}
                    onChange={() => {}}
                    disabled
                  />{' '}
                  Đang chia sẻ màn hình
                </label>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={checklist.oneDisplay}
                    onChange={(e) =>
                      setChecklist((c) => ({
                        ...c,
                        oneDisplay: e.target.checked,
                      }))
                    }
                  />{' '}
                  Chỉ một màn hình
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={checklist.noHeadset}
                    onChange={(e) =>
                      setChecklist((c) => ({
                        ...c,
                        noHeadset: e.target.checked,
                      }))
                    }
                  />{' '}
                  Không tai nghe
                </label>
              </div>
            </div>

            {/* Right: Proctor View & Chat */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8 }}>
                  Proctor View (What Proctor Sees)
                </h3>
                <div
                  style={{
                    position: 'relative',
                    background: '#000',
                    borderRadius: 8,
                    overflow: 'hidden',
                    minHeight: 400,
                  }}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      minHeight: 400,
                    }}
                  />
                  {!connected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#fff',
                        textAlign: 'center',
                      }}
                    >
                      Chờ kết nối Proctor...
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  Proctor sẽ thấy:{' '}
                  {isSharingScreen ? 'Màn hình của bạn' : 'Camera của bạn'} +
                  Audio
                </div>
              </div>

              {/* Chat */}
              <div style={{ marginTop: 16 }}>
                <h4>Chat với Giám thị</h4>
                <div
                  style={{
                    height: 200,
                    overflow: 'auto',
                    border: '1px solid #ddd',
                    padding: 12,
                    background: '#fff',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  {msgs.length === 0 ? (
                    <div
                      style={{
                        color: '#999',
                        textAlign: 'center',
                        padding: 20,
                      }}
                    >
                      Chưa có tin nhắn
                    </div>
                  ) : (
                    msgs.map((m, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <strong
                          style={{
                            color: m.from === userId ? '#007bff' : '#28a745',
                          }}
                        >
                          {m.from === userId ? 'Bạn' : m.from}:
                        </strong>
                        <span style={{ marginLeft: 8 }}>{m.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={chat}
                    onChange={(e) => setChat(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Nhập tin nhắn..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                    }}
                  />
                  <button
                    onClick={sendChat}
                    style={{
                      padding: '8px 16px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// A5 OCR sampling loop
function useScreenOCR({
  screenVideoRef,
  canvasRef,
  sigRef,
  userId,
}: UseScreenOCRParams) {
  useEffect(() => {
    let timer: number
    const blacklist = //import.meta.env.VITE_OCR_BLACKLIST ||
      'cheat,answer,google,chatgpt,stack overflow'
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)

    const run = async () => {
      const video = screenVideoRef.current
      if (!video || !video.srcObject) return
      const canvas = canvasRef.current
      if (!canvas) return

      const w = Math.min(1280, video.videoWidth || 1280)
      const h = Math.min(720, video.videoHeight || 720)
      if (!w || !h) return

      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, w, h)
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(canvas, 'eng')
        const lower = (text || '').toLowerCase()
        if (lower && blacklist.some((k) => lower.includes(k))) {
          sigRef.current?.send({
            type: 'incident',
            tag: 'A5',
            level: 'S2',
            note: 'OCR match blacklist',
            ts: Date.now(),
            by: userId,
          })
        }
      } catch (error) {
        console.warn('OCR error:', error)
      }
    }

    const loop = () => {
      run()
      timer = window.setTimeout(
        loop,
        parseInt(
          //import.meta.env.VITE_OCR_INTERVAL_MS ||
          '6000',
          10
        )
      )
    }

    loop()
    return () => window.clearTimeout(timer)
  }, [screenVideoRef, canvasRef, sigRef, userId])
}
