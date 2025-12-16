import { Col, Space, Tag, Typography, Button } from "antd";
import { ExamSession } from "../../types/examsession";
import {
  ActionButtons,
  CardTitle,
  ExamName,
  InfoRow,
  StyledCard,
  TokenBox,
  TokenText,
} from "../student-page/StudentExamSession";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { formatInstant } from "../../utils/times";
import styled from "@emotion/styled";
import { useExamCountDown } from "../../hooks/useExamCountDown";

const { Text } = Typography;

export const formatRemaining = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

interface Props {
  examSession: ExamSession;
  onEdit?: (examSession: ExamSession) => void;
  onMonitor?: (examSession: ExamSession) => void;
  onTrack?: (examSession: ExamSession) => void;
}

/* ===================== Styled ===================== */

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const CountdownText = styled(Text)`
  font-size: 14px;
  font-weight: bold;
  color: #fa8c16;
`;

/* ===================== Component ===================== */

const ExamSessionCard = ({
  examSession,
  onEdit,
  onMonitor,
  onTrack,
}: Props) => {
  const { status: sessionStatus, remaining } = useExamCountDown(
    examSession.startTime,
    examSession.endTime
  );

  const handleEdit = () => onEdit?.(examSession);
  const handleMonitor = () => onMonitor?.(examSession);
  const handleTrack = () => onTrack?.(examSession);

  console.log(sessionStatus, remaining);

  /* --------------------- Status --------------------- */
  const renderStatus = () => {
    switch (sessionStatus) {
      case "NOT_STARTED":
        return (
          <Tag color="default" icon={<ClockCircleOutlined />}>
            Chưa bắt đầu
          </Tag>
        );

      case "COUNTDOWN":
        return (
          <StatusContainer>
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              Sắp bắt đầu
            </Tag>
            <CountdownText>{formatRemaining(remaining)}</CountdownText>
          </StatusContainer>
        );

      case "IN_PROGRESS":
        return (
          <Tag color="green" icon={<PlayCircleOutlined />}>
            Đang diễn ra
          </Tag>
        );

      case "ENDED":
        return (
          <Tag color="red" icon={<StopOutlined />}>
            Đã kết thúc
          </Tag>
        );

      default:
        return null;
    }
  };

  const genStatusName = () => {
    switch (sessionStatus) {
      case "NOT_STARTED":
        return "Chưa bắt đầu";
      case "COUNTDOWN":
        return "Sắp bắt đầu";
      case "IN_PROGRESS":
        return "Đang diễn ra";
      case "ENDED":
        return "Đã kết thúc";
      default:
        return "";
    }
  };

  /* --------------------- Actions --------------------- */
  const renderActionButtons = () => {
    switch (sessionStatus) {
      case "NOT_STARTED":
        return (
          <ActionButtons>
            <Button type="default" onClick={handleEdit} block disabled>
              Chưa bắt đầu
            </Button>
          </ActionButtons>
        );

      case "COUNTDOWN":
        return (
          <ActionButtons>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleTrack}
              block
              style={{ background: "#fa8c16", borderColor: "#fa8c16" }}
            >
              Chuẩn bị thi
            </Button>
          </ActionButtons>
        );

      case "IN_PROGRESS":
        return (
          <ActionButtons>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleMonitor}
              danger
              block
            >
              Giám sát
            </Button>
          </ActionButtons>
        );

      case "ENDED":
        return (
          <ActionButtons>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleTrack}
              block
            >
              Xem kết quả
            </Button>
          </ActionButtons>
        );

      default:
        return null;
    }
  };

  /* ===================== Render ===================== */

  return (
    <Col xs={24} sm={24} md={12} lg={8}>
      <StyledCard
        title={
          <CardTitle>
            <ExamName level={5}>{examSession.name}</ExamName>
          </CardTitle>
        }
        extra={renderStatus()}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <InfoRow>
            <FileTextOutlined />
            <Text>{examSession?.exam?.name || "Chưa có đề thi"}</Text>
          </InfoRow>

          <InfoRow>
            <CalendarOutlined />
            <Text>
              {formatInstant(examSession.startTime)} - {"\n"}
              {formatInstant(examSession.endTime)}
            </Text>
          </InfoRow>

          <InfoRow>
            <ClockCircleOutlined />
            <Text>Thời gian: {examSession.durationMinutes} phút</Text>
          </InfoRow>

          <InfoRow>
            <Text type="secondary">
              Số thí sinh: {examSession?.assignedStudents?.length ?? 0}
            </Text>
          </InfoRow>

          <InfoRow>
            <Text type="secondary">Trạng thái: {genStatusName()}</Text>
          </InfoRow>
        </Space>

        <TokenBox>
          <TokenText copyable>{examSession.code}</TokenText>
        </TokenBox>

        {renderActionButtons()}
      </StyledCard>
    </Col>
  );
};

export default ExamSessionCard;
