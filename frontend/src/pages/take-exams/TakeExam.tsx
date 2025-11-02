import { useLocation, useNavigate } from 'react-router-dom'
import { AnswerSubmission, StartAttemptRequest } from '../../types/take-exam'
import {
  useStartExamAttemptMutation,
  useSubmitAttemptMutation,
} from '../../services/api/take-exam'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Button,
  Card,
  Progress,
  Modal,
  Spin,
  Radio,
  Checkbox,
  Input,
} from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { AttemptDetailResponse, QuestionResponse } from '../../types/take-exam'
import { QuestionType } from '../../types/question'
import { useToast } from '../../hooks/useToast'

const TakeExam = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location

  const toast = useToast()

  const [data, setData] = useState<AttemptDetailResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, AnswerSubmission>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Modal states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitResult, setSubmitResult] = useState<any>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRequest = state?.startExamRequest satisfies StartAttemptRequest
  const tokenJoinStart = state?.tokenJoinStart as string

  const [startExamAttempt, { isLoading: isStartAttemptLoading }] =
    useStartExamAttemptMutation()

  const [submitAttempt, { isLoading: isSubmitLoading }] =
    useSubmitAttemptMutation()

  const fetchExamAttempt = useCallback(async () => {
    if (startRequest) {
      try {
        const res = await startExamAttempt(startRequest).unwrap()
        setData(res)

        // Tính thời gian còn lại
        const expireTime = new Date(res.expireAt).getTime()
        const now = new Date().getTime()
        const remaining = Math.floor((expireTime - now) / 1000)
        setTimeRemaining(remaining > 0 ? remaining : 0)
      } catch (error: any) {
        console.error('Failed to start exam:', error)
        setErrorMessage(
          error?.data?.message || 'Không thể tải bài thi. Vui lòng thử lại.'
        )
        setIsErrorModalOpen(true)
      }
    }
  }, [startRequest, startExamAttempt])

  // Khởi tạo answers khi có data
  useEffect(() => {
    if (data && Object.keys(answers).length === 0) {
      const initialAnswers = data.questions.reduce((acc, item) => {
        acc[item.attemptQuestionId] = {
          attemptQuestionId: item.attemptQuestionId,
        }
        return acc
      }, {} as Record<number, AnswerSubmission>)
      setAnswers(initialAnswers)
    }
  }, [data])

  useEffect(() => {
    fetchExamAttempt()
  }, [fetchExamAttempt])

  // Submit exam function
  const submitExam = useCallback(async () => {
    if (!data) return

    const answersList = Object.values(answers)
    console.log('Submitting answers:', answersList, tokenJoinStart)

    try {
      const result = await submitAttempt({
        attemptId: data.attemptId,
        request: { answers: answersList },
        sessionToken: tokenJoinStart,
      }).unwrap()

      console.log('Submit successful:', result)

      // Hiển thị success modal
      setSubmitResult(result)
      setIsSuccessModalOpen(true)
    } catch (error: any) {
      console.error('Failed to submit exam:', error)
      setErrorMessage(
        error?.data?.message || 'Không thể nộp bài. Vui lòng thử lại.'
      )
      setIsErrorModalOpen(true)
    }
  }, [data, answers, submitAttempt, tokenJoinStart])

  // Submit trực tiếp khi hết giờ
  const submitExamDirectly = useCallback(async () => {
    if (!data) return

    console.log('Auto-submitting (time up)')

    try {
      await submitExam()
    } catch (error) {
      console.error('Auto-submit failed:', error)
    }
  }, [data, submitExam])

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          submitExamDirectly()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeRemaining, submitExamDirectly])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = useCallback(
    (questionId: number, value: any, questionType: QuestionType) => {
      setAnswers((prev) => {
        const currentAnswer = prev[questionId] || {
          attemptQuestionId: questionId,
        }

        switch (questionType) {
          case QuestionType.ONE_CHOICE:
            return {
              ...prev,
              [questionId]: {
                ...currentAnswer,
                selectedAnswerId: value,
              },
            }
          case QuestionType.TRUE_FALSE:
            return {
              ...prev,
              [questionId]: {
                ...currentAnswer,
                selectedAnswerId: value === 'True' ? 0 : 1,
              },
            }
          case QuestionType.MULTI_CHOICE:
            return {
              ...prev,
              [questionId]: {
                ...currentAnswer,
                selectedAnswerIds: value,
              },
            }
          case QuestionType.PLAIN_TEXT:
            return {
              ...prev,
              [questionId]: {
                ...currentAnswer,
                text: value,
              },
            }
          default:
            return prev
        }
      })
    },
    []
  )

  const handleSubmit = useCallback(() => {
    console.log('Opening submit modal')
    setIsSubmitModalOpen(true)
  }, [])

  const handleConfirmSubmit = useCallback(async () => {
    console.log('Confirming submit')
    setIsSubmitModalOpen(false)
    await submitExam()
  }, [submitExam])

  const handleCancelSubmit = useCallback(() => {
    console.log('Cancel submit')
    setIsSubmitModalOpen(false)
  }, [])

  const handleSuccessModalOk = useCallback(() => {
    setIsSuccessModalOpen(false)
    navigate('/finish-exam', { state: { result: submitResult } })
  }, [navigate, submitResult])

  const handleErrorModalOk = useCallback(() => {
    setIsErrorModalOpen(false)
    // Nếu là error khi load exam, quay lại
    if (!data) {
      navigate(-1)
    }
  }, [data, navigate])

  const renderQuestion = (question: QuestionResponse) => {
    const answer = answers[question.attemptQuestionId]

    if (!answer) {
      return null
    }

    switch (question.type) {
      case QuestionType.ONE_CHOICE:
        return (
          <Radio.Group
            value={answer.selectedAnswerId}
            onChange={(e) =>
              handleAnswerChange(
                question.attemptQuestionId,
                e.target.value,
                QuestionType.ONE_CHOICE
              )
            }
          >
            <AnswerList>
              {question.answers.map((ans) => (
                <Radio key={ans.answerId} value={ans.answerId}>
                  {ans.value}
                </Radio>
              ))}
            </AnswerList>
          </Radio.Group>
        )

      case QuestionType.MULTI_CHOICE:
        return (
          <Checkbox.Group
            value={answer.selectedAnswerIds || []}
            onChange={(values) =>
              handleAnswerChange(
                question.attemptQuestionId,
                values,
                QuestionType.MULTI_CHOICE
              )
            }
          >
            <AnswerList>
              {question.answers.map((ans) => (
                <Checkbox key={ans.answerId} value={ans.answerId}>
                  {ans.value}
                </Checkbox>
              ))}
            </AnswerList>
          </Checkbox.Group>
        )

      case QuestionType.PLAIN_TEXT:
        return (
          <StyledInput
            placeholder="Nhập câu trả lời của bạn"
            value={answer.text || ''}
            onChange={(e) =>
              handleAnswerChange(
                question.attemptQuestionId,
                e.target.value,
                QuestionType.PLAIN_TEXT
              )
            }
            maxLength={500}
          />
        )

      case QuestionType.TRUE_FALSE:
        return (
          <Radio.Group
            value={answer.text}
            onChange={(e) =>
              handleAnswerChange(
                question.attemptQuestionId,
                e.target.value,
                QuestionType.TRUE_FALSE
              )
            }
          >
            <TrueFalseList>
              {question.answers.map((ans) => {
                const answerValue =
                  typeof ans.value === 'string'
                    ? ans.value.toLowerCase()
                    : String(ans.value).toLowerCase()
                const isTrue = answerValue === 'true' || answerValue === 'đúng'

                return (
                  <Radio key={ans.answerId} value={ans.value}>
                    <TrueFalseLabel $isTrue={isTrue}>
                      {isTrue ? 'Đúng' : 'Sai'}
                    </TrueFalseLabel>
                  </Radio>
                )
              })}
            </TrueFalseList>
          </Radio.Group>
        )

      default:
        return <div>Loại câu hỏi không được hỗ trợ</div>
    }
  }

  const getAnsweredCount = () => {
    return Object.values(answers).filter((answer) => {
      return (
        answer.selectedAnswerId !== undefined ||
        (answer.selectedAnswerIds && answer.selectedAnswerIds.length > 0) ||
        (answer.text && answer.text.trim().length > 0)
      )
    }).length
  }

  const getProgress = () => {
    if (!data?.questions.length) return 0
    return (getAnsweredCount() / data.questions.length) * 100
  }

  const isQuestionAnswered = (questionId: number) => {
    const answer = answers[questionId]
    if (!answer) return false

    return (
      answer.selectedAnswerId !== undefined ||
      (answer.selectedAnswerIds && answer.selectedAnswerIds.length > 0) ||
      (answer.text && answer.text.trim().length > 0)
    )
  }

  if (isStartAttemptLoading || !data) {
    return (
      <LoadingContainer>
        <Spin size="large" />
        <LoadingText>Đang tải bài thi...</LoadingText>
      </LoadingContainer>
    )
  }

  const question = data.questions[currentQuestion]

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <SessionName>{data.sessionName}</SessionName>
          <AttemptInfo>Lần thi thứ {data.attemptNo}</AttemptInfo>
        </HeaderLeft>
        <HeaderRight>
          <TimeWrapper $isWarning={timeRemaining < 300}>
            <ClockCircleOutlined />
            <TimeText>{formatTime(timeRemaining)}</TimeText>
          </TimeWrapper>
        </HeaderRight>
      </Header>

      <MainContent>
        <Sidebar>
          <ProgressCard>
            <ProgressTitle>Tiến độ làm bài</ProgressTitle>
            <Progress
              percent={Math.round(getProgress())}
              strokeColor="#667eea"
              status="active"
            />
            <ProgressStats>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              Đã làm: {getAnsweredCount()}/{data.questions.length}
            </ProgressStats>
          </ProgressCard>

          <QuestionNav>
            <NavTitle>Danh sách câu hỏi</NavTitle>
            <QuestionGrid>
              {data.questions.map((q, idx) => (
                <QuestionNavButton
                  key={q.attemptQuestionId}
                  $isActive={idx === currentQuestion}
                  $isAnswered={!!isQuestionAnswered(q.attemptQuestionId)}
                  onClick={() => setCurrentQuestion(idx)}
                >
                  {idx + 1}
                </QuestionNavButton>
              ))}
            </QuestionGrid>
          </QuestionNav>

          <SubmitButton
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={isSubmitLoading}
          >
            Nộp bài
          </SubmitButton>
        </Sidebar>

        <QuestionContent>
          <QuestionCard>
            <QuestionHeader>
              <QuestionNumber>Câu {currentQuestion + 1}</QuestionNumber>
              <QuestionPoint>{question.point} điểm</QuestionPoint>
            </QuestionHeader>

            <QuestionText dangerouslySetInnerHTML={{ __html: question.text }} />

            <AnswerSection>{renderQuestion(question)}</AnswerSection>
          </QuestionCard>

          <NavigationButtons>
            <Button
              size="large"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
            >
              Câu trước
            </Button>
            <Button
              size="large"
              type="primary"
              disabled={currentQuestion === data.questions.length - 1}
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
            >
              Câu tiếp theo
            </Button>
          </NavigationButtons>
        </QuestionContent>
      </MainContent>

      {/* Submit Confirmation Modal */}
      <Modal
        title={
          <ModalTitle>
            <ExclamationCircleOutlined
              style={{ color: '#faad14', marginRight: 8 }}
            />
            Xác nhận nộp bài
          </ModalTitle>
        }
        open={isSubmitModalOpen}
        onOk={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        okText="Nộp bài"
        cancelText="Hủy"
        confirmLoading={isSubmitLoading}
        centered
        width={480}
      >
        <ModalContent>
          <p>Bạn có chắc chắn muốn nộp bài?</p>
          <WarningText>⚠️ Bạn sẽ không thể chỉnh sửa sau khi nộp.</WarningText>
          <StatsInfo>
            <StatsItem>
              <span>Đã làm:</span>
              <strong>
                {getAnsweredCount()}/{data.questions.length} câu
              </strong>
            </StatsItem>
            <StatsItem>
              <span>Thời gian còn lại:</span>
              <strong>{formatTime(timeRemaining)}</strong>
            </StatsItem>
          </StatsInfo>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal
        title={
          <ModalTitle>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Nộp bài thành công
          </ModalTitle>
        }
        open={isSuccessModalOpen}
        onOk={handleSuccessModalOk}
        onCancel={handleSuccessModalOk}
        okText="Xem kết quả"
        cancelButtonProps={{ style: { display: 'none' } }}
        centered
        width={480}
        closable={false}
      >
        <ModalContent>
          <SuccessMessage>
            Bài thi của bạn đã được nộp thành công!
          </SuccessMessage>
        </ModalContent>
      </Modal>

      {/* Error Modal */}
      <Modal
        title={
          <ModalTitle>
            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Lỗi
          </ModalTitle>
        }
        open={isErrorModalOpen}
        onOk={handleErrorModalOk}
        onCancel={handleErrorModalOk}
        okText="Đóng"
        cancelButtonProps={{ style: { display: 'none' } }}
        centered
        width={480}
      >
        <ModalContent>
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default TakeExam

// Styles
const Container = styled.div`
  min-height: 100vh;
  background: #f5f7fa;
`

const Header = styled.div`
  background: white;
  padding: 20px 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
`

const HeaderLeft = styled.div``

const SessionName = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`

const AttemptInfo = styled.p`
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
`

const HeaderRight = styled.div``

const TimeWrapper = styled.div<{ $isWarning: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${(props) => (props.$isWarning ? '#fff2e8' : '#f0f5ff')};
  border: 2px solid ${(props) => (props.$isWarning ? '#ff7a45' : '#667eea')};
  border-radius: 12px;
  color: ${(props) => (props.$isWarning ? '#ff7a45' : '#667eea')};
  font-size: 18px;
  font-weight: 600;
`

const TimeText = styled.span``

const MainContent = styled.div`
  display: flex;
  gap: 24px;
  padding: 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
`

const Sidebar = styled.div`
  width: 280px;
  flex-shrink: 0;
`

const ProgressCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
`

const ProgressTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
`

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #666;
`

const QuestionNav = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
`

const NavTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`

const QuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
`

const QuestionNavButton = styled.button<{
  $isActive: boolean
  $isAnswered: boolean
}>`
  width: 40px;
  height: 40px;
  border: 2px solid
    ${(props) =>
      props.$isActive ? '#667eea' : props.$isAnswered ? '#52c41a' : '#d9d9d9'};
  background: ${(props) =>
    props.$isActive ? '#667eea' : props.$isAnswered ? '#f6ffed' : 'white'};
  color: ${(props) =>
    props.$isActive ? 'white' : props.$isAnswered ? '#52c41a' : '#666'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
  }
`

const SubmitButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: #52c41a;
  border: none;

  &:hover {
    background: #73d13d;
  }
`

const QuestionContent = styled.div`
  flex: 1;
`

const QuestionCard = styled(Card)`
  border-radius: 12px;
  margin-bottom: 24px;
  min-height: 500px;
`

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`

const QuestionNumber = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
  margin: 0;
`

const QuestionPoint = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
`

const QuestionText = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #1a1a1a;
  margin-bottom: 24px;
`

const AnswerSection = styled.div`
  margin-top: 24px;
`

const AnswerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ant-radio-wrapper,
  .ant-checkbox-wrapper {
    font-size: 15px;
    padding: 12px 16px;
    border: 2px solid #f0f0f0;
    border-radius: 8px;
    transition: all 0.3s;
    margin: 0;

    &:hover {
      border-color: #667eea;
      background: #f0f5ff;
    }
  }

  .ant-radio-wrapper-checked,
  .ant-checkbox-wrapper-checked {
    border-color: #667eea;
    background: #f0f5ff;
  }
`

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  font-size: 15px;

  &:hover,
  &:focus {
    border-color: #667eea;
  }
`

const TrueFalseList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 400px;

  .ant-radio-wrapper {
    font-size: 16px;
    padding: 20px;
    border: 2px solid #f0f0f0;
    border-radius: 12px;
    transition: all 0.3s;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #667eea;
      background: #f0f5ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
  }

  .ant-radio-wrapper-checked {
    border-color: #667eea;
    background: #f0f5ff;
  }
`

const TrueFalseLabel = styled.span<{ $isTrue: boolean }>`
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => (props.$isTrue ? '#52c41a' : '#ff4d4f')};
`

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;

  button {
    flex: 1;
    max-width: 200px;
    height: 44px;
    border-radius: 8px;
    font-weight: 600;
  }
`

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
`

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 16px;
  color: #666;
`

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
`

const ModalContent = styled.div`
  padding: 16px 0;

  p {
    font-size: 16px;
    color: #333;
    margin-bottom: 16px;
  }
`

const WarningText = styled.div`
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 12px;
  color: #ad6800;
  font-size: 14px;
  margin-bottom: 20px;
`

const StatsInfo = styled.div`
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const StatsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  span {
    color: #666;
  }

  strong {
    color: #1a1a1a;
    font-weight: 600;
  }
`

const SuccessMessage = styled.p`
  font-size: 16px;
  color: #333;
  text-align: center;
  margin: 20px 0;
`

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #333;
  margin: 20px 0;
`
