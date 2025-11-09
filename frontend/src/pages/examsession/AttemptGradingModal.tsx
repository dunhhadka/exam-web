import { SaveOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import {
  Button,
  Input,
  InputNumber,
  Modal,
  Spin,
  Typography,
} from 'antd'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import {
  useGetAttemptForGradingQuery,
  useManualGradingMutation,
} from '../../services/api/attemptApi'
import {
  ManualGradingRequest,
  QuestionGrading,
  QuestionGradingDetail,
} from '../../types/attempt'
import { QuestionType } from '../../types/question'

const { Text } = Typography
const { TextArea } = Input

interface AttemptGradingModalProps {
  attemptId: number
  open: boolean
  onClose: () => void
}

export const AttemptGradingModal = ({
  attemptId,
  open,
  onClose,
}: AttemptGradingModalProps) => {
  const toast = useToast()

  const {
    data: attemptData,
    isLoading,
    isFetching
  } = useGetAttemptForGradingQuery(attemptId, {
    skip: !open,
  })



  const [manualGrading, { isLoading: isSaving }] = useManualGradingMutation()

  const [scores, setScores] = useState<Record<number, number>>({})
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({})
  const [activeQuestion, setActiveQuestion] = useState<number>(0)

  const handleScoreChange = (attemptQuestionId: number, value: number | string | null) => {
    if (value !== null && typeof value === 'number') {
      setScores((prev) => ({ ...prev, [attemptQuestionId]: value }))
    }
  }

  const handleFeedbackChange = (attemptQuestionId: number, value: string) => {
    setFeedbacks((prev) => ({ ...prev, [attemptQuestionId]: value }))
  }

  const handleSave = async () => {
    if (!attemptData) return

    const questions: QuestionGrading[] = attemptData.questions.map((q) => ({
      attemptQuestionId: q.attemptQuestionId,
      score: scores[q.attemptQuestionId] ?? q.manualScore ?? q.autoScore ?? 0,
      feedback: feedbacks[q.attemptQuestionId] ?? undefined,
    }))

    const request: ManualGradingRequest = { questions }

    try {
      await manualGrading({ attemptId, request }).unwrap()
      toast.success('Chấm điểm thành công!')
      onClose()
    } catch (error: any) {
      toast.error(
        'Lỗi chấm điểm',
        error?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      )
    }
  }

  if (isLoading || isFetching) {
    return (
      <StyledModal open={open} onCancel={onClose} footer={null} width={1600}>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </StyledModal>
    )
  }

  if (!attemptData) return null

  const totalManualScore = attemptData.questions.reduce((sum, q) => {
    return sum + (scores[q.attemptQuestionId] ?? q.manualScore ?? q.autoScore ?? 0)
  }, 0)

  return (
    <StyledModal
      open={open}
      onCancel={onClose}
      width={1600}
      centered
      footer={null}
      destroyOnClose
    >
      <ModalLayout>
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <StudentAvatar>{attemptData.studentName?.charAt(0) || 'S'}</StudentAvatar>
            <StudentInfo>
              <StudentName>{attemptData.studentName}</StudentName>
              <StudentEmail>{attemptData.studentEmail}</StudentEmail>
            </StudentInfo>
          </SidebarHeader>

          <StatsGrid>
            <StatCard>
              <StatLabel>Lần thi</StatLabel>
              <StatValue>#{attemptData.attemptNo}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Điểm tự động</StatLabel>
              <StatValue>{attemptData.scoreAuto}</StatValue>
            </StatCard>
          </StatsGrid>

          <QuestionNav>
            <NavTitle>Danh sách câu hỏi</NavTitle>
            <QuestionGrid>
              {attemptData.questions.map((q, index) => {
                const hasScore = !!scores[q.attemptQuestionId] || !!q.manualScore
                const isActive = index === activeQuestion
                return (
                  <QuestionNavButton
                    key={q.attemptQuestionId}
                    $active={isActive}
                    $hasScore={hasScore}
                    onClick={() => setActiveQuestion(index)}
                  >
                    {index + 1}
                  </QuestionNavButton>
                )
              })}
            </QuestionGrid>
          </QuestionNav>

          <SidebarFooter>
            <TotalScoreCard>
              <TotalLabel>Tổng điểm</TotalLabel>
              <TotalScore>
                {totalManualScore.toFixed(2)} <TotalMax>/ {attemptData.totalScore}</TotalMax>
              </TotalScore>
            </TotalScoreCard>
            <SaveButton
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={isSaving}
              size="large"
              block
            >
              Lưu điểm
            </SaveButton>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <MainContent>
          {attemptData.questions.map((question, index) => (
            <QuestionPanel
              key={question.attemptQuestionId}
              $visible={index === activeQuestion}
            >
              <QuestionHeader>
                <QuestionBadge>Câu {index + 1}</QuestionBadge>
                <QuestionPoints>{question.point} điểm</QuestionPoints>
              </QuestionHeader>

              <QuestionText>{question.text}</QuestionText>

              <QuestionContent question={question} />

              <GradingPanel>
                <GradingTitle>Chấm điểm</GradingTitle>
                
                <ScoreSection>
                  <ScoreInputWrapper>
                    <InputLabel>Điểm số</InputLabel>
                    <StyledInputNumber
                      value={
                        scores[question.attemptQuestionId] ??
                        question.manualScore ??
                        question.autoScore ??
                        0
                      }
                      min={0}
                      max={question.point}
                      step={0.25}
                      onChange={(value) =>
                        handleScoreChange(question.attemptQuestionId, value)
                      }
                      addonAfter={`/ ${question.point}`}
                    />
                  </ScoreInputWrapper>
                  
                  <ScoreInfoItem>
                    <InputLabel>Điểm tự động</InputLabel>
                    <ScoreDisplayBox>{question.autoScore ?? 0}</ScoreDisplayBox>
                  </ScoreInfoItem>
                  
                  {question.manualScore !== null && (
                    <ScoreInfoItem>
                      <InputLabel>Điểm đã chấm</InputLabel>
                      <ScoreDisplayBox>{question.manualScore}</ScoreDisplayBox>
                    </ScoreInfoItem>
                  )}
                </ScoreSection>

                <FeedbackWrapper>
                  <InputLabel>Nhận xét</InputLabel>
                  <StyledTextArea
                    value={feedbacks[question.attemptQuestionId] ?? ''}
                    onChange={(e) =>
                      handleFeedbackChange(
                        question.attemptQuestionId,
                        e.target.value
                      )
                    }
                    placeholder="Nhập nhận xét cho học sinh..."
                    rows={4}
                  />
                </FeedbackWrapper>
              </GradingPanel>

              <NavigationButtons>
                {index > 0 && (
                  <NavBtn onClick={() => setActiveQuestion(index - 1)}>
                    ← Câu trước
                  </NavBtn>
                )}
                {index < attemptData.questions.length - 1 && (
                  <NavBtn $primary onClick={() => setActiveQuestion(index + 1)}>
                    Câu sau →
                  </NavBtn>
                )}
              </NavigationButtons>
            </QuestionPanel>
          ))}
        </MainContent>
      </ModalLayout>
    </StyledModal>
  )
}

// Component hiển thị nội dung câu hỏi theo type
const QuestionContent = ({ question }: { question: QuestionGradingDetail }) => {
  const { type, studentAnswer, answers, rows, expectedAnswer } = question

  switch (type) {
    case QuestionType.ONE_CHOICE:
    case QuestionType.MULTI_CHOICE:
    case QuestionType.TRUE_FALSE:
      return (
        <ContentSection>
          <SectionTitle>Đáp án</SectionTitle>
          <AnswersList>
            {answers?.map((answer) => (
              <AnswerItem
                key={answer.answerId}
                $selected={answer.selected}
                $correct={answer.result}
              >
                <AnswerIcon $selected={answer.selected} $correct={answer.result}>
                  {answer.selected ? (
                    answer.result ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                  ) : (
                    <span>○</span>
                  )}
                </AnswerIcon>
                <AnswerText>{answer.value}</AnswerText>
                <AnswerTagsWrapper>
                  {answer.result && (
                    <StatusTag $type="correct">Đáp án đúng</StatusTag>
                  )}
                  {answer.selected && (
                    <StatusTag $type="selected">Học sinh chọn</StatusTag>
                  )}
                </AnswerTagsWrapper>
              </AnswerItem>
            ))}
          </AnswersList>
        </ContentSection>
      )

    case QuestionType.TABLE_CHOICE:
      return (
        <ContentSection>
          <SectionTitle>Bảng đáp án</SectionTitle>
          <TableContainer>
            <StyledTable>
              <thead>
                <tr>
                  <th>Câu hỏi</th>
                  {question.tableHeaders?.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows?.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.label}</td>
                    {row.columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={
                          colIdx === row.selectedIndex
                            ? colIdx === row.correctIndex
                              ? 'correct-selected'
                              : 'wrong-selected'
                            : colIdx === row.correctIndex
                            ? 'correct'
                            : ''
                        }
                      >
                        {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
        </ContentSection>
      )

    case QuestionType.PLAIN_TEXT:
    case QuestionType.ESSAY:
      return (
        <ContentSection>
          <SectionTitle>Câu trả lời</SectionTitle>
          <AnswerBox>
            <AnswerLabel>Học sinh trả lời:</AnswerLabel>
            <StudentAnswerBox>
              {studentAnswer?.text || <EmptyText>Chưa trả lời</EmptyText>}
            </StudentAnswerBox>
          </AnswerBox>
          {expectedAnswer && (
            <AnswerBox>
              <AnswerLabel>Đáp án mẫu:</AnswerLabel>
              <ExpectedAnswerBox>{expectedAnswer}</ExpectedAnswerBox>
            </AnswerBox>
          )}
          {question.minWords && (
            <WordCount>
              Yêu cầu: {question.minWords} - {question.maxWords || '∞'} từ
            </WordCount>
          )}
        </ContentSection>
      )

    default:
      return <EmptyText>Loại câu hỏi không được hỗ trợ</EmptyText>
  }
}

// Styled Components
const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
  }

  .ant-modal-close {
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.04);
    
    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  .ant-modal-body {
    padding: 0;
  }
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 600px;
`

const ModalLayout = styled.div`
  display: flex;
  height: 90vh;
  max-height: 1000px;
  min-height: 800px;
`

const Sidebar = styled.div`
  width: 320px;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
`

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const StudentAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8c8c8c 0%, #595959 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
`

const StudentInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const StudentName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StudentEmail = styled.div`
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const StatCard = styled.div`
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
`

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
`

const QuestionNav = styled.div`
  flex: 1;
  overflow-y: auto;
`

const NavTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const QuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`

const QuestionNavButton = styled.button<{ $active: boolean; $hasScore: boolean }>`
  aspect-ratio: 1;
  border: 2px solid ${props => props.$active ? '#1890ff' : props.$hasScore ? '#52c41a' : '#e8e8e8'};
  background: ${props => props.$active ? '#1890ff' : props.$hasScore ? '#f6ffed' : 'white'};
  color: ${props => props.$active ? 'white' : props.$hasScore ? '#52c41a' : '#595959'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: ${props => props.$active || props.$hasScore ? '600' : '400'};
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
  }
`

const SidebarFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`

const TotalScoreCard = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, #8c8c8c 0%, #595959 100%);
  border-radius: 12px;
  text-align: center;
`

const TotalLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const TotalScore = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: white;
`

const TotalMax = styled.span`
  font-size: 18px;
  font-weight: 400;
  opacity: 0.7;
`

const SaveButton = styled(Button)`
  height: 44px;
  font-weight: 600;
  border-radius: 8px;
`

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  position: relative;
`

const QuestionPanel = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'block' : 'none'};
  padding: 32px;
  height: 100%;
  overflow-y: auto;
`

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`

const QuestionBadge = styled.div`
  padding: 8px 16px;
  background: linear-gradient(135deg, #8c8c8c 0%, #595959 100%);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
`

const QuestionPoints = styled.div`
  padding: 8px 16px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
`

const QuestionText = styled.div`
  font-size: 18px;
  line-height: 1.6;
  color: #262626;
  margin-bottom: 32px;
  font-weight: 500;
`

const ContentSection = styled.div`
  margin-bottom: 32px;
`

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #595959;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const AnswersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const AnswerItem = styled.div<{ $selected: boolean; $correct: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid ${props => 
    props.$selected 
      ? props.$correct ? '#52c41a' : '#ff4d4f'
      : props.$correct ? '#52c41a' : '#e8e8e8'
  };
  background: ${props =>
    props.$selected
      ? props.$correct ? '#f6ffed' : '#fff2f0'
      : props.$correct ? '#f6ffed' : 'white'
  };
  transition: all 0.2s;
`

const AnswerIcon = styled.div<{ $selected: boolean; $correct: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${props =>
    props.$selected
      ? 'white'
      : props.$correct ? '#52c41a' : '#d9d9d9'
  };
  background: ${props =>
    props.$selected
      ? props.$correct ? '#52c41a' : '#ff4d4f'
      : 'transparent'
  };
`

const AnswerText = styled.div`
  flex: 1;
  font-size: 15px;
  color: #262626;
`

const AnswerTagsWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const StatusTag = styled.div<{ $type: 'correct' | 'selected' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  
  ${props => {
    switch (props.$type) {
      case 'correct':
        return `
          background: #1890ff;
          color: white;
        `;
      case 'selected':
        return `
          background: #722ed1;
          color: white;
        `;
    }
  }}
`

const TableContainer = styled.div`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 14px 16px;
    text-align: left;
    border: 1px solid #f0f0f0;
  }

  th {
    background: #fafafa;
    font-weight: 600;
    font-size: 13px;
    color: #595959;
  }

  td {
    font-size: 14px;
    color: #262626;
  }

  td.correct {
    background: #f6ffed;
    color: #52c41a;
    font-weight: 600;
  }

  td.correct-selected {
    background: #52c41a;
    color: white;
    font-weight: 600;
  }

  td.wrong-selected {
    background: #ff4d4f;
    color: white;
    font-weight: 600;
  }
`

const AnswerBox = styled.div`
  margin-bottom: 20px;
`

const AnswerLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  margin-bottom: 8px;
`

const StudentAnswerBox = styled.div`
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  min-height: 80px;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.6;
  color: #262626;
`

const ExpectedAnswerBox = styled.div`
  padding: 16px;
  background: #f6ffed;
  border-radius: 12px;
  border-left: 4px solid #52c41a;
  font-size: 15px;
  line-height: 1.6;
  color: #262626;
`

const WordCount = styled(Text)`
  font-size: 13px;
  color: #8c8c8c;
  display: block;
  margin-top: 8px;
`

const EmptyText = styled.span`
  color: #bfbfbf;
  font-style: italic;
  font-size: 14px;
`

const GradingPanel = styled.div`
  margin-top: 32px;
  padding: 24px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
`

const GradingTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 20px;
`

const ScoreSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
`

const ScoreInputWrapper = styled.div`
  flex-shrink: 0;
  width: 200px;
`

const ScoreInfoItem = styled.div`
  flex-shrink: 0;
  width: 200px;
`

const ScoreDisplayBox = styled.div`
  height: 44px;
  padding: 0 11px;
  display: flex;
  align-items: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  transition: all 0.2s;
`

const FeedbackWrapper = styled.div``

const InputLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  margin-bottom: 8px;
`

const StyledInputNumber = styled(InputNumber)`
  width: 100%;
  height: 44px;
  
  .ant-input-number-input {
    height: 42px;
  }
`

const StyledTextArea = styled(TextArea)`
  border-radius: 8px;
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
`

const NavBtn = styled(Button)<{ $primary?: boolean }>`
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  
  ${props => props.$primary && `
    margin-left: auto;
  `}
`

export default AttemptGradingModal