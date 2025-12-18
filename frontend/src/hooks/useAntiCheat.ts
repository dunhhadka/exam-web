import { useEffect, useRef } from 'react'
import { getToastInstance } from '../ToastProvider'
import { useIncrementFullscreenExitCountMutation } from '../services/api/take-exam'

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
  const devtoolsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const warningCountRef = useRef<number>(0)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<number>(5)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCountdownActiveRef = useRef<boolean>(false)
  const fullscreenExitCountRef = useRef<number>(0)
  const initTimeRef = useRef<number>(Date.now())
  const [incrementFullscreenExitCount] = useIncrementFullscreenExitCountMutation()

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
      if (toast) {
        toast.warning(' Cảnh báo', 'Không được phép sao chép trong quá trình làm bài thi!', 3)
      }
      return false
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (toast) {
        toast.warning(' Cảnh báo', 'Không được phép cắt trong quá trình làm bài thi!', 3)
      }
      return false
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (toast) {
        toast.warning(' Cảnh báo', 'Không được phép dán trong quá trình làm bài thi!', 3)
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
          toast.warning(' Cảnh báo', `Không được phép ${action} trong quá trình làm bài thi!`, 3)
        }
        return false
      }
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase())) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault()
        e.stopPropagation()
        if (toast) {
          toast.warning(' Cảnh báo', 'Không được phép mở Developer Tools trong quá trình làm bài thi!', 3)
        }
        return false
      }
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
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              'Bạn không được phép chuyển sang tab khác. Bài thi sẽ bị chặn.',
              10
            )
          }
          // Có thể redirect hoặc chặn ở đây
          return
        }

        // Nếu vượt quá số lần cho phép
        if (blurCount > maxWindowBlurAllowed) {
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              `Bạn đã chuyển sang tab khác quá ${maxWindowBlurAllowed} lần. Bài thi sẽ bị chặn.`,
              10
            )
          }
          return
        }

        // Cảnh báo
        if (!warningShown) {
          warningShown = true
          if (toast) {
            toast.warning(
              ' Cảnh báo',
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
                '❌ Vi phạm',
                'Bạn không được phép chuyển sang tab khác. Bài thi sẽ bị chặn.',
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
                '❌ Vi phạm',
                `Bạn đã chuyển sang tab khác quá ${maxWindowBlurAllowed} lần. Bài thi sẽ bị chặn.`,
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
    const FULLSCREEN_REQUEST_COOLDOWN = 5000

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

    const handleFullscreenChange = async () => {
      const isFullscreen =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      if (!isFullscreen && settings.requireFullscreen) {
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
        // Nếu maxAllowed = 0, chặn ngay lần đầu tiên
        if (maxAllowed === 0 && fullscreenExitCountRef.current > 0) {
          const toast = getToastInstance()
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              'Bạn không được phép thu nhỏ màn hình. Bài thi sẽ bị chặn.',
              10
            )
          }
          return
        }

        // Nếu vượt quá số lần cho phép
        if (fullscreenExitCountRef.current > maxAllowed) {
          const toast = getToastInstance()
          if (toast) {
            toast.error(
              '❌ Vi phạm',
              `Bạn đã thoát khỏi chế độ toàn màn hình quá ${maxAllowed} lần. Bài thi sẽ bị chặn.`,
              10
            )
          }
          return
        }

        const toast = getToastInstance()
        if (toast) {
          toast.warning(
            ' Cảnh báo',
            `Bạn đã thoát khỏi chế độ toàn màn hình (${fullscreenExitCountRef.current}/${maxAllowed} lần). Vui lòng quay lại toàn màn hình ngay.`,
            5
          )
        }

        setTimeout(() => {
          const now = Date.now()
          if ((now - lastFullscreenRequestTime) > FULLSCREEN_REQUEST_COOLDOWN) {
            lastFullscreenRequestTime = now
            requestFullscreen()
          }
        }, 1000)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    const fullscreenCheckInterval = setInterval(checkFullscreen, 5000)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      clearInterval(fullscreenCheckInterval)
    }
  }, [settings?.preventMinimize, settings?.requireFullscreen, settings?.attemptId, settings?.maxFullscreenExitAllowed, incrementFullscreenExitCount])
}