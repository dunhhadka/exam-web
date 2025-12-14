// pages/examsession/ExamSessionFactoryPage.tsx
import { useState } from 'react'
import { Button, Space } from 'antd'
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import ExamSessionListPage from './ExamSessionListPage'
import ExamSessionGridMode from './ExamSessionGridMode'

const ExamSessionFactoryPage = () => {
  const [viewMode, setViewMode] = useState<'ROW' | 'GRID'>('ROW')

  return (
    <>
      <ViewModeToggle>
        <Space>
          <Button
            type={viewMode === 'ROW' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={() => setViewMode('ROW')}
          ></Button>
          <Button
            type={viewMode === 'GRID' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode('GRID')}
          ></Button>
        </Space>
      </ViewModeToggle>

      {viewMode === 'ROW' ? <ExamSessionListPage /> : <ExamSessionGridMode />}
    </>
  )
}

export default ExamSessionFactoryPage

const ViewModeToggle = styled.div`
  position: fixed;
  bottom: 10px;
  right: 24px;
  z-index: 99;
  background: #fff;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`
