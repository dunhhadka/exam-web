import {
  DeleteOutlined,
  DownOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { InputNumber, Tag, Tooltip } from 'antd'
import { useCallback, useState } from 'react'
import { createActionColumns } from '../../components/search/createActionColumn'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { ExamQuestion } from '../../types/exam'
import {
  Level,
  LevelColor,
  LevelLabel,
  Tag as QuestionTag,
  QuestionType,
  QuestionTypeColor,
  QuestionTypeLabel,
} from '../../types/question'
import { Truncate3Lines } from '../question/QuestionList'
import { ExamQuestionModel } from './ExamQuestionModel'

interface Props {
  questions: ExamQuestion[]
  onChange: (questions: ExamQuestion[]) => void
}

export const ExamQuestionList = ({ questions, onChange }: Props) => {
  const columns = [
    createColumn<ExamQuestion>('Cấp độ', 'level', {
      width: '100px',
      render: (value: Level) =>
        value ? <Tag color={LevelColor[value]}>{LevelLabel[value]}</Tag> : null,
    }),
    createColumn<ExamQuestion>('Thẻ', 'tags', {
      render: (value: QuestionTag[]) =>
        value
          ? value.map((tag) => (
              <Tag key={tag.id} color={tag.colorCode}>
                {tag.name}
              </Tag>
            ))
          : null,
    }),
    createColumn<ExamQuestion>('Câu hỏi', 'text', {
      render: (value) =>
        value ? (
          <Tooltip title={value}>
            <Truncate3Lines>{value}</Truncate3Lines>
          </Tooltip>
        ) : null,
    }),
    createColumn<ExamQuestion>('Loại', 'type', {
      width: '100px',
      render: (value?: QuestionType) =>
        value ? (
          <Tag color={QuestionTypeColor[value]}>{QuestionTypeLabel[value]}</Tag>
        ) : null,
    }),
    createColumn<ExamQuestion>('Điểm', 'point', {
      width: '80px',
      render: (value, record) => (
        <InputNumber
          value={value}
          onChange={(e) => {
            onChange(
              questions.map((item) =>
                item.id !== record.id ? item : { ...item, point: e }
              )
            )
          }}
        />
      ),
    }),
    createActionColumns<ExamQuestion>([
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => {
          const newQuestions = questions.filter((item) => item.id !== record.id)

          onChange(
            newQuestions.map((item, index) => ({
              ...item,
              orderIndex: index,
            }))
          )
        },
      },
      {
        label: 'Di chuyển xuống',
        icon: <DownOutlined />,
        onClick: (record) => {
          const index = questions.findIndex((item) => item.id === record.id)
          if (index === -1 || index === questions.length - 1) return
          const newQuestions = [...questions]
          const temp = newQuestions[index]
          newQuestions[index] = newQuestions[index + 1]
          newQuestions[index + 1] = temp
          onChange(newQuestions.map((item, i) => ({ ...item, orderIndex: i })))
        },
      },
      {
        label: 'Di chuyển lên',
        icon: <DownOutlined rotate={180} />,
        onClick: (record) => {
          const index = questions.findIndex((item) => item.id === record.id)
          if (index <= 0) return
          const newQuestions = [...questions]
          const temp = newQuestions[index]
          newQuestions[index] = newQuestions[index - 1]
          newQuestions[index - 1] = temp

          onChange(newQuestions.map((item, i) => ({ ...item, orderIndex: i })))
        },
      },
    ]),
  ]

  const [showModalAddQuestion, setShowModalAddQuestion] = useState(false)

  const handleAddQuestion = useCallback(() => {
    setShowModalAddQuestion(true)
  }, [])

  return (
    <Wrapper>
      <CustomTable<ExamQuestion>
        columns={columns}
        data={questions ?? []}
        emptyText="Chưa có câu hỏi nào"
        tableTitle="Danh sách câu hỏi"
        actions={[
          {
            title: 'Thêm câu hỏi',
            icon: <PlusCircleOutlined />,
            onClick: handleAddQuestion,
            color: 'primary',
          },
        ]}
      />

      {showModalAddQuestion && (
        <ExamQuestionModel
          selectedQuestionIds={(questions ?? []).map((item) => item.id)}
          onSelect={(values) => {
            const newQuestions: ExamQuestion[] = (values ?? []).map(
              (value, index) =>
                ({
                  id: value.id,
                  text: value.text,
                  point: 0,
                  level: value.level,
                  tags: value.tags,
                  type: value.type,
                  orderIndex: index,
                } as ExamQuestion)
            )
            onChange(newQuestions)
          }}
          open={showModalAddQuestion}
          onCancel={() => setShowModalAddQuestion(false)}
        />
      )}
    </Wrapper>
  )
}

/* ==== Styled ==== */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`
