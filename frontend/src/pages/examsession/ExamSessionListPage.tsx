import {
  DeleteOutlined,
  EditOutlined,
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
import { ExamSession, ExamSessionRequest } from '../../types/examsession'
import { formatInstant } from '../../utils/times'
import ExamSessionCreate from './ExamSessionCreate'
import ExamSessionViewLink from './ExamSessionViewLink'

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
    ]),
  ]

  const {
    data: examSessionData,
    isLoading: isExamSessionLoading,
    isFetching: isExamSessionFetching,
  } = useFilterExamSessionQuery({ pageIndex: 1, pageSize: 20 })

  const [examSessionUpdate, setExamSessionUpdate] = useState<
    ExamSession | undefined
  >(undefined)

  const [openCreateAssignmentModal, setOpenCreateAssignmentModal] =
    useState(false)
  const [viewLinkExamSession, setViewLinkExamSession] = useState<
    ExamSession | undefined
  >(undefined)

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
        data={examSessionData ?? []}
        actions={[
          {
            title: 'Giao bài',
            icon: <EditOutlined />,
            color: 'primary',
            onClick: handleCreateAssigment,
          },
        ]}
        loading={isExamSessionLoading || isExamSessionFetching}
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
    </div>
  )
}

export default ExamSessionListPage
