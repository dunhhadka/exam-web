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
import { QuestionFilter } from './filter/QuestionFilter'
import { useFilterQuestionQuery } from '../../hooks/useFilterQuestionQuery'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useDeleteQuestionMutation } from '../../services/api/questionApi'
import { useToast } from '../../hooks/useToast'
import { formatDateTimeToRequest, formatInstant } from '../../utils/times'

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
    createColumn<Question>('Ngày tạo', 'createdAt', {
      render: (value: string) => formatInstant(value),
    }),

    createActionColumns<Question>([
      {
        label: 'Sao chép',
        icon: <CopyOutlined />,
        onClick: (record) => {
          setShowQuestionCopyModal(true)
          setQuestionSelectedId(record.id)
        },
      },
      {
        label: 'Cập nhật',
        icon: <EditOutlined />,
        onClick: (record) => {
          setShowQuestionEditModal(true)
          setQuestionSelectedId(record.id)
          setQuestionSelected(record)
        },
      },
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => {
          setShowModalDeleteQuestion(true)
          setQuestionSelectedId(record.id)
        },
        danger: true,
      },
    ]),
  ]

  const [openFilter, setOpenFilter] = useState(false)

  const {
    query,
    changeQuery,
    filter,
    labelItems,
    changeFilter,
    result: questionData,
    count,
    isLoading: isQuestionLoading,
    isFetching: isQuestionFetching,
  } = useFilterQuestionQuery({})

  const navigate = useNavigate()

  const [deleteQuestion, { isLoading: isDeleteQuestionLoading }] =
    useDeleteQuestionMutation()

  const [showQuestionCreateModal, setShowQuestionCreateModal] = useState(false)

  const [showModalDeleteQuestion, setShowModalDeleteQuestion] = useState(false)
  const [questionSeletedId, setQuestionSelectedId] = useState<
    number | undefined
  >(undefined)
  const [showQuestionCopyModal, setShowQuestionCopyModal] = useState(false)
  const [showQuestionEditModal, setShowQuestionEditModal] = useState(false)
  const [questionSelected, setQuestionSelected] = useState<
    Question | undefined
  >(undefined)

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

  const toast = useToast()

  const handleDeleteQuestion = async () => {
    if (!showModalDeleteQuestion || !questionSeletedId) {
      return
    }

    try {
      const res = await deleteQuestion({
        questionId: questionSeletedId,
      }).unwrap()

      toast.success('Xoá câu hỏi thành công')

      setShowModalDeleteQuestion(false)
      setQuestionSelectedId(undefined)
    } catch (error) {
      console.log(error)
    }
  }

  console.log(filter)

  return (
    <div>
      <CustomTable<Question>
        columns={columns}
        emptyText="Danh sách câu hỏi trống"
        data={questionData ?? []}
        tableTitle="Danh sách câu hỏi"
        loading={
          isQuestionLoading || isQuestionFetching || isDeleteQuestionLoading
        }
        showQuery
        placeholder="Tìm kiếm câu hỏi..."
        query={query}
        filterActive
        labelItems={labelItems}
        onQueryChange={changeQuery}
        openFilter={openFilter}
        onFilterClick={setOpenFilter}
        pagination={{
          current: filter.pageIndex ?? 0,
          pageSize: filter.pageSize ?? 10,
          total: count,
          onChange: (page, pageSize) => {
            changeFilter({
              ...filter,
              pageIndex: page,
              pageSize: pageSize,
            })
          },
        }}
        filterComponent={
          <QuestionFilter
            filter={filter}
            onFilterChange={changeFilter}
            onClose={() => setOpenFilter(false)}
          />
        }
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
      {showModalDeleteQuestion && (
        <ConfirmModal
          open={showModalDeleteQuestion}
          onOk={handleDeleteQuestion}
          onCancel={() => {
            setShowModalDeleteQuestion(false)
            setQuestionSelectedId(undefined)
          }}
          content={`Bạn có chắc chắn muốn xoá câu hỏi này`}
          danger
        />
      )}
      {showQuestionCopyModal && questionSeletedId && (
        <ConfirmModal
          open={showQuestionCopyModal}
          onOk={() => {}}
          onCancel={() => {
            setShowQuestionCopyModal(false)
            setQuestionSelectedId(undefined)
          }}
          content={`Bạn có chắc chắn muốn sao chép câu hỏi này`}
        />
      )}
      {showQuestionEditModal && questionSeletedId && (
        <ConfirmModal
          open={showQuestionEditModal}
          onOk={() => {
            if (questionSelected) {
              navigate(`/questions/edit/${questionSelected.id}`, {
                state: { type: questionSelected.type },
              })
            }
          }}
          onCancel={() => {
            setShowQuestionEditModal(false)
            setQuestionSelectedId(undefined)
            setQuestionSelected(undefined)
          }}
          content={`Bạn có chắc chắn muốn chỉnh sửa câu hỏi này`}
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
