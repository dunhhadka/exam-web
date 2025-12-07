import { useCallback, useState } from 'react'
import { Select } from 'antd'
import styled from '@emotion/styled'
import {
  ExamLevel,
  ExamSearchRequest,
  ExamStatus,
  ExamStatusLabel,
} from '../../types/exam'

interface Props {
  filter: ExamSearchRequest
  onFilterChange: (newFilter: ExamSearchRequest) => void
  onClose?: () => void
}

export const ExamFilter = ({ filter, onFilterChange, onClose }: Props) => {
  const [filterState, setFilterState] = useState<ExamSearchRequest>(filter)

  const applyFilter = () => {
    onFilterChange({ ...filterState, pageIndex: 1, pageSize: 10 })
    onClose?.()
  }

  const restFilter = useCallback(() => {
    setFilterState({
      pageIndex: 1,
      pageSize: 10,
    })
  }, [])

  return (
    <FilterWrapper>
      <FilterHeader>
        <FilterTitle>Bộ lọc</FilterTitle>
        <FilterSubtitle>Tùy chỉnh kết quả tìm kiếm của bạn</FilterSubtitle>
      </FilterHeader>
      <FilterContent>
        <FilterSection>
          <FilterRow>
            <FilterItem>
              <FilterLabel>Người tạo</FilterLabel>
              <Select
                placeholder="Chọn"
                value={filterState.me}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    me: value,
                  })
                }
                allowClear
                options={[
                  { label: 'Tôi', value: true },
                  { label: 'Mọi người', value: false },
                ]}
              />
            </FilterItem>
            <FilterItem>
              <FilterLabel>Cấp độ</FilterLabel>
              <Select
                placeholder="Chọn cấp độ"
                value={filterState.level}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    level: value,
                  })
                }
                allowClear
                options={Object.entries(ExamLevel).map(([, level]) => ({
                  label: level,
                  value: level as ExamLevel,
                }))}
              />
            </FilterItem>
          </FilterRow>
        </FilterSection>

        <FilterSection>
          <FilterRow>
            <FilterItem>
              <FilterLabel>Trạng thái</FilterLabel>
              <Select
                placeholder="Chọn trạng thái"
                value={filterState.status}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    status: value,
                  })
                }
                allowClear
                options={Object.entries(ExamStatus).map(([, status]) => ({
                  label: ExamStatusLabel[status],
                  value: status as ExamStatus,
                }))}
              />
            </FilterItem>
            <FilterItem>
              <FilterLabel>Công khai</FilterLabel>
              <Select
                placeholder="Chọn trạng thái"
                value={filterState.publicFlag}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    publicFlag: value,
                  })
                }
                allowClear
                options={[
                  { label: 'Công khai', value: true },
                  { label: 'Chưa công khai', value: false },
                ]}
              />
            </FilterItem>
          </FilterRow>
        </FilterSection>
      </FilterContent>
      <FilterFooter>
        <FooterButton className="reset" onClick={restFilter}>
          Đặt lại
        </FooterButton>
        <FooterButton className="apply" onClick={applyFilter}>
          Áp dụng
        </FooterButton>
      </FilterFooter>
    </FilterWrapper>
  )
}

const FilterWrapper = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 100%;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
`

const FilterHeader = styled.div`
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-bottom: 2px solid #e8eaed;
`

const FilterTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border-radius: 2px;
  }
`

const FilterSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
  padding-left: 12px;
`

const FilterContent = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FilterItem = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  animation: fadeInUp 0.3s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ant-select {
    width: 100%;
    border-radius: 8px;

    .ant-select-selector {
      border-color: #d9e6f6 !important;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #b3d8ff !important;
      }
    }

    &.ant-select-focused .ant-select-selector {
      border-color: #1890ff !important;
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12) !important;
    }
  }
`

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
`

const FilterFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
`

const FooterButton = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  background: white;
  color: #333;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #b3d8ff;
    color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.12);
  }

  &.reset {
    &:hover {
      background: #f5f9ff;
    }
  }

  &.apply {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    border: none;
    color: white;

    &:hover {
      background: linear-gradient(135deg, #096dd9 0%, #1890ff 100%);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }
  }
`
