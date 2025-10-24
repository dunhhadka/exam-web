import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { createActionColumns } from "../../components/search/createActionColumn";
import { createColumn } from "../../components/search/createColumn";
import { CustomTable } from "../../components/search/CustomTable";
import { Exam } from "../../types/exam";
import { ExamSession } from "../../types/examsession";
import { formatInstant } from "../../utils/times";
import { useState } from "react";
import ExamSessionCreate from "./ExamSessionCreate";
import { Modal } from "antd";

const ExamSessionListPage = () => {
  const columns = [
    createColumn<ExamSession>("Tên bài kiểm tra", "name"),
    createColumn<ExamSession>("Tên đề", "exam", {
      render: (value: Exam) => <span>{value.name}</span>,
    }),
    createColumn<ExamSession>("Trạng thái", "publicFlag", {
      render: (value?: boolean) => (
        <span>{value ? "Công khai" : "Chỉ mình tôi"}</span>
      ),
    }),
    createColumn<ExamSession>("Ngày bắt đầu", "startTime", {
      render: (value: string) => <span>{formatInstant(value)}</span>,
    }),
    createColumn<ExamSession>("Ngày kết thúc", "endTime", {
      render: (value: string) => <span>{formatInstant(value)}</span>,
    }),
    createColumn<ExamSession>("Điểm tối đa", "exam", {
      render: (value: Exam) => <span>{value.score}</span>,
    }),
    createColumn<ExamSession>("Thời gian làm bài", "durationMinutes"),
    createActionColumns<ExamSession>([
      {
        label: "Xoá",
        icon: <DeleteOutlined />,
        onClick: (record) => console.log("delete", record),
        danger: true,
      },
    ]),
  ];

  const [openCreateAssignmentModal, setOpenCreateAssignmentModal] =
    useState(false);

  const handleCreateAssigment = () => {
    setOpenCreateAssignmentModal(true);
  };

  const closeCreateAssignmentModal = () => {
    setOpenCreateAssignmentModal(false);
  };

  return (
    <div>
      <CustomTable<ExamSession>
        columns={columns}
        tableTitle="Bài kiểm tra"
        filterActive
        actions={[
          {
            title: "Giao bài",
            icon: <EditOutlined />,
            color: "primary",
            onClick: handleCreateAssigment,
          },
        ]}
      />
      {openCreateAssignmentModal && (
        <Modal
          open={openCreateAssignmentModal}
          title={"Tạo bài kiểm tra mới"}
          onCancel={closeCreateAssignmentModal}
          width={"60%"}
          footer={null}
        >
          <ExamSessionCreate
            onSubmit={(data) => {
              console.log(data);
            }}
            onClose={closeCreateAssignmentModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ExamSessionListPage;
