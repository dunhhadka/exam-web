import React from 'react'
import { Modal } from '../../components/common/Modal'
import { QuestionType } from '../../types/question'
import styled from '@emotion/styled'
import {
  CheckSquareOutlined,
  CheckCircleOutlined,
  TableOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (type: QuestionType) => void
}

interface QuestionTypeItem {
  label: string
  type: QuestionType
  icon: React.ReactNode
}

interface QuestionTypeGroup {
  title: string
  items: QuestionTypeItem[]
  color: string
}

export const QuestionTypeCreate = ({ open, onClose, onSelect }: Props) => {
  const questionGroups: QuestionTypeGroup[] = [
    {
      title: 'Trắc nghiệm',
      color: '#3f51b5',
      items: [
        {
          label: 'Trắc nghiệm (Chọn một)',
          icon: <CheckCircleOutlined />,
          type: QuestionType.ONE_CHOICE,
        },
        {
          label: 'Trắc nghiệm (Chọn nhiều)',
          icon: <CheckSquareOutlined />,
          type: QuestionType.MULTI_CHOICE,
        },
        {
          label: 'Trắc nghiệm (Đúng sai)',
          icon: <FileTextOutlined />,
          type: QuestionType.TRUE_FALSE,
        },
        {
          label: 'Trắc nghiệm (Bảng)',
          icon: <TableOutlined />,
          type: QuestionType.TABLE_CHOICE,
        },
      ],
    },
    {
      title: 'Đoạn văn',
      color: '#00c9a7',
      items: [
        {
          label: 'Đoạn văn',
          icon: <EditOutlined />,
          type: QuestionType.PLAIN_TEXT,
        },
      ],
    },
  ]

  return (
    <Modal
      title="Chọn loại câu hỏi"
      size="large"
      open={open}
      onClose={onClose}
      onCancel={onClose}
    >
      <Container>
        {questionGroups.map((group, idx) => (
          <Group key={idx}>
            <GroupTitle>{group.title}</GroupTitle>
            <Items>
              {group.items.map((item, i) => (
                <ItemCard key={i} onClick={() => onSelect(item.type)}>
                  <IconBox style={{ backgroundColor: group.color }}>
                    {item.icon}
                  </IconBox>
                  <Label>{item.label}</Label>
                </ItemCard>
              ))}
            </Items>
          </Group>
        ))}
      </Container>
    </Modal>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 25px;
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const GroupTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #333;
`

const Items = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
`

const ItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.1);
  }
`

const IconBox = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  flex-shrink: 0;
`

const Label = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: #333;
`
