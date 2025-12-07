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

/* ==== Styled Components (Modern Design) ==== */
const Wrapper = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f9fbff 100%);
  overflow: hidden;
  border: 1px solid #e8eef7;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
  border-bottom: 1px solid #e8eef7;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f8fb 100%);
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
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
`

const ActionButtons = styled(Flex)`
  gap: 10px;
`

const StyledButton = styled(Button)`
  border-radius: 8px;
  height: 36px;
  padding: 0 14px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;

  &.ant-btn-primary {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    border: none;
    color: white;

    &:hover {
      background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.ant-btn-default {
    border: 1px solid #d9e6f6;
    color: #333;
    background: #fff;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.12);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FilterActionStyled = styled.div`
  display: flex;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid #e8eef7;
  align-items: center;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f8fb 100%);
  flex-wrap: wrap;
`

const SearchSection = styled.div`
  flex: 1;
  min-width: 220px;
`

const SearchInput = styled(Input)`
  max-width: 420px;
  border-radius: 8px;
  border: 1px solid #d9e6f6;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #b3d8ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
  }

  &:focus {
    border-color: #1890ff !important;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12) !important;
  }

  .ant-input-prefix {
    color: #8c95a8;
  }

  .ant-input {
    font-size: 14px;
    color: #333;

    &::placeholder {
      color: #bac0d0;
    }
  }
`

const FilterSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const FilterButton = styled(Button)`
  border-radius: 8px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d9e6f6;
  background: white;
  color: #666;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #b3d8ff;
    color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.12);
  }

  &.active {
    border-color: #1890ff;
    color: white;
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
`

const LabelItemsSection = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid #e8eef7;
  background: #fafbfc;
`

const LabelItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const StyledTag = styled(Tag)`
  margin: 0;
  padding: 6px 14px;
  border-radius: 24px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border: 1px solid #91d5ff;
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.08);

  &:hover {
    background: linear-gradient(135deg, #bae7ff 0%, #e6f7ff 100%);
    border-color: #69c0ff;
    color: #096dd9;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
    transform: translateY(-2px);
  }

  .anticon-close {
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: #ff4d4f;
      transform: scale(1.2);
    }
  }
`

const TagContent = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const TagLabel = styled.span`
  color: #666;
  font-weight: 600;
`

const TagValue = styled.span`
  color: #1890ff;
  font-weight: 700;
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
    font-size: 14px;
  }

  .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #fafbfc 0%, #f5f8fb 100%);
    font-weight: 700;
    color: #333;
    border-bottom: 2px solid #e8eef7;
    padding: 14px 16px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #f5f8fb 0%, #eef3f9 100%);
    }
  }

  .ant-table-tbody > tr {
    transition: background-color 0.15s ease-out;

    > td {
      border-bottom: 1px solid #f0f3f8;
      padding: 14px 16px;
      color: #333;
      font-size: 14px;
      transition: background-color 0.15s ease-out;
    }

    &:nth-child(odd) > td {
      background-color: #ffffff;
    }

    &:nth-child(even) > td {
      background-color: #f8fbff;
    }

    &:hover > td {
      background-color: #f0f7ff;
    }

    &:last-child > td {
      border-bottom: 1px solid #f0f3f8;
    }
  }

  .ant-table-row-selected {
    > td {
      background: linear-gradient(135deg, #e6f7ff 0%, #eef5ff 100%) !important;
    }

    &:hover > td {
      background: linear-gradient(135deg, #bae7ff 0%, #e6f7ff 100%) !important;
    }
  }

  .ant-pagination {
    padding: 14px 16px;
    margin: 0;
    border-top: 1px solid #f0f3f8;
    background: #fafbfc;
  }

  .ant-pagination-item {
    border-radius: 6px;
    border-color: #d9e6f6;
    transition: all 0.2s;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }

    &.ant-pagination-item-active {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
      border-color: #1890ff;

      a {
        color: white;
      }
    }
  }

  .ant-pagination-next,
  .ant-pagination-prev {
    transition: all 0.2s;

    button {
      border-radius: 6px;
      border-color: #d9e6f6;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        border-color: #1890ff;
        color: #1890ff;
      }
    }
  }

  .ant-empty {
    padding: 32px 24px;
    background: transparent;
  }

  .ant-empty-description {
    color: #8c95a8;
    font-size: 14px;
    font-weight: 500;
  }

  .ant-empty-img-simple {
    g {
      stroke: #b3d8ff;
    }
  }
`
