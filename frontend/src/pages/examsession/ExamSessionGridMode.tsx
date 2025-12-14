import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Typography
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFilterExamSessionQuery } from "../../services/api/examsession";
import { ExamFilterRequest } from "../../types/examsession";
import { formatDay } from "../../utils/times";
import {
  CardListContainer,
  FetchingOverlay,
  FilterItem,
  FilterLabel,
  FilterRow,
  FilterSection,
  LoadingContainer,
  PageContainer,
  PageHeader,
} from "../student-page/StudentExamSession";
import ExamSessionCard from "./ExamSessionCard";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const ExamSessionGridMode = () => {
  const [searchName, setSearchName] = useState("");
  const [dateRange, setDateRange] = useState<any>(null);

  // TODO: chưa làm
  const [filter, setFilter] = useState<ExamFilterRequest>({
    pageIndex: 1,
    pageSize: 100,
  });

  const {
    data: examSessionData,
    isLoading,
    isFetching,
  } = useFilterExamSessionQuery(filter, {
    refetchOnMountOrArgChange: true,
  });

  const { data, count } = examSessionData || {};

  const handleSearch = () => {
    setFilter({
      ...filter,
      keyword: searchName || undefined,
      startDate: dateRange ? formatDay(dateRange[0]) : undefined,
      endDate: dateRange ? formatDay(dateRange[1]) : undefined,
    });
  };

  const handleResetFilter = () => {
    setSearchName("");
    setDateRange(null);
    setFilter({
      pageIndex: 1,
      pageSize: 100,
    });
  };

  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader>
        <Title level={3} style={{ margin: 0 }}>
          Danh sách phiên thi
        </Title>
        <Text type="secondary">
          Danh sách các bài kiểm tra được hiển thị ở chế độ lưới
        </Text>
      </PageHeader>
      <FilterSection>
        <FilterRow>
          <FilterItem>
            <FilterLabel>Tìm kiếm theo tên</FilterLabel>
            <Input
              placeholder="Tìm kiếm bài kiểm tra..."
              prefix={<SearchOutlined />}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              allowClear
              size="large"
              disabled={isLoading || isFetching}
            />
          </FilterItem>
          <FilterItem style={{ flex: 1.5 }}>
            <FilterLabel>Thời gian thi</FilterLabel>
            <RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              size="large"
              style={{ width: "100%" }}
              disabled={isLoading || isFetching}
            />
          </FilterItem>
          <FilterItem style={{ flex: "0 0 auto", minWidth: "auto" }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={handleSearch}
                loading={isLoading || isFetching}
              >
                Tìm kiếm
              </Button>
              <Button
                onClick={handleResetFilter}
                size="large"
                disabled={isLoading || isFetching}
              >
                Đặt lại
              </Button>
            </Space>
          </FilterItem>
        </FilterRow>
      </FilterSection>
      {isLoading ? (
        <LoadingContainer>
          <Spin size="large" />
          <Text style={{ marginTop: 16 }}>Đang tải dữ liệu...</Text>
        </LoadingContainer>
      ) : (data ?? []).length === 0 ? (
        <Empty
          description="Chưa có bài kiểm tra nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <CardListContainer $isFetching={isFetching}>
          <Row gutter={[16, 16]}>
            {(data ?? []).map((item) => (
              <ExamSessionCard
                examSession={item}
                onMonitor={(item) => {
                  navigate(`/protor-tracking/${item?.code}/${"proctor"}`);
                }}
              />
            ))}
          </Row>
          {isFetching && <FetchingOverlay />}
        </CardListContainer>
      )}
    </PageContainer>
  );
};

export default ExamSessionGridMode;
