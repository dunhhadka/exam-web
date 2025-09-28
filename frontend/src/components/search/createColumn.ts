export const createColumn = <T = any>(
  title: string,
  dataIndex: keyof T,
  options?: {
    width?: number | string
    fixed?: 'left' | 'right'
    sorter?: boolean
    render?: (value: any, record: T, index: number) => React.ReactNode
    align?: 'left' | 'center' | 'right'
  }
) => ({
  title,
  dataIndex: dataIndex as string,
  key: dataIndex as string,
  ...options,
})
