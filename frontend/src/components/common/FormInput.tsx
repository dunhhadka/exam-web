import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { InputProps as AntInputProps } from 'antd/es/input'
import { Input as AntInput, Form } from 'antd'
import styled from '@emotion/styled'
import { forwardRef } from 'react'

interface Props extends Omit<AntInputProps, 'prefix'> {
  title: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

const CustomInput = forwardRef<any, Props>(
  (
    { title, error, required = false, icon, type, value, onChange, ...rest },
    ref
  ) => {
    const isPassword = type === 'password'
    const iconToRender =
      icon ||
      (type === 'email' ? (
        <MailOutlined />
      ) : type === 'password' ? (
        <LockOutlined />
      ) : (
        <UserOutlined />
      ))

    return (
      <InputWrapper>
        <Label required={required}>{title}</Label>
        {isPassword ? (
          <StyledInputPassword
            {...rest}
            ref={ref}
            prefix={<span style={{ marginRight: 8 }}>{iconToRender}</span>}
            hasError={!!error}
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
            value={value}
            onChange={onChange}
          ></StyledInputPassword>
        ) : (
          <StyledInput
            {...rest}
            ref={ref}
            type={type}
            prefix={<span style={{ marginRight: 8 }}>{iconToRender}</span>}
            hasError={!!error}
            value={value}
            onChange={onChange}
          ></StyledInput>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputWrapper>
    )
  }
)

export default CustomInput

const InputWrapper = styled.div`
  width: 100%;
`

const Label = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5715;

  ${(props) =>
    props.required &&
    `
    &::before {
      display: inline-block;
      margin-right: 4px;
      color: #ff4d4f;
      font-size: 14px;
      font-family: SimSun, sans-serif;
      line-height: 1;
      content: '*';
    }
  `}
`

const StyledInputPassword = styled(AntInput.Password)<{ hasError?: boolean }>`
  width: 100%;
  height: 44px;
  ${(props) =>
    props.hasError &&
    `
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    
    &:hover {
      border-color: #ff4d4f;
    }
    
    &:focus, &.ant-input-focused {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    }
  `}
`

const ErrorMessage = styled.div`
  margin-top: 4px;
  color: #ff4d4f;
  font-size: 12px;
  line-height: 1.5715;
`

const StyledInput = styled(AntInput)<{ hasError?: boolean }>`
  width: 100%;
  height: 44px;
  ${(props) =>
    props.hasError &&
    `
    border-color: #ff4d4f;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    
    &:hover {
      border-color: #ff4d4f;
    }
    
    &:focus, &.ant-input-focused {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    }
  `}
`
