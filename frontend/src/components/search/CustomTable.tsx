import styled from "@emotion/styled";
import { Button, Flex, Input, Popover, Tag } from "antd";
import Table, { ColumnType, TableProps } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";
import React, { useState } from "react";
import {
  FilterOutlined,
  SearchOutlined,
  CloseOutlined,
} from "@ant-design/icons";

interface SearchApiConfig<T> {}

export interface LabelItem {
  label: string;
  value: string | number;
  onClose?: () => void;
}

interface ButtonAction {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "danger";
}

interface Props<T = any>
  extends Omit<TableProps<T>, "columns" | "dataSource" | "title"> {
  columns: ColumnType<T>[];
  data?: T[];
  variant?: "default" | "compact";
  showHeader?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  emptyText?: string;
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  customClassName?: string;
  searchApiConfig?: SearchApiConfig<T>;
  tableTitle?: string;
  actions?: ButtonAction[];
  showQuery?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  labelItems?: LabelItem[];
  openFilter?: boolean,
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: TableRowSelection<T>;
  onFilterClick?: (openFilter: boolean) => void;
  filterActive?: boolean;
  filterComponent?: React.ReactNode;
}

export const CustomTable = <T extends Record<string, any>>({
  columns,
  data,
  variant = "default",
  showHeader = true,
  stickyHeader = false,
  maxHeight,
  emptyText = "Không có dữ liệu",
  onRowClick,
  onRowDoubleClick,
  customClassName,
  loading = false,
  size = "middle",
  pagination,
  tableTitle,
  actions,
  rowSelection,
  showQuery = false,
  labelItems,
  query = "",
  onQueryChange,
  placeholder = "Tìm kiếm...",
  onFilterClick,
  filterActive = false,
  filterComponent,
  openFilter,
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
                  type={action.color === "primary" ? "primary" : "default"}
                  danger={action.color === "danger"}
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
              trigger={"click"}
              placement="bottomRight"
              arrow={false}
              content={filterComponent}
            >
              <FilterButton
                icon={<FilterOutlined />}
                onClick={() => {onFilterClick?.(!openFilter)}}
                className={filterActive ? "active" : ""}
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
                  e.preventDefault();
                  item.onClose?.();
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

      <TableWrapper>
        <Table<T>
          columns={columns}
          dataSource={data ?? []}
          showHeader={showHeader}
          loading={loading}
          size={size}
          locale={{ emptyText }}
          pagination={pagination}
          rowSelection={rowSelection}
          scroll={{
            x: "max-content",
            y: maxHeight || undefined,
          }}
          {...restProps}
        />
      </TableWrapper>
    </Wrapper>
  );
};

/* ==== Styled Components ==== */
const Wrapper = styled.div`
  background: #ffffff;
  overflow: hidden;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  gap: 20px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #262626;
  letter-spacing: -0.02em;
  white-space: nowrap;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ActionButtons = styled(Flex)`
  gap: 10px;
`;

const StyledButton = styled(Button)`
  border-radius: 8px;
  font-weight: 500;
  height: 38px;
  padding: 0 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &.ant-btn-primary {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border: none;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
    }
  }

  &.ant-btn-dangerous {
    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(255, 77, 79, 0.25);
    }
  }
`;

const FilterActionStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
`;

const SearchSection = styled.div`
  flex: 1;
  min-width: 280px;
`;

const SearchInput = styled(Input)`
  max-width: 500px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    border-color: #d9d9d9;
  }

  &:focus,
  &.ant-input-focused {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.08),
      0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .ant-input-prefix {
    color: #8c8c8c;
    font-size: 16px;
    margin-right: 8px;
  }

  .ant-input {
    font-size: 15px;

    &::placeholder {
      color: #bfbfbf;
    }
  }

  .ant-input-clear-icon {
    font-size: 14px;
    color: #bfbfbf;

    &:hover {
      color: #8c8c8c;
    }
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const FilterButton = styled(Button)`
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  padding: 0 20px;
  border: 2px solid #d9d9d9;
  background: #ffffff;
  color: #595959;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;

  .anticon {
    font-size: 16px;
  }

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  }

  &.active {
    border-color: #1890ff;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const LabelItemsSection = styled.div`
  padding: 12px 24px;
  background: linear-gradient(to bottom, #f0f7ff, #fafafa);
  border-bottom: 1px solid #e6f0ff;
`;

const LabelItemsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

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
    color: #1890ff;
    transition: all 0.2s ease;
    margin-left: 2px;
    padding: 2px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #fff;
      background: #1890ff; /* hover icon close: trắng trên nền primary */
    }
  }
`;

const TagContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TagLabel = styled.span`
  color: #0050b3;
  font-weight: 500;
`;

const TagValue = styled.span`
  color: #003a8c;
  font-weight: 600;
`;

const TableWrapper = styled.div`
  padding: 0;

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: #fafafa;
    font-weight: 600;
    color: #595959;
    border-bottom: 2px solid #f0f0f0;
    padding: 14px 16px;
    font-size: 14px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    font-size: 12px;

    &:first-of-type {
      padding-left: 24px;
    }

    &:last-of-type {
      padding-right: 24px;
    }
  }

  .ant-table-tbody > tr {
    transition: all 0.2s ease;

    &:hover {
      background: #f5f9ff !important;
    }

    > td {
      border-bottom: 1px solid #f5f5f5;
      padding: 16px;
      color: #434343;
      font-size: 14px;

      &:first-of-type {
        padding-left: 24px;
      }

      &:last-of-type {
        padding-right: 24px;
      }
    }

    &:last-child > td {
      border-bottom: none;
    }
  }

  .ant-table-tbody > tr.ant-table-row-selected > td {
    background: #e6f7ff;
  }

  .ant-pagination {
    padding: 16px 24px;
    margin: 0;
  }

  .ant-empty {
    padding: 48px 24px;
  }

  .ant-empty-description {
    color: #8c8c8c;
    font-size: 14px;
  }
`;
