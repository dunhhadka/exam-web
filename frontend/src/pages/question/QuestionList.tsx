import {
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, message, Modal, Radio, Tag, Tooltip } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import { createActionColumns } from '../../components/search/createActionColumn'
import { createColumn } from '../../components/search/createColumn'
import { CustomTable } from '../../components/search/CustomTable'
import { useFilterQuestionQuery } from '../../hooks/useFilterQuestionQuery'
import { useToast } from '../../hooks/useToast'
import {
  useDeleteQuestionMutation,
  useDownloadTemplateMutation,
  useImportQuestionsMutation,
} from '../../services/api/questionApi'
import {
  Level,
  LevelColor,
  LevelLabel,
  Question,
  Tag as QuestionTag,
  QuestionType,
  QuestionTypeColor,
  QuestionTypeLabel,
  Status,
  StatusColor,
  StatusLabel,
} from '../../types/question'
import { formatInstant } from '../../utils/times'
import { QuestionFilter } from './filter/QuestionFilter'
import { QuestionTypeCreate } from './QuestionTypeCreate'

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
      // {
      //   label: 'Sao chép',
      //   icon: <CopyOutlined />,
      //   onClick: (record) => {
      //     setShowQuestionCopyModal(true)
      //     setQuestionSelectedId(record.id)
      //   },
      // },
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

  const [importQuestions] = useImportQuestionsMutation()

  const [downloadTemplate, { isLoading: isDownloadingTemplate }] =
    useDownloadTemplateMutation()

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

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOption, setExportOption] = useState<
    'all' | 'current' | 'selected' | 'search'
  >('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const [showImportModal, setShowImportModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleAddQuestionAction = () => {
    setShowQuestionCreateModal(true)
  }

  const handleImportExcel = (file: File) => {
    // Validate file type
    const isExcel =
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')

    if (!isExcel) {
      message.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
      return false
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('Kích thước file không được vượt quá 5MB')
      return false
    }

    setIsImporting(true)

    // Convert file to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      const base64Data = base64String.split(',')[1] // Remove data:application/octet-stream;base64, prefix

      // Call import API with base64 data
      importQuestions({ fileData: base64Data })
        .unwrap()
        .then(() => {
          message.success('Import file Excel thành công')
          setIsImporting(false)
          setShowImportModal(false)
        })
        .catch((error) => {
          console.error('Import error:', error)
          message.error('Lỗi khi import file. Vui lòng thử lại.')
          setIsImporting(false)
        })
    }
    reader.readAsDataURL(file)

    return false // Prevent automatic upload
  }

  const handleExportExcel = () => {
    let dataToExport: Question[] = []
    let fileName = 'questions.xlsx'

    switch (exportOption) {
      case 'all':
        // TODO: Fetch all questions (public + own)
        dataToExport = questionData ?? []
        fileName = 'all-questions.xlsx'
        message.info('Đang xuất tất cả câu hỏi (Public + của bạn)')
        break
      case 'current':
        // Current page data
        dataToExport = questionData ?? []
        fileName = `questions-page-${filter.pageIndex || 1}.xlsx`
        message.info(`Đang xuất câu hỏi trang ${filter.pageIndex || 1}`)
        break
      case 'selected':
        // Selected rows
        if (selectedRowKeys.length === 0) {
          message.warning('Vui lòng chọn ít nhất một câu hỏi')
          return
        }
        dataToExport = (questionData ?? []).filter((q) =>
          selectedRowKeys.includes(q.id)
        )
        fileName = `selected-questions.xlsx`
        message.info(`Đang xuất ${selectedRowKeys.length} câu hỏi được chọn`)
        break
      case 'search':
        // Search results
        dataToExport = questionData ?? []
        fileName = `search-questions.xlsx`
        message.info(
          `Đang xuất kết quả tìm kiếm (${query || 'Không có từ khóa'})`
        )
        break
    }

    // TODO: Implement actual Excel export logic
    console.log(`Exporting ${dataToExport.length} questions to ${fileName}`)

    // Simulate successful export
    setTimeout(() => {
      message.success(`Xuất Excel thành công: ${fileName}`)
      setShowExportModal(false)
    }, 1500)
  }

  const handleDownloadTemplate = async () => {
    const response = await fetch('/api/question/template/download', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()

    // Download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'import_question_template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('Download success!')
  }

  const handleDirectImport = () => {
    const fileInput = document.getElementById(
      'excel-import-input'
    ) as HTMLInputElement
    fileInput?.click()
    setShowImportModal(false)
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
      await deleteQuestion({
        questionId: questionSeletedId,
      }).unwrap()

      toast.success('Xoá câu hỏi thành công')

      setShowModalDeleteQuestion(false)
      setQuestionSelectedId(undefined)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
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
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        actions={[
          // {
          //   title: 'Tải Excel',
          //   icon: <DownloadOutlined />,
          //   onClick: () => setShowExportModal(true),
          //   color: 'secondary',
          // },
          {
            title: 'Nhập Excel',
            icon: <ImportOutlined />,
            onClick: () => setShowImportModal(true),
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
      <HiddenFileInput
        id="excel-import-input"
        type="file"
        accept=".xlsx,.xls"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (file) {
            handleImportExcel(file)
          }
          e.target.value = ''
        }}
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
      <Modal
        title="Xuất Excel"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        footer={[
          <Button key="back" onClick={() => setShowExportModal(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleExportExcel}>
            Xuất
          </Button>,
        ]}
        centered
      >
        <ExportModalContent>
          <Radio.Group
            value={exportOption}
            onChange={(e) => setExportOption(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <ExportOption value="all">
              <ExportLabel>Tất cả câu hỏi</ExportLabel>
            </ExportOption>
            <ExportOption value="current">
              <ExportLabel>Trang hiện tại</ExportLabel>
            </ExportOption>
            <ExportOption
              value="selected"
              disabled={selectedRowKeys.length === 0}
            >
              <ExportLabel>Câu hỏi được chọn</ExportLabel>
            </ExportOption>
            <ExportOption value="search">
              <ExportLabel>Kết quả tìm kiếm</ExportLabel>
            </ExportOption>
          </Radio.Group>
        </ExportModalContent>
      </Modal>
      <Modal
        title="Nhập Excel"
        open={showImportModal}
        onCancel={() => !isImporting && setShowImportModal(false)}
        footer={[
          <Button
            key="back"
            onClick={() => setShowImportModal(false)}
            disabled={isImporting}
          >
            Hủy
          </Button>,
        ]}
        centered
        closable={!isImporting}
      >
        <ImportModalContent>
          <ImportButton
            onClick={handleDownloadTemplate}
            style={{ marginBottom: '12px' }}
            disabled={isImporting || isDownloadingTemplate}
            loading={isDownloadingTemplate}
          >
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {isDownloadingTemplate ? 'Đang tải...' : '📥 Tải file mẫu'}
            </span>
          </ImportButton>
          <ImportButton
            onClick={handleDirectImport}
            disabled={isImporting || isDownloadingTemplate}
            loading={isImporting}
          >
            <span style={{ fontSize: '16px', fontWeight: 600 }}>
              {isImporting ? 'Đang nhập...' : '📤 Import trực tiếp'}
            </span>
          </ImportButton>
        </ImportModalContent>
      </Modal>
    </div>
  )
}

const ExportModalContent = styled.div`
  padding: 24px 0;
`

const ExportOption = styled(Radio)`
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
  margin: 0 !important;

  &:hover {
    border-color: #1890ff;
    background-color: #f6f9ff;
  }

  &.ant-radio-wrapper-checked {
    border-color: #1890ff;
    background-color: #f6f9ff;

    span {
      color: #1890ff;
    }
  }
`

const ExportLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`

const ImportModalContent = styled.div`
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ImportButton = styled(Button)`
  width: 100%;
  height: 56px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #fff;
  color: #262626;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: #1890ff;
    background-color: #f6f9ff;
    color: #1890ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Truncate3Lines = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 3; /* số dòng tối đa */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal; /* cho phép xuống dòng */
`

const HiddenFileInput = styled.input`
  display: none;
`
