import { useCallback, useState } from 'react'
import {
  AnswerSummary,
  AnswerText,
  Container,
  Description,
  SectionHeader,
  SectionTitle,
  SummaryIcon,
  SummaryText,
} from './TrueFalse'
import { Input } from 'antd'
import styled from '@emotion/styled'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'

export interface Answer {
  orderIndex: number
  label: string | null
  isCorrect: boolean
}

export interface MultiChoiceData {
  answers: Answer[]
}

interface Props {
  questionData?: MultiChoiceData
  onChange: (data: MultiChoiceData) => void
  isPreview?: boolean
}

export const MultiChoice = ({ questionData, onChange, isPreview }: Props) => {
  const [data, setData] = useState<MultiChoiceData>(
    questionData
      ? questionData
      : {
          answers: [
            {
              orderIndex: 1,
              label: null,
              isCorrect: false,
            },
            {
              orderIndex: 2,
              label: null,
              isCorrect: false,
            },
          ],
        }
  )

  const updateData = useCallback(
    (newData: MultiChoiceData) => {
      setData(newData)
      onChange(newData)
    },
    [onChange]
  )

  const handleSetLabelValue = (e: any, index: number) => {
    e.stopPropagation()
    const labelValue = e.target.value

    const newData = {
      ...data,
      answers: data.answers.map((answer) =>
        answer.orderIndex === index ? { ...answer, label: labelValue } : answer
      ),
    }

    updateData(newData)
  }

  const handleToggleAnswerForQuestion = (index: number) => {
    const newData = {
      ...data,
      answers: data.answers.map((item) =>
        item.orderIndex === index
          ? { ...item, isCorrect: !item.isCorrect }
          : item
      ),
    }
    updateData(newData)
  }

  const getLetter = (index: number) => String.fromCharCode(64 + index) // 1 -> 'A', 2 -> 'B', ...

  const getLettersCorrectAnswers = () => {
    const correctAnswers = data.answers
      .filter((item) => item.isCorrect)
      .map((item) => getLetter(item.orderIndex))
      .sort()

    return correctAnswers.length > 0 ? correctAnswers.join(', ') : ''
  }

  const reOrderAnswers = (answersToReorder: Answer[]) => {
    return answersToReorder.map((item, index) => ({
      ...item,
      orderIndex: index + 1,
    }))
  }

  const deleteAnswer = (index: number) => {
    if (data.answers.length <= 2) return

    const filteredAnswers = data.answers.filter(
      (item) => item.orderIndex !== index
    )
    const reorderedAnswers = reOrderAnswers(filteredAnswers)

    updateData({
      ...data,
      answers: reorderedAnswers,
    })
  }

  const appendAnswer = () => {
    const newAnswers = [
      ...data.answers,
      {
        orderIndex: 0, // Sẽ được reorder sau
        label: null,
        isCorrect: false,
      },
    ]

    const reorderedAnswers = reOrderAnswers(newAnswers)

    updateData({
      ...data,
      answers: reorderedAnswers,
    })
  }

  const getCorrectAnswersCount = () => {
    return data.answers.filter((item) => item.isCorrect).length
  }

  return (
    <Container>
      <SectionHeader>
        <div>
          <SectionTitle>Đáp án đúng (Nhiều lựa chọn)</SectionTitle>
          <Description>
            Tạo các câu trả lời của câu hỏi và chọn một hoặc nhiều đáp án đúng
          </Description>
        </div>
        <StyledAddButton onClick={appendAnswer}>
          <PlusCircleOutlined />
        </StyledAddButton>
      </SectionHeader>

      {Array.from({ length: Math.ceil(data.answers.length / 2) }).map(
        (_, rowIndex) => {
          const startIndex = rowIndex * 2
          const rowAnswers = data.answers.slice(startIndex, startIndex + 2)

          return (
            <div key={rowIndex} style={{ display: 'flex', gap: '16px' }}>
              {rowAnswers.map((answer) => (
                <StyledAnswerOption
                  key={answer.orderIndex}
                  isCorrect={answer.isCorrect}
                >
                  <AnswerText
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AnswwerAction
                      onClick={() =>
                        !isPreview &&
                        handleToggleAnswerForQuestion(answer.orderIndex)
                      }
                      isCorrect={answer.isCorrect}
                    >
                      <AnswerLetter>
                        {getLetter(answer.orderIndex)}.
                      </AnswerLetter>
                    </AnswwerAction>
                    <LabelAnswer
                      value={answer.label ?? ''}
                      onChange={(e) =>
                        handleSetLabelValue(e, answer.orderIndex)
                      }
                      disabled={isPreview}
                      style={{ flex: 1 }}
                    />
                    <StyledDeleteButton
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAnswer(answer.orderIndex)
                      }}
                      disabled={data.answers.length <= 2}
                    >
                      <DeleteOutlined />
                    </StyledDeleteButton>
                  </AnswerText>
                </StyledAnswerOption>
              ))}
            </div>
          )
        }
      )}

      <AnswerSummary>
        {getCorrectAnswersCount() > 0 ? (
          <>
            <SummaryIcon correct>
              <CheckCircleOutlined></CheckCircleOutlined>
            </SummaryIcon>
            <SummaryText>
              Đáp án được chọn ({getCorrectAnswersCount()}):{' '}
              <strong>{getLettersCorrectAnswers()}</strong>
            </SummaryText>
          </>
        ) : (
          <>
            <SummaryText>Chưa có đáp án được chọn</SummaryText>
          </>
        )}
      </AnswerSummary>
    </Container>
  )
}

// Styled Components
export const LabelAnswer = styled(Input)`
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  &:hover {
    border-color: #40a9ff;
  }
`

export const StyledAnswerOption = styled.div<{ isCorrect: boolean }>`
  flex: 1;
  padding: 12px;
  border: 2px solid ${({ isCorrect }) => (isCorrect ? '#52c41a' : '#e8e8e8')};
  background-color: ${({ isCorrect }) => (isCorrect ? '#f6ffed' : '#fafafa')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    border-color: ${({ isCorrect }) => (isCorrect ? '#52c41a' : '#1890ff')};
    background-color: ${({ isCorrect }) => (isCorrect ? '#f6ffed' : '#f0f8ff')};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`

export const AnswwerAction = styled.div<{ isCorrect?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ isCorrect }) =>
    isCorrect ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : 'white'};
  color: ${({ isCorrect }) => (isCorrect ? 'white' : '#595959')};
  border: 2px solid ${({ isCorrect }) => (isCorrect ? '#52c41a' : '#d9d9d9')};
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: ${({ isCorrect }) =>
    isCorrect
      ? '0 2px 8px rgba(82, 196, 26, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.1)'};

  &:hover {
    background: ${({ isCorrect }) =>
      isCorrect
        ? 'linear-gradient(135deg, #389e0d 0%, #52c41a 100%)'
        : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'};
    color: white;
    border-color: ${({ isCorrect }) => (isCorrect ? '#52c41a' : '#1890ff')};
    transform: scale(1.05);
    box-shadow: ${({ isCorrect }) =>
      isCorrect
        ? '0 4px 12px rgba(82, 196, 26, 0.4)'
        : '0 4px 12px rgba(24, 144, 255, 0.3)'};
  }

  &:active {
    transform: scale(1.02);
  }
`

export const AnswerLetter = styled.span`
  font-weight: 600;
  font-size: 14px;
`

export const StyledAddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #1677ff;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;

  &:hover {
    background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }

  &:active {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
  }
`

export const StyledDeleteButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ disabled }) => (disabled ? '#d9d9d9' : '#ff4d4f')};
  background: ${({ disabled }) =>
    disabled ? '#f5f5f5' : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'};
  color: ${({ disabled }) => (disabled ? '#bfbfbf' : 'white')};
  border-radius: 6px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #d9363e 0%, #ff4d4f 100%);
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
  }

  &:active:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 1px 4px rgba(255, 77, 79, 0.3);
  }

  &:focus:not(:disabled) {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
  }
`
