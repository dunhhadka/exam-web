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
import { Button, InputNumber, Radio, Select, Space, Tabs } from 'antd'
import { ReactNode, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DropDownFixedValues,
  DropOptionItem,
} from '../../components/common/DropDownFixedValues'
import { TagSelection } from '../../components/common/TagSelection'
import { useSubmitQuestion } from '../../hooks/useSubmitQuestion'
import {
  Level,
  LevelLabel,
  QuestionRequestInput,
  QuestionType,
  QuestionTypeLabel,
  Tag,
} from '../../types/question'
import { QuestionFactory } from './QuestionTypeFactory'

interface ActionItem {
  title: string
  icon: ReactNode
  onAction: () => void
  ariaLabel?: string
}

export const QuestionCreatePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { type } = location.state as { type: QuestionType }
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorContent, setEditorContent] = useState('')

  const { isSubmitting, submitQuestion } = useSubmitQuestion()

  const [requestInput, setRequestInput] = useState<QuestionRequestInput>({
    text: '',
    point: null,
    level: Level.EASY,
    isPublic: false,
    tagIds: [],
    type: type,
    data: null,
  })

  // question data

  const handlePointsChange = (value: number | null) => {
    if (value === null) {
      setRequestInput({
        ...requestInput,
        point: 0,
      })
    } else {
      setRequestInput({
        ...requestInput,
        point: value,
      })
    }
  }

  const handlePublishStatusChange = (e: any) => {
    console.log(e.target.value)
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
    console.log(requestInput)
    submitQuestion(type, requestInput)

    navigate('/questions')
    // Logic publish
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
      onAction: () => {
        console.log('Preview question')
      },
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
          />
          <TagSelection 
          onSelect={(tags) => console.log(tags)} />
        </FormSection>

        <QuestionSection>
          <QuestionLabel>Câu hỏi</QuestionLabel>

          {/* Rich Text Editor */}
          <EditorContainer>
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
              onInput={(e) =>
                setRequestInput({
                  ...requestInput,
                  text: (e.target as HTMLDivElement).innerHTML,
                })
              }
              suppressContentEditableWarning={true}
            />

            <EditorFooter>
              <span>0 từ</span>
            </EditorFooter>
          </EditorContainer>
        </QuestionSection>

        <PointsSection>
          <PointsLabel>
            Điểm: <RequiredStar>*</RequiredStar>
          </PointsLabel>
          <InputNumber
            placeholder="Nhập điểm"
            value={requestInput.point}
            onChange={handlePointsChange}
            min={0}
            max={100}
            style={{ width: 200 }}
          />
        </PointsSection>

        <QuestionFactory
          questionType={type}
          onChange={(data) => {
            setRequestInput({
              ...requestInput,
              data: data,
            })
          }}
        />

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
          <Space size="middle">
            <CancelButton onClick={handleCancel}>Hủy</CancelButton>
            <SaveDraftButton onClick={handleSaveDraft}>
              Lưu bản nháp
            </SaveDraftButton>
            <PublishButton type="primary" onClick={handlePublish}>
              Xuất bản
            </PublishButton>
          </Space>
        </ActionButtonsSection>
      </ContentLayout>
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

const EditorContainer = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  padding: 10px;
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
