import React, { CSSProperties } from "react";
import { Select } from "antd";
import styled from "@emotion/styled";
import type { SelectProps } from "antd";

export interface DropOptionItem {
  value: string | number;
  label: string;
}

interface Props {
  title?: string;
  required?: boolean;
  options: DropOptionItem[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  isRow?: boolean;
}

export const DropDownFixedValues = ({
  title,
  required = false,
  options,
  value,
  onChange,
  placeholder = "Chọn một giá trị",
  disabled = false,
  style,
  className,
  isRow = true,
}: Props) => {
  return (
    <Container isRow={isRow}>
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
        aria-label={title || placeholder}
        aria-required={required}
      />
    </Container>
  );
};

const Container = styled.div<{ isRow?: boolean }>`
  display: flex;
  align-items: ${({ isRow }) => (isRow ? "center" : "flex-start")};
  gap: 12px;
  flex: 1;
  flex-direction: ${({ isRow }) => (isRow ? "row" : "column")};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
`;

const RequiredMark = styled.span`
  color: #ff4d4f;
  margin-left: 4px;
`;

const StyledSelect = styled(Select<string | number>)`
  flex: 1;
  
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
`;