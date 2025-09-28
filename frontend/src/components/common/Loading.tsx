import React from 'react'
import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import type { SpinIndicator } from 'antd/es/spin'

/** Custom spinner elements — đảm bảo là ReactElement */
const CustomSpinners: Record<'dots' | 'bars' | 'pulse', React.ReactElement> = {
  dots: (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  ),
  bars: (
    <div className="flex space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-blue-500 animate-pulse"
          style={{
            height: '20px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  ),
  pulse: (
    <div className="relative">
      <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75" />
      <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full animate-pulse" />
    </div>
  ),
}

interface Props {
  size?: 'small' | 'default' | 'large'
  tip?: string
  overlay?: boolean
  /** nhận ReactNode nhưng sẽ được wrap thành ReactElement nếu cần */
  indicator?: React.ReactNode
  delay?: number
  spinning?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  variant?: 'default' | 'dots' | 'bars' | 'pulse'
  overlayColor?: string
}

export const Loading: React.FC<Props> = ({
  size = 'default',
  tip,
  overlay = false,
  indicator,
  delay = 0,
  spinning = true,
  className = '',
  style = {},
  children,
  variant = 'default',
  overlayColor = 'rgba(255, 255, 255, 0.8)',
}) => {
  /**
   * Trả về SpinIndicator hoặc undefined (theo kiểu antd cần)
   * - Nếu user truyền indicator là ReactElement -> dùng thẳng (với type assertion)
   * - Nếu user truyền string/number/fragment/... -> wrap trong <span>
   * - Nếu không truyền và variant !== 'default' -> dùng CustomSpinners
   * - Nếu không -> dùng LoadingOutlined
   */
  const getCustomIndicator = (): SpinIndicator | undefined => {
    if (indicator != null) {
      // nếu đã là React element, trả thẳng với type assertion
      if (React.isValidElement(indicator)) {
        return indicator as SpinIndicator
      }
      // nếu không phải element (string/number/array) -> wrap để thành ReactElement
      return (<span>{indicator as React.ReactNode}</span>) as SpinIndicator
    }

    if (variant !== 'default') {
      return CustomSpinners[
        variant as keyof typeof CustomSpinners
      ] as SpinIndicator
    }

    return (
      <LoadingOutlined
        style={{
          fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24,
        }}
        spin
      />
    ) as SpinIndicator
  }

  const getTipFontSize = () => {
    const map: Record<'small' | 'default' | 'large', string> = {
      small: '12px',
      default: '14px',
      large: '16px',
    }
    return map[size]
  }

  const indicatorElement = getCustomIndicator()

  const DefaultSpinner = () =>
    variant === 'default' ? (
      <Spin
        size={size}
        tip={tip}
        indicator={indicatorElement}
        delay={delay}
        spinning={spinning}
      />
    ) : (
      <div className="flex flex-col items-center space-y-3">
        {indicatorElement}
        {tip && (
          <div
            className="text-gray-600 text-center"
            style={{ fontSize: getTipFontSize() }}
          >
            {tip}
          </div>
        )}
      </div>
    )

  // Nếu component được dùng để wrap children -> dùng Spin làm wrapper
  if (children) {
    return (
      <Spin
        spinning={spinning}
        tip={tip}
        size={size}
        indicator={indicatorElement}
        delay={delay}
        className={className}
        style={style}
      >
        {children}
      </Spin>
    )
  }

  // Nếu overlay full-screen
  if (overlay) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 ${className}`}
        style={{ backgroundColor: overlayColor, ...style }}
      >
        <DefaultSpinner />
      </div>
    )
  }

  // Mặc định: render spinner standalone
  return (
    <div className={className} style={style}>
      <DefaultSpinner />
    </div>
  )
}
