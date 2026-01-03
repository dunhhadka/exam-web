import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useFilterExamSessionQuery as useFilterExamSessionQueryApi } from '../services/api/examsession'
import { ExamFilterRequest } from '../types/examsession'
import { LabelItem } from '../components/search/CustomTable'
import { useSearchParams } from 'react-router-dom'

interface Props {
  delay?: number
}

export function useFilterExamSessionHook({ delay = 300 }: Props) {
  const [seachParams, setSearchParams] = useSearchParams()

  const [filter, setFilter] = useState<ExamFilterRequest>({
    pageIndex: 1,
    pageSize: 10,
  })
  const [query, setQuery] = useState<string | undefined>(undefined)
  const [finalQuery] = useDebounce(query, delay)

  const [labelItems, setLabelItems] = useState<LabelItem[]>([])

  const changeParamURL = (filter: ExamFilterRequest) => {
    const params: Record<string, string> = {}
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value)
      }
    })
    setSearchParams(params)
  }

  const {
    data: examSessionData,
    isLoading,
    isFetching,
  } = useFilterExamSessionQueryApi(filter, {
    refetchOnMountOrArgChange: true,
  })

  const changeFilter = (newFilter: ExamFilterRequest) => {
    setFilter(newFilter)
  }

  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      keyword: finalQuery,
      pageIndex: 1,
    }))
  }, [finalQuery])

  const changeLabelItems = (filter: ExamFilterRequest) => {
    const items: LabelItem[] = []
    
    if (filter.keyword) {
      items.push({
        label: `Từ khoá: `,
        value: filter.keyword,
        onClose: () => setQuery(undefined),
      })
    }

    if (filter.publicFlag !== undefined) {
      items.push({
        label: `Phạm vi: `,
        value: filter.publicFlag ? 'Công khai' : 'Chỉ mình tôi',
        onClose: () =>
          changeFilter({
            ...filter,
            publicFlag: undefined,
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
    result: examSessionData?.data ?? [],
    count: examSessionData?.count ?? 0,
    isLoading,
    isFetching,
    labelItems,
  }
}
