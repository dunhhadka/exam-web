import { useEffect } from 'react'

// Để fix lỗi "Property 'env' does not exist on type 'ImportMeta'",
// bạn cần thêm vào tsconfig.json (nếu dùng Vite):
// {
//   "compilerOptions": {
//     "types": ["vite/client"]
//   }
// }
// Hoặc install @types/node nếu cần. Giả sử đã config, code dưới đây sẽ work.

interface UseScreenOCRProps {
  screenVideoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  sigRef: React.RefObject<{ send: (msg: any) => void } | null>
  userId?: string | null
}

export function useScreenOCR({
  screenVideoRef,
  canvasRef,
  sigRef,
  userId,
}: UseScreenOCRProps): void {
  useEffect(() => {
    let timer: number | null = null
    const blacklist = //import.meta.env.VITE_OCR_BLACKLIST ||
      'cheat,answer,google,chatgpt,stack overflow'
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean) as string[]

    const run = async (): Promise<void> => {
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
        // Assuming Tesseract is imported/available globally; adjust import as needed
        // import Tesseract from 'tesseract.js'; // Uncomment if needed
        const {
          data: { text },
        } = await (window as any).Tesseract.recognize(canvas, 'eng')
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
        console.error('OCR recognition failed:', error)
      }
    }

    const loop = (): void => {
      run().finally(() => {
        const interval = parseInt(
          //import.meta.env.VITE_OCR_INTERVAL_MS ||
          '6000',
          10
        )
        timer = window.setTimeout(loop, interval)
      })
    }

    loop()

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [screenVideoRef, canvasRef, sigRef, userId])
}
