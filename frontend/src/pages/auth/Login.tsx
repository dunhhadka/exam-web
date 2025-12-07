import { Controller, useForm } from 'react-hook-form'
import { LoginRequest } from '../../types/auth'
import { loginSchema } from '../../validation/loginSchema'
import { yupResolver } from '@hookform/resolvers/yup'
import { Container, Form, StyledButton, Subtitle, Title } from './Register'
import CustomInput from '../../components/common/FormInput'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { useLoginMutation } from '../../services/api/authApi'
import { setCredentials, setProfile } from '../../store/slices/authSlice'
import { useToast } from '../../hooks/useToast'
import { useLazyGetProfileQuery } from '../../services/api/accountApi'

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
  const [loginMutation] = useLoginMutation()

  const [getProfile] = useLazyGetProfileQuery()

  const toast = useToast()

  const onSubmit = async (request: LoginRequest) => {
    try {
      const response = await loginMutation({
        credential: request.email,
        password: request.password,
        rememberMe: true,
      }).unwrap()
      dispatch(
        setCredentials({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        })
      )

      // TODO: use redux persist to save profile
      const profile = await getProfile().unwrap()
      if (profile) {
        dispatch(setProfile(profile))
      }

      toast.success('Đăng nhập thành công')
    } catch (error) {
      console.log(error)
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
