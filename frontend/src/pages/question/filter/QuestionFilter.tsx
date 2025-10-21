import { useCallback, useState } from "react";
import {
  Level,
  LevelLabel,
  QuestionFilterRequest,
  QuestionType,
  QuestionTypeLabel,
  Status,
  StatusLabel,
} from "../../../types/question";
import { DropDownFixedValues } from "../../../components/common/DropDownFixedValues";
import styled from "@emotion/styled";

interface Props {
  filter: QuestionFilterRequest;
  onFilterChange: (newFilter: QuestionFilterRequest) => void;
  onClose?: () => void;
}

export const QuestionFilter = ({ filter, onFilterChange, onClose }: Props) => {
  const [filterState, setFilterState] = useState<QuestionFilterRequest>(filter);

  const applyFilter = () => {
    onFilterChange({ ...filterState, pageIndex: 1, pageSize: 10 });

    onClose?.();
  };

  const restFilter = useCallback(() => {
    setFilterState({
      pageIndex: 1,
      pageSize: 10,
    });
  }, []);

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
              <DropDownFixedValues
                title="Người tạo"
                options={[
                  { label: "Tôi", value: "me" },
                  { label: "Mọi người", value: "all" },
                ]}
                value={filterState.createdBy}
                isRow={false}
                style={{ width: "100%" }}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    createdBy: value as "me" | "all",
                  })
                }
              />
            </FilterItem>

            <FilterItem>
              <DropDownFixedValues
                placeholder="Chọn loại câu hỏi"
                title="Loại câu hỏi"
                options={Object.entries(QuestionType).map(([value, type]) => ({
                  label: QuestionTypeLabel[type],
                  value: type,
                }))}
                isRow={false}
                style={{ width: "100%" }}
                value={filterState.type}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    type: value as QuestionType,
                  })
                }
              />
            </FilterItem>
          </FilterRow>
        </FilterSection>

        <FilterSection>
          <FilterRow>
            <FilterItem>
              <DropDownFixedValues
                placeholder="Chọn cấp độ"
                title="Cấp độ"
                options={Object.entries(Level).map(([value, level]) => ({
                  label: LevelLabel[level],
                  value: level,
                }))}
                isRow={false}
                style={{ width: "100%" }}
                value={filterState.level}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    level: value as Level,
                  })
                }
              />
            </FilterItem>
            <FilterItem>
              <DropDownFixedValues
                placeholder="Chọn cấp độ"
                title="Cấp độ"
                options={Object.entries(Level).map(([value, level]) => ({
                  label: LevelLabel[level],
                  value: level,
                }))}
                isRow={false}
                style={{ width: "100%" }}
              />
            </FilterItem>
          </FilterRow>
        </FilterSection>

        <FilterSection>
          <FilterRow>
            <FilterItem>
              <DropDownFixedValues
                title="Phạm vi"
                options={[
                  { label: "Công khai", value: "isPublish" },
                  { label: "Chỉ mình tôi", value: "isPrivate" },
                ]}
                placeholder="Chọn phạm vi"
                isRow={false}
                style={{ width: "100%" }}
                value={
                  filterState.isPublic === undefined
                    ? undefined
                    : filterState.isPublic
                    ? "isPublish"
                    : "isPrivate"
                }
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    isPublic:
                      value === "isPublish"
                        ? true
                        : value === "isPrivate"
                        ? false
                        : undefined,
                  })
                }
              />
            </FilterItem>
            <FilterItem>
              <DropDownFixedValues
                title="Trạng thái"
                options={Object.entries(Status).map(([value, status]) => ({
                  label: StatusLabel[status],
                  value: status,
                }))}
                placeholder="Chọn trạng thái"
                isRow={false}
                style={{ width: "100%" }}
                value={filterState.status}
                onChange={(value) =>
                  setFilterState({
                    ...filterState,
                    status: value as Status,
                  })
                }
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
  );
};

/* ==== Styled Components ==== */
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
`;

const FilterHeader = styled.div`
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  border-bottom: 2px solid #e8eaed;
`;

const FilterTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 18px;
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    border-radius: 2px;
  }
`;

const FilterSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 400;
  padding-left: 12px;
`;

const FilterContent = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterItem = styled.div`
  width: 300px;
  /* Style cho dropdown wrapper */
  & > div {
    width: 100%;
  }

  /* Optional: Add subtle animation */
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
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
`;

const FooterButton = styled.button`
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

  &.reset {
    background: #ffffff;
    color: #595959;
    border: 2px solid #d9d9d9;

    &:hover {
      border-color: #8c8c8c;
      color: #262626;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
    }
  }

  &.apply {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: #ffffff;
    border: none;

    &:hover {
      background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;
