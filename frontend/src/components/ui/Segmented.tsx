import styled from '@emotion/styled'
import { useRef, useState, useEffect, useCallback } from 'react'

interface Option {
  label: string
  value: string
}

interface Props {
  options: Option[]
  defaultValue?: string
  onChange?: (value: string) => void
}

const CustomSegmented = ({ options, defaultValue, onChange }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(defaultValue || options[0].value)
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number
    left: number
  }>({
    width: 0,
    left: 0,
  })

  const inputRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Update active state when defaultValue prop changes
  useEffect(() => {
    if (defaultValue && defaultValue !== active) {
      setActive(defaultValue)
    }
  }, [defaultValue])

  const updateIndicator = useCallback(() => {
    const activeIndex = options.findIndex((opt) => opt.value === active)
    if (activeIndex < 0) return

    const activeElement = inputRefs.current[activeIndex]
    if (!activeElement) return

    const { offsetWidth: width, offsetLeft: left } = activeElement
    setIndicatorStyle({ width, left })

    console.log(`Indicator updated: width=${width}, left=${left}`)
    console.log([activeElement])
  }, [active, options])

  useEffect(() => {
    updateIndicator()
  }, [active, options, updateIndicator])

  useEffect(() => {
    const handleResize = () => {
      updateIndicator()
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [active, options, updateIndicator])

  const handleClick = (value: string) => {
    setActive(value)
    onChange?.(value)
  }

  return (
    <SegmentedContainer ref={containerRef}>
      <Indicator
        style={{ width: indicatorStyle.width, left: indicatorStyle.left }}
      />
      {options.map((option, index) => (
        <SegmentedItem
          key={option.value}
          isActive={active === option.value}
          onClick={() => handleClick(option.value)}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
        >
          {option.label}
        </SegmentedItem>
      ))}
    </SegmentedContainer>
  )
}

export default CustomSegmented

const SegmentedContainer = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50px;
  padding: 4px;
  position: relative;
  overflow: hidden;
  width: 100%;
  flex-direction: row;
  justify-content: space-around;
`

const Indicator = styled.div`
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 50px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  transition: all 0.3s ease;
  z-index: 0;
`

const SegmentedItem = styled.button<{ isActive: boolean }>`
  position: relative;
  border: none;
  border-radius: 50px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  background: transparent;
  color: ${({ isActive }) => (isActive ? 'white' : '#666')};
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 1;
  white-space: nowrap;
  flex: 1;

  &:hover {
    color: ${({ isActive }) => (isActive ? 'white' : '#333')};
  }

  &:focus {
    outline: none;
  }
`
