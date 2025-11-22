import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  EditOutlined,
  EyeOutlined,
  HistoryOutlined,
  ItalicOutlined,
  LeftOutlined,
  MoreOutlined,
  OrderedListOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RedoOutlined,
  SearchOutlined,
  SoundOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, InputNumber, Modal, Radio, Select, Space, Tabs } from 'antd'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  DropDownFixedValues,
  DropOptionItem,
} from '../../components/common/DropDownFixedValues'
import { Loading } from '../../components/common/Loading'
import { TagSelection } from '../../components/common/TagSelection'
import { useSubmitQuestion } from '../../hooks/useSubmitQuestion'
import { useToast } from '../../hooks/useToast'
import { useLazyFindByIdQuery } from '../../services/api/questionApi'
import {
  Level,
  LevelLabel,
  QuestionRequestInput,
  QuestionType,
  QuestionTypeLabel,
  Tag,
} from '../../types/question'
import { EssayData } from './Essay'
import { MultiChoiceData } from './MultiChoice'
import { OneChoiceData } from './OneChoice'
import { PlainTextData } from './PlainText'
import { QuestionPreviewFactory } from './QuestionPreviewFactory'
import { QuestionFactory } from './QuestionTypeFactory'
import { TableChoiceData } from './TableChoice'
import { TrueFalseData } from './TrueFalse'

interface ActionItem {
  title: string
  icon: ReactNode
  onAction: () => void
  ariaLabel?: string
}

interface ValidationErrors {
  level?: string
  text?: string
  point?: string
  data?: string
}

export const QuestionCreatePage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { id } = useParams()
  const [findQuestionById, { isLoading: isQuestionLoading }] =
    useLazyFindByIdQuery()
  const isEdit = !!id

  const { type } = location.state as { type: QuestionType }
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorContent, setEditorContent] = useState('')
  const [tags, setTags] = useState<Tag[]>([])

  const [openPreview, setOpenPreview] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const { isSubmitting, submitQuestion } = useSubmitQuestion()

  const toast = useToast()

  const [requestInput, setRequestInput] = useState<QuestionRequestInput>({
    text: '',
    point: null,
    level: null as any, // Để null để validate
    isPublic: false,
    tagIds: [],
    type: type,
    data: null,
  })

  // Validation function
  const validateField = (
    field: keyof ValidationErrors,
    value: any
  ): string | undefined => {
    switch (field) {
      case 'level':
        return !value ? 'Vui lòng chọn cấp độ' : undefined
      case 'text':
        // Strip HTML tags để check nội dung thực
        const textContent = value?.replace(/<[^>]*>/g, '').trim()
        return !textContent ? 'Vui lòng nhập nội dung câu hỏi' : undefined
      case 'point':
        if (value === null || value === undefined) {
          return 'Vui lòng nhập điểm'
        }
        if (value < 0) {
          return 'Điểm phải lớn hơn hoặc bằng 0'
        }
        if (value > 100) {
          return 'Điểm không được vượt quá 100'
        }
        return undefined
      case 'data':
        return !value ? 'Vui lòng hoàn thiện dữ liệu câu hỏi' : undefined
      default:
        return undefined
    }
  }

  // Validate all fields
  const validateAll = (): boolean => {
    const newErrors: ValidationErrors = {}

    newErrors.level = validateField('level', requestInput.level)
    newErrors.text = validateField('text', requestInput.text)
    newErrors.point = validateField('point', requestInput.point)
    newErrors.data = validateField('data', requestInput.data)

    setErrors(newErrors)
    setTouched({
      level: true,
      text: true,
      point: true,
      data: true,
    })

    // Check if there are any errors
    return !Object.values(newErrors).some((error) => error !== undefined)
  }

  // Handle field blur
  const handleBlur = (field: keyof ValidationErrors) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(
      field,
      requestInput[field as keyof QuestionRequestInput]
    )
    setErrors({ ...errors, [field]: error })
  }

  const handlePointsChange = (value: number | null) => {
    const newValue = value === null ? 0 : value
    setRequestInput({
      ...requestInput,
      point: newValue,
    })

    if (touched.point) {
      const error = validateField('point', newValue)
      setErrors({ ...errors, point: error })
    }
  }

  const handlePublishStatusChange = (e: any) => {
    setRequestInput({
      ...requestInput,
      isPublic: e.target.value === 'private' ? false : true,
    })
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const handleSaveDraft = () => {
    console.log('Save draft')
    // Logic save draft
  }

  const handlePublish = () => {
    // Validate before submit
    const isValid = validateAll()

    if (!isValid) {
      toast.error(
        'Vui lòng kiểm tra lại thông tin',
        'Có một số trường chưa được điền đầy đủ hoặc không hợp lệ'
      )
      return
    }

    console.log(requestInput)
    submitQuestion(type, requestInput)
  }

  const handleEditQuestion = () => {
    // Validate before submit
    const isValid = validateAll()

    if (!isValid) {
      toast.error(
        'Vui lòng kiểm tra lại thông tin',
        'Có một số trường chưa được điền đầy đủ hoặc không hợp lệ'
      )
      return
    }

    console.log(requestInput)
    submitQuestion(type, requestInput, Number(id))
  }

  const handlePreview = () => {
    // Validate before preview
    if (!requestInput.text || !requestInput.data) {
      const newErrors: ValidationErrors = {}
      if (!requestInput.text)
        newErrors.text = validateField('text', requestInput.text)
      if (!requestInput.data)
        newErrors.data = validateField('data', requestInput.data)

      setErrors(newErrors)
      setTouched({ ...touched, text: true, data: true })

      toast.error('Vui lòng hoàn thành dữ liệu câu hỏi để xem trước')
      return
    }
    setOpenPreview(true)
  }

  const actions: ActionItem[] = [
    {
      icon: <HistoryOutlined />,
      title: 'Lịch sử',
      onAction: () => {
        console.log('View history')
      },
      ariaLabel: 'Xem lịch sử',
    },
    {
      icon: <EditOutlined />,
      title: 'Chỉnh sửa',
      onAction: () => {
        console.log('Edit question')
      },
      ariaLabel: 'Chỉnh sửa câu hỏi',
    },
    {
      icon: <EyeOutlined />,
      title: 'Xem trước',
      onAction: handlePreview,
      ariaLabel: 'Xem trước câu hỏi',
    },
  ]

  const handleSelectLevel = (level: string | number) => {
    const levelKey = level as keyof typeof Level
    const levelValue = Level[levelKey]
    setRequestInput({
      ...requestInput,
      level: levelValue,
    })

    if (touched.level) {
      const error = validateField('level', levelValue)
      setErrors({ ...errors, level: error })
    }
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML)
    }
  }

  const insertMedia = (type: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept =
      type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (type === 'image') {
            executeCommand(
              'insertHTML',
              `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`
            )
          } else if (type === 'video') {
            executeCommand(
              'insertHTML',
              `<video controls style="max-width: 100%;"><source src="${result}" /></video>`
            )
          } else {
            executeCommand(
              'insertHTML',
              `<audio controls><source src="${result}" /></audio>`
            )
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const tabItems = [
    {
      key: 'edit',
      label: 'Sửa',
    },
    {
      key: 'preview',
      label: 'Chèn',
    },
    {
      key: 'view',
      label: 'Xem',
    },
    {
      key: 'format',
      label: 'Định dạng',
    },
    {
      key: 'table',
      label: 'Bảng',
    },
    {
      key: 'tools',
      label: 'Công cụ',
    },
    {
      key: 'help',
      label: 'Trợ giúp',
    },
  ]

  useEffect(() => {
    setRequestInput({
      ...requestInput,
      tagIds: tags.map((tag) => tag.id),
    })
  }, [tags])

  const loadQuestion = async (questionId: number) => {
    try {
      const result = await findQuestionById({ questionId }).unwrap()
      console.log('API Response:', result)
      const requestInput: QuestionRequestInput = {
        text: result.text ?? '',
        point: result.point,
        level: result.level,
        isPublic: result.isPublic,
        tagIds: result.tags ? result.tags.map((tag) => tag.id) : [],
        type: result.type,
        data: null,
      }

      const tags = result.tags || []
      if (tags.length > 0) {
        console.log(tags)
        setTags(tags)
      }

      switch (result.type) {
        case QuestionType.ONE_CHOICE: {
          const data: OneChoiceData = {
            answers: result.answers.map((item) => ({
              orderIndex: (item.orderIndex ?? 0) + 1,
              label: item.value ?? '',
              isCorrect: !!item.result,
            })),
          }
          requestInput.data = data
          break
        }
        case QuestionType.MULTI_CHOICE: {
          const data: MultiChoiceData = {
            answers: result.answers.map((item) => ({
              orderIndex: (item.orderIndex ?? 0) + 1,
              label: item.value ?? '',
              isCorrect: !!item.result,
            })),
          }
          requestInput.data = data
          break
        }
        case QuestionType.TRUE_FALSE: {
          const data: TrueFalseData = {
            correctAnswer: !!result.answers[0].result,
          }
          requestInput.data = data
          break
        }
        case QuestionType.TABLE_CHOICE: {
          const data: TableChoiceData = {
            headers: result.headers || [],
            rows: result.rows || [],
          }
          requestInput.data = data
          break
        }
        case QuestionType.ESSAY: {
          const data: EssayData = {
            minWords: result.minWords,
            maxWords: result.maxWords,
            answerAnswer: result.answerAnswer,
            gradingCriteria: result.gradingCriteria,
          }
          requestInput.data = data
          break
        }
        case QuestionType.PLAIN_TEXT: {
          const data: PlainTextData = {
            expectedAnswer: result.expectedAnswer,
            caseSensitive: result.caseSensitive,
            exactMatch: result.exactMatch,
          }
          requestInput.data = data
          break
        }
        default:
          break
      }

      console.log('REquest Input:', requestInput)
      setRequestInput(requestInput)
    } catch (error) {
      console.error('Failed to load question', error)
      toast.error('Không thể tải câu hỏi')
    }
  }

  useEffect(() => {
    console.log('Question ID:', id)

    if (id) {
      loadQuestion(Number(id))
    }
  }, [])

  // sync editor DOM when requestInput.text changes, but only if editor not focused
  useEffect(() => {
    if (!editorRef.current) return
    const el = editorRef.current
    if (document.activeElement !== el) {
      el.innerHTML = requestInput.text ?? ''
    }
  }, [requestInput.text])

  if (isQuestionLoading) {
    return <Loading />
  }

  return (
    <Container>
      <HeaderAction>
        <BackAction onClick={() => navigate(-1)} aria-label="Quay lại">
          <LeftOutlined style={{ marginRight: 6 }} />
          {QuestionTypeLabel[type]}
        </BackAction>

        <ActionGroup>
          {actions.map((action) => (
            <ActionButton
              key={action.title}
              type="text"
              icon={action.icon}
              onClick={action.onAction}
              aria-label={action.ariaLabel || action.title}
            >
              {action.title}
            </ActionButton>
          ))}
        </ActionGroup>
      </HeaderAction>

      <ContentLayout>
        <FormSection>
          <div style={{ flex: 1 }}>
            <DropDownFixedValues
              options={Object.entries(Level).map(
                (value) =>
                  ({
                    value: value[0],
                    label: LevelLabel[value[1]],
                  } as DropOptionItem)
              )}
              placeholder="Chọn cấp độ"
              title="Cấp độ"
              required
              onChange={handleSelectLevel}
              style={{ width: '100%' }}
              value={requestInput.level || undefined}
            />
            {touched.level && errors.level && (
              <ErrorMessage>{errors.level}</ErrorMessage>
            )}
          </div>
          <TagSelection tags={tags} onSelect={setTags} />
        </FormSection>

        <QuestionSection>
          <QuestionLabel>
            Câu hỏi <RequiredStar>*</RequiredStar>
          </QuestionLabel>

          {/* Rich Text Editor */}
          <EditorContainer hasError={!!(touched.text && errors.text)}>
            <EditorTabs>
              <Tabs
                defaultActiveKey="edit"
                items={tabItems}
                size="small"
                tabBarStyle={{ marginBottom: 0 }}
              />
            </EditorTabs>

            <Toolbar>
              <ToolbarGroup>
                <ToolButton onClick={() => executeCommand('undo')}>
                  <UndoOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('redo')}>
                  <RedoOutlined />
                </ToolButton>
                <ToolButton>
                  <SearchOutlined />
                </ToolButton>
              </ToolbarGroup>

              <Separator />

              <ToolbarGroup>
                <ToolButton onClick={() => insertMedia('image')}>
                  <PictureOutlined />
                </ToolButton>
                <ToolButton onClick={() => insertMedia('video')}>
                  <PlayCircleOutlined />
                </ToolButton>
                <ToolButton onClick={() => insertMedia('audio')}>
                  <SoundOutlined />
                </ToolButton>
                <ToolButton
                  onClick={() => executeCommand('insertHTML', '<br>')}
                >
                  <PlusOutlined />
                </ToolButton>
              </ToolbarGroup>

              <Separator />

              <ToolbarGroup>
                <ToolButton onClick={() => executeCommand('bold')}>
                  <BoldOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('italic')}>
                  <ItalicOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('underline')}>
                  <UnderlineOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('strikethrough')}>
                  <StrikethroughOutlined />
                </ToolButton>
              </ToolbarGroup>

              <ToolbarGroup>
                <Select
                  defaultValue="Mulish"
                  size="small"
                  style={{ width: 100 }}
                  options={[
                    { value: 'Mulish', label: 'Mulish' },
                    { value: 'Arial', label: 'Arial' },
                    { value: 'Times', label: 'Times' },
                  ]}
                  onChange={(value) => executeCommand('fontName', value)}
                />
              </ToolbarGroup>

              <ToolbarGroup>
                <Select
                  defaultValue="12pt"
                  size="small"
                  style={{ width: 60 }}
                  options={[
                    { value: '8pt', label: '8pt' },
                    { value: '10pt', label: '10pt' },
                    { value: '12pt', label: '12pt' },
                    { value: '14pt', label: '14pt' },
                    { value: '16pt', label: '16pt' },
                    { value: '18pt', label: '18pt' },
                  ]}
                  onChange={(value) => executeCommand('fontSize', value)}
                />
              </ToolbarGroup>

              <ToolbarGroup>
                <Select
                  defaultValue="Đoạn văn"
                  size="small"
                  style={{ width: 100 }}
                  options={[
                    { value: 'p', label: 'Đoạn văn' },
                    { value: 'h1', label: 'Tiêu đề 1' },
                    { value: 'h2', label: 'Tiêu đề 2' },
                    { value: 'h3', label: 'Tiêu đề 3' },
                  ]}
                  onChange={(value) => executeCommand('formatBlock', value)}
                />
              </ToolbarGroup>

              <Separator />

              <ToolbarGroup>
                <ToolButton onClick={() => executeCommand('justifyLeft')}>
                  <AlignLeftOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('justifyCenter')}>
                  <AlignCenterOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('justifyRight')}>
                  <AlignRightOutlined />
                </ToolButton>
              </ToolbarGroup>

              <ToolbarGroup>
                <ToolButton
                  onClick={() => executeCommand('insertUnorderedList')}
                >
                  <UnorderedListOutlined />
                </ToolButton>
                <ToolButton onClick={() => executeCommand('insertOrderedList')}>
                  <OrderedListOutlined />
                </ToolButton>
              </ToolbarGroup>

              <ToolButton>
                <MoreOutlined />
              </ToolButton>
            </Toolbar>

            <EditorContent
              ref={editorRef}
              contentEditable
              onInput={(e) => {
                const html = (e.target as HTMLDivElement).innerHTML
                setRequestInput({
                  ...requestInput,
                  text: html,
                })

                if (touched.text) {
                  const error = validateField('text', html)
                  setErrors({ ...errors, text: error })
                }
              }}
              onBlur={() => handleBlur('text')}
              suppressContentEditableWarning={true}
              content={requestInput.text}
            />

            <EditorFooter>
              <span>0 từ</span>
            </EditorFooter>
          </EditorContainer>
          {touched.text && errors.text && (
            <ErrorMessage>{errors.text}</ErrorMessage>
          )}
        </QuestionSection>

        <PointsSection>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <PointsLabel>
              Điểm: <RequiredStar>*</RequiredStar>
            </PointsLabel>
            <InputNumber
              placeholder="Nhập điểm"
              value={requestInput.point}
              onChange={handlePointsChange}
              onBlur={() => handleBlur('point')}
              min={0}
              max={100}
              style={{ width: 200 }}
              status={touched.point && errors.point ? 'error' : ''}
            />
            {touched.point && errors.point && (
              <ErrorMessage>{errors.point}</ErrorMessage>
            )}
          </div>
        </PointsSection>

        <div>
          <QuestionFactory
            questionType={type}
            onChange={(data) => {
              setRequestInput({
                ...requestInput,
                data: data,
              })

              if (touched.data) {
                const error = validateField('data', data)
                setErrors({ ...errors, data: error })
              }
            }}
            questionData={requestInput.data}
          />
          {touched.data && errors.data && (
            <ErrorMessage>{errors.data}</ErrorMessage>
          )}
        </div>

        <PublishStatusSection>
          <PublishStatusLabel>
            Trạng thái xuất bản: <RequiredStar>*</RequiredStar>
          </PublishStatusLabel>
          <Radio.Group
            value={requestInput.isPublic ? 'public' : 'private'}
            onChange={handlePublishStatusChange}
          >
            <Space direction="horizontal">
              <Radio value="private">Chỉ mình tôi</Radio>
              <Radio value="public">Công khai</Radio>
            </Space>
          </Radio.Group>
        </PublishStatusSection>

        <ActionButtonsSection>
          {!isEdit ? (
            <>
              <Space size="middle">
                <CancelButton onClick={handleCancel}>Hủy</CancelButton>
                <SaveDraftButton onClick={handleSaveDraft}>
                  Lưu bản nháp
                </SaveDraftButton>
                <PublishButton
                  type="primary"
                  onClick={handlePublish}
                  loading={isSubmitting}
                >
                  Xuất bản
                </PublishButton>
              </Space>
            </>
          ) : (
            <>
              <Space size="middle">
                <CancelButton onClick={handleCancel}>Hủy</CancelButton>
                <PublishButton
                  type="primary"
                  onClick={handleEditQuestion}
                  loading={isSubmitting}
                >
                  Cập nhật
                </PublishButton>
              </Space>
            </>
          )}
        </ActionButtonsSection>
      </ContentLayout>

      {openPreview && (
        <Modal
          title="Xem trước hiển thị câu hỏi"
          open={openPreview}
          width={'60%'}
          onCancel={() => setOpenPreview(false)}
          footer={null}
        >
          <div style={{ marginTop: 20 }}>
            <QuestionPreviewFactory
              type={type}
              data={requestInput.data}
              text={requestInput.text}
            />
          </div>
        </Modal>
      )}
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const HeaderAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  background: #fff;
`

const BackAction = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  color: #333;

  &:hover {
    color: #1677ff;
  }
`

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
    color: #1677ff;
  }

  .anticon {
    margin-right: 6px;
  }
`

const ContentLayout = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`

const FormSection = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
`

const QuestionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const QuestionLabel = styled.label`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`

const EditorContainer = styled.div<{ hasError?: boolean }>`
  border: 1px solid ${(props) => (props.hasError ? '#ff4d4f' : '#d9d9d9')};
  border-radius: 6px;
  background: #fff;
  padding: 10px;
  transition: border-color 0.3s;
`

const EditorTabs = styled.div`
  border-bottom: 1px solid #d9d9d9;

  .ant-tabs-tab {
    padding: 8px 16px;
    font-size: 14px;
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #d9d9d9;
  background: #fafafa;
  gap: 8px;
  flex-wrap: wrap;
`

const ToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ToolButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;

  &:hover {
    background: #e6f7ff;
    color: #1677ff;
  }

  &:active {
    background: #bae7ff;
  }
`

const Separator = styled.div`
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  margin: 0 4px;
`

const EditorContent = styled.div`
  min-height: 200px;
  padding: 12px;
  outline: none;
  line-height: 1.6;
  color: #333;

  &:empty:before {
    content: 'Nhập nội dung câu hỏi...';
    color: #bfbfbf;
  }

  img,
  video,
  audio {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
  }
`

const EditorFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  font-size: 12px;
  color: #666;
`

export const PointsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const PointsLabel = styled.label`
  font-size: 16px;
  color: #333;
`

export const RequiredStar = styled.span`
  color: #ff4d4f;
  margin-left: 2px;
`

export const PublishStatusSection = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
`

export const PublishStatusLabel = styled.label`
  font-size: 16px;
  color: #333;
  font-weight: 600;
`

const ActionButtonsSection = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
`

const CancelButton = styled(Button)`
  min-width: 100px;
`

const SaveDraftButton = styled(Button)`
  min-width: 120px;
`

const PublishButton = styled(Button)`
  min-width: 100px;
`

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 4px;
`
