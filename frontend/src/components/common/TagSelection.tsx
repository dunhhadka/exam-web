import styled from "@emotion/styled";
import { Tag, TagSearchRequest } from "../../types/question";
import { Button, Input } from "antd";
import { useEffect, useRef, useState } from "react";
import { useSearchTagsQuery } from "../../services/api/questionApi";
import { useSearch } from "../search/useSearch";
import { InboxOutlined } from "@ant-design/icons";
import { TagCreation } from "./TagCreation";

interface Props {
  tags?: Tag[];
  title?: string;
  placeholder?: string;
  onSelect: (tags: Tag[]) => void;
  required?: boolean;
}

export const TagSelection = ({
  title = "Thẻ",
  tags,
  placeholder = "Chọn thẻ",
  required,
  onSelect,
}: Props) => {
  const constainerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState<Tag[]>(tags || []);

  const { data, isLoading, isFetching } = useSearchTagsQuery(
    { pageIndex: 1, pageSize: 10 },
    { skip: !open }
  );

  const searchedTags: Tag[] = data?.data || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        constainerRef.current &&
        !constainerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Container ref={constainerRef}>
      {title && (
        <Label>
          {title}
          {required && <RequiredMark>*</RequiredMark>}
        </Label>
      )}
      <InputDropDownStyled>
        <SelectStyled
          onClick={() => setOpen(!open)}
          placeholder={placeholder}
        />
        {open && (
          <Dropdown>
            <SelectedStyled />
            {!!searchedTags?.length ? (
              <SearchListStyled>
                {searchedTags.map((tag) => (
                  <DropItemConainer>
                    <DropdownItem
                      key={tag.id}
                      //selected={!!selected.find((t) => t.id === tag.id)}
                      style={{
                        backgroundColor: tag.colorCode || "#ccc",
                        color: "#fff",
                      }}
                      //onClick={() => handleSelect(tag)}
                    >
                      {tag.name}
                    </DropdownItem>
                  </DropItemConainer>
                ))}
              </SearchListStyled>
            ) : (
              <NoDataStyled>
                <InboxOutlined className="icon" />
                <span>Không có dữ liệu</span>
              </NoDataStyled>
            )}
            <CreateNewStyled>
              <TagCreation />
            </CreateNewStyled>
          </Dropdown>
        )}
      </InputDropDownStyled>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const RequiredMark = styled.span`
  color: #ff4d4f; // Red color for required indicator
  margin-left: 4px;
`;

const SelectStyled = styled(Input)`
  width: 100%;
`;

const InputDropDownStyled = styled.div`
  width: 400px;
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
`;

const SelectedStyled = styled.div``;

const SearchListStyled = styled.div``;

const NoDataStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  color: #999;

  .icon {
    font-size: 32px;
    margin-bottom: 8px;
    color: #d9d9d9;
  }

  span {
    font-size: 14px;
  }
`;

const CreateNewStyled = styled.div``;

const DropdownItem = styled.div<{ selected?: boolean }>`
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  margin: 4px 8px;
  transition: all 0.2s;
  width: fit-content;

  &:hover {
    filter: brightness(0.9);
  }
`;

const TagColorPreview = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const DropItemConainer = styled.div`
  width: 100%;
  $:hover {
   filter: brightness(0.9);
  }
`;
