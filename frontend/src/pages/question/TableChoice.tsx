import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Input, Radio } from 'antd'
import { useEffect, useState } from 'react'

export interface TableChoiceRow {
  label: string
  correctIndex: number
}

export interface TableChoiceData {
  headers: string[]
  rows: TableChoiceRow[]
}

interface TableChoiceProps {
  value?: TableChoiceData
  onChange?: (value: TableChoiceData) => void
}

export const TableChoice = ({ value, onChange }: TableChoiceProps) => {
  const [headers, setHeaders] = useState<string[]>(value?.headers || ['', '', ''])
  const [rows, setRows] = useState<TableChoiceRow[]>(
    value?.rows || [{ label: '', correctIndex: 0 }]
  )

  // Sync state with value prop when editing
  useEffect(() => {
    if (value) {
      if (value.headers && value.headers.length > 0) {
        setHeaders(value.headers)
      }
      if (value.rows && value.rows.length > 0) {
        setRows(value.rows)
      }
    }
  }, [value])

  const handleHeaderChange = (index: number, newValue: string) => {
    const newHeaders = [...headers]
    newHeaders[index] = newValue
    setHeaders(newHeaders)
    onChange?.({ headers: newHeaders, rows })
  }

  const handleAddHeader = () => {
    const newHeaders = [...headers, '']
    setHeaders(newHeaders)
    onChange?.({ headers: newHeaders, rows })
  }

  const handleRemoveHeader = (index: number) => {
    if (headers.length <= 1) return
    const newHeaders = headers.filter((_, i) => i !== index)
    // Cập nhật lại correctIndex của các rows nếu xóa header
    const newRows = rows.map((row) => ({
      ...row,
      correctIndex: row.correctIndex >= index && row.correctIndex > 0 ? row.correctIndex - 1 : row.correctIndex,
    }))
    setHeaders(newHeaders)
    setRows(newRows)
    onChange?.({ headers: newHeaders, rows: newRows })
  }

  const handleRowLabelChange = (rowIndex: number, newLabel: string) => {
    const newRows = rows.map((row, index) => 
      index === rowIndex ? { ...row, label: newLabel } : { ...row }
    )
    setRows(newRows)
    onChange?.({ headers, rows: newRows })
  }

  const handleRowCorrectIndexChange = (rowIndex: number, correctIndex: number) => {
    console.log('handleRowCorrectIndexChange:', { rowIndex, correctIndex })
    console.log('Current rows before change:', JSON.stringify(rows, null, 2))
    const newRows = rows.map((row, index) => 
      index === rowIndex ? { ...row, correctIndex } : { ...row }
    )
    console.log('New rows after change:', JSON.stringify(newRows, null, 2))
    setRows(newRows)
    onChange?.({ headers, rows: newRows })
  }

  const handleAddRow = () => {
    const newRows = [...rows, { label: '', correctIndex: 0 }]
    setRows(newRows)
    onChange?.({ headers, rows: newRows })
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return
    const newRows = rows.filter((_, i) => i !== index)
    setRows(newRows)
    onChange?.({ headers, rows: newRows })
  }

  return (
    <Container>
      <SectionTitle>Đáp án</SectionTitle>
      <TableContainer>
        {/* Header Row */}
        <HeaderRow>
          <EmptyCorner />
          {headers.map((header, index) => (
            <HeaderColumn key={index}>
              <HeaderInput
                value={header}
                onChange={(e) => handleHeaderChange(index, e.target.value)}
                placeholder={`Cột ${index + 1}`}
              />
              {headers.length > 1 && (
                <DeleteIconButton
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveHeader(index)}
                  type="text"
                  size="small"
                />
              )}
            </HeaderColumn>
          ))}
          <AddColumnCell>
            <AddButton
              icon={<PlusOutlined />}
              onClick={handleAddHeader}
              type="text"
              shape="circle"
              size="small"
            />
          </AddColumnCell>
        </HeaderRow>

        {/* Data Rows */}
        {rows.map((row, rowIndex) => (
          <DataRow key={rowIndex}>
            <RowLabelColumn>
              <RowLabelInput
                value={row.label}
                onChange={(e) => handleRowLabelChange(rowIndex, e.target.value)}
                placeholder={`Hàng ${rowIndex + 1}`}
              />
              {rows.length > 1 && (
                <DeleteIconButton
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveRow(rowIndex)}
                  type="text"
                  size="small"
                />
              )}
            </RowLabelColumn>
            {headers.map((_, colIndex) => (
              <RadioColumn key={colIndex}>
                <Radio
                  checked={row.correctIndex === colIndex}
                  onChange={() => handleRowCorrectIndexChange(rowIndex, colIndex)}
                />
              </RadioColumn>
            ))}
            <EmptyActionCell />
          </DataRow>
        ))}

        {/* Add Row Button */}
        <AddRowButtonRow>
          <AddRowButton
            icon={<PlusOutlined />}
            onClick={handleAddRow}
            type="text"
            shape="circle"
            size="small"
          />
        </AddRowButtonRow>
      </TableContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
`

const HeaderRow = styled.div`
  display: flex;
  border-bottom: 1px solid #d9d9d9;
  background: #fafafa;
`

const EmptyCorner = styled.div`
  width: 200px;
  min-width: 200px;
  border-right: 1px solid #d9d9d9;
`

const HeaderColumn = styled.div`
  flex: 1;
  min-width: 150px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  border-right: 1px solid #d9d9d9;
  position: relative;
`

const HeaderInput = styled(Input)`
  flex: 1;
  border: none;
  background: transparent;
  padding: 4px 8px;
  
  &:focus {
    background: white;
    border: 1px solid #1890ff;
    border-radius: 2px;
  }
`

const AddColumnCell = styled.div`
  width: 60px;
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
`

const DataRow = styled.div`
  display: flex;
  border-bottom: 1px solid #d9d9d9;

  &:last-child {
    border-bottom: none;
  }
`

const RowLabelColumn = styled.div`
  width: 200px;
  min-width: 200px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  border-right: 1px solid #d9d9d9;
  background: #fafafa;
`

const RowLabelInput = styled(Input)`
  flex: 1;
  border: none;
  background: transparent;
  padding: 4px 8px;

  &:focus {
    background: white;
    border: 1px solid #1890ff;
    border-radius: 2px;
  }
`

const RadioColumn = styled.div`
  flex: 1;
  min-width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-right: 1px solid #d9d9d9;

  &:hover {
    background: #f5f5f5;
  }
`

const EmptyActionCell = styled.div`
  width: 60px;
  min-width: 60px;
`

const DeleteIconButton = styled(Button)`
  padding: 0;
  width: 20px;
  height: 20px;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .anticon {
    font-size: 12px;
  }
`

const AddButton = styled(Button)`
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  background: white;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .anticon {
    font-size: 12px;
  }
`

const AddRowButtonRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #d9d9d9;
`

const AddRowButton = styled(Button)`
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  background: white;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .anticon {
    font-size: 12px;
  }
`
