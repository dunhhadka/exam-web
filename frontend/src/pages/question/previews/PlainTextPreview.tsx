import styled from '@emotion/styled'
import { CheckOutlined } from '@ant-design/icons'
import { PlainTextData } from '../PlainText'

interface PlainTextPreviewProps {
  data: PlainTextData
}

export const PlainTextPreview = ({ data }: PlainTextPreviewProps) => {
  return (
    <Container>
      {data.expectedAnswer && (
        <Section>
          <SectionTitle>Câu trả lời mong đợi:</SectionTitle>
          <AnswerBox>{data.expectedAnswer}</AnswerBox>
        </Section>
      )}

      <OptionsSection>
        {data.caseSensitive && (
          <Option>
            <CheckOutlined style={{ color: '#52c41a' }} />
            <OptionText>Phân biệt chữ hoa/thường</OptionText>
          </Option>
        )}
        {data.exactMatch && (
          <Option>
            <CheckOutlined style={{ color: '#52c41a' }} />
            <OptionText>Khớp chính xác 100%</OptionText>
          </Option>
        )}
      </OptionsSection>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`

const AnswerBox = styled.div`
  padding: 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #262626;
  white-space: pre-wrap;
`

const OptionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const OptionText = styled.span`
  font-size: 14px;
  color: #262626;
`
