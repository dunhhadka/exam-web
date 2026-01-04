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
import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { useSearch } from '../../components/search/useSearch'
import { useLazyFindByIdQuery, useSearchQuestionQuery } from '../../services/api/questionApi'

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

  // Cache Question objects across pages so OK can return full selection
  const [selectedQuestionsById, setSelectedQuestionsById] = useState<
    Record<number, Question>
  >({})

  const [fetchQuestionById] = useLazyFindByIdQuery()

  useEffect(() => {
    if (!open) return
    setQuestionSelectedIds(selectedQuestionIds)
    setSelectedQuestionsById({})
  }, [open, selectedQuestionIds])

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
    const doSelect = async () => {
      const selectedIds = (questionSelectedIds ?? []).map((id) => Number(id))
      if (selectedIds.length === 0) {
        onSelect([])
        onCancel()
        return
      }

      const missingIds = selectedIds.filter((id) => !selectedQuestionsById[id])

      let fetched: Question[] = []
      if (missingIds.length > 0) {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            const res = await fetchQuestionById({ questionId: id })
            return res.data
          })
        )
        fetched = results.filter(Boolean) as Question[]
      }

      const mergedById: Record<number, Question> = {
        ...selectedQuestionsById,
      }
      for (const q of fetched) mergedById[q.id] = q

      const questions = selectedIds
        .map((id) => mergedById[id])
        .filter(Boolean)

      onSelect(questions)
      onCancel()
    }

    void doSelect()
  }

  console.log('question data', data)

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
          preserveSelectedRowKeys: true,
          selectedRowKeys: questionSelectedIds,
          onChange: (newSelectedRowKeys, selectedRows) => {
            const nextIds = (newSelectedRowKeys as number[]).map((id) =>
              Number(id)
            )
            setQuestionSelectedIds(nextIds)

            setSelectedQuestionsById((prev) => {
              const next: Record<number, Question> = { ...prev }

              // Remove unselected ids from cache
              for (const idStr of Object.keys(next)) {
                const id = Number(idStr)
                if (!nextIds.includes(id)) delete next[id]
              }

              // Add/update selected rows from current page
              for (const row of selectedRows ?? []) {
                next[row.id] = row
              }

              return next
            })
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
