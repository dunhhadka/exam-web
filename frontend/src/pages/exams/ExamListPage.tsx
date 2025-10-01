import { Tag, Tooltip } from 'antd'
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
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../components/search/useSearch'
import { useSearchExamQuery } from '../../services/api/examApi'
import { loadavg } from 'os'

export const ExamListPage = () => {
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

  const {
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    resetFilter,
    data,
    isLoading,
    isFetching,
    refetch,
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

  const handleDownloadAction = () => {}

  const handleAddNewExam = () => {
    navigate('/exams/create')
  }

  return (
    <div>
      <CustomTable<Exam>
        columns={columns}
        emptyText="Danh sách bài thi trống"
        tableTitle="Danh sách bài thi"
        data={data}
        loading={isLoading || isFetching}
        actions={[
          {
            title: 'Tải xuống',
            icon: <DownloadOutlined />,
            onClick: handleDownloadAction,
            color: 'secondary',
          },
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
    </div>
  )
}
