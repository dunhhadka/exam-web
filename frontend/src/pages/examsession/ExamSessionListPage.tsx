import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { Modal } from 'antd'
import { useState } from 'react'
import { createActionColumns } from '../../components/search/createActionColumn'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { useToast } from '../../hooks/useToast'
import {
  useCreateExamSessionMutation,
  useFilterExamSessionQuery,
  useUpdateExamSessionMutation,
} from '../../services/api/examsession'
import { Exam } from '../../types/exam'
import {
  ExamFilterRequest,
  ExamSession,
  ExamSessionRequest,
} from '../../types/examsession'
import { formatInstant, isNowBetween } from '../../utils/times'
import ExamSessionCreate from './ExamSessionCreate'
import ExamSessionViewLink from './ExamSessionViewLink'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useNavigate } from 'react-router-dom'

const ExamSessionListPage = () => {
  const columns = [
    createColumn<ExamSession>('Tên bài kiểm tra', 'name'),
    createColumn<ExamSession>('Tên đề', 'exam', {
      render: (value: Exam) => <span>{value.name}</span>,
    }),
    createColumn<ExamSession>('Trạng thái', 'publicFlag', {
      render: (value?: boolean) => (
        <span>{value ? 'Công khai' : 'Chỉ mình tôi'}</span>
      ),
    }),
    createColumn<ExamSession>('Ngày bắt đầu', 'startTime', {
      render: (value: string) => <span>{formatInstant(value)}</span>,
    }),
    createColumn<ExamSession>('Ngày kết thúc', 'endTime', {
      render: (value: string) => <span>{formatInstant(value)}</span>,
    }),
    createColumn<ExamSession>('Điểm tối đa', 'exam', {
      render: (value: Exam) => <span>{value.score}</span>,
    }),
    createColumn<ExamSession>('Thời gian làm bài', 'durationMinutes'),
    createActionColumns<ExamSession>([
      {
        label: 'Mời qua link',
        icon: <ShareAltOutlined />,
        onClick: (record) => setViewLinkExamSession(record),
      },
      {
        label: 'Cập nhật',
        icon: <EditOutlined />,
        onClick: (record) => {
          setOpenCreateAssignmentModal(true)
          setExamSessionUpdate(record)
        },
      },
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => console.log('delete', record),
        danger: true,
      },
      {
        label: 'Giám sát làm bài',
        icon: <EyeOutlined />,
        onClick: (record) => {
          setShowMonitorExam(true)
          setCurrentExamSession(record)
        },
        disabled: (record) => !isNowBetween(record.startTime, record.endTime),
      },
    ]),
  ]

  const [filter, setFilter] = useState<ExamFilterRequest>({
    pageIndex: 1,
    pageSize: 10,
  })

  const {
    data: examSessionData,
    isLoading: isExamSessionLoading,
    isFetching: isExamSessionFetching,
  } = useFilterExamSessionQuery(filter)

  const { data, count } = examSessionData ?? { data: [], count: 0 }

  const [examSessionUpdate, setExamSessionUpdate] = useState<
    ExamSession | undefined
  >(undefined)

  const [openCreateAssignmentModal, setOpenCreateAssignmentModal] =
    useState(false)
  const [viewLinkExamSession, setViewLinkExamSession] = useState<
    ExamSession | undefined
  >(undefined)
  const [showMonitorExam, setShowMonitorExam] = useState<boolean>(false)

  const navigate = useNavigate()

  const [currentExamSession, setCurrentExamSession] =
    useState<ExamSession | null>(null)

  const [createExamSession, { isLoading: isCreateExamSessionLoading }] =
    useCreateExamSessionMutation()
  const [updateExamSession, { isLoading: isUpdateExamSessionLoading }] =
    useUpdateExamSessionMutation()

  const toast = useToast()

  const handleCreateAssigment = () => {
    setOpenCreateAssignmentModal(true)
  }

  const closeCreateAssignmentModal = () => {
    setOpenCreateAssignmentModal(false)
    if (examSessionUpdate) {
      setExamSessionUpdate(undefined)
    }
  }

  const submitExamSession = async (request: ExamSessionRequest) => {
    const isUpdate = !!examSessionUpdate

    try {
      let res: ExamSession | null = null
      if (!examSessionUpdate) {
        res = await createExamSession(request).unwrap()
      } else {
        res = await updateExamSession({
          id: examSessionUpdate.id,
          request: request,
        }).unwrap()
      }

      toast.success(
        isUpdate
          ? `Cập nhật bài kiểm tra thành công`
          : `Tạo bài kiểm tra ${res?.name} thành công`
      )

      closeCreateAssignmentModal()
    } catch (err) {
      toast.error(
        isUpdate
          ? 'Cập nhật bài kiểm tra thành công'
          : 'Tạo bài kiểm tra không thành công'
      )
    }
  }

  return (
    <div>
      <CustomTable<ExamSession>
        columns={columns}
        tableTitle="Bài kiểm tra"
        filterActive
        data={data ?? []}
        actions={[
          {
            title: 'Giao bài',
            icon: <EditOutlined />,
            color: 'primary',
            onClick: handleCreateAssigment,
          },
        ]}
        loading={isExamSessionLoading || isExamSessionFetching}
        pagination={{
          current: filter.pageIndex ?? 0,
          pageSize: filter.pageSize ?? 10,
          total: count,
          onChange: (page, pageSize) => {
            setFilter({ ...filter, pageIndex: page, pageSize })
          },
        }}
      />

      {openCreateAssignmentModal && (
        <Modal
          open={openCreateAssignmentModal}
          title={'Tạo bài kiểm tra mới'}
          onCancel={closeCreateAssignmentModal}
          width={'60%'}
          footer={null}
        >
          <ExamSessionCreate
            onSubmit={submitExamSession}
            onClose={closeCreateAssignmentModal}
            loading={isCreateExamSessionLoading || isUpdateExamSessionLoading}
            initData={examSessionUpdate}
          />
        </Modal>
      )}
      {viewLinkExamSession && (
        <Modal
          open={!!viewLinkExamSession}
          title="Link mời"
          footer={null}
          width={'400px'}
          onCancel={() => setViewLinkExamSession(undefined)}
        >
          <ExamSessionViewLink examsession={viewLinkExamSession} />
        </Modal>
      )}
      {showMonitorExam && currentExamSession && (
        <ConfirmModal
          open={showMonitorExam}
          onOk={() => {
            navigate(
              `/protor-tracking/${currentExamSession?.code}/${'proctor'}`
            )
          }}
          onCancel={() => {
            setShowMonitorExam(false)
            setCurrentExamSession(null)
          }}
          title="Giám sát làm bài"
          content={`Bắt đầu giám sát làm bài cho bài kiểm tra: ${
            currentExamSession?.name ?? ''
          }`}
        />
      )}
    </div>
  )
}

export default ExamSessionListPage
