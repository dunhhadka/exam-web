import { ColumnType } from 'antd/es/table'
import { Tooltip } from 'antd'
import { CopyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import React from 'react'

export interface ActionConfig<T> {
  label: string
  icon: React.ReactNode
  onClick: (record: T) => void
  type?: 'primary' | 'link' | 'default' | 'dashed'
  danger?: boolean
  disabled?: (record: T) => boolean
}

export const createActionColumns = <T extends Record<string, any>>(
  actions: ActionConfig<T>[]
): ColumnType<T> => {
  return {
    title: 'Thao tác',
    key: 'actions',
    fixed: 'right' as const,
    width: actions.length * 50, // icon nhỏ hơn text nên để 50px
    render: (_: any, record: T) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {actions.map((action, index) => {
          const isDisabled = action.disabled?.(record)

          return (
            <Tooltip key={index} title={action.label}>
              <button
                onClick={() => !isDisabled && action.onClick(record)}
                disabled={isDisabled}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: action.danger ? '#ff4d4f' : '#1890ff',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              >
                {action.icon}
              </button>
            </Tooltip>
          )
        })}
      </div>
    ),
  }
}
