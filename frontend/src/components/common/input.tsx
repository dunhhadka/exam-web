import { Input as AntdInput, InputNumber } from 'antd'
import styled from '@emotion/styled'

interface Props {
  title: string
  placeholder?: string
  require?: boolean
  numberic?: boolean
  vertical?: boolean
  max?: number
  min?: number
  disabled?: boolean
  value?: string | number
  onChange?: (value: string | number) => void
  error?: boolean
  errorMessage?: string
}

export const Input = ({
  title,
  placeholder,
  require,
  vertical,
  numberic,
  max,
  min,
  disabled,
  value,
  onChange,
  error,
  errorMessage,
}: Props) => {
  return (
    <Wrapper vertical={vertical}>
      <Label>
        {title}
        {require && <Required>*</Required>}
      </Label>

      <InputWrapper>
        {numberic ? (
          <InputNumberStyled
            value={value as number}
            min={min}
            max={max}
            disabled={disabled}
            $error={error}
            placeholder={placeholder}
            onChange={(val) => {
              if (onChange) onChange(val ?? '')
            }}
          />
        ) : (
          <AntdInput
            value={value as string}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              borderColor: error ? 'red' : undefined,
              boxShadow: error ? '0 0 0 2px rgba(255,0,0,0.1)' : undefined,
            }}
            onChange={(e) => {
              if (onChange) onChange(e.target.value)
            }}
          />
        )}

        {error && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </InputWrapper>
    </Wrapper>
  )
}

// style
const Wrapper = styled.div<{ vertical?: boolean }>`
  display: flex;
  flex-direction: ${({ vertical }) => (vertical ? 'column' : 'row')};
  align-items: ${({ vertical }) => (vertical ? 'flex-start' : 'center')};
  gap: 8px;
  width: 100%;
`

const Label = styled.label`
  font-weight: 500;
  color: #333;
`

const Required = styled.span`
  color: red;
  margin-left: 4px;
`

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const ErrorMessage = styled.span`
  color: red;
  font-size: 12px;
  margin-top: 4px;
`

const InputNumberStyled = styled(InputNumber)<{ $error?: boolean }>`
  width: 100%;
  border-color: ${({ $error }) => ($error ? 'red' : undefined)} !important;
  box-shadow: ${({ $error }) =>
    $error ? '0 0 0 2px rgba(255,0,0,0.1)' : undefined} !important;
`
