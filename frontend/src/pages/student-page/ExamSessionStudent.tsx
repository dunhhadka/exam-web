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
<<<<<<< HEAD
} from "antd";
import {
  ExamSessionStudentResponse,
  SessionStudentStatus,
} from "../../types/examSessionStudent";
=======
} from 'antd'
import {
  ExamSessionStudentResponse,
  SessionStudentStatus,
} from '../../types/examSessionStudent'
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
<<<<<<< HEAD
} from "@ant-design/icons";
import { formatInstant } from "../../utils/times";
=======
} from '@ant-design/icons'
import { formatInstant } from '../../utils/times'
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
import {
  ActionButtons,
  CardTitle,
  ExamName,
  InfoRow,
  StyledCard,
  TokenBox,
  TokenText,
<<<<<<< HEAD
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
=======
} from './StudentExamSession'
import { ExamTimeStatus, useExamCountDown } from '../../hooks/useExamCountDown'
import { formatRemaining } from '../examsession/ExamSessionCard'
import { ExamSessionStatus } from '../../types/examsession'
import { useState } from 'react'
import ConfirmModal from '../../components/common/ConfirmModal'
import { set } from 'react-hook-form'
import { useToast } from '../../hooks/useToast'

const { Title, Text, Paragraph } = Typography

interface Props {
  session: ExamSessionStudentResponse
  joinExam?: (session: ExamSessionStudentResponse) => void
  viewResult?: (session: ExamSessionStudentResponse) => void
}

const ExamSessionStudent = ({ session, joinExam, viewResult }: Props) => {
  const { startTime, endTime } = session
  const { status: examSessionStatus, remaining } = useExamCountDown(
    startTime,
    endTime
  )

  const [confirmJoinExam, setConfirmJoinExam] = useState(false)

  const toast = useToast()

  const getStatusConfig = (status: ExamTimeStatus) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'COUNTDOWN':
        return {
          color: 'default',
          text: 'Chưa bắt đầu',
          icon: <ClockCircleOutlined />,
        }

      case 'IN_PROGRESS':
        return {
          color: 'processing',
          text: 'Đang diễn ra',
          icon: <PlayCircleOutlined />,
        }

      case 'ENDED':
        return {
          color: 'success',
          text: 'Đã hoàn thành',
          icon: <CheckCircleOutlined />,
        }

      default:
        return {
          color: 'default',
          text: 'Không xác định',
          icon: <ClockCircleOutlined />,
        }
    }
  }

  const statusConfig = getStatusConfig(examSessionStatus)

  // Render action buttons
  const renderActionButtons = (session: ExamSessionStudentResponse) => {
    if (examSessionStatus === 'IN_PROGRESS') {
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
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
<<<<<<< HEAD
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
=======
      )
    }

    if (examSessionStatus === 'ENDED') {
      return (
        // <Button
        //   type="default"
        //   icon={<FileTextOutlined />}
        //   block
        //   onClick={() => viewResult?.(session)}
        // >
        //   Xem kết quả
        // </Button>
        <></>
      )
    }

    if (examSessionStatus === 'COUNTDOWN') {
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
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
<<<<<<< HEAD
      );
    }

    if (examSessionStatus === "NOT_STARTED") {
=======
      )
    }

    if (examSessionStatus === 'NOT_STARTED') {
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
      return (
        <Button type="default" block disabled>
          Chưa đến giờ thi
        </Button>
<<<<<<< HEAD
      );
=======
      )
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
    }

    return (
      <Button type="default" block disabled>
        Đã hết hạn
      </Button>
<<<<<<< HEAD
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
=======
    )
  }

  const handleJoinExam = () => {
    const examUrl = `/exam-waiting/${session.examSessionId}?independent=true`

    setConfirmJoinExam(false)

    const features = [
      'width=1280',
      'height=800',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
      'resizable=yes',
    ].join(',')

    window.open(examUrl, '_blank', features)
  }
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67

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
<<<<<<< HEAD
        <Space direction="vertical" style={{ width: "100%" }} size="small">
=======
        <Space direction="vertical" style={{ width: '100%' }} size="small">
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
          <InfoRow>
            <FileTextOutlined />
            <Text>{session.examName}</Text>
          </InfoRow>

          <InfoRow>
            <CalendarOutlined />
            <Text>
<<<<<<< HEAD
              {formatInstant(session.startTime)} -{" "}
=======
              {formatInstant(session.startTime)} -{' '}
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
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
<<<<<<< HEAD
        (examSessionStatus === "COUNTDOWN" ||
          examSessionStatus === "IN_PROGRESS") && (
=======
        (examSessionStatus === 'COUNTDOWN' ||
          examSessionStatus === 'IN_PROGRESS') && (
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
          <ConfirmModal
            content="Bạn có chắc chắn muốn tham gia làm bài thi này?"
            open={confirmJoinExam}
            onOk={handleJoinExam}
            onCancel={() => setConfirmJoinExam(false)}
          />
        )}
    </Col>
<<<<<<< HEAD
  );
};

export default ExamSessionStudent;
=======
  )
}

export default ExamSessionStudent
>>>>>>> da2c7106712fc2f3079763a5dc47b43a07eabe67
