import { useNavigate } from 'react-router-dom'
import CustomSegmented from '../ui/Segmented'
import styled from '@emotion/styled'

interface Props {
  children?: React.ReactNode
}

const authOptions = [
  { label: 'Đăng ký', value: 'register', path: '/register' },
  { label: 'Đăng nhập', value: 'login', path: '/login' },
]

const FormAuth = ({ children }: Props) => {
  const navigate = useNavigate()

  const handleChange = (value: string) => {
    const target = authOptions.find((opt) => opt.value === value)
    if (target) navigate(target.path)
  }

  return (
    <Container>
      <FormContainer>
        <CustomSegmented
          options={authOptions.map(({ label, value }) => ({ label, value }))}
          defaultValue="register"
          onChange={handleChange}
        />
        <FormContent>{children}</FormContent>
      </FormContainer>
      <ImageWrapper>
        <img
          src="https://app.exam.vn/static/media/login.46cff212f409b7fe2e42.png"
          alt="auth"
        />
      </ImageWrapper>
    </Container>
  )
}

export default FormAuth

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 20px;
  }
`

const FormContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 100px;
`

const FormContent = styled.div``

const ImageWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: start;
  position: relative;
  width: 800px;
  position: relative;
  top: -50px;
  img {
    max-width: 100%;
    height: auto;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    display: none;
  }
`
