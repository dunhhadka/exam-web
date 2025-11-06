import styled from '@emotion/styled'
import { Tag, TagSearchRequest } from '../../types/question'
import { Button, Input, Tag as TagAntd } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useSearchTagsQuery } from '../../services/api/questionApi'
import { useSearch } from '../search/useSearch'
import {
  CloseCircleFilled,
  InboxOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { TagCreation } from './TagCreation'

interface Props {
  tags?: Tag[]
  title?: string
  placeholder?: string
  onSelect: (tags: Tag[]) => void
  required?: boolean
}

export const TagSelection = ({
  title = 'Thẻ',
  tags,
  placeholder = 'Chọn thẻ',
  required,
  onSelect,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const [tagFilter, setTagFilter] = useState<TagSearchRequest>({
    pageIndex: 1,
    pageSize: 10,
  })

  const [selected, setSelected] = useState<Tag[]>(tags || [])

  const { data, isLoading, isFetching } = useSearchTagsQuery(tagFilter, {
    skip: !open,
  })

  const searchedTags: Tag[] = data || []

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (tag: Tag) => {
    let newSelected: Tag[] = []
    if (selected.find((t) => t.id === tag.id)) {
      newSelected = selected.filter((t) => t.id !== tag.id)
    } else {
      newSelected = [...selected, tag]
    }
    setSelected(newSelected)
    onSelect(newSelected)
  }

  const handleRemoveTag = (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const newSelected = selected.filter((t) => t.id !== tagId)
    setSelected(newSelected)
    onSelect(newSelected)
  }

  return (
    <Container ref={containerRef}>
      {title && (
        <Label>
          {title}
          {required && <RequiredMark>*</RequiredMark>}
        </Label>
      )}
      <ContentWrapper>
        <InputDropDownWrapper>
          <TagInputContainer onClick={() => setOpen(!open)} isOpen={open}>
            <TagsWrapper>
              {selected.length > 0 ? (
                selected.map((tag, index) => (
                  <SelectedTag key={index} color={tag.colorCode}>
                    <TagText>{tag.name}</TagText>
                    <CloseIcon onClick={(e) => handleRemoveTag(tag.id, e)}>
                      <CloseCircleFilled />
                    </CloseIcon>
                  </SelectedTag>
                ))
              ) : (
                <Placeholder>{placeholder}</Placeholder>
              )}
            </TagsWrapper>
          </TagInputContainer>

          {open && (
            <Dropdown>
              <SearchInputWrapper isVisible={open}>
                <SearchIcon>
                  <SearchOutlined />
                </SearchIcon>
                <SearchInput
                  placeholder="Tìm kiếm thẻ..."
                  onChange={(e) =>
                    setTagFilter({ ...tagFilter, name: e.target.value })
                  }
                  autoFocus
                />
              </SearchInputWrapper>
              {isLoading || isFetching ? (
                <LoadingStyled>
                  <span>Đang tải...</span>
                </LoadingStyled>
              ) : searchedTags?.length > 0 ? (
                <SearchListStyled>
                  {searchedTags.map((tag) => {
                    const isSelected = !!selected.find((t) => t.id === tag.id)
                    return (
                      <DropdownItem
                        key={tag.id}
                        isSelected={isSelected}
                        onClick={() => handleSelect(tag)}
                      >
                        <TagBadge color={tag.colorCode || '#8c8c8c'}>
                          {tag.name}
                        </TagBadge>
                        {isSelected && <CheckMark>✓</CheckMark>}
                      </DropdownItem>
                    )
                  })}
                </SearchListStyled>
              ) : (
                <NoDataStyled>
                  <InboxOutlined className="icon" />
                  <span>Không tìm thấy thẻ nào</span>
                </NoDataStyled>
              )}
              <CreateNewStyled>
                <TagCreation />
              </CreateNewStyled>
            </Dropdown>
          )}
        </InputDropDownWrapper>
      </ContentWrapper>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 50%;
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding-top: 8px;
`

const RequiredMark = styled.span`
  color: #ff4d4f;
  margin-left: 4px;
  font-size: 14px;
`

const InputDropDownWrapper = styled.div`
  position: relative;
  width: 100%;
`

const TagInputContainer = styled.div<{ isOpen?: boolean }>`
  padding: 6px 12px;
  background: #ffffff;
  border: 1.5px solid ${(props) => (props.isOpen ? '#1890ff' : '#d9d9d9')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) =>
    props.isOpen ? '0 0 0 2px rgba(24, 144, 255, 0.1)' : 'none'};

  &:hover {
    border-color: ${(props) => (props.isOpen ? '#1890ff' : '#40a9ff')};
  }
`

const TagsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`

const Placeholder = styled.span`
  color: #bfbfbf;
  font-size: 14px;
`

const SelectedTag = styled.div<{ color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${(props) => props.color || '#f0f0f0'};
  color: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &:hover {
    filter: brightness(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
`

const TagText = styled.span`
  line-height: 1;
`

const CloseIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.8;
  transition: all 0.2s;
  padding: 2px;
  border-radius: 50%;

  &:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }
`

const SearchInputWrapper = styled.div<{ isVisible?: boolean }>`
  display: ${(props) => (props.isVisible ? 'flex' : 'none')};
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`

const SearchIcon = styled.div`
  color: #8c8c8c;
  font-size: 16px;
  display: flex;
  align-items: center;
`

const SearchInput = styled(Input)`
  border: none;
  background: transparent;
  padding: 0;
  box-shadow: none;

  &:focus {
    border: none;
    box-shadow: none;
  }
`

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const SearchListStyled = styled.div`
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;

    &:hover {
      background: #bfbfbf;
    }
  }
`

const DropdownItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  background: ${(props) => (props.isSelected ? '#e6f7ff' : 'transparent')};

  &:hover {
    background: ${(props) => (props.isSelected ? '#e6f7ff' : '#f5f5f5')};
  }
`

const TagBadge = styled.div<{ color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: ${(props) => props.color};
  color: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`

const CheckMark = styled.div`
  color: #1890ff;
  font-size: 16px;
  font-weight: bold;
`

const NoDataStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  color: #8c8c8c;

  .icon {
    font-size: 48px;
    margin-bottom: 12px;
    color: #d9d9d9;
  }

  span {
    font-size: 14px;
  }
`

const LoadingStyled = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #8c8c8c;
  font-size: 14px;
`

const CreateNewStyled = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 8px;
`
