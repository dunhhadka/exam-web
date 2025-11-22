import { useLocation, useNavigate } from "react-router-dom"
import type { AnswerSubmission, StartAttemptRequest } from "../../types/take-exam"
import { useStartExamAttemptMutation, useSubmitAttemptMutation } from "../../services/api/take-exam"
import { useEffect, useState, useCallback, useRef } from "react"
import { Button, Card, Progress, Modal, Spin, Radio, Checkbox, Input, Table } from "antd"

const { TextArea } = Input
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import styled from "@emotion/styled"
import type { AttemptDetailResponse, QuestionResponse } from "../../types/take-exam"
import { QuestionType } from "../../types/question"
import { useToast } from "../../hooks/useToast"
import { useAntiCheat } from "../../hooks/useAntiCheat"

const TakeExam = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location

  const toast = useToast()

  const [data, setData] = useState<AttemptDetailResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, AnswerSubmission>>({})
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Lấy settings từ state (từ PrepareCheckCandidateSystem)
  const sessionSettings = state?.sessionSettings

  // Gọi useAntiCheat với attemptId sau khi đã start attempt
  useAntiCheat(
    data?.attemptId
      ? {
          ...sessionSettings,
          attemptId: data.attemptId,
        }
      : sessionSettings
  )

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [submitResult, setSubmitResult] = useState<any>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRequest = state?.startExamRequest satisfies StartAttemptRequest
  const tokenJoinStart = state?.tokenJoinStart as string

  const [startExamAttempt, { isLoading: isStartAttemptLoading }] = useStartExamAttemptMutation()

  const [submitAttempt, { isLoading: isSubmitLoading }] = useSubmitAttemptMutation()

  const hasStartedRef = useRef(false)

  const fetchExamAttempt = useCallback(async () => {
    if (startRequest && !hasStartedRef.current) {
      hasStartedRef.current = true

      try {
        const res = await startExamAttempt(startRequest).unwrap()
        setData(res)

        // Parse datetime format: "09-11-2025 18:12" -> Date object
        const parseDateTime = (dateTimeStr: string): Date => {
          const [datePart, timePart] = dateTimeStr.split(" ")
          const [day, month, year] = datePart.split("-")
          const [hours, minutes] = timePart.split(":")
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
        }

        const expireTime = parseDateTime(res.expireAt).getTime()
        const now = new Date().getTime()
        const remaining = Math.floor((expireTime - now) / 1000)
        console.log("Timer initialized:", {
          expireAt: res.expireAt,
          expireTime,
          now,
          remaining,
        })
        setTimeRemaining(remaining > 0 ? remaining : 0)
      } catch (error: any) {
        hasStartedRef.current = false
        console.error("Failed to start exam:", error)
        setErrorMessage(error?.data?.message || "Không thể tải bài thi. Vui lòng thử lại.")
        setIsErrorModalOpen(true)
      }
    }
  }, [startRequest, startExamAttempt])

  useEffect(() => {
    if (data && Object.keys(answers).length === 0) {
      const initialAnswers = data.questions.reduce(
        (acc, item) => {
          acc[item.attemptQuestionId] = {
            attemptQuestionId: item.attemptQuestionId,
          }
          return acc
        },
        {} as Record<number, AnswerSubmission>,
      )
      setAnswers(initialAnswers)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    fetchExamAttempt()
  }, [fetchExamAttempt])

  const submitExam = useCallback(async () => {
    if (!data) return

    const answersList = Object.values(answers)
    console.log("Submitting answers:", answersList, tokenJoinStart)

    try {
      const result = await submitAttempt({
        attemptId: data.attemptId,
        request: { answers: answersList },
        sessionToken: tokenJoinStart,
      }).unwrap()

      console.log("Submit successful:", result)
      setSubmitResult(result)
      setIsSuccessModalOpen(true)
    } catch (error: any) {
      console.error("Failed to submit exam:", error)
      setErrorMessage(error?.data?.message || "Không thể nộp bài. Vui lòng thử lại.")
      setIsErrorModalOpen(true)
    }
  }, [data, answers, submitAttempt, tokenJoinStart])

  const submitExamDirectly = useCallback(async () => {
    if (!data) return

    console.log("Auto-submitting (time up)")

    try {
      await submitExam()
    } catch (error) {
      console.error("Auto-submit failed:", error)
    }
  }, [data, submitExam])

  useEffect(() => {
    // Only start timer when we have positive time remaining
    if (timeRemaining <= 0) {
      console.log("Timer not started - timeRemaining:", timeRemaining)
      return
    }

    console.log("Starting timer with remaining time:", timeRemaining)

    // Clear any existing interval before creating new one
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        console.log("Timer tick - prev:", prev)
        if (prev <= 1) {
          // Time's up - submit exam
          submitExamDirectly()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.attemptId, submitExamDirectly])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = useCallback((questionId: number, value: any, questionType: QuestionType) => {
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
              selectedAnswerId: value,
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
        case QuestionType.ESSAY:
          return {
            ...prev,
            [questionId]: {
              ...currentAnswer,
              text: value,
            },
          }
        case QuestionType.TABLE_CHOICE:
          return {
            ...prev,
            [questionId]: {
              ...currentAnswer,
              rows: value,
            },
          }
        default:
          return prev
      }
    })
  }, [])

  const handleSubmit = useCallback(() => {
    console.log("Opening submit modal")
    setIsSubmitModalOpen(true)
  }, [])

  const handleConfirmSubmit = useCallback(async () => {
    console.log("Confirming submit")
    setIsSubmitModalOpen(false)
    await submitExam()
  }, [submitExam])

  const handleCancelSubmit = useCallback(() => {
    console.log("Cancel submit")
    setIsSubmitModalOpen(false)
  }, [])

  const handleSuccessModalOk = useCallback(() => {
    setIsSuccessModalOpen(false)
    navigate("/finish-exam", { state: { result: submitResult } })
  }, [navigate, submitResult])

  const handleErrorModalOk = useCallback(() => {
    setIsErrorModalOpen(false)
    if (!data) {
      navigate(-1)
    }
  }, [data, navigate])

  const renderQuestion = (question: QuestionResponse) => {
    const answer = answers[question.attemptQuestionId]

    // Khởi tạo answer nếu chưa có (tránh lỗi khi render)
    if (!answer) {
      const initialAnswer: AnswerSubmission = {
        attemptQuestionId: question.attemptQuestionId,
      }
      setAnswers(prev => ({
        ...prev,
        [question.attemptQuestionId]: initialAnswer
      }))
      return null
    }

    switch (question.type) {
      case QuestionType.ONE_CHOICE:
        if (!question.answers || question.answers.length === 0) {
          return <div>Không có đáp án</div>
        }
        return (
          <Radio.Group
            value={answer.selectedAnswerId}
            onChange={(e) => handleAnswerChange(question.attemptQuestionId, e.target.value, QuestionType.ONE_CHOICE)}
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
        if (!question.answers || question.answers.length === 0) {
          return <div>Không có đáp án</div>
        }
        return (
          <Checkbox.Group
            value={answer.selectedAnswerIds || []}
            onChange={(values) => handleAnswerChange(question.attemptQuestionId, values, QuestionType.MULTI_CHOICE)}
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
            value={answer.text || ""}
            onChange={(e) => handleAnswerChange(question.attemptQuestionId, e.target.value, QuestionType.PLAIN_TEXT)}
            maxLength={500}
          />
        )

      case QuestionType.TRUE_FALSE:
        if (!question.answers || question.answers.length === 0) {
          return <div>Không có đáp án</div>
        }
        return (
          <Radio.Group
            value={answer.selectedAnswerId}
            onChange={(e) => handleAnswerChange(question.attemptQuestionId, e.target.value, QuestionType.TRUE_FALSE)}
          >
            <TrueFalseList>
              {question.answers.map((ans) => {
                const isTrue = ans.value === "True"

                return (
                  <Radio key={ans.answerId} value={ans.answerId}>
                    <TrueFalseLabel $isTrue={isTrue}>{isTrue ? "Đúng" : "Sai"}</TrueFalseLabel>
                  </Radio>
                )
              })}
            </TrueFalseList>
          </Radio.Group>
        )

      case QuestionType.ESSAY:
        const wordCount = answer.text ? answer.text.trim().split(/\s+/).filter(word => word.length > 0).length : 0
        const minWords = question.minWords || 0
        const maxWords = question.maxWords || 0
        const isWordCountValid = (!minWords || wordCount >= minWords) && (!maxWords || wordCount <= maxWords)
        
        return (
          <EssayContainer>
            <StyledTextArea
              rows={8}
              placeholder="Nhập câu trả lời của bạn..."
              value={answer.text || ""}
              onChange={(e) => handleAnswerChange(question.attemptQuestionId, e.target.value, QuestionType.ESSAY)}
              showCount
              maxLength={5000}
            />
            {(minWords > 0 || maxWords > 0) && (
              <WordCountInfo $isValid={isWordCountValid}>
                Số từ: {wordCount}
                {minWords > 0 && ` (tối thiểu: ${minWords})`}
                {maxWords > 0 && ` (tối đa: ${maxWords})`}
              </WordCountInfo>
            )}
          </EssayContainer>
        )

      case QuestionType.TABLE_CHOICE:
        if (!question.rows || question.rows.length === 0) {
          return <div>Không có dữ liệu bảng</div>
        }

        // Lấy headers từ nhiều nguồn: headers field, columns của row đầu tiên, hoặc từ answers
        let headers: string[] = []
        if (question.headers && question.headers.length > 0) {
          headers = question.headers
        } else if (question.rows[0]?.columns && question.rows[0].columns.length > 0) {
          headers = question.rows[0].columns
        } else if (question.answers && question.answers.length > 0) {
          headers = question.answers.map(a => a.value)
        } else {
          // Fallback: tạo headers mặc định dựa trên số cột có thể có
          // Thử lấy từ row có columns không null
          const rowWithColumns = question.rows.find(r => r.columns && r.columns.length > 0)
          if (rowWithColumns && rowWithColumns.columns) {
            headers = rowWithColumns.columns
          } else {
            // Nếu không có columns nào, tạo headers mặc định
            headers = ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3']
          }
        }

        if (headers.length === 0) {
          return <div>Không có dữ liệu cột cho bảng</div>
        }
        
        // Đảm bảo selectedRows có đủ phần tử cho tất cả rows
        const selectedRows = answer.rows || []
        const paddedSelectedRows = [...selectedRows]
        while (paddedSelectedRows.length < question.rows.length) {
          paddedSelectedRows.push(-1) // -1 nghĩa là chưa chọn
        }

        return (
          <TableChoiceContainer>
            <TableChoiceTable>
              <TableChoiceHeaderRow>
                <TableChoiceEmptyCell />
                {headers.map((header, colIndex) => (
                  <TableChoiceHeaderCell key={colIndex}>{header || `Cột ${colIndex + 1}`}</TableChoiceHeaderCell>
                ))}
              </TableChoiceHeaderRow>
              {question.rows.map((row, rowIndex) => {
                // Sử dụng columns của row hiện tại nếu có, nếu không thì dùng headers chung
                const rowColumns = row.columns && row.columns.length > 0 ? row.columns : headers
                
                return (
                  <TableChoiceDataRow key={rowIndex}>
                    <TableChoiceLabelCell>{row.label}</TableChoiceLabelCell>
                    {rowColumns.map((_, colIndex) => (
                      <TableChoiceRadioCell key={colIndex}>
                        <Radio
                          checked={paddedSelectedRows[rowIndex] === colIndex}
                          onChange={() => {
                            const newRows = [...paddedSelectedRows]
                            newRows[rowIndex] = colIndex
                            // Loại bỏ các phần tử -1 ở cuối
                            while (newRows.length > 0 && newRows[newRows.length - 1] === -1) {
                              newRows.pop()
                            }
                            handleAnswerChange(question.attemptQuestionId, newRows, QuestionType.TABLE_CHOICE)
                          }}
                        />
                      </TableChoiceRadioCell>
                    ))}
                  </TableChoiceDataRow>
                )
              })}
            </TableChoiceTable>
          </TableChoiceContainer>
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
        (answer.text && answer.text.trim().length > 0) ||
        (answer.rows && answer.rows.length > 0)
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
      (answer.text && answer.text.trim().length > 0) ||
      (answer.rows && answer.rows.length > 0)
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
            <Progress percent={Math.round(getProgress())} strokeColor="#0066cc" status="active" />
            <ProgressStats>
              <CheckCircleOutlined style={{ color: "#0066cc" }} />
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

          <SubmitButton type="primary" size="large" block onClick={handleSubmit} loading={isSubmitLoading}>
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
              className="nav-btn"
            >
              Câu trước
            </Button>
            <Button
              size="large"
              type="primary"
              disabled={currentQuestion === data.questions.length - 1}
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              className="nav-btn"
            >
              Câu tiếp theo
            </Button>
          </NavigationButtons>
        </QuestionContent>
      </MainContent>

      <Modal
        title={
          <ModalTitle>
            <ExclamationCircleOutlined style={{ color: "#ff9d00", marginRight: 8 }} />
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

      <Modal
        title={
          <ModalTitle>
            <CheckCircleOutlined style={{ color: "#00a86b", marginRight: 8 }} />
            Nộp bài thành công
          </ModalTitle>
        }
        open={isSuccessModalOpen}
        onOk={handleSuccessModalOk}
        onCancel={handleSuccessModalOk}
        okText="Xem kết quả"
        cancelButtonProps={{ style: { display: "none" } }}
        centered
        width={480}
        closable={false}
      >
        <ModalContent>
          <SuccessMessage>Bài thi của bạn đã được nộp thành công!</SuccessMessage>
        </ModalContent>
      </Modal>

      <Modal
        title={
          <ModalTitle>
            <CloseCircleOutlined style={{ color: "#d32f2f", marginRight: 8 }} />
            Lỗi
          </ModalTitle>
        }
        open={isErrorModalOpen}
        onOk={handleErrorModalOk}
        onCancel={handleErrorModalOk}
        okText="Đóng"
        cancelButtonProps={{ style: { display: "none" } }}
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

// Styles - Professional minimalist design with white background
const Container = styled.div`
  min-height: 100vh;
  background: #ffffff;
`

const Header = styled.div`
  background: #ffffff;
  padding: 24px 40px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
`

const HeaderLeft = styled.div``

const SessionName = styled.h1`
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.5px;
`

const AttemptInfo = styled.p`
  font-size: 14px;
  color: #757575;
  margin: 6px 0 0;
  font-weight: 400;
`

const HeaderRight = styled.div``

const TimeWrapper = styled.div<{ $isWarning: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: ${(props) => (props.$isWarning ? "#fff3e0" : "#f0f7ff")};
  border: 2px solid ${(props) => (props.$isWarning ? "#ff9d00" : "#0066cc")};
  border-radius: 10px;
  color: ${(props) => (props.$isWarning ? "#ff9d00" : "#0066cc")};
  font-size: 20px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.$isWarning ? "0 4px 12px rgba(255, 157, 0, 0.2)" : "0 2px 8px rgba(0, 102, 204, 0.15)"};
  min-width: 160px;
  justify-content: center;

  ${(props) =>
    props.$isWarning &&
    `
    animation: pulse 1.5s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  .anticon {
    font-size: 22px;
  }
`

const TimeText = styled.span`
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
`

const MainContent = styled.div`
  display: flex;
  gap: 32px;
  padding: 32px 40px;
  max-width: 1400px;
  margin: 0 auto;
`

const Sidebar = styled.div`
  width: 280px;
  flex-shrink: 0;
`

const ProgressCard = styled(Card)`
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 20px;
  }
`

const ProgressTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #1a1a1a;
`

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
`

const QuestionNav = styled(Card)`
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 20px;
  }
`

const NavTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a1a;
`

const QuestionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d0d0d0;
    border-radius: 3px;

    &:hover {
      background: #999;
    }
  }
`

const QuestionNavButton = styled.button<{
  $isActive: boolean
  $isAnswered: boolean
}>`
  width: 40px;
  height: 40px;
  border: 2px solid
    ${(props) => (props.$isActive ? "#0066cc" : props.$isAnswered ? "#00a86b" : "#d0d0d0")};
  background: ${(props) => (props.$isActive ? "#0066cc" : props.$isAnswered ? "#f0f8f5" : "#ffffff")};
  color: ${(props) => (props.$isActive ? "#ffffff" : props.$isAnswered ? "#00a86b" : "#757575")};
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    transform: ${(props) => (props.$isActive ? "none" : "translateY(-2px)")};
    box-shadow: 0 2px 6px rgba(0, 102, 204, 0.1);
    border-color: #0066cc;
  }

  &:disabled {
    opacity: 0.5;
  }
`

const SubmitButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: #0066cc;
  border: none;
  color: white;
  transition: all 0.2s ease;

  &:hover {
    background: #0052a3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`

const QuestionContent = styled.div`
  flex: 1;
`

const QuestionCard = styled(Card)`
  border-radius: 8px;
  margin-bottom: 24px;
  min-height: 500px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 32px;
  }
`

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e8e8e8;
`

const QuestionNumber = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #0066cc;
  margin: 0;
`

const QuestionPoint = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #00a86b;
  background: #f0f8f5;
  padding: 4px 12px;
  border-radius: 6px;
`

const QuestionText = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 28px;
  font-weight: 500;
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
    padding: 14px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin: 0;
    background: #ffffff;
    color: #333;

    &:hover {
      border-color: #0066cc;
      background: #f8fbff;
    }
  }

  .ant-radio-wrapper-checked,
  .ant-checkbox-wrapper-checked {
    border-color: #0066cc;
    background: #f8fbff;
    color: #0066cc;
  }
`

const StyledInput = styled(Input)`
  height: 48px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover,
  &:focus {
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
`

const TrueFalseList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 400px;

  .ant-radio-wrapper {
    font-size: 16px;
    padding: 18px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;

    &:hover {
      border-color: #0066cc;
      background: #f8fbff;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
    }
  }

  .ant-radio-wrapper-checked {
    border-color: #0066cc;
    background: #f8fbff;
  }
`

const TrueFalseLabel = styled.span<{ $isTrue: boolean }>`
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => (props.$isTrue ? "#00a86b" : "#d32f2f")};
`

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;

  .nav-btn {
    flex: 1;
    max-width: 200px;
    height: 44px;
    border-radius: 6px;
    font-weight: 600;
    border: 1px solid #d0d0d0;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    &[type='primary'] {
      background: #0066cc;
      border-color: #0066cc;

      &:hover:not(:disabled) {
        background: #0052a3;
      }
    }
  }
`

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
`

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 16px;
  color: #757575;
  font-weight: 500;
`

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
`

const ModalContent = styled.div`
  padding: 16px 0;

  p {
    font-size: 16px;
    color: #333;
    margin-bottom: 16px;
    font-weight: 500;
  }
`

const WarningText = styled.div`
  background: #fff8f0;
  border: 1px solid #ffd699;
  border-radius: 6px;
  padding: 12px;
  color: #d87706;
  font-size: 14px;
  margin-bottom: 20px;
  font-weight: 500;
`

const StatsInfo = styled.div`
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #e8e8e8;
`

const StatsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;

  span {
    color: #757575;
    font-weight: 500;
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
  font-weight: 500;
`

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #333;
  margin: 20px 0;
  font-weight: 500;
`

const EssayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const StyledTextArea = styled(TextArea)`
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover,
  &:focus {
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
`

const WordCountInfo = styled.div<{ $isValid: boolean }>`
  font-size: 14px;
  color: ${props => props.$isValid ? '#52c41a' : '#ff4d4f'};
  font-weight: 500;
  padding: 8px 12px;
  background: ${props => props.$isValid ? '#f6ffed' : '#fff1f0'};
  border: 1px solid ${props => props.$isValid ? '#b7eb8f' : '#ffccc7'};
  border-radius: 4px;
`

const TableChoiceContainer = styled.div`
  overflow-x: auto;
  margin-top: 8px;
`

const TableChoiceTable = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  min-width: 100%;
`

const TableChoiceHeaderRow = styled.div`
  display: flex;
  background: #fafafa;
  border-bottom: 2px solid #e0e0e0;
`

const TableChoiceEmptyCell = styled.div`
  min-width: 200px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  font-weight: 600;
  color: #333;
`

const TableChoiceHeaderCell = styled.div`
  flex: 1;
  min-width: 150px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  font-weight: 600;
  color: #333;
  text-align: center;

  &:last-child {
    border-right: none;
  }
`

const TableChoiceDataRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f8fbff;
  }
`

const TableChoiceLabelCell = styled.div`
  min-width: 200px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  font-weight: 500;
  color: #333;
  background: #fafafa;
`

const TableChoiceRadioCell = styled.div`
  flex: 1;
  min-width: 150px;
  padding: 12px 16px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:last-child {
    border-right: none;
  }

  .ant-radio-wrapper {
    margin: 0;
  }

  &:hover {
    background: #f0f7ff;
  }
`
