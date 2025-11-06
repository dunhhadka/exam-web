import { Controller, useForm } from 'react-hook-form'
import { Button, Row, Col, Card } from 'antd'
import styled from '@emotion/styled'
import { RegisterRequest } from '../../types/auth'
import { registerSchema } from '../../validation/registerSchema'
import { yupResolver } from '@hookform/resolvers/yup'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import CustomInput from '../../components/common/FormInput'
import { useRegisterMutation } from '../../services/api/authApi'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'

// Styled Components
export const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`

export const Title = styled.h2`
  color: #ff6b6b;
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`

export const Subtitle = styled.p`
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  text-align: center;
  margin-bottom: 32px;
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const StyledButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 8px;

  &.ant-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

    &:hover,
    &:focus {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    &[disabled] {
      background: #f5f5f5;
      color: rgba(0, 0, 0, 0.25);
      box-shadow: none;
      transform: none;
    }
  }
`

const Register = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: yupResolver(registerSchema),
    mode: 'all',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  const navigate = useNavigate()
  const [register] = useRegisterMutation()
  const toast = useToast()

  const onSubmit = async (request: RegisterRequest) => {
    try {
      const res = await register({
        firstName: request.first_name,
        lastName: request.last_name,
        email: request.email,
        password: request.password,
        confirmPassword: request.confirm_password,
        isTeacher: true,
      }).unwrap()

      toast.success('Tạo tài khoản thành công')

      navigate('/login')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Container>
      <Title>Đăng ký ngay</Title>
      <Subtitle>Vui lòng điền các thông tin bên dưới</Subtitle>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <CustomInput
                  title="Tên"
                  placeholder="Nhập tên của bạn"
                  icon={<UserOutlined />}
                  error={errors.first_name?.message}
                  required
                  {...field}
                />
              )}
            />
          </Col>

          <Col xs={24} sm={12}>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <CustomInput
                  title="Họ"
                  placeholder="Nhập họ của bạn"
                  icon={<UserOutlined />}
                  error={errors.last_name?.message}
                  required
                  {...field}
                />
              )}
            />
          </Col>
        </Row>

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <CustomInput
              title="Email"
              type="email"
              placeholder="Nhập email của bạn"
              icon={<MailOutlined />}
              error={errors.email?.message}
              required
              {...field}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <CustomInput
              title="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              icon={<LockOutlined />}
              error={errors.password?.message}
              required
              {...field}
            />
          )}
        />

        <Controller
          name="confirm_password"
          control={control}
          render={({ field }) => (
            <CustomInput
              title="Nhập lại mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              icon={<LockOutlined />}
              error={errors.confirm_password?.message}
              required
              {...field}
            />
          )}
        />

        <StyledButton
          type="primary"
          htmlType="submit"
          size="large"
          loading={isSubmitting}
          block
        >
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
        </StyledButton>
      </Form>
    </Container>
  )
}

export default Register
