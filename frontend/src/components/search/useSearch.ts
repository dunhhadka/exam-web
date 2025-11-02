import { useState } from 'react'
import { useDebounce } from 'use-debounce'

interface UseSearchOptions {
  delay?: number
  minLength?: number
  skip?: boolean
}

interface UseSearchReturn<IFilter, IResult> {
  searchTerm: string
  setSearchTerm: (term: string) => void

  filter: IFilter
  setFilter: (filter: IFilter) => void

  data: IResult[] | undefined

  isLoading: boolean

  isFetching: boolean

  resetFilter: () => void

  refetch: () => void

  pageIndex: number

  pageSize: number

  total: number
}

export function useSearch<IFilter extends Record<string, any>, IResult>(
  useQueryHook: (filter: IFilter, options?: any) => any,
  initialFilter: IFilter,
  options: UseSearchOptions = {}
): UseSearchReturn<IFilter, IResult> {
  const { delay = 500, minLength = 0, skip = false } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilterState] = useState<IFilter>(initialFilter)

  const [debouncedSearchTerm] = useDebounce(searchTerm, delay)

  const finalFilter: IFilter = {
    ...filter,
    query: debouncedSearchTerm.trim(),
  }

  const shouldSkip =
    skip || (minLength > 0 && debouncedSearchTerm.trim.length < minLength)

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useQueryHook(finalFilter, {
    skip: shouldSkip,
  })

  const setFilter = (newFilter: Partial<IFilter>) => {
    setFilterState((prev) => ({
      ...prev,
      ...newFilter,
    }))
  }

  const resetFilter = () => {
    setFilterState(initialFilter)
    setSearchTerm('')
  }

  return {
    searchTerm,
    filter,
    setFilter,
    setSearchTerm,
    resetFilter,
    data: response ?? [],
    isLoading,
    isFetching,
    refetch,
    pageIndex: response?.pageIndex ?? 0,
    pageSize: response?.pageSize ?? 0,
    total: response?.total ?? 0,
  }
}
