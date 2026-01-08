import { useEffect, useState } from 'react'
import {
  LevelLabel,
  QuestionFilterRequest,
  QuestionTypeLabel,
  StatusLabel,
} from '../types/question'
import { useDebounce } from 'use-debounce'
import { useSearchQuestionQuery } from '../services/api/questionApi'
import { LabelItem } from '../components/search/CustomTable'
import { set } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'

interface Props {
  delay?: number
}

export function useFilterQuestionQuery({ delay = 300 }: Props) {
  const [seachParams, setSearchParams] = useSearchParams()

  const [filter, setFilter] = useState<QuestionFilterRequest>({
    pageIndex: 1,
    pageSize: 10,
  })
  const [query, setQuery] = useState<string | undefined>(undefined)
  const [findalQuery] = useDebounce(query, delay)

  const [labelItems, setLabelItems] = useState<LabelItem[]>([])

  const changeParamURL = (filter: QuestionFilterRequest) => {
    const params: Record<string, string> = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value)
      }
    })
    setSearchParams(params)
  }

  const {
    data: questionData,
    isLoading,
    isFetching,
  } = useSearchQuestionQuery(filter, {
    refetchOnMountOrArgChange: true,
  })

  const changeFilter = (newFilter: QuestionFilterRequest) => {
    console.log(newFilter, filter)

    setFilter(newFilter)
  }

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      keyword: findalQuery,
      pageIndex: 1,
      pageSize: 10,
    }))
  }, [findalQuery])

  const changeLabelItems = (filter: QuestionFilterRequest) => {
    const items: LabelItem[] = []
    if (filter.keyword) {
      items.push({
        label: `Từ khoá: `,
        value: filter.keyword,
        onClose: () => setQuery(undefined),
      })
    }

    if (filter.createdBy) {
      items.push({
        label: `Người tạo: `,
        value: `${filter.createdBy === 'me' ? 'Tôi' : 'Mọi người'}`,
        onClose: () =>
          changeFilter({
            ...filter,
            createdBy: undefined,
          }),
      })
    }

    if (filter.type) {
      items.push({
        label: `Loại câu hỏi: `,
        value: QuestionTypeLabel[filter.type],
        onClose: () =>
          changeFilter({
            ...filter,
            type: undefined,
          }),
      })
    }

    if (filter.level) {
      items.push({
        label: `Mức độ: `,
        value: LevelLabel[filter.level],
        onClose: () =>
          changeFilter({
            ...filter,
            level: undefined,
          }),
      })
    }

    if (filter.isPublic) {
      items.push({
        label: 'Phạm vi',
        value: filter.isPublic ? 'Công khai' : 'Chỉ mình tôi',
        onClose: () =>
          changeFilter({
            ...filter,
            isPublic: undefined,
          }),
      })
    }

    if (filter.status) {
      items.push({
        label: 'Trạng thái',
        value: StatusLabel[filter.status],
        onClose: () =>
          changeFilter({
            ...filter,
            status: undefined,
          }),
      })
    }

    setLabelItems(items)
  }

  useEffect(() => {
    changeLabelItems(filter)
    changeParamURL(filter)
  }, [filter])

  return {
    query,
    changeQuery: setQuery,
    changeFilter,
    filter,
    result: questionData?.data ?? [],
    count: questionData?.count ?? 0,
    labelItems,
    isLoading,
    isFetching,
  }
}
