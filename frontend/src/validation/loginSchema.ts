import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập Email'),
  password: yup.string().required('Vui lòng nhập Mật khẩu'),
})
