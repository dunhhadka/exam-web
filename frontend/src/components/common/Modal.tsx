import React from 'react'
import { Modal as AntdModal, Button } from 'antd'

interface Props {
  title: string
  size: 'large' | 'medium' | 'small'
  open: boolean
  onClose: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export const Modal: React.FC<Props> = ({
  title,
  size,
  open,
  onClose,
  onCancel,
  children,
}) => {
  const getWidth = () => {
    switch (size) {
      case 'large':
        return 900
      case 'medium':
        return 600
      case 'small':
        return 400
      default:
        return 600
    }
  }

  return (
    <AntdModal
      title={
        <div style={{ fontSize: '25px', fontWeight: 'bold' }}>{title}</div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Huỷ
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={getWidth()}
      centered
      destroyOnClose
    >
      {children}
    </AntdModal>
  )
}
