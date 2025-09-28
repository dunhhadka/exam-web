import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Radio, Space } from 'antd'
import { useState, useEffect, useCallback } from 'react'

export interface TrueFalseData {
  correctAnswer: boolean | null
}

interface Props {
  questionData?: TrueFalseData
  onChange: (data: TrueFalseData) => void
  isPreview?: boolean
}

export const TrueFalse = ({ questionData, onChange, isPreview }: Props) => {
  const [data, setData] = useState<TrueFalseData>(() => ({
    correctAnswer: questionData?.correctAnswer ?? null,
  }))

  // Memoized onChange để tránh infinite re-render
  const handleDataChange = useCallback(
    (newData: TrueFalseData) => {
      onChange(newData)
    },
    [onChange]
  )

  // Chỉ sync khi questionData thay đổi từ bên ngoài
  useEffect(() => {
    if (questionData && questionData.correctAnswer !== data.correctAnswer) {
      setData(questionData)
    }
  }, [questionData?.correctAnswer]) // Chỉ depend vào correctAnswer

  // Notify parent khi data thay đổi
  useEffect(() => {
    handleDataChange(data)
  }, [data, handleDataChange])

  const handleAnswerChange = (value: boolean) => {
    const newData = { correctAnswer: value }
    setData(newData)
  }

  if (isPreview) {
    return (
      <PreviewContainer>
        <PreviewTitle>Câu hỏi Đúng/Sai</PreviewTitle>
        <PreviewOptions>
          <PreviewOption>
            <AnswerIcon correct={true}>
              <CheckCircleOutlined />
            </AnswerIcon>
            <AnswerText>Đúng</AnswerText>
          </PreviewOption>
          <PreviewOption>
            <AnswerIcon correct={false}>
              <CloseCircleOutlined />
            </AnswerIcon>
            <AnswerText>Sai</AnswerText>
          </PreviewOption>
        </PreviewOptions>
      </PreviewContainer>
    )
  }

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>Đáp án đúng</SectionTitle>
        <Description>Chọn đáp án chính xác cho câu hỏi này</Description>
      </SectionHeader>

      <OptionsContainer>
        <Radio.Group
          value={data.correctAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <AnswerOption value={true}>
              <AnswerContent>
                <AnswerText>Đúng</AnswerText>
              </AnswerContent>
            </AnswerOption>

            <AnswerOption value={false}>
              <AnswerContent>
                <AnswerText>Sai</AnswerText>
              </AnswerContent>
            </AnswerOption>
          </Space>
        </Radio.Group>
      </OptionsContainer>

      {data.correctAnswer !== null && (
        <AnswerSummary>
          <SummaryIcon correct={data.correctAnswer}>
            {data.correctAnswer ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )}
          </SummaryIcon>
          <SummaryText>
            Đáp án được chọn:{' '}
            <strong>{data.correctAnswer ? 'Đúng' : 'Sai'}</strong>
          </SummaryText>
        </AnswerSummary>
      )}
    </Container>
  )
}

// Default data helper
export const getTrueFalseDefaultData = (): TrueFalseData => ({
  correctAnswer: null,
})

// Validation helper
export const validateTrueFalseData = (data: TrueFalseData) => {
  const errors: { correctAnswer?: string } = {}

  if (data.correctAnswer === null) {
    errors.correctAnswer = 'Vui lòng chọn đáp án đúng'
  }

  return errors
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
`

const Description = styled.div`
  font-size: 14px;
  color: #8c8c8c;
  line-height: 1.4;
`

const OptionsContainer = styled.div`
  width: 100%;
`

const AnswerOption = styled(Radio)`
  padding: 16px 20px !important;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  margin: 0 !important;
  width: 100%;
  /* display: block; */
  transition: all 0.3s ease;

  &:hover {
    border-color: #d9d9d9;
    background: #fafafa;
  }

  &.ant-radio-wrapper-checked {
    border-color: #1677ff;
    background: #f0f9ff;

    .ant-radio-checked .ant-radio-inner {
      border-color: #1677ff;
      background-color: #1677ff;
    }
  }

  .ant-radio {
    align-self: flex-start;
    margin-top: 6px;
    margin-right: 10px;
  }
`

const AnswerContent = styled.div`
  display: flex;
  width: 100%;
`

const AnswerIcon = styled.div<{ correct: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(props) => (props.correct ? '#f6ffed' : '#fff2f0')};
  color: ${(props) => (props.correct ? '#52c41a' : '#ff4d4f')};
  font-size: 16px;
  flex-shrink: 0;
`

const AnswerText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #262626;
`

const AnswerSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #1677ff;
`

const SummaryIcon = styled.div<{ correct: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: ${(props) => (props.correct ? '#52c41a' : '#ff4d4f')};
  flex-shrink: 0;
`

const SummaryText = styled.div`
  font-size: 14px;
  color: #595959;

  strong {
    color: #262626;
  }
`

// Preview components
const PreviewContainer = styled.div`
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const PreviewTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
`

const PreviewOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PreviewOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #d9d9d9;
    background: #fafafa;
  }
`
