import styled from '@emotion/styled'
import { Button, Flex, Input, Popover, Tag } from 'antd'
import Table, { ColumnType, TableProps } from 'antd/es/table'
import { TableRowSelection } from 'antd/es/table/interface'
import React from 'react'
import {
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons'

interface SearchApiConfig<T> {}

export interface LabelItem {
  label: string
  value: string | number
  onClose?: () => void
}

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
  showQuery?: boolean
  query?: string
  onQueryChange?: (query: string) => void
  placeholder?: string
  labelItems?: LabelItem[]
  openFilter?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowSelection?: TableRowSelection<T>
  onFilterClick?: (openFilter: boolean) => void
  filterActive?: boolean
  filterComponent?: React.ReactNode

  // thêm prop padding: nếu không truyền thì không có padding
  padding?: string | number
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
  rowSelection,
  showQuery = false,
  labelItems,
  query = '',
  onQueryChange,
  placeholder = 'Tìm kiếm...',
  onFilterClick,
  filterActive = false,
  filterComponent,
  openFilter,
  padding, // <- sử dụng prop mới
  ...restProps
}: Props<T>) => {
  return (
    <Wrapper className={customClassName}>
      {(tableTitle || (actions && actions.length > 0)) && (
        <HeaderBar>
          <LeftSection>{tableTitle && <Title>{tableTitle}</Title>}</LeftSection>
          {actions && !!actions.length && (
            <ActionButtons gap="small" wrap>
              {actions.map((action, idx) => (
                <StyledButton
                  key={idx}
                  icon={action.icon}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  type={action.color === 'primary' ? 'primary' : 'default'}
                  danger={action.color === 'danger'}
                >
                  {action.title}
                </StyledButton>
              ))}
            </ActionButtons>
          )}
        </HeaderBar>
      )}

      {filterActive && (
        <FilterActionStyled>
          <SearchSection>
            <SearchInput
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQueryChange?.(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              size="large"
            />
          </SearchSection>

          <FilterSection>
            <Popover
              open={openFilter}
              trigger={'click'}
              placement="bottomRight"
              arrow={false}
              content={filterComponent}
            >
              <FilterButton
                icon={<FilterOutlined />}
                onClick={() => {
                  onFilterClick?.(!openFilter)
                }}
                className={filterActive ? 'active' : ''}
              >
                Bộ lọc
              </FilterButton>
            </Popover>
          </FilterSection>
        </FilterActionStyled>
      )}

      {labelItems && labelItems.length > 0 && (
        <LabelItemsSection>
          <LabelItemsWrapper>
            {labelItems.map((item, idx) => (
              <StyledTag
                key={`${item.value}-${idx}`}
                closable={!!item.onClose}
                onClose={(e) => {
                  e.preventDefault()
                  item.onClose?.()
                }}
                closeIcon={<CloseOutlined />}
              >
                <TagContent>
                  <TagLabel>{item.label}:</TagLabel>
                  <TagValue>{item.value}</TagValue>
                </TagContent>
              </StyledTag>
            ))}
          </LabelItemsWrapper>
        </LabelItemsSection>
      )}

      <TableWrapper contentPadding={padding}>
        <Table<T>
          columns={columns}
          dataSource={data ?? []}
          showHeader={showHeader}
          loading={loading}
          size={size}
          locale={{ emptyText }}
          pagination={
            pagination
              ? {
                  ...pagination,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '20'],
                }
              : false
          }
          rowSelection={rowSelection}
          scroll={{
            x: 'max-content',
            y: maxHeight || undefined,
          }}
          {...restProps}
        />
      </TableWrapper>
    </Wrapper>
  )
}

/* ==== Styled Components (simplified) ==== */
const Wrapper = styled.div`
  background: #fff;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 6px;
`

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
  background: transparent;
`

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #222;
`

const ActionButtons = styled(Flex)`
  gap: 8px;
`

const StyledButton = styled(Button)`
  border-radius: 6px;
  height: 34px;
  padding: 0 12px;
  font-weight: 500;
  box-shadow: none;

  &.ant-btn-primary {
    border: none;
  }
`

const FilterActionStyled = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
  background: transparent;
  flex-wrap: wrap;
`

const SearchSection = styled.div`
  flex: 1;
  min-width: 220px;
`

const SearchInput = styled(Input)`
  max-width: 420px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  box-shadow: none;

  .ant-input-prefix {
    color: #8c8c8c;
  }
`

const FilterSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const FilterButton = styled(Button)`
  border-radius: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #444;

  &.active {
    border-color: #1890ff;
    color: #1890ff;
  }
`

const LabelItemsSection = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #f5f5f5;
  background: transparent;
`

const LabelItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`

const StyledTag = styled(Tag)`
  margin: 0;
  padding: 5px 12px;
  border-radius: 20px;
  background: #e6f7ff; /* xanh nhạt hơn primary */
  border: 1px solid #91d5ff; /* viền xanh pastel */
  font-size: 13px;
  font-weight: 500;
  color: #1890ff; /* text giữ màu primary */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #bae7ff; /* xanh hover đậm hơn */
    border-color: #69c0ff;
    color: #096dd9; /* text đậm hơn một chút */
  }
  .anticon-close {
    font-size: 12px;
  }
`

const TagContent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const TagLabel = styled.span`
  color: #555;
  font-weight: 500;
`

const TagValue = styled.span`
  color: #333;
  font-weight: 600;
`

const TableWrapper = styled.div<{ contentPadding?: string | number }>`
  padding: ${(p) =>
    p.contentPadding === undefined
      ? '0'
      : typeof p.contentPadding === 'number'
      ? `${p.contentPadding}px`
      : p.contentPadding};

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: #fff;
    font-weight: 600;
    color: #666;
    border-bottom: 1px solid #f0f0f0;
    padding: 10px 12px;
    font-size: 12px;
    text-transform: none;
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f7f7f7;
    padding: 10px 12px;
    color: #333;
    font-size: 13px;
  }

  .ant-table-tbody > tr:hover > td {
    background: transparent;
  }

  .ant-pagination {
    padding: 10px 12px;
    margin: 0;
  }

  .ant-empty {
    padding: 24px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }
`
