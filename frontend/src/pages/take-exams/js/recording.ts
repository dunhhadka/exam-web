/**
 * Recording Service: Ghi video camera + screen
 * Client-side MediaRecorder API
 */
export class RecordingService {
  private recorders: Map<string, MediaRecorder> = new Map()
  private chunks: Map<string, Blob[]> = new Map()
  private startTime: number | null = null

  async startRecording(
    stream: MediaStream,
    streamId: string = 'main'
  ): Promise<void> {
    if (this.recorders.has(streamId)) {
      console.warn(`Recording ${streamId} already started`)
      return
    }

    const options: MediaRecorderOptions = {
      mimeType: 'video/webm;codecs=vp9,opus',
    }
    const recorder = new MediaRecorder(stream, options)
    const chunks: Blob[] = []

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      this.chunks.set(streamId, [blob]) // Note: This may not execute in normal flow due to override in stopRecording
    }

    this.recorders.set(streamId, recorder)
    this.chunks.set(streamId, chunks)
    recorder.start(1000) // chunk every 1s
    if (!this.startTime) this.startTime = Date.now()
  }

  async stopRecording(streamId: string = 'main'): Promise<Blob | null> {
    const recorder = this.recorders.get(streamId)
    if (!recorder) return null

    return new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const chunkData = this.chunks.get(streamId) || []
        const blob = new Blob(chunkData, { type: 'video/webm' })
        this.recorders.delete(streamId)
        this.chunks.delete(streamId)
        resolve(blob)
      }
      recorder.stop()
    })
  }

  async stopAll(): Promise<Record<string, Blob | null>> {
    const results: Record<string, Blob | null> = {}
    const keys = Array.from(this.recorders.keys())
    for (const streamId of keys) {
      results[streamId] = await this.stopRecording(streamId)
    }
    this.startTime = null
    return results
  }

  getDuration(): number {
    if (!this.startTime) return 0
    return Date.now() - this.startTime
  }

  download(blob: Blob, filename?: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `recording-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }
}
