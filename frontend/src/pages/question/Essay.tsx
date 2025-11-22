import { Input } from 'antd'
import styled from '@emotion/styled'

const { TextArea } = Input

export interface EssayData {
  minWords?: number
  maxWords?: number
  answerAnswer?: string
  gradingCriteria?: string
}

interface EssayProps {
  value?: EssayData
  onChange?: (value: EssayData) => void
}

export const Essay = ({ value, onChange }: EssayProps) => {
  const handleChange = (field: keyof EssayData, fieldValue: string | number | undefined) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    })
  }

  return (
    <Container>
      <SectionTitle>Đáp án</SectionTitle>
      
      <WordLimitRow>
        <FieldGroup>
          <Label>Số từ tối thiểu</Label>
          <StyledInput
            type="number"
            min={0}
            value={value?.minWords}
            onChange={(e) => handleChange('minWords', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Nhập số từ tối thiểu"
          />
        </FieldGroup>

        <FieldGroup>
          <Label>Số từ tối đa</Label>
          <StyledInput
            type="number"
            min={0}
            value={value?.maxWords}
            onChange={(e) => handleChange('maxWords', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Nhập số từ tối đa"
          />
        </FieldGroup>
      </WordLimitRow>

      <FieldGroup>
        <Label>Câu trả lời mẫu</Label>
        <StyledTextArea
          rows={6}
          value={value?.answerAnswer}
          onChange={(e) => handleChange('answerAnswer', e.target.value)}
          placeholder="Nhập câu trả lời mẫu (tùy chọn)"
        />
      </FieldGroup>

      <FieldGroup>
        <Label>Tiêu chí chấm điểm</Label>
        <StyledTextArea
          rows={4}
          value={value?.gradingCriteria}
          onChange={(e) => handleChange('gradingCriteria', e.target.value)}
          placeholder="Nhập tiêu chí chấm điểm"
        />
      </FieldGroup>
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

const WordLimitRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
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

const StyledInput = styled(Input)`
  width: 100%;
  max-width: 200px;
`

const StyledTextArea = styled(TextArea)`
  width: 100%;
`
