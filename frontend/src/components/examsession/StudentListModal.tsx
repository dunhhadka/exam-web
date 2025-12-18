import React, { useState, useRef, useEffect } from 'react'
import { Modal, Button, Pagination, Tooltip, Empty, Input, Checkbox, Spin, Image, Card, Divider, Table, Space, Tag } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  PictureOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { useLazySearchStudentsQuery } from '../../services/api/useApi'
import { User } from '../../types/user'
import { useToast } from '../../hooks/useToast'

interface StudentEntry {
  id: string
  userId?: string
  email: string
  fullName?: string
  status: 'VALID' | 'INVALID' | 'DUPLICATE'
  reason?: string
  row?: number | null
  avatarCount?: number
  avatarPreviews?: string[]
  source?: 'IMPORT_VALID' | 'IMPORT_INVALID' | 'IMPORT_DUPLICATE' | 'MANUAL' | 'SELECTED'
  manualFiles?: (File | null)[]
}

interface StudentListModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (students: StudentEntry[]) => void
  initialStudents?: StudentEntry[]
  title?: string
  previewLoading?: boolean
  onImportExcel?: (file: File) => void
}

const MAX_AVATARS_PER_EMAIL = 3
const PAGE_SIZE = 10

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
`

const HiddenFileInput = styled.input`
  display: none;
`

const ManualAddRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`

const StudentInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &[data-error='true'] {
    border-color: #ff4d4f;
  }
`

const StudentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
`

const StudentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.12);
    transform: translateY(-1px);
  }
`

const StudentIndex = styled.div`
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
`

const StudentEmailWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StudentReason = styled.div`
  font-size: 12px;
  color: #ff4d4f;
  
  &[data-status='DUPLICATE'] {
    color: #faad14;
  }
`

const StudentTrailing = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const StatusBadge = styled.span`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &[data-status='VALID'] {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &[data-status='DUPLICATE'] {
    background: #fffbe6;
    color: #faad14;
    border: 1px solid #ffe58f;
  }

  &[data-status='INVALID'] {
    background: #fff2f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }
`

const RowLinkButton = styled(Button)`
  padding: 0;
  height: auto;
  font-size: 13px;
`

const RowIconButton = styled(Button)`
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const RemoveEntryButton = styled(Button)`
  color: #ff4d4f;
  &:hover {
    color: #ff7875;
    background: #fff1f0;
  }
`

const Summary = styled.div`
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
  border-radius: 8px;
  justify-content: center;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
`

const SummaryItem = styled.div`
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &[data-status='VALID'] {
    color: #52c41a;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
  }

  &[data-status='INVALID'] {
    color: #ff4d4f;
    background: #fff2f0;
    border: 1px solid #ffccc7;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
`

const SearchSection = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
`

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f5f5f5;
  }

  &[data-selected='true'] {
    background: #e6f7ff;
  }
`

const StudentInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StudentName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #262626;
`

const StudentEmail = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`

const SelectedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`

const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #262626;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:before {
    content: '';
    width: 4px;
    height: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
`

const ImagePreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 16px;
`

export const StudentListModal: React.FC<StudentListModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialStudents = [],
  title = 'Quản lý danh sách sinh viên',
  previewLoading = false,
  onImportExcel,
}) => {
  const [students, setStudents] = useState<StudentEntry[]>(initialStudents)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewEntry, setPreviewEntry] = useState<StudentEntry | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const avatarInputsRef = useRef<Record<string, HTMLInputElement | null>>({})
  const toast = useToast()
  
  const [searchStudents, { data: searchResults, isLoading: searchLoading }] = useLazySearchStudentsQuery()

  useEffect(() => {
    if (visible) {
      setStudents(initialStudents)
      setCurrentPage(1)
      setSearchKeyword('')
    }
  }, [visible, initialStudents])

  useEffect(() => {
    if (searchKeyword.trim()) {
      const timer = setTimeout(() => {
        searchStudents({ keyword: searchKeyword, size: 20 })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchKeyword, searchStudents])

  useEffect(() => {
    if (searchResults) {
      console.log('Search Results:', searchResults)
      console.log('Search Results Type:', typeof searchResults)
      console.log('Search Results Keys:', Object.keys(searchResults))
      console.log('Search Results Data:', searchResults.data)
      console.log('Is Array:', Array.isArray(searchResults))
    }
  }, [searchResults])

  // Handle both array and object response structures
  const getSearchResultsData = (): User[] => {
    if (!searchResults) return []
    if (Array.isArray(searchResults)) return searchResults
    if (searchResults.data && Array.isArray(searchResults.data)) return searchResults.data
    return []
  }

  const searchResultsData = getSearchResultsData()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (onImportExcel) {
      onImportExcel(file)
    }

    event.target.value = ''
  }

  const handleToggleStudent = (user: User) => {
    const existingIndex = students.findIndex(
      (s) => s.userId === user.id || s.email.toLowerCase() === user.email.toLowerCase()
    )

    if (existingIndex >= 0) {
      // Remove student
      setStudents((prev) => prev.filter((_, index) => index !== existingIndex))
    } else {
      // Check for duplicate email before adding
      const emailLower = user.email.toLowerCase()
      const isDuplicate = students.some(
        (s) => s.email.toLowerCase() === emailLower
      )

      if (isDuplicate) {
        toast.warning('Email trùng', `Email ${user.email} đã tồn tại trong danh sách`)
        return
      }

      // Add student
      const newEntry: StudentEntry = {
        id: `selected-${user.id}-${Date.now()}`,
        userId: user.id,
        email: user.email,
        fullName: user.name,
        status: 'VALID',
        source: 'SELECTED',
        avatarPreviews: [],
        manualFiles: [],
      }
      setStudents((prev) => {
        const updated = [...prev, newEntry]
        return recalcStatuses(updated)
      })
    }
  }

  const isStudentSelected = (user: User): boolean => {
    return students.some(
      (s) => s.userId === user.id || s.email.toLowerCase() === user.email.toLowerCase()
    )
  }

  const handleEntryEmailChange = (id: string, newEmail: string) => {
    setStudents((prev) => {
      const updated = prev.map((entry) => (entry.id === id ? { ...entry, email: newEmail } : entry))
      return recalcStatuses(updated)
    })
  }

  const handleRemoveEntry = (id: string) => {
    setStudents((prev) => prev.filter((entry) => entry.id !== id))
    if (currentPage > 1 && students.length - 1 <= (currentPage - 1) * PAGE_SIZE) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleAvatarUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Convert files to base64 immediately
    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })
    }

    setStudents((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry

        const currentFiles = entry.manualFiles || []
        const currentPreviews = entry.avatarPreviews || []
        const availableSlots = MAX_AVATARS_PER_EMAIL - currentFiles.length

        if (availableSlots <= 0) return entry

        const filesToAdd = files.slice(0, availableSlots)
        
        // Convert files to base64 asynchronously
        Promise.all(filesToAdd.map(file => convertToBase64(file)))
          .then(base64Strings => {
            setStudents(prevStudents =>
              prevStudents.map(e => {
                if (e.id !== id) return e
                
                const currentFiles = e.manualFiles || []
                const currentPreviews = e.avatarPreviews || []
                
                return {
                  ...e,
                  manualFiles: [...currentFiles, ...filesToAdd],
                  avatarPreviews: [...currentPreviews, ...base64Strings],
                }
              })
            )
          })
          .catch(error => {
            console.error('Error converting files to base64:', error)
            toast.error('Lỗi', 'Không thể đọc file ảnh')
          })

        return entry
      })
    )

    event.target.value = ''
  }

  const handleClearAvatars = (id: string) => {
    setStudents((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, manualFiles: [], avatarPreviews: [] }
          : entry
      )
    )
  }

  const handleConfirm = () => {
    const validated = recalcStatuses(students)
    onConfirm(validated)
    onClose()
  }

  const recalcStatuses = (entries: StudentEntry[]): StudentEntry[] => {
    return entries.map((entry) => {
      // Giữ nguyên status và reason nếu đã có (từ import)
      if (entry.status && entry.reason) {
        return entry
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const isValid = emailRegex.test(entry.email)

      let status: 'VALID' | 'INVALID' = 'VALID'
      let reason: string | undefined

      if (!isValid) {
        status = 'INVALID'
        reason = 'Email không hợp lệ'
      } else if (!entry.userId && entry.source?.startsWith('IMPORT')) {
        status = 'INVALID'
        reason = entry.reason || 'Không tìm thấy tài khoản trong hệ thống'
      }

      return {
        ...entry,
        status,
        reason,
      }
    })
  }

  const validatedStudents = recalcStatuses(students)
  const summary = validatedStudents.reduce(
    (acc, entry) => {
      if (entry.status === 'VALID' || entry.status === 'INVALID') {
        acc[entry.status]++
      }
      return acc
    },
    { VALID: 0, INVALID: 0 }
  )

  const pageStartIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedStudents = validatedStudents.slice(
    pageStartIndex,
    pageStartIndex + PAGE_SIZE
  )

  return (
    <>
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{ minHeight: '95vh', maxHeight: '80vh', overflow: 'auto' }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={summary.VALID === 0}
        >
          Xác nhận ({summary.VALID} sinh viên)
        </Button>,
      ]}
    >
      <ModalContent>
        <ActionButtons>
          <Button
            icon={<UploadOutlined />}
            onClick={handleImportClick}
            loading={previewLoading}
          >
            Import Excel
          </Button>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          
          <SearchSection>
            <Input
              placeholder="Tìm kiếm sinh viên theo email hoặc tên..."
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
            
            {searchLoading && searchKeyword.trim() && (
              <SearchResults>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin tip="Đang tìm kiếm..." />
                </div>
              </SearchResults>
            )}

            {!searchLoading && searchKeyword.trim() && searchResultsData.length > 0 && (
              <SearchResults>
                {searchResultsData.map((user) => {
                  const selected = isStudentSelected(user)
                  return (
                    <SearchResultItem
                      key={user.id}
                      data-selected={selected}
                      onClick={() => handleToggleStudent(user)}
                    >
                      <Checkbox checked={selected} />
                      <StudentInfo>
                        <StudentName>{user.name || 'Chưa có tên'} - {user.email}</StudentName>
                      </StudentInfo>
                    </SearchResultItem>
                  )
                })}
              </SearchResults>
            )}

            {!searchLoading && searchKeyword.trim() && searchResults && searchResultsData.length === 0 && (
              <SearchResults>
                <Empty description="Không tìm thấy sinh viên nào" style={{ padding: '20px' }} />
              </SearchResults>
            )}
          </SearchSection>
        </ActionButtons>

        {validatedStudents.length > 0 && (
          <SelectedSection>
            <SectionTitle>Sinh viên đã chọn ({validatedStudents.length})</SectionTitle>
            <Table
              dataSource={validatedStudents}
              rowKey="id"
              pagination={{
                current: currentPage,
                pageSize: PAGE_SIZE,
                total: validatedStudents.length,
                onChange: setCurrentPage,
                showSizeChanger: false,
                showTotal: (total) => `Tổng số ${total} sinh viên`,
              }}
              size="middle"
              scroll={{ y: 500 }}
              columns={[
                {
                  title: 'STT',
                  key: 'index',
                  width: 60,
                  align: 'center',
                  render: (_, __, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
                },
                {
                  title: 'Email',
                  dataIndex: 'email',
                  key: 'email',
                  width: '30%',
                  render: (email, entry) => (
                    <div>
                      <div style={{ 
                        color: entry.status === 'INVALID' ? '#ff4d4f' : '#262626',
                        fontWeight: entry.status === 'INVALID' ? 500 : 400,
                      }}>
                        {email}
                      </div>
                      {entry.reason && entry.status === 'INVALID' && (
                        <div style={{
                          fontSize: '12px',
                          color: '#ff4d4f',
                          marginTop: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#fff2f0',
                          border: '1px solid #ffccc7',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ fontSize: '14px' }}>⚠️</span>
                          <span>{entry.reason}</span>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Họ tên',
                  dataIndex: 'fullName',
                  key: 'fullName',
                  width: '25%',
                  render: (name) => name || <span style={{ color: '#999' }}>Chưa có tên</span>,
                },
                {
                  title: 'Trạng thái',
                  key: 'status',
                  width: '15%',
                  align: 'center',
                  render: (_, entry) => {
                    if (entry.status === 'VALID') {
                      return (
                        <Tag 
                          color="success" 
                          style={{ 
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontWeight: 500,
                          }}
                        >
                          ✓ Hợp lệ
                        </Tag>
                      )
                    }
                    return (
                      <Tag 
                        color="error"
                        style={{ 
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontWeight: 500,
                        }}
                      >
                        ✗ Không hợp lệ
                      </Tag>
                    )
                  },
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  width: '28%',
                  render: (_, entry) => {
                    const reachedAvatarLimit = (entry.avatarPreviews?.length ?? 0) >= MAX_AVATARS_PER_EMAIL
                    return (
                      <Space size="small" wrap>
                        <Button
                          size="small"
                          type="link"
                          onClick={() => avatarInputsRef.current[entry.id]?.click()}
                          disabled={reachedAvatarLimit}
                        >
                          {reachedAvatarLimit ? 'Đủ ảnh' : 'Thêm ảnh'}
                        </Button>
                        <HiddenFileInput
                          ref={(element: HTMLInputElement | null) => {
                            if (element) {
                              avatarInputsRef.current[entry.id] = element
                            } else {
                              delete avatarInputsRef.current[entry.id]
                            }
                          }}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleAvatarUpload(entry.id, event)}
                        />
                        {entry.avatarPreviews && entry.avatarPreviews.length > 0 && (
                          <>
                            <Button
                              size="small"
                              type="link"
                              icon={<EyeOutlined />}
                              onClick={() => setPreviewEntry(entry)}
                            >
                              Xem ({entry.avatarPreviews.length})
                            </Button>
                            <Tooltip title="Xóa tất cả ảnh">
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleClearAvatars(entry.id)}
                              />
                            </Tooltip>
                          </>
                        )}
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveEntry(entry.id)}
                        />
                      </Space>
                    )
                  },
                },
              ]}
            />

            <Summary>
              <SummaryItem data-status="VALID">
                <span style={{ fontWeight: 600 }}>Hợp lệ:</span> {summary.VALID}
              </SummaryItem>
              {summary.INVALID > 0 && (
                <SummaryItem data-status="INVALID">
                  <span style={{ fontWeight: 600 }}>Không hợp lệ:</span> {summary.INVALID}
                </SummaryItem>
              )}
            </Summary>
        </SelectedSection>
      )}

      {validatedStudents.length === 0 && !searchKeyword.trim() && (
        <Empty description="Chưa có sinh viên nào. Hãy tìm kiếm và chọn sinh viên hoặc import Excel." />
      )}
      </ModalContent>
    </Modal>

    <Modal
      title={`Xem ảnh - ${previewEntry?.email || ''}`}
      open={!!previewEntry}
      onCancel={() => setPreviewEntry(null)}
      footer={[
        <Button key="close" onClick={() => setPreviewEntry(null)}>
          Đóng
        </Button>,
      ]}
      width={800}
    >
      <ImagePreviewGrid>
        {previewEntry?.avatarPreviews?.map((preview, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <Image
              src={preview}
              alt={`Avatar ${index + 1}`}
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
              preview={{
                mask: (
                  <div style={{ fontSize: '12px' }}>
                    <EyeOutlined /> Xem
                  </div>
                ),
              }}
            />
          </div>
        ))}
      </ImagePreviewGrid>
      {(!previewEntry?.avatarPreviews || previewEntry.avatarPreviews.length === 0) && (
        <Empty description="Không có ảnh nào" />
      )}
    </Modal>
  </>
  )
}
