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
import styled from '@emotion/styled'

const SocialLoginSection = styled.div`
  margin-top: 24px;
`

const SocialLoginText = styled.p`
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
`

const SocialButtonsContainer = styled.div`
  display: flex;
  gap: 16px;
`

const SocialButton = styled.button`
  flex: 1;
  height: 56px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-2px);
  }

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
`

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

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth login
    toast.info('Tính năng đăng nhập Google đang được phát triển')
  }

  const handleFacebookLogin = () => {
    // TODO: Implement Facebook OAuth login
    toast.info('Tính năng đăng nhập Facebook đang được phát triển')
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

      <SocialLoginSection>
        <SocialLoginText>Hoặc đăng nhập bằng tài khoản</SocialLoginText>
        <SocialButtonsContainer>
          <SocialButton onClick={handleGoogleLogin}>
            <img src="/icon4/google.png" alt="Google" />
            <span>Google</span>
          </SocialButton>
          <SocialButton onClick={handleFacebookLogin}>
            <img src="/icon4/facebook.png" alt="Facebook" />
            <span>Facebook</span>
          </SocialButton>
        </SocialButtonsContainer>
      </SocialLoginSection>
    </Container>
  )
}

export default Login
