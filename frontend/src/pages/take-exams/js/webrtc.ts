interface CreatePeerOptions {
  onTrack?: (event: RTCTrackEvent) => void
  onIce?: (candidate: RTCIceCandidate) => void
  onDataMessage?: (data: string) => void
}

interface PeerConnection extends RTCPeerConnection {
  _trackLabels?: Map<string, string>
}

interface CreatePeerResult {
  pc: PeerConnection
  dc: RTCDataChannel
}

export async function createPeer({
  onTrack,
  onIce,
  onDataMessage,
}: CreatePeerOptions): Promise<CreatePeerResult> {
  const pc: PeerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  })

  pc.ontrack = (ev: RTCTrackEvent) => {
    if (onTrack) onTrack(ev) // Pass full event, not just stream
  }

  pc.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
    if (ev.candidate && onIce) onIce(ev.candidate)
  }

  const dc = pc.createDataChannel('chat')
  dc.onmessage = (ev: MessageEvent) => {
    if (onDataMessage) onDataMessage(ev.data)
  }

  return { pc, dc }
}

export async function addLocalStream(
  pc: PeerConnection,
  stream: MediaStream,
  label: string | null = null
): Promise<PeerConnection> {
  // Store track label mapping in peer connection for identification
  if (!pc._trackLabels) {
    pc._trackLabels = new Map<string, string>()
  }

  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream)
    // Store label mapping by track ID
    if (label && track.kind === 'video') {
      pc._trackLabels.set(track.id, label)
    }
  }

  return pc
}

export async function setRemoteDescription(
  pc: RTCPeerConnection,
  desc: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(desc))
}

export async function createAndSetOffer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  return offer
}

export async function createAndSetAnswer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  return answer
}
