import styled from '@emotion/styled'
import { Button, Flex } from 'antd'
import Table, { ColumnType, TableProps } from 'antd/es/table'
import React from 'react'

interface SearchApiConfig<T> {}

interface ButtonAction {
  title: string
  disabled?: boolean
  onClick: () => void
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'danger'
}

interface Props<T = any>
  extends Omit<TableProps<T>, 'columns' | 'dataSource' | 'title'> {
  columns: ColumnType<T>[]
  data?: T[]
  variant?: 'default' | 'compact'
  showHeader?: boolean
  stickyHeader?: boolean
  maxHeight?: number | string
  emptyText?: string
  onRowClick?: (record: T, index: number) => void
  onRowDoubleClick?: (record: T, index: number) => void
  customClassName?: string
  searchApiConfig?: SearchApiConfig<T>
  tableTitle?: string
  actions?: ButtonAction[]
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
}

export const CustomTable = <T extends Record<string, any>>({
  columns,
  data,
  variant = 'default',
  showHeader = true,
  stickyHeader = false,
  maxHeight,
  emptyText = 'Không có dữ liệu',
  onRowClick,
  onRowDoubleClick,
  customClassName,
  loading = false,
  size = 'middle',
  pagination,
  tableTitle,
  actions,
  ...restProps
}: Props<T>) => {
  return (
    <Wrapper className={customClassName}>
      {(tableTitle || (actions && actions.length > 0)) && (
        <HeaderBar>
          {tableTitle && <Title>{tableTitle}</Title>}
          {actions && !!actions.length && (
            <Flex gap="small" wrap>
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  icon={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  type={action.color === 'primary' ? 'primary' : 'default'}
                  danger={action.color === 'danger'}
                >
                  {action.title}
                </Button>
              ))}
            </Flex>
          )}
        </HeaderBar>
      )}

      <Table<T>
        columns={columns}
        dataSource={data ?? []}
        showHeader={showHeader}
        loading={loading}
        size={size}
        locale={{ emptyText }}
        pagination={pagination}
        scroll={{
          x: 'max-content',
          y: maxHeight || undefined,
        }}
        {...restProps}
      />
    </Wrapper>
  )
}

/* ==== Styled Components ==== */
const Wrapper = styled.div`
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
`

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
`
