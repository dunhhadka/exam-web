import { Controller, useForm } from 'react-hook-form'
import { LoginRequest } from '../../types/auth'
import { loginSchema } from '../../validation/loginSchema'
import { yupResolver } from '@hookform/resolvers/yup'
import { Container, Form, StyledButton, Subtitle, Title } from './Register'
import CustomInput from '../../components/common/FormInput'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { login } from '../../store/slices/authSlice'

const Login = () => {
  const dispatch = useDispatch()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
    mode: 'all',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginRequest) => {
    try {
      console.log('Login data:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      dispatch(
        login({
          user: { email: data.email, id: '1', name: 'hadung' },
          token: 'fake-token',
        })
      )

      alert('Đăng nhập thành công!')
    } catch (error) {
      console.error('Login error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại!')
    }
  }

  return (
    <Container>
      <Title>Đăng nhập</Title>
      <Subtitle>Vui lòng điền các thông tin đăng nhập</Subtitle>

      <Form onSubmit={handleSubmit(onSubmit)}>
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

        <StyledButton
          type="primary"
          htmlType="submit"
          size="large"
          loading={isSubmitting}
          block
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </StyledButton>
      </Form>
    </Container>
  )
}

export default Login
