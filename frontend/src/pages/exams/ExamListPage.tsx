import { Tag, Tooltip, Modal } from 'antd'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import {
  Exam,
  ExamLevel,
  ExamLevelColor,
  ExamSearchRequest,
  ExamStatus,
  ExamStatusColor,
  ExamStatusLabel,
} from '../../types/exam'
import { Truncate3Lines } from '../question/QuestionList'
import { formatInstant } from '../../utils/times'
import { createActionColumns } from '../../components/search/createActionColumn'
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../components/search/useSearch'
import {
  useSearchExamQuery,
  useGetExamByIdQuery,
  useDeleteExamMutation,
} from '../../services/api/examApi'
import { ExamFilter } from './ExamFilter'
import { useState } from 'react'
import { ExamCreatePage } from './ExamCreatePage'
import { useToast } from '../../hooks/useToast'
import ConfirmModal from '../../components/common/ConfirmModal'

export const ExamListPage = () => {
  const toast = useToast()
  const [openFilter, setOpenFilter] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [deleteExam, { isLoading: isDeleteLoading }] = useDeleteExamMutation()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  const { data: examDetail } = useGetExamByIdQuery(
    selectedExam?.id.toString() ?? '',
    {
      skip: !selectedExam?.id,
    }
  )

  const handleDeleteExam = (examId: number, examName: string) => {
    console.log('Delete clicked:', examId, examName)
    setExamToDelete({ id: examId, name: examName } as Exam)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!examToDelete) return
    try {
      await deleteExam({ ids: [examToDelete.id] }).unwrap()
      toast.success(
        'Xoá bài thi thành công!',
        `Bài thi "${examToDelete.name}" đã được xoá`
      )
      setShowDeleteModal(false)
      setExamToDelete(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Lỗi xoá bài thi', error?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const columns = [
    createColumn<Exam>('Cấp độ', 'level', {
      render: (value: ExamLevel) =>
        value ? (
          <Tag color={ExamLevelColor[value]}>{ExamLevel[value]}</Tag>
        ) : null,
    }),
    createColumn<Exam>('Tên', 'name', {
      render: (value) =>
        value ? (
          <Tooltip title={value}>
            <Truncate3Lines>{value}</Truncate3Lines>
          </Tooltip>
        ) : null,
    }),
    createColumn<Exam>('Người tạo', 'createdBy'),
    createColumn<Exam>('Trạng thái', 'status', {
      render: (value: ExamStatus) =>
        value ? (
          <Tag color={ExamStatusColor[value]}>{ExamStatusLabel[value]}</Tag>
        ) : null,
    }),
    createColumn<Exam>('Công khai', 'isPublic', {
      render: (value) =>
        value ? (
          <Tag color="green">Công khai</Tag>
        ) : (
          <Tag color="orange">Chưa công khai</Tag>
        ),
    }),
    createColumn<Exam>('Ngày tạo', 'createdAt', {
      render: (value) => (value ? formatInstant(value) : null),
    }),
    createColumn<Exam>('Ngày cập nhật', 'lastModifiedAt', {
      render: (value) => (value ? formatInstant(value) : null),
    }),
    createActionColumns<Exam>([
      // {
      //   label: 'Sao chép',
      //   icon: <CopyOutlined />,
      //   onClick: (record) => console.log('copy', record),
      // },
      {
        label: 'Cập nhật',
        icon: <EditOutlined />,
        onClick: (record) => {
          setSelectedExam(record)
          setOpenEditModal(true)
        },
      },
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => handleDeleteExam(record.id, record.name),
        danger: true,
      },
    ]),
  ]

  const {
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    data,
    isLoading,
    isFetching,
    pageIndex,
    pageSize,
    total,
  } = useSearch<ExamSearchRequest, Exam>(
    useSearchExamQuery,
    {
      pageIndex: 1,
      pageSize: 10,
    },
    { delay: 300 }
  )

  const navigate = useNavigate()

  const handleAddNewExam = () => {
    navigate('/exams/create')
  }

  return (
    <div style={{ padding: 20 }}>
      <CustomTable<Exam>
        columns={columns}
        emptyText="Danh sách bài thi trống"
        tableTitle="Danh sách bài thi"
        data={data}
        loading={isLoading || isFetching}
        filterActive
        query={searchTerm}
        placeholder="Tìm kiếm bài thi..."
        onQueryChange={(value) => {
          setSearchTerm(value || '')
          setFilter({
            ...filter,
            pageIndex: 1,
          })
        }}
        openFilter={openFilter}
        onFilterClick={setOpenFilter}
        filterComponent={
          <ExamFilter
            filter={filter}
            onFilterChange={setFilter}
            onClose={() => setOpenFilter(false)}
          />
        }
        actions={[
          {
            title: 'Tạo bài thi',
            icon: <PlusCircleOutlined />,
            onClick: handleAddNewExam,
            color: 'primary',
          },
        ]}
        pagination={{
          current: pageIndex,
          pageSize: pageSize,
          total: total,
          onChange: (page, pageSize) => {
            setFilter({
              ...filter,
              pageIndex: page,
              pageSize: pageSize,
            })
          },
        }}
      ></CustomTable>

      {openEditModal && selectedExam && (
        <Modal
          open={openEditModal}
          title="Cập nhật bài thi"
          footer={null}
          width="80%"
          onCancel={() => {
            setOpenEditModal(false)
            setSelectedExam(null)
          }}
        >
          <ExamCreatePage
            key={`edit-${selectedExam.id}`}
            initData={examDetail || selectedExam}
            isUpdate={true}
            onSuccess={() => {
              setOpenEditModal(false)
              setSelectedExam(null)
            }}
          />
        </Modal>
      )}

      <ConfirmModal
        open={showDeleteModal}
        title="Xác nhận xoá"
        content={`Bạn có chắc chắn muốn xoá bài thi "${examToDelete?.name}"? Hành động này không thể hoàn tác.`}
        okText="Xoá"
        cancelText="Huỷ"
        danger
        loading={isDeleteLoading}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setExamToDelete(null)
        }}
      />
    </div>
  )
}
