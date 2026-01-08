import { useEffect, useRef, useState } from 'react'
import { getToastInstance } from '../ToastProvider'
import { useIncrementFullscreenExitCountMutation } from '../services/api/take-exam'
import { useCreateLogMutation } from '../services/api/logApi'
import { getProctoringSignalingClient } from '../utils/proctoringSignaling'

interface AntiCheatSettings {
  disableCopyPaste?: boolean
  disableDeveloperTools?: boolean
  preventTabSwitch?: boolean
  preventMinimize?: boolean
  requireFullscreen?: boolean
  examCode?: string
  attemptId?: number
  maxFullscreenExitAllowed?: number
  maxWindowBlurAllowed?: number
}

export const useAntiCheat = (settings?: AntiCheatSettings) => {
  const fullscreenExitCountRef = useRef<number>(0)
  const lastFullscreenChangeTimeRef = useRef<number>(0)
  const [incrementFullscreenExitCount] = useIncrementFullscreenExitCountMutation()
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false)
  const [createLog] = useCreateLogMutation()

  // Helper function to log anti-cheat warnings
  const logWarning = async (
    logType: 'DEVTOOLS_OPEN' | 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'COPY_PASTE_ATTEMPT' | 'SUSPICIOUS_ACTIVITY' | 'OTHER',
    severity: 'INFO' | 'WARNING' | 'SERIOUS' | 'CRITICAL',
    message: string
  ) => {
    if (!settings?.attemptId) {
      console.warn('Cannot log warning: attemptId not provided')
      return
    }

    const severityToLevel = (s: typeof severity) => {
      switch (s) {
        case 'INFO':
          return 'S1'
        case 'WARNING':
          return 'S2'
        case 'SERIOUS':
          return 'S3'
        case 'CRITICAL':
          return 'S4'
        default:
          return 'S2'
      }
    }

    // Best-effort: also push incident to proctor via signaling WebSocket (if connected)
    try {
      const signaling = getProctoringSignalingClient()
      signaling?.send({
        type: 'incident',
        tag: logType,
        level: severityToLevel(severity),
        note: message,
        ts: Date.now(),
        attemptId: settings.attemptId,
      })
    } catch (e) {
      // no-op (WS optional)
    }

    try {
      await createLog({
        attemptId: settings.attemptId,
        logType,
        severity,
        message,
      }).unwrap()
      console.log(`📝 Log saved: ${logType} - ${message}`)
    } catch (error) {
      console.error('Failed to save log:', error)
    }
  }

  useEffect(() => {
    console.log('🛡️ useAntiCheat - Settings received:', {
      hasSettings: !!settings,
      disableCopyPaste: settings?.disableCopyPaste,
      disableDeveloperTools: settings?.disableDeveloperTools,
      preventTabSwitch: settings?.preventTabSwitch,
      preventMinimize: settings?.preventMinimize,
      requireFullscreen: settings?.requireFullscreen,
    })
  }, [settings])

  useEffect(() => {
    if (!settings?.disableCopyPaste) return

    console.log('🛡️ useAntiCheat - ✅ Enabling copy-paste protection')

    const toast = getToastInstance()

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      logWarning('COPY_PASTE_ATTEMPT', 'WARNING', 'Cố gắng sao chép nội dung')
      if (toast) {
        toast.warning('⚠ Cảnh báo', 'Không được phép sao chép trong quá trình làm bài thi!', 3)
      }
      return false
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      logWarning('COPY_PASTE_ATTEMPT', 'WARNING', 'Cố gắng cắt nội dung')
      if (toast) {
        toast.warning('⚠ Cảnh báo', 'Không được phép cắt trong quá trình làm bài thi!', 3)
      }
      return false
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      logWarning('COPY_PASTE_ATTEMPT', 'WARNING', 'Cố gắng dán nội dung')
      if (toast) {
        toast.warning('⚠ Cảnh báo', 'Không được phép dán trong quá trình làm bài thi!', 3)
      }
      return false
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (toast) {
          const action = e.key.toLowerCase() === 'c' ? 'sao chép' : 
                        e.key.toLowerCase() === 'v' ? 'dán' : 
                        e.key.toLowerCase() === 'x' ? 'cắt' : 'chọn tất cả'
          toast.warning('⚠ Cảnh báo', `Không được phép ${action} trong quá trình làm bài thi!`, 3)
        }
        return false
      }
      // Bỏ xử lý F12 ở đây vì đã có trong disableDeveloperTools effect
    }

    document.addEventListener('copy', handleCopy, true)
    document.addEventListener('cut', handleCut, true)
    document.addEventListener('paste', handlePaste, true)
    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('copy', handleCopy, true)
      document.removeEventListener('cut', handleCut, true)
      document.removeEventListener('paste', handlePaste, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [settings?.disableCopyPaste])

  useEffect(() => {
    if (!settings?.disableDeveloperTools) return

    console.log('🛡️ AntiCheat - Developer Tools Protection ENABLED (SAFE VERSION)')
    const toast = getToastInstance()

    let baselineWidth = window.outerWidth - window.innerWidth
    let baselineHeight = window.outerHeight - window.innerHeight
    let isChecking = false
    let initialized = false

    const initTimeout = setTimeout(() => {
      initialized = true
      baselineWidth = window.outerWidth - window.innerWidth
      baselineHeight = window.outerHeight - window.innerHeight
      console.log('🛡️ AntiCheat - DevTools baseline initialized:', {
        baselineWidth,
        baselineHeight
      })
    }, 1500)

    const startWarning = () => {
      if (!toast) return
      toast.warning(
        'Cảnh báo',
        'Không được phép mở Developer Tools trong quá trình làm bài thi!',
        3
      )
    }

    const detectConsoleToString = () => {
      let detected = false
      const obj = {
        toString() {
          detected = true
          return ''
        }
      }
      console.log('%c', obj)
      return detected
    }

    const detectConsoleTable = () => {
      let detected = false
      const obj: any = {}
      Object.defineProperty(obj, 'x', {
        get() {
          detected = true
          return 'detected'
        }
      })
      console.table([obj])
      return detected
    }


    const detectConsoleDir = () => {
      let detected = false
      const obj: any = {}
      Object.defineProperty(obj, 'y', {
        get() {
          detected = true
          return 'detected'
        }
      })
      console.dir(obj)
      return detected
    }

    const detectFirebug = () => {
      return (window as any).Firebug ||
        (console as any).firebug ||
        (console as any).exception
        ? true
        : false
    }

    const detectWindowSize = () => {
      const dw = (window.outerWidth - window.innerWidth) - baselineWidth
      const dh = (window.outerHeight - window.innerHeight) - baselineHeight

      if (dw < 0 || dh < 0) {
        return false
      }

      const verticalDevtools = dw > 160 && window.innerWidth > 900
      const horizontalDevtools = dh > 160 && window.innerHeight > 500

      return verticalDevtools || horizontalDevtools
    }

    const detectDevtools = () => {
      if (!initialized || isChecking) return false
      isChecking = true

      const detected =
        detectConsoleToString() ||
        detectConsoleTable() ||
        detectConsoleDir() ||
        detectFirebug() ||
        detectWindowSize()

      isChecking = false
      return detected
    }

    const interval = setInterval(() => {
      const opened = detectDevtools()
      if (opened) {
        console.log('🛡️ AntiCheat - DEVTOOLS DETECTED')
        logWarning('DEVTOOLS_OPEN', 'CRITICAL', 'Phát hiện Developer Tools đang mở')
        startWarning()

        const examCode =
          settings.examCode ||
          new URLSearchParams(window.location.search).get('code')

        const redirectUrl = examCode
          ? `/exam-checkin?code=${examCode}`
          : '/exam-checkin'

        window.location.href = redirectUrl
      }
    }, 1200)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault()
        e.stopPropagation()
        startWarning()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      clearTimeout(initTimeout)
      clearInterval(interval)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [settings?.disableDeveloperTools, settings?.examCode])

  useEffect(() => {
    if (!settings?.preventTabSwitch) return

    const maxWindowBlurAllowed = settings?.maxWindowBlurAllowed ?? 0
    console.log('🛡️ useAntiCheat - ✅ Enabling tab switch protection', {
      maxWindowBlurAllowed,
    })

    let blurCount = 0
    let warningShown = false
    let isInitialized = false
    let blurTimeout: NodeJS.Timeout | null = null

    const initTimeout = setTimeout(() => {
      isInitialized = true
      console.log('🛡️ useAntiCheat - Tab switch protection initialized')
    }, 2000)

    const toast = getToastInstance()

    const handleVisibilityChange = () => {
      if (!isInitialized) return

      if (document.hidden) {
        blurCount += 1
        console.log('🛡️ useAntiCheat - Tab hidden detected', {
          blurCount,
          maxAllowed: maxWindowBlurAllowed,
        })

        // Nếu maxWindowBlurAllowed = 0, chặn ngay lần đầu tiên
        if (maxWindowBlurAllowed === 0 && blurCount > 0) {
          logWarning('TAB_SWITCH', 'SERIOUS', 'Chuyển tab khi không được phép (maxAllowed = 0)')
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              'Bạn không được phép chuyển sang tab khác',
              10
            )
          }
          return
        }

        // Nếu vượt quá số lần cho phép
        if (blurCount > maxWindowBlurAllowed) {
          logWarning('TAB_SWITCH', 'SERIOUS', `Chuyển tab vượt quá giới hạn: ${blurCount}/${maxWindowBlurAllowed}`)
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              `Bạn đã chuyển sang tab khác quá ${maxWindowBlurAllowed} lần.`,
              10
            )
          }
          return
        }

        // Cảnh báo
        if (!warningShown) {
          warningShown = true
          logWarning('TAB_SWITCH', 'WARNING', `Chuyển tab lần ${blurCount}/${maxWindowBlurAllowed}`)
          if (toast) {
            toast.warning(
              '⚠ Cảnh báo',
              `Bạn đã rời khỏi màn hình làm bài (${blurCount}/${maxWindowBlurAllowed} lần)! Vui lòng quay lại ngay.`,
              5
            )
          }
        }
      } else {
        warningShown = false
        console.log('🛡️ useAntiCheat - Tab visible again')
      }
    }

    const handleBlur = () => {
      if (!isInitialized) return

      if (blurTimeout) {
        clearTimeout(blurTimeout)
      }

      blurTimeout = setTimeout(() => {
        if (document.hidden && !warningShown) {
          blurCount += 1
          console.log('🛡️ useAntiCheat - Window blur with tab hidden detected', {
            blurCount,
            maxAllowed: maxWindowBlurAllowed,
          })

          // Nếu maxWindowBlurAllowed = 0, chặn ngay lần đầu tiên
          if (maxWindowBlurAllowed === 0 && blurCount > 0) {
            const toast = getToastInstance()
            if (toast) {
              toast.error(
                'Vi phạm',
                'Bạn không được phép chuyển sang tab khác.',
                10
              )
            }
            return
          }

          // Nếu vượt quá số lần cho phép
          if (blurCount > maxWindowBlurAllowed) {
            const toast = getToastInstance()
            if (toast) {
              toast.error(
                'Vi phạm',
                `Bạn đã chuyển sang tab khác quá ${maxWindowBlurAllowed} lần.`,
                10
              )
            }
            return
          }

          warningShown = true
          const toast = getToastInstance()
          if (toast) {
            toast.warning(
              ' Cảnh báo',
              `Cửa sổ làm bài đã mất focus (${blurCount}/${maxWindowBlurAllowed} lần)! Vui lòng quay lại ngay.`,
              5
            )
          }
        }
      }, 500)
    }

    const handleFocus = () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout)
        blurTimeout = null
      }
      warningShown = false
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearTimeout(initTimeout)
      if (blurTimeout) {
        clearTimeout(blurTimeout)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [settings?.preventTabSwitch, settings?.maxWindowBlurAllowed])

  useEffect(() => {
    if (!settings?.preventMinimize) {
      console.log('🛡️ useAntiCheat - ⏭️ Skipping fullscreen protection (preventMinimize not enabled)')
      return
    }

    if (!settings?.attemptId) {
      console.log('🛡️ useAntiCheat - ⏭️ Skipping fullscreen protection (attempt not started yet)')
      return
    }

    console.log('🛡️ useAntiCheat - ✅ Enabling fullscreen protection', {
      preventMinimize: settings.preventMinimize,
      requireFullscreen: settings.requireFullscreen,
      attemptId: settings.attemptId,
      maxFullscreenExitAllowed: settings.maxFullscreenExitAllowed,
    })

    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen()
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen()
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen()
        }
      } catch (error: any) {
        if (error?.name !== 'NotAllowedError' &&
          error?.message &&
          !error.message.includes('user gesture') &&
          !error.message.includes('Permissions check failed')) {
          console.warn('Fullscreen request failed:', error)
        }
      }
    }

    let lastFullscreenRequestTime = 0
    const FULLSCREEN_REQUEST_COOLDOWN = 100 // Giảm từ 5000ms xuống 100ms để request nhanh hơn
    const FULLSCREEN_CHANGE_DEBOUNCE = 500 // 500ms debounce

    const checkFullscreen = () => {
      const isFullscreen =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      const now = Date.now()
      if (!isFullscreen && settings.requireFullscreen && (now - lastFullscreenRequestTime) > FULLSCREEN_REQUEST_COOLDOWN) {
        lastFullscreenRequestTime = now
        requestFullscreen()
      }
    }

    if (settings.requireFullscreen) {
      lastFullscreenRequestTime = Date.now()
      requestFullscreen()
    }

    // Chặn ESC key để ngăn user thoát fullscreen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settings.requireFullscreen) {
        const isFullscreen =
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement

        if (isFullscreen) {
          e.preventDefault()
          e.stopPropagation()
          const toast = getToastInstance()
          if (toast) {
            toast.warning(
              '⚠ Cảnh báo',
              'Không được phép thoát chế độ toàn màn hình trong khi làm bài!',
              3
            )
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    const handleFullscreenChange = async () => {
      // Debounce để tránh gọi nhiều lần (vì có 4 event listeners)
      const now = Date.now()
      if (now - lastFullscreenChangeTimeRef.current < FULLSCREEN_CHANGE_DEBOUNCE) {
        console.log('🛡️ useAntiCheat - Debouncing fullscreen change event')
        return
      }
      lastFullscreenChangeTimeRef.current = now

      const isFullscreen =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      if (!isFullscreen && settings.requireFullscreen) {
        // Hiển thị overlay ngay lập tức
        setShowFullscreenOverlay(true)
        
        fullscreenExitCountRef.current += 1

        if (settings.attemptId) {
          try {
            await incrementFullscreenExitCount(settings.attemptId).unwrap()
            console.log('🛡️ useAntiCheat - Fullscreen exit count incremented:', fullscreenExitCountRef.current)
          } catch (error) {
            console.error('🛡️ useAntiCheat - Failed to increment fullscreen exit count:', error)
          }
        }

        const maxAllowed = settings.maxFullscreenExitAllowed ?? 0
        
        // Nếu maxAllowed = 0, không hiện toast vì đã có overlay
        if (maxAllowed === 0 && fullscreenExitCountRef.current > 0) {
          console.log('🛡️ useAntiCheat - maxAllowed = 0, blocking immediately with overlay')
          logWarning('FULLSCREEN_EXIT', 'CRITICAL', 'Thoát fullscreen khi không được phép (maxAllowed = 0)')
          return
        }

        // Nếu vượt quá số lần cho phép
        if (fullscreenExitCountRef.current > maxAllowed) {
          logWarning('FULLSCREEN_EXIT', 'SERIOUS', `Thoát fullscreen vượt quá giới hạn: ${fullscreenExitCountRef.current}/${maxAllowed}`)
          const toast = getToastInstance()
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              `Bạn đã thoát khỏi chế độ toàn màn hình quá ${maxAllowed} lần.`,
              10
            )
          }
          return
        }

        // Chỉ hiện toast cảnh báo khi còn trong giới hạn
        logWarning('FULLSCREEN_EXIT', 'WARNING', `Thoát fullscreen lần ${fullscreenExitCountRef.current}/${maxAllowed}`)
        const toast = getToastInstance()
        if (toast) {
          toast.warning(
            '⚠ Cảnh báo',
            `Bạn đã thoát khỏi chế độ toàn màn hình (${fullscreenExitCountRef.current}/${maxAllowed} lần). Vui lòng quay lại toàn màn hình ngay.`,
            5
          )
        }

        // Request fullscreen lại NGAY LẬP TỨC (bỏ setTimeout 1s)
        const requestNow = Date.now()
        if ((requestNow - lastFullscreenRequestTime) > FULLSCREEN_REQUEST_COOLDOWN) {
          lastFullscreenRequestTime = requestNow
          requestFullscreen()
        }
      } else if (isFullscreen) {
        // Ẩn overlay khi đã vào fullscreen trở lại
        setShowFullscreenOverlay(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    const fullscreenCheckInterval = setInterval(checkFullscreen, 5000)

    // Tạo và inject overlay element
    const overlay = document.createElement('div')
    overlay.id = 'fullscreen-warning-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    overlay.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 72px; margin-bottom: 24px;">⚠️</div>
        <h1 style="font-size: 32px; margin-bottom: 16px;">Vui lòng quay lại chế độ toàn màn hình!</h1>
        <p style="font-size: 18px; color: #ffa940; margin-bottom: 32px;">
          Bạn đã thoát khỏi chế độ toàn màn hình.<br/>
          Hệ thống yêu cầu bạn phải ở chế độ toàn màn hình để tiếp tục làm bài.
        </p>
        <button id="return-fullscreen-btn" style="
          padding: 16px 32px;
          font-size: 18px;
          background: #1890ff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        ">
          🖥️ Quay lại Toàn Màn Hình
        </button>
      </div>
    `
    document.body.appendChild(overlay)

    const returnBtn = document.getElementById('return-fullscreen-btn')
    if (returnBtn) {
      returnBtn.onclick = () => {
        lastFullscreenRequestTime = Date.now()
        requestFullscreen()
      }
    }

    // Observer để hiển thị/ẩn overlay
    const updateOverlay = () => {
      if (showFullscreenOverlay && settings.requireFullscreen) {
        overlay.style.display = 'flex'
      } else {
        overlay.style.display = 'none'
      }
    }

    // Gọi ngay và set interval
    updateOverlay()
    const overlayInterval = setInterval(updateOverlay, 100)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      clearInterval(fullscreenCheckInterval)
      clearInterval(overlayInterval)
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    }
  }, [settings?.preventMinimize, settings?.requireFullscreen, settings?.attemptId, settings?.maxFullscreenExitAllowed, incrementFullscreenExitCount, showFullscreenOverlay])
}