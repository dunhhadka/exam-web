import styled from '@emotion/styled'
import { EssayData } from '../Essay'

interface EssayPreviewProps {
  data: EssayData
}

export const EssayPreview = ({ data }: EssayPreviewProps) => {
  return (
    <Container>
      <InfoSection>
        {data.minWords !== undefined && (
          <InfoItem>
            <Label>Số từ tối thiểu:</Label>
            <Value>{data.minWords}</Value>
          </InfoItem>
        )}
        {data.maxWords !== undefined && (
          <InfoItem>
            <Label>Số từ tối đa:</Label>
            <Value>{data.maxWords}</Value>
          </InfoItem>
        )}
      </InfoSection>

      {data.answerAnswer && (
        <Section>
          <SectionTitle>Câu trả lời mẫu:</SectionTitle>
          <AnswerBox>{data.answerAnswer}</AnswerBox>
        </Section>
      )}

      {data.gradingCriteria && (
        <Section>
          <SectionTitle>Tiêu chí chấm điểm:</SectionTitle>
          <AnswerBox>{data.gradingCriteria}</AnswerBox>
        </Section>
      )}
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

const InfoSection = styled.div`
  display: flex;
  gap: 24px;
`

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #595959;
`

const Value = styled.span`
  font-size: 14px;
  color: #262626;
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
