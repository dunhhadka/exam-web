import styled from '@emotion/styled'
import { Radio } from 'antd'
import { TableChoiceData } from '../TableChoice'

interface TableChoicePreviewProps {
  data: TableChoiceData
  text: string
  point: number
}

export const TableChoicePreview = ({ data, text, point }: TableChoicePreviewProps) => {
  return (
    <Container>
      <QuestionHeader>
        <QuestionText dangerouslySetInnerHTML={{ __html: text }} />
        <PointBadge>{point} điểm</PointBadge>
      </QuestionHeader>

      <TableContainer>
        <Table>
          <thead>
            <TableRow>
              <HeaderCell style={{ width: '200px' }}>Hàng</HeaderCell>
              {data.headers.map((header, index) => (
                <HeaderCell key={index}>{header}</HeaderCell>
              ))}
            </TableRow>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <RowLabelCell>{row.label}</RowLabelCell>
                {data.headers.map((_, colIndex) => (
                  <RadioCell key={colIndex}>
                    <Radio value={colIndex} disabled />
                  </RadioCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
`

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
`

const QuestionText = styled.div`
  flex: 1;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
`

const PointBadge = styled.span`
  background: #f0f8f5;
  color: #00a86b;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 16px;
`

const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #e8e8e8;
  }

  &:hover {
    background: #fafafa;
  }
`

const HeaderCell = styled.th`
  padding: 14px 16px;
  text-align: center;
  background: #f8f8f8;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
  border-right: 1px solid #e8e8e8;

  &:last-child {
    border-right: none;
  }
`

const RowLabelCell = styled.td`
  padding: 14px 16px;
  font-weight: 500;
  color: #333;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  text-align: left;
`

const RadioCell = styled.td`
  padding: 14px 16px;
  text-align: center;
  border-right: 1px solid #e8e8e8;

  &:last-child {
    border-right: none;
  }

  .ant-radio-wrapper {
    margin: 0;
  }
`
