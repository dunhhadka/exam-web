import { ExclamationCircleOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Button, Modal } from "antd";

interface Props {
  open: boolean;
  title?: string;
  content?: string | React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
  width?: number;
  icon?: React.ReactNode;
}

const ConfirmModal = ({
  open,
  title = "Xác nhận",
  content = "Bạn có chắc chắn muốn thực hiện hành động này?",
  okText = "Xác nhận",
  cancelText = "Hủy",
  onOk,
  onCancel,
  loading = false,
  danger = false,
  width = 416,
  icon,
}: Props) => {
  return (
    <StyledModal
      open={open}
      title={null}
      footer={null}
      onCancel={onCancel}
      width={width}
      centered
      closeIcon={null}
    >
      <ModalContent>
        <IconWrapper $danger={danger}>
          {icon || <ExclamationCircleOutlined />}
        </IconWrapper>

        <TextContent>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{content}</ModalDescription>
        </TextContent>
      </ModalContent>

      <ModalFooter>
        <Button onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button type="primary" danger={danger} onClick={onOk} loading={loading}>
          {okText}
        </Button>
      </ModalFooter>
    </StyledModal>
  );
};

export default ConfirmModal;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 24px;
  }
`;

const ModalContent = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const IconWrapper = styled.div<{ $danger?: boolean }>`
  font-size: 22px;
  color: ${(props) => (props.$danger ? "#ff4d4f" : "#faad14")};
  line-height: 1;
  flex-shrink: 0;
`;

const TextContent = styled.div`
  flex: 1;
`;

const ModalTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
  margin-bottom: 8px;
`;

const ModalDescription = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
