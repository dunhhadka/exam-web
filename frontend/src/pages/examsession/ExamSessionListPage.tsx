import {
  BookOutlined,
  DeleteOutlined,
  DownOutlined,
  EditFilled,
  EditOutlined,
  FileTextOutlined,
  FundOutlined,
  HistoryOutlined,
  EyeOutlined,
  ShareAltOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Dropdown, MenuProps, Modal } from 'antd'
import { useState } from 'react'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { useToast } from '../../hooks/useToast'
import {
  useCreateExamSessionMutation,
  useFilterExamSessionQuery,
  useLazyGetExamSessionByIdQuery,
  useUpdateExamSessionMutation,
} from '../../services/api/examsession'
import { Exam } from '../../types/exam'
import { AttemptListModal } from './AttemptListModal'
import {
  ExamFilterRequest,
  ExamSession,
  ExamSessionRequest,
} from '../../types/examsession'
import { formatInstant, isNowBetween } from '../../utils/times'
import ExamSessionCreate from './ExamSessionCreate'
import ExamSessionViewLink from './ExamSessionViewLink'
import { UserManagementModal } from './UserManagementModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useNavigate } from 'react-router-dom'
import { createActionColumns } from '../../components/search/createActionColumn'
import { ExamSessionFilter } from './ExamSessionFilter'

const ExamSessionListPage = () => {
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(
    null
  )
  const [attemptListOpen, setAttemptListOpen] = useState(false)
  const [userManagementOpen, setUserManagementOpen] = useState(false)

  // Menu items cho dropdown "Hành động"
  const getActionMenuItems = (record: ExamSession): MenuProps['items'] => {
    const items: MenuProps['items'] = []

    // Chỉ thêm "Giám sát làm bài" nếu đang trong khoảng thời gian
    if (isNowBetween(record.startTime, record.endTime)) {
      items.push({
        key: 'monitor',
        label: 'Giám sát làm bài',
        icon: <EyeOutlined />,
        onClick: () => {
          setShowMonitorExam(true)
          setCurrentExamSession(record)
        },
      })
    }

    items.push({
      key: 'manage-users',
      label: 'Quản lý người dùng',
      icon: <TeamOutlined />,
      onClick: () => {
        setSelectedSession(record)
        setUserManagementOpen(true)
      },
    })

    items.push({
      key: 'grade',
      label: 'Chấm điểm',
      icon: <EditFilled />,
      onClick: () => {
        setSelectedSession(record)
        setAttemptListOpen(true)
      },
    })

    items.push({
      key: 'results',
      label: 'Kết quả',
      icon: <FundOutlined />,
      onClick: () => console.log('Kết quả', record),
    })

    items.push({
      key: 'exam-progress',
      label: 'Tiến độ cuộc thi',
      icon: <HistoryOutlined />,
      onClick: () => console.log('Tiến độ cuộc thi', record),
    })

    items.push({
      key: 'learning-progress',
      label: 'Tiến độ học tập chung',
      icon: <BookOutlined />,
      onClick: () => console.log('Tiến độ học tập chung', record),
    })

    items.push({
      key: 'report',
      label: 'Báo cáo',
      icon: <FileTextOutlined />,
      onClick: () => console.log('Báo cáo', record),
    })

    items.push({
      key: 'history',
      label: 'Lịch sử',
      icon: <HistoryOutlined />,
      onClick: () => console.log('Lịch sử', record),
    })

    return items
  }

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
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: ExamSession) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Dropdown
            menu={{ items: getActionMenuItems(record) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#262626',
                transition: 'all 0.2s',
                boxShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff'
                e.currentTarget.style.color = '#1890ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9'
                e.currentTarget.style.color = '#262626'
              }}
            >
              Hành động <DownOutlined style={{ fontSize: '12px' }} />
            </button>
          </Dropdown>
          {/* Các action buttons khác */}
        </div>
      ),
    },
    createActionColumns<ExamSession>([
      {
        label: 'Mời qua link',
        icon: <ShareAltOutlined />,
        onClick: (record) => setViewLinkExamSession(record),
      },
      {
        label: 'Cập nhật',
        icon: <EditOutlined />,
        onClick: (record) => handleEditExamSession(record),
      },
      {
        label: 'Xoá',
        icon: <DeleteOutlined />,
        onClick: (record) => console.log('delete', record),
        danger: true,
      },
    ]),
  ]

  // .map((action, index) => (
  //       <button
  //         key={index}
  //         onClick={action.onClick}
  //         title={action.label}
  //         style={{
  //           width: 32,
  //           height: 32,
  //           display: 'flex',
  //           alignItems: 'center',
  //           justifyContent: 'center',
  //           border: 'none',
  //           background: 'transparent',
  //           color: action.danger ? '#ff4d4f' : '#1890ff',
  //           cursor: 'pointer',
  //           borderRadius: '4px',
  //           fontSize: '16px',
  //         }}
  //       >
  //         {action.icon}
  //       </button>
  //     ))

  const [filter, setFilter] = useState<ExamFilterRequest>({
    pageIndex: 1,
    pageSize: 10,
  })
  const [openFilter, setOpenFilter] = useState(false)
  const [keyword, setKeyword] = useState<string | undefined>(undefined)

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
  const [loadExamSessionById] = useLazyGetExamSessionByIdQuery()

  const toast = useToast()

  const handleCreateAssigment = () => {
    setExamSessionUpdate(undefined)
    setOpenCreateAssignmentModal(true)
  }

  const handleEditExamSession = async (session: ExamSession) => {
    try {
      const detail = await loadExamSessionById(session.id).unwrap()
      setExamSessionUpdate(detail)
      setOpenCreateAssignmentModal(true)
    } catch (error) {
      toast.error('Không thể tải dữ liệu bài kiểm tra, vui lòng thử lại')
    }
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
    <div style={{ padding: 20 }}>
      <CustomTable<ExamSession>
        columns={columns}
        tableTitle="Bài kiểm tra"
        filterActive
        data={data ?? []}
        rowKey="id"
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
        openFilter={openFilter}
        onFilterClick={setOpenFilter}
        query={keyword}
        onQueryChange={(value) => {
          setKeyword(value)
          setFilter({ ...filter, keyword: value || undefined, pageIndex: 1 })
        }}
        placeholder="Tìm kiếm bài kiểm tra..."
        filterComponent={
          <ExamSessionFilter
            filter={filter}
            onFilterChange={setFilter}
            onClose={() => setOpenFilter(false)}
          />
        }
      />

      {openCreateAssignmentModal && (
        <Modal
          open={openCreateAssignmentModal}
          title={
            examSessionUpdate ? 'Cập nhật bài kiểm tra' : 'Tạo bài kiểm tra mới'
          }
          onCancel={closeCreateAssignmentModal}
          width={'60%'}
          footer={null}
        >
          <ExamSessionCreate
            key={examSessionUpdate ? `edit-${examSessionUpdate.id}` : 'create'}
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

      {/* Modal chấm điểm */}
      {selectedSession && (
        <AttemptListModal
          sessionId={selectedSession.id}
          sessionName={selectedSession.name}
          open={attemptListOpen}
          onClose={() => {
            setAttemptListOpen(false)
            setSelectedSession(null)
          }}
        />
      )}

      {/* Modal quản lý người dùng */}
      {selectedSession && (
        <UserManagementModal
          sessionId={selectedSession.id}
          sessionName={selectedSession.name}
          open={userManagementOpen}
          onClose={() => {
            setUserManagementOpen(false)
            setSelectedSession(null)
          }}
        />
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
