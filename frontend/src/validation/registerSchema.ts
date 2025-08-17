import * as yup from 'yup'

export const registerSchema = yup.object({
  first_name: yup.string().required('Vui lòng nhập Tên'),
  last_name: yup.string().required('Vui lòng nhập Họ'),
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Vui lòng nhập Email'),
  password: yup
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Vui lòng nhập Mật khẩu'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu nhập lại không khớp')
    .required('Vui lòng nhập lại Mật khẩu'),
})
