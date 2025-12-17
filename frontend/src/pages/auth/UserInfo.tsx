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
          <HeaderContent>
            <Title>Thông tin cá nhân</Title>
            <Subtitle>Quản lý thông tin tài khoản của bạn</Subtitle>
          </HeaderContent>
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

        <ContentCard>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              email: profile.email,
              firstName: profile.firstName,
              lastName: profile.lastName,
              password: '********',
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
              <UserName>
                {profile.lastName} {profile.firstName}
              </UserName>
              <UserEmail>{profile.email}</UserEmail>
            </AvatarSection>

            <Divider />

            <FormSection>
              <SectionTitle>Thông tin cơ bản</SectionTitle>
              <FormGrid>
                <FormItem
                  label="Họ"
                  name="lastName"
                  rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                >
                  <StyledInput
                    placeholder="Nhập họ của bạn"
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
                    placeholder="Nhập tên của bạn"
                    disabled={!isEditing}
                    size="large"
                  />
                </FormItem>

                <FormItem label="Email" name="email">
                  <StyledInput
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    disabled
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
            </FormSection>
          </Form>
        </ContentCard>
      </Container>
    </Wrapper>
  )
}

export default UserInfo

/* ==== Styled Components ==== */
const Wrapper = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const HeaderContent = styled.div`
  flex: 1;
`

const Title = styled.h1`
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f1f1f;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
`

const EditButton = styled(Button)`
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
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
    transform: translateY(-2px);
  }
`

const SaveButton = styled(Button)`
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  }
`

const ContentCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.3;
    pointer-events: none;
  }
`

const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 16px;
  z-index: 1;
`

const StyledAvatar = styled(Avatar)`
  border: 5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const UploadButton = styled(Button)`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 3px solid #fff;

  &:hover {
    transform: scale(1.1);
  }

  .anticon {
    font-size: 16px;
  }
`

const UserName = styled.h2`
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`

const UserEmail = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  z-index: 1;
`

const Divider = styled.div`
  height: 1px;
  background: #f0f0f0;
`

const FormSection = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`

const SectionTitle = styled.h3`
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
  display: flex;
  align-items: center;

  &::before {
    content: '';
    width: 4px;
    height: 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin-right: 12px;
    border-radius: 2px;
  }
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const FormItem = styled(Form.Item)`
  margin-bottom: 0;

  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 14px;
    color: #595959;
    height: auto;
  }
`

const StyledInput = styled(Input)`
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: #40a9ff;
  }

  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    color: #595959;
    cursor: not-allowed;
    border-color: #d9d9d9;
  }

  .ant-input-prefix {
    margin-right: 12px;
    color: #8c8c8c;
    font-size: 16px;
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
