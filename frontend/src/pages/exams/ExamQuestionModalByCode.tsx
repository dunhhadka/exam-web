import { Modal, Input, Spin, Empty, List, Tag, Button, Space } from 'antd'
import { SearchInput } from './ExamQuestionModel'
import { useState, useEffect, useMemo } from 'react'
import { useLazySearchByCodesQuery } from '../../services/api/questionApi'
import { useDebounce } from 'use-debounce'
import {
  Question,
  Level,
  LevelColor,
  LevelLabel,
  QuestionType,
  QuestionTypeColor,
  QuestionTypeLabel,
} from '../../types/question'
import styled from '@emotion/styled'

interface Props {
  open: boolean
  onCancel: () => void
  onConfirm?: (questions: Question[]) => void
  currentSelectedCodes?: string[]
}

const StyledQuestionItem = styled.div`
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #fafafa;
    border-color: #40a9ff;
  }

  &.selected {
    background-color: #e6f7ff;
    border-color: #1890ff;
  }
`

const QuestionCode = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`

const QuestionText = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const SelectedQuestionsContainer = styled.div`
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
`

const AddExamQuestionModalByCode = ({
  open,
  onCancel,
  onConfirm,
  currentSelectedCodes,
}: Props) => {
  const [codes, setCodes] = useState<string>('')
  const [questionsSelected, setQuestionsSelected] = useState<Question[]>([])

  console.log('Current selected codes:', currentSelectedCodes)

  const [debouncedSearchTerm] = useDebounce(codes, 500)

  const [searchQuestionsByCodes, { data: searchResults, isLoading }] =
    useLazySearchByCodesQuery()

  // Gọi API khi debounced term thay đổi
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      searchQuestionsByCodes({ codes: debouncedSearchTerm.trim() })
    }
  }, [debouncedSearchTerm, searchQuestionsByCodes])

  // Tự động chọn tất cả questions khi kết quả search thay đổi
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setQuestionsSelected(searchResults)
    }
  }, [searchResults])

  useEffect(() => {
    if (currentSelectedCodes) {
      setCodes(currentSelectedCodes.join(','))
    }
  }, [currentSelectedCodes])

  // Tạo Set chứa IDs của selected questions để check nhanh
  const selectedIds = useMemo(
    () => new Set(questionsSelected.map((q) => q.id)),
    [questionsSelected]
  )

  const handleSelectQuestion = (question: Question) => {
    // Chỉ cho phép xóa, không toggle
    if (selectedIds.has(question.id)) {
      setQuestionsSelected(
        questionsSelected.filter((q) => q.id !== question.id)
      )
    }
  }

  const handleRemoveQuestion = (questionId: number) => {
    setQuestionsSelected(questionsSelected.filter((q) => q.id !== questionId))
  }

  const handleConfirm = () => {
    onConfirm?.(questionsSelected)
    setQuestionsSelected([])
    setCodes('')

    onCancel()
  }

  const questions = searchResults || []

  return (
    <Modal
      width={'60%'}
      open={open}
      onCancel={onCancel}
      title="Thêm vào bài thi bằng mã câu hỏi"
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={questionsSelected.length === 0}
        >
          Thêm ({questionsSelected.length})
        </Button>,
      ]}
    >
      <div>
        <Input
          placeholder="Nhập mã câu hỏi (cách nhau bằng dấu cách hoặc dấu phẩy)"
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          size="large"
          style={{ marginBottom: 12 }}
        />

        <Spin spinning={isLoading}>
          {questionsSelected && questionsSelected.length > 0 ? (
            <List
              dataSource={questionsSelected}
              renderItem={(question) => (
                <StyledQuestionItem className="selected">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <QuestionCode>{question.code}</QuestionCode>
                      <QuestionText>{question.text}</QuestionText>
                      <div>
                        {question.level && (
                          <Tag
                            color={LevelColor[question.level]}
                            style={{ marginRight: 4 }}
                          >
                            {LevelLabel[question.level]}
                          </Tag>
                        )}
                        {question.type && (
                          <Tag color={QuestionTypeColor[question.type]}>
                            {QuestionTypeLabel[question.type]}
                          </Tag>
                        )}
                      </div>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      onClick={() => handleRemoveQuestion(question.id)}
                      style={{ marginLeft: 8 }}
                    >
                      Xóa
                    </Button>
                  </div>
                </StyledQuestionItem>
              )}
            />
          ) : codes.trim() ? (
            <Empty description="Không tìm thấy câu hỏi nào" />
          ) : (
            <Empty description="Nhập mã câu hỏi để tìm kiếm" />
          )}
        </Spin>
      </div>
    </Modal>
  )
}

export default AddExamQuestionModalByCode
