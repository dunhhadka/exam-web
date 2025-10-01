import { Tag, Tooltip } from 'antd'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import {
  Level,
  LevelColor,
  LevelLabel,
  Question,
  QuestionType,
  QuestionTypeColor,
  QuestionTypeLabel,
  Status,
  StatusColor,
  StatusLabel,
  Tag as QuestionTag,
  QuestionFilterRequest,
} from '../../types/question'
import styled from '@emotion/styled'
import { createActionColumns } from '../../components/search/createActionColumn'
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { QuestionTypeCreate } from './QuestionTypeCreate'
import { useSearchQuestionQuery } from '../../services/api/questionApi'

export const QuestionList = () => {
  const columns = [
    createColumn<Question>('Cấp độ', 'level', {
      render: (value: Level) =>
        value ? <Tag color={LevelColor[value]}>{LevelLabel[value]}</Tag> : null,
    }),

    createColumn<Question>('Thẻ', 'tags', {
      render: (value?: QuestionTag[]) =>
        value
          ? value.map((v) => (
              <Tag key={v.id} color={v.colorCode}>
                {v.name}
              </Tag>
            ))
          : null,
    }),

    createColumn<Question>('Câu hỏi', 'text', {
      render: (value) =>
        value ? (
          <Tooltip title={value}>
            <Truncate3Lines>{value}</Truncate3Lines>
          </Tooltip>
        ) : null,
    }),

    createColumn<Question>('Người tạo', 'createdBy'),

    createColumn<Question>('Loại', 'type', {
      render: (value?: QuestionType) =>
        value ? (
          <Tag color={QuestionTypeColor[value]}>{QuestionTypeLabel[value]}</Tag>
        ) : null,
    }),

    createColumn<Question>('Trạng thái', 'status', {
      render: (value: Status) =>
        value ? (
          <Tag color={StatusColor[value]}>{StatusLabel[value]}</Tag>
        ) : null,
    }),

    createColumn<Question>('Người cập nhật', 'lastModifiedBy'),
    createColumn<Question>('Ngày tạo', 'createdAt'),

    createActionColumns<Question>([
      {
        label: 'Sao chép',
        icon: <CopyOutlined />,
        onClick: (record) => console.log('copy', record),
      },
      {
        label: 'Cập nhật',
        icon: <EditOutlined />,
        onClick: (record) => console.log('edit', record),
      },
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => console.log('delete', record),
        danger: true,
      },
    ]),
  ]

  const [filter, setFilter] = useState<QuestionFilterRequest>({
    pageIndex: 0,
    pageSize: 5,
    total: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  })

  const {
    data: questionData,
    isLoading: isQuestionLoading,
    isFetching: isQuestionFetching,
  } = useSearchQuestionQuery(filter, { refetchOnMountOrArgChange: true })
  const navigate = useNavigate()

  const [showQuestionCreateModal, setShowQuestionCreateModal] = useState(false)

  const handleAddQuestionAction = () => {
    setShowQuestionCreateModal(true)
  }

  const handleDownloadExcel = () => {
    console.log('handle download excel')
  }

  const handleTypeSelect = (type: QuestionType) => {
    navigate('/questions/create', { state: { type } })

    setShowQuestionCreateModal(false)
  }

  return (
    <div>
      <CustomTable<Question>
        columns={columns}
        emptyText="Danh sách câu hỏi trống"
        data={questionData?.data ?? []}
        tableTitle="Danh sách câu hỏi"
        loading={isQuestionLoading || isQuestionFetching}
        pagination={{
          current: (questionData?.pageIndex ?? 0) + 1,
          pageSize: questionData?.pageSize ?? 10,
          total: questionData?.total ?? 0,
          onChange: (page, pageSize) => {
            setFilter({
              ...filter,
              pageIndex: page - 1,
              pageSize: pageSize,
            })
          },
        }}
        actions={[
          {
            title: 'Tải xuống',
            icon: <DownloadOutlined />,
            onClick: handleDownloadExcel,
            color: 'secondary',
          },
          {
            title: 'Thêm câu hỏi mới',
            icon: <PlusCircleOutlined />,
            onClick: handleAddQuestionAction,
            color: 'primary',
          },
        ]}
      />
      {showQuestionCreateModal && (
        <QuestionTypeCreate
          open={showQuestionCreateModal}
          onClose={() => setShowQuestionCreateModal(false)}
          onSelect={handleTypeSelect}
        />
      )}
    </div>
  )
}

export const Truncate3Lines = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 3; /* số dòng tối đa */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal; /* cho phép xuống dòng */
`
