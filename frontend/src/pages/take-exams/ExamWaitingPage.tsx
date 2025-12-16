import { Button, Card, Col, Empty, Row, Space, Spin, Typography } from "antd";
import styled from "@emotion/styled";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useGetExamSessionByIdQuery } from "../../services/api/examsession";
import { useExamCountDown } from "../../hooks/useExamCountDown";
import { formatRemaining } from "../examsession/ExamSessionCard";
import { formatInstant } from "../../utils/times";

const { Text } = Typography;

const ExamWaitingPage = () => {
  const { examSessionId } = useParams();
  const navigate = useNavigate();
  const { data: examSession, isLoading } = useGetExamSessionByIdQuery(
    examSessionId as unknown as number,
    {
      skip: !examSessionId,
    }
  );

  const { status: examSessionStatus, remaining: remainingToEnd } = useExamCountDown(
    examSession?.startTime || "",
    examSession?.endTime || ""
  );

  // Parse custom date format: DD-MM-YYYY HH:mm
  const parseCustomDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart ? timePart.split(":").map(Number) : [0, 0];
    
    return new Date(year, month - 1, day, hours, minutes, 0);
  };

  // Tính thời gian còn lại từ bây giờ đến endTime
  const getTimeRemainingToEnd = () => {
    if (!examSession?.endTime) return "0h 0m";
    
    const now = new Date();
    const endTime = parseCustomDate(examSession.endTime);
    const diffMs = endTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "0h 0m";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleStartExam = () => {
    if (examSession?.id) {
      navigate(`/exam/${examSession.id}/take`);
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (!examSession) {
    return (
      <Container>
        <Empty description="Không tìm thấy bài thi" />
      </Container>
    );
  }

  if (examSessionStatus === "ENDED" || examSessionStatus === "NOT_STARTED") {
    return (
      <Container>
        <Empty description="Bài thi chưa bắt đầu hoặc đã kết thúc" />
      </Container>
    );
  }

  const getExamSessionAction = () => {
    if (examSessionStatus === "IN_PROGRESS") {
      const timeRemaining = getTimeRemainingToEnd();
      return `Bắt đầu làm bài (Còn lại ${timeRemaining})`;
    }

    if (examSessionStatus === "COUNTDOWN") {
      return `Bài thi sắp bắt đầu (${formatRemaining(remainingToEnd)})`;
    }

    return "Bắt đầu làm bài";
  };

  return (
    <Container>
      {/* Exam Info Card */}
      <InfoCard>
        <Row gutter={[40, 40]} align="middle">
          <Col xs={24} md={14}>
            <ExamContent>
              <ExamTitle>{examSession.name}</ExamTitle>
              
              <InfoGrid>
                <InfoCol>
                  <InfoLabel>
                    <FileTextOutlined /> Tên bài thi
                  </InfoLabel>
                  <InfoValue>{examSession.name}</InfoValue>
                </InfoCol>

                <InfoCol>
                  <InfoLabel>
                    <ClockCircleOutlined /> Thời gian làm bài
                  </InfoLabel>
                  <InfoValue>{examSession.durationMinutes} phút</InfoValue>
                </InfoCol>

                <InfoCol>
                  <InfoLabel>
                    <CalendarOutlined /> Bắt đầu
                  </InfoLabel>
                  <InfoValue>{formatInstant(examSession.startTime)}</InfoValue>
                </InfoCol>

                <InfoCol>
                  <InfoLabel>
                    <CalendarOutlined /> Kết thúc
                  </InfoLabel>
                  <InfoValue>{formatInstant(examSession.endTime)}</InfoValue>
                </InfoCol>
              </InfoGrid>
            </ExamContent>
          </Col>

          <Col xs={24} md={10}>
            <ActionArea>
              <Button
                type="primary"
                size="large"
                block
                icon={<PlayCircleOutlined />}
                onClick={handleStartExam}
                disabled={examSessionStatus !== "IN_PROGRESS"}
                style={{ height: 50, fontSize: 16, fontWeight: 600 }}
              >
                {getExamSessionAction()}
              </Button>
            </ActionArea>
          </Col>
        </Row>
      </InfoCard>

      {/* Rules Section */}
      <RulesSection>
        <RulesTitle>Quy định trước khi thi</RulesTitle>
        <RulesList>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Kiểm tra kết nối internet ổn định trước khi bắt đầu</Text>
          </RuleItem>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Không được rời khỏi màn hình trong suốt quá trình thi</Text>
          </RuleItem>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Không được sử dụng tài liệu tham khảo (nếu quy định)</Text>
          </RuleItem>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Nếu hết thời gian, hệ thống sẽ tự động nộp bài</Text>
          </RuleItem>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Làm bài trung thực và tuân thủ quy định của trường</Text>
          </RuleItem>
          <RuleItem>
            <RuleBullet>•</RuleBullet>
            <Text>Nếu mất kết nối, hãy kết nối lại sớm nhất có thể</Text>
          </RuleItem>
        </RulesList>
      </RulesSection>
    </Container>
  );
};

export default ExamWaitingPage;

// Styled Components
const Container = styled.div`
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #fff;
`;

const InfoCard = styled(Card)`
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: none;
  margin-bottom: 32px;
  padding: 32px;

  .ant-card-body {
    padding: 0;
  }
`;

const ExamContent = styled.div``;

const ExamTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #000;
  margin: 0 0 32px 0;
  line-height: 1.3;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
`;

const InfoCol = styled.div``;

const InfoLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;

  .anticon {
    font-size: 14px;
    color: #1890ff;
  }
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
`;

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const RulesSection = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 28px;
`;

const RulesTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0 0 24px 0;
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RuleItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  line-height: 1.6;

  .ant-typography {
    margin: 0;
    color: #666;
  }
`;

const RuleBullet = styled.span`
  color: #1890ff;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
`;
