import styled from '@emotion/styled'
import { Avatar, Button, Input, Upload, message, Form } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  CameraOutlined,
  LockOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { useState } from 'react'
import { RootState } from '../../store'

const UserInfo = () => {
  const { profile } = useSelector((state: RootState) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatarUrl || null
  )
  const [form] = Form.useForm()

  if (!profile) {
    return (
      <Wrapper>
        <EmptyState>
          <UserOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
          <EmptyText>Không tìm thấy thông tin người dùng</EmptyText>
        </EmptyState>
      </Wrapper>
    )
  }

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('Chỉ chấp nhận file JPG/PNG!')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('Kích thước ảnh phải nhỏ hơn 2MB!')
      return false
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setAvatarUrl(reader.result as string)
      message.success('Tải ảnh lên thành công!')
    })
    reader.readAsDataURL(file)

    return false
  }

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log('Saved values:', values)
      message.success('Cập nhật thông tin thành công!')
      setIsEditing(false)
      // TODO: Dispatch update action here
    })
  }

  const handleCancel = () => {
    form.resetFields()
    setAvatarUrl(profile?.avatarUrl || null)
    setIsEditing(false)
  }

  return (
    <Wrapper>
      <Container>
        <Header>
          {!isEditing ? (
            <EditButton
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
            >
              Chỉnh sửa
            </EditButton>
          ) : (
            <ButtonGroup>
              <CancelButton icon={<CloseOutlined />} onClick={handleCancel}>
                Hủy
              </CancelButton>
              <SaveButton
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Lưu
              </SaveButton>
            </ButtonGroup>
          )}
        </Header>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            password: '***',
          }}
        >
          <AvatarSection>
            <AvatarWrapper>
              <StyledAvatar
                size={120}
                src={avatarUrl}
                icon={<UserOutlined />}
              />
              {isEditing && (
                <Upload
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  accept="image/png,image/jpeg"
                >
                  <UploadButton
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    size="large"
                  />
                </Upload>
              )}
            </AvatarWrapper>
          </AvatarSection>

          <FormGrid>
            <FormItem label="Email" name="email">
              <StyledInput
                prefix={<MailOutlined />}
                placeholder="Email"
                disabled
                size="large"
              />
            </FormItem>

            <FormItem
              label="Họ"
              name="lastName"
              rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
            >
              <StyledInput
                placeholder="Họ"
                disabled={!isEditing}
                size="large"
              />
            </FormItem>

            <FormItem
              label="Tên"
              name="firstName"
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
            >
              <StyledInput
                placeholder="Tên"
                disabled={!isEditing}
                size="large"
              />
            </FormItem>

            <FormItem label="Mật khẩu" name="password">
              <StyledInput
                prefix={<LockOutlined />}
                type="password"
                placeholder="Mật khẩu"
                disabled={!isEditing}
                size="large"
              />
            </FormItem>
          </FormGrid>
        </Form>
      </Container>
    </Wrapper>
  )
}

export default UserInfo

/* ==== Styled Components ==== */
const Wrapper = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
`

const Container = styled.div`
  max-width: 700px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  display: none;
`

const EditButton = styled(Button)`
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;

  &:hover {
    transform: translateY(-2px);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`

const CancelButton = styled(Button)`
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 2px solid #d9d9d9;

  &:hover {
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
`

const SaveButton = styled(Button)`
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;

  &:hover {
    transform: translateY(-2px);
  }
`

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  padding: 32px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 12px;
`

const StyledAvatar = styled(Avatar)`
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #1890ff;
`

const UploadButton = styled(Button)`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 45px;
  height: 45px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 3px solid #fff;

  &:hover {
    transform: scale(1.1);
  }

  .anticon {
    font-size: 18px;
  }
`

const AvatarHint = styled.div`
  font-size: 13px;
  color: #8c8c8c;
  text-align: center;
  max-width: 250px;
  display: none;
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  padding: 40px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  margin-top: 24px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const FormItem = styled(Form.Item)`
  margin-bottom: 0;

  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 13px;
    color: #1890ff;
    height: auto;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &:nth-child(1) {
    grid-column: 1 / -1;
  }
`

const StyledInput = styled(Input)`
  border-radius: 8px;
  border: 2px solid #e8e8e8;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: #1890ff;
  }

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    color: #595959;
    cursor: not-allowed;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: #8c8c8c;
    font-size: 16px;
  }

  &:focus .ant-input-prefix {
    color: #1890ff;
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 16px;
  color: #8c8c8c;
`
