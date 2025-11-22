import { Checkbox, Input } from 'antd'
import styled from '@emotion/styled'

const { TextArea } = Input

export interface PlainTextData {
  expectedAnswer?: string
  caseSensitive?: boolean
  exactMatch?: boolean
}

interface PlainTextProps {
  value?: PlainTextData
  onChange?: (value: PlainTextData) => void
}

export const PlainText = ({ value, onChange }: PlainTextProps) => {
  const handleChange = (field: keyof PlainTextData, fieldValue: string | boolean | undefined) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    })
  }

  return (
    <Container>
      <SectionTitle>Đáp án</SectionTitle>
      
      <FieldGroup>
        <Label>Câu trả lời mong đợi</Label>
        <StyledTextArea
          rows={4}
          value={value?.expectedAnswer}
          onChange={(e) => handleChange('expectedAnswer', e.target.value)}
          placeholder="Nhập câu trả lời mong đợi"
        />
      </FieldGroup>

      <CheckboxGroup>
        <StyledCheckbox
          checked={value?.caseSensitive}
          onChange={(e) => handleChange('caseSensitive', e.target.checked)}
        >
          Phân biệt chữ hoa/thường
        </StyledCheckbox>
        
        <StyledCheckbox
          checked={value?.exactMatch}
          onChange={(e) => handleChange('exactMatch', e.target.checked)}
        >
          Khớp chính xác 100%
        </StyledCheckbox>
      </CheckboxGroup>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`

const StyledTextArea = styled(TextArea)`
  width: 100%;
`

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const StyledCheckbox = styled(Checkbox)`
  font-size: 14px;
`
