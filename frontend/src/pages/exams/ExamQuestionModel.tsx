import { Input, Modal, Tag, Tooltip } from 'antd'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import {
  Level,
  LevelColor,
  LevelLabel,
  Question,
  QuestionFilterRequest,
  Tag as QuestionTag,
  QuestionType,
  QuestionTypeColor,
  QuestionTypeLabel,
} from '../../types/question'
import { Truncate3Lines } from '../question/QuestionList'
import { useState } from 'react'
import styled from '@emotion/styled'
import { useSearch } from '../../components/search/useSearch'
import { useSearchQuestionQuery } from '../../services/api/questionApi'

interface Props {
  open: boolean
  onCancel: () => void
  selectedQuestionIds: number[]
  onSelect: (questions: Question[]) => void
}

export const ExamQuestionModel = ({
  selectedQuestionIds,
  onSelect,
  open,
  onCancel,
}: Props) => {
  const columns = [
    createColumn<Question>('Cấp đô', 'level', {
      render: (value: Level) =>
        value ? <Tag color={LevelColor[value]}>{LevelLabel[value]}</Tag> : null,
    }),
    createColumn<Question>('Thẻ', 'tags', {
      render: (value: QuestionTag[]) =>
        value
          ? value.map((tag) => (
              <Tag key={tag.id} color={tag.colorCode}>
                {tag.name}
              </Tag>
            ))
          : null,
    }),
    createColumn<Question>('Câu hỏi', 'text', {
      render: (value) =>
        value ? (
          <Tooltip title={value}>
            <Truncate3Lines>{value}</Truncate3Lines>
          </Tooltip>
        ) : null,
    }),
    createColumn<Question>('Loại', 'type', {
      render: (value?: QuestionType) =>
        value ? (
          <Tag color={QuestionTypeColor[value]}>{QuestionTypeLabel[value]}</Tag>
        ) : null,
    }),
  ]

  const [questionSelectedIds, setQuestionSelectedIds] =
    useState<number[]>(selectedQuestionIds)

  const {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    resetFilter,
    data,
    isLoading,
    isFetching,
    refetch,
    pageIndex,
    pageSize,
    total,
  } = useSearch<QuestionFilterRequest, Question>(
    useSearchQuestionQuery,
    {
      pageSize: 10,
      pageIndex: 1,
    },
    {
      delay: 300,
    }
  )

  const handleSelectQuestions = () => {
    onSelect(selectedQuestionPages.flatMap((p) => p.questions))

    onCancel()
  }

  const [selectedQuestionPages, setSelectedQuestionPages] = useState<
    {
      pageIndex: number
      questions: Question[]
    }[]
  >([])

  const mergeSelectedQuestions = (questionIds: number[]) => {
    const questions = (data ?? []).filter(
      (item) => item.id && questionIds.includes(item.id)
    )

    const currentPageIndex = filter.pageIndex || 1

    setSelectedQuestionPages((prevPages) => {
      return [
        ...prevPages.filter((p) => p.pageIndex !== currentPageIndex),
        { pageIndex: currentPageIndex, questions },
      ]
    })
  }

  console.log('selected question ids page', selectedQuestionPages)

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={'60%'}
      title="Thêm câu hỏi vào bài thi"
      onOk={handleSelectQuestions}
    >
      <SearchInput
        placeholder="Tìm câu hỏi"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <CustomTable<Question>
        columns={columns}
        rowKey={'id'}
        emptyText="Chưa có câu hỏi nào"
        data={data}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys:
            selectedQuestionPages.flatMap((p) =>
              p.questions.map((q) => q.id)
            ) || [],
          onChange: (newSelectedRowKeys, _) => {
            mergeSelectedQuestions(newSelectedRowKeys as number[])
          },
        }}
        pagination={{
          current: pageIndex,
          pageSize: pageSize,
          total: total,
          onChange: (page, pageSize) => {
            setFilter({
              ...filter,
              pageIndex: page ?? 1,
              pageSize: pageSize ?? 10,
            })
          },
        }}
        loading={isLoading || isFetching}
      />
    </Modal>
  )
}

const SearchInput = styled(Input)`
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`
