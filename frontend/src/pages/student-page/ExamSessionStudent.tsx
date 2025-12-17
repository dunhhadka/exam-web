import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ExamSessionStudentResponse,
  SessionStudentStatus,
} from "../../types/examSessionStudent";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { formatInstant } from "../../utils/times";
import {
  ActionButtons,
  CardTitle,
  ExamName,
  InfoRow,
  StyledCard,
  TokenBox,
  TokenText,
} from "./StudentExamSession";
import { ExamTimeStatus, useExamCountDown } from "../../hooks/useExamCountDown";
import { formatRemaining } from "../examsession/ExamSessionCard";
import { ExamSessionStatus } from "../../types/examsession";
import { useState } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import { set } from "react-hook-form";
import { useToast } from "../../hooks/useToast";

const { Title, Text, Paragraph } = Typography;

interface Props {
  session: ExamSessionStudentResponse;
  joinExam?: (session: ExamSessionStudentResponse) => void;
  viewResult?: (session: ExamSessionStudentResponse) => void;
}

const ExamSessionStudent = ({ session, joinExam, viewResult }: Props) => {
  const { startTime, endTime } = session;
  const { status: examSessionStatus, remaining } = useExamCountDown(
    startTime,
    endTime
  );

  const [confirmJoinExam, setConfirmJoinExam] = useState(false);

  const toast = useToast();

  const getStatusConfig = (status: ExamTimeStatus) => {
    switch (status) {
      case "NOT_STARTED":
      case "COUNTDOWN":
        return {
          color: "default",
          text: "Chưa bắt đầu",
          icon: <ClockCircleOutlined />,
        };

      case "IN_PROGRESS":
        return {
          color: "processing",
          text: "Đang diễn ra",
          icon: <PlayCircleOutlined />,
        };

      case "ENDED":
        return {
          color: "success",
          text: "Đã hoàn thành",
          icon: <CheckCircleOutlined />,
        };

      default:
        return {
          color: "default",
          text: "Không xác định",
          icon: <ClockCircleOutlined />,
        };
    }
  };

  const statusConfig = getStatusConfig(examSessionStatus);

  // Render action buttons
  const renderActionButtons = (session: ExamSessionStudentResponse) => {
    if (examSessionStatus === "IN_PROGRESS") {
      return (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          block
          size="large"
          onClick={() => setConfirmJoinExam(true)}
        >
          Vào làm bài
        </Button>
      );
    }

    if (examSessionStatus === "ENDED") {
      return (
        <Button
          type="default"
          icon={<FileTextOutlined />}
          block
          onClick={() => viewResult?.(session)}
        >
          Xem kết quả
        </Button>
      );
    }

    if (examSessionStatus === "COUNTDOWN") {
      return (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          block
          size="large"
          onClick={() => setConfirmJoinExam(true)}
          style={{}}
        >
          Vào làm bài {formatRemaining(remaining)}
        </Button>
      );
    }

    if (examSessionStatus === "NOT_STARTED") {
      return (
        <Button type="default" block disabled>
          Chưa đến giờ thi
        </Button>
      );
    }

    return (
      <Button type="default" block disabled>
        Đã hết hạn
      </Button>
    );
  };

  const handleJoinExam = () => {
    const examUrl = `/exam-waiting/${session.examSessionId}?independent=true`;

    setConfirmJoinExam(false);

    const features = [
      "width=1280",
      "height=800",
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
      "resizable=yes",
    ].join(",");

    window.open(examUrl, "_blank", features);
  };

  return (
    <Col xs={24} sm={24} md={12} lg={8} key={session.id}>
      <StyledCard
        title={
          <CardTitle>
            <ExamName level={5}>{session.name}</ExamName>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.text}
            </Tag>
          </CardTitle>
        }
      >
        {/* Description */}
        {session.description && (
          <Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 16, minHeight: 44 }}
          >
            {session.description}
          </Paragraph>
        )}

        {/* Exam Info */}
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <InfoRow>
            <FileTextOutlined />
            <Text>{session.examName}</Text>
          </InfoRow>

          <InfoRow>
            <CalendarOutlined />
            <Text>
              {formatInstant(session.startTime)} -{" "}
              {formatInstant(session.endTime)}
            </Text>
          </InfoRow>

          <InfoRow>
            <ClockCircleOutlined />
            <Text>Thời gian: {session.duration} phút</Text>
          </InfoRow>
        </Space>

        {/* Join Token */}
        <TokenBox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mã tham gia
          </Text>
          <div>
            <TokenText>{session.joinToken}</TokenText>
          </div>
        </TokenBox>

        {/* Action Buttons */}
        <ActionButtons>{renderActionButtons(session)}</ActionButtons>
      </StyledCard>

      {confirmJoinExam &&
        (examSessionStatus === "COUNTDOWN" ||
          examSessionStatus === "IN_PROGRESS") && (
          <ConfirmModal
            content="Bạn có chắc chắn muốn tham gia làm bài thi này?"
            open={confirmJoinExam}
            onOk={handleJoinExam}
            onCancel={() => setConfirmJoinExam(false)}
          />
        )}
    </Col>
  );
};

export default ExamSessionStudent;
