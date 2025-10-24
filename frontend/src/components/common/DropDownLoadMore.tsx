import styled from "@emotion/styled";
import { Select, SelectProps, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";

interface Props<T = any> extends Omit<SelectProps, "options" | "onSearch"> {
  fetchData: (params: {
    page: number;
    pageSize: number;
    search?: string;
  }) => Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;
  renderOption: (item: T) => { label: string; value: any };
  pageSize?: number;
  debounceTime?: number;
  searchPlaceholder?: string;
}

const DropdownLoadMore = <T,>({
  fetchData,
  renderOption,
  debounceTime = 300,
  pageSize = 20,
  searchPlaceholder = "Tìm kiếm...",
  ...selectProps
}: Props<T>) => {
  const [options, setOptions] = useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  const handleSearch = (value: string) => {
    setSearchValue(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      loadData(1, value);
    }, debounceTime);
  };

  const handlePopupScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    if (scrollBottom < 10 && hasMore && !loadingMore && !loading) {
      loadData(page + 1, searchValue);
    }
  };

  const loadData = async (currentPage: number, search?: string) => {
    try {
      if (currentPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await fetchData({
        page: currentPage,
        pageSize: pageSize,
        search,
      });

      const newOptions = result.data?.map(renderOption) ?? [];

      if (currentPage === 1) {
        setOptions(newOptions);
      } else {
        setOptions((old) => [...old, ...newOptions]);
      }

      setHasMore(result.hasMore);
      setPage(currentPage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  return (
    <StyledSelect
      {...selectProps}
      options={options}
      loading={loading}
      showSearch
      onSearch={handleSearch}
      onPopupScroll={handlePopupScroll}
      placeholder={searchPlaceholder}
      filterOption={false}
      notFoundContent={
        loading ? (
          <SpinWrapper>
            <Spin size="small" />
          </SpinWrapper>
        ) : (
          <EmptyText>Không tìm thấy dữ liệu</EmptyText>
        )
      }
      dropdownRender={(menu) => (
        <div ref={dropdownRef}>
          {menu}
          {loadingMore && (
            <LoadMoreWrapper>
              <Spin size="small" />
              <span>Đang tải thêm...</span>
            </LoadMoreWrapper>
          )}
        </div>
      )}
    ></StyledSelect>
  );
};

export default DropdownLoadMore;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: 40px !important;
    padding: 4px 11px !important;
  }

  .ant-select-selection-search-input {
    height: 38px !important;
  }

  .ant-select-selection-item {
    line-height: 38px !important;
  }
`;

const SpinWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: 20px;
  color: #999;
`;

const LoadMoreWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  color: #666;
  font-size: 13px;
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 8px;
  border: none;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  color: #1890ff;
  cursor: pointer;
  font-size: 13px;

  &:hover:not(:disabled) {
    background: #f5f5f5;
  }

  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
`;

const FormRow = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
`;
