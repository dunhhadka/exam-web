import React, { CSSProperties } from 'react'
import { Select } from 'antd'
import styled from '@emotion/styled'
import type { SelectProps } from 'antd' // Import Ant Design types

export interface DropOptionItem {
  value: string | number
  label: string
}

interface Props {
  title?: string // Title to display on the left
  required?: boolean // New prop for required indicator
  options: DropOptionItem[] // Array of fixed values
  value?: string | number // Selected value
  onChange?: (value: string | number) => void // Explicitly define onChange
  placeholder?: string // Placeholder text
  disabled?: boolean // Disable the dropdown
  style?: CSSProperties // Custom styles
  className?: string // Custom class for additional styling
}

export const DropDownFixedValues = ({
  title,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Chọn một giá trị',
  disabled = false,
  style,
  className,
}: Props) => {
  return (
    <Container>
      {title && (
        <Label>
          {title}
          {required && <RequiredMark>*</RequiredMark>}
        </Label>
      )}
      <StyledSelect
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={style}
        className={className}
        options={options}
        aria-label={title || placeholder} // Use title for accessibility if provided
        aria-required={required} // Accessibility for required field
      />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px; // Space between label and dropdown
`

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`

const RequiredMark = styled.span`
  color: #ff4d4f; // Red color for required indicator
  margin-left: 4px;
`

const StyledSelect = styled(Select<string | number>)`
  width: 200px;
  .ant-select-selector {
    border-radius: 6px !important;
    font-size: 14px;
    color: #333;
    transition: all 0.2s;

    &:hover {
      border-color: #1677ff !important;
    }
  }

  &.ant-select-disabled .ant-select-selector {
    background: #f5f5f5;
    color: #888;
  }
`
