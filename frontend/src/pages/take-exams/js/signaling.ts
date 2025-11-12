type MessageType =
  | 'join'
  | 'leave'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'close'
  | string // Cho phép các message types khác

interface SignalingMessage {
  type: MessageType
  userId?: string
  role?: string
  [key: string]: any // Cho phép các fields bổ sung
}

interface SignalingClientConfig {
  baseUrl: string
  roomId: string
  userId: string
  role: string
}

type MessageHandler = (data: SignalingMessage) => void

export class SignalingClient {
  private baseUrl: string
  private roomId: string
  private userId: string
  private role: string
  private ws: WebSocket | null
  private listeners: Map<MessageType, MessageHandler>

  constructor({ baseUrl, roomId, userId, role }: SignalingClientConfig) {
    this.baseUrl = baseUrl.replace(/^http/, 'ws')
    this.roomId = roomId
    this.userId = userId
    this.role = role
    this.ws = null
    this.listeners = new Map()
  }

  on(type: MessageType, handler: MessageHandler): void {
    this.listeners.set(type, handler)
  }

  off(type: MessageType): void {
    this.listeners.delete(type)
  }

  async connect(maxRetries: number = 3, timeout: number = 5000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.ws = new WebSocket(`${this.baseUrl}/ws/${this.roomId}`)

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            this.ws?.close()
            reject(new Error('WebSocket connection timeout'))
          }, timeout)

          if (!this.ws) {
            clearTimeout(timer)
            reject(new Error('WebSocket not initialized'))
            return
          }

          this.ws.onopen = () => {
            clearTimeout(timer)
            resolve()
          }

          this.ws.onerror = () => {
            clearTimeout(timer)
            reject(new Error('WebSocket connection error'))
          }

          this.ws.onclose = (e: CloseEvent) => {
            clearTimeout(timer)
            if (e.code !== 1000) {
              reject(new Error(`WebSocket closed: ${e.code} ${e.reason}`))
            }
          }
        })

        // Setup message handler
        if (this.ws) {
          this.ws.onmessage = (ev: MessageEvent) => {
            try {
              const data = JSON.parse(ev.data) as SignalingMessage
              console.log(
                '[SignalingClient] Received message:',
                data.type,
                data
              )
              const handler = this.listeners.get(data.type)
              if (handler) {
                handler(data)
              } else {
                console.warn(
                  '[SignalingClient] No handler for message type:',
                  data.type
                )
              }
            } catch (e) {
              console.error('Failed to parse message:', e)
            }
          }

          this.ws.onclose = () => {
            const handler = this.listeners.get('close')
            if (handler) handler({ type: 'close' })
          }
        }

        // Send join message
        this.send({ type: 'join', userId: this.userId, role: this.role })
        return // Success
      } catch (error) {
        console.warn(`WebSocket connection attempt ${i + 1} failed:`, error)
        if (i === maxRetries - 1) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          throw new Error(
            `Failed to connect after ${maxRetries} attempts: ${errorMessage}`
          )
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
  }

  send(obj: SignalingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj))
    }
  }

  close(): void {
    try {
      this.send({ type: 'leave' })
    } catch {
      // Ignore errors when closing
    }
    this.ws?.close()
  }
}
