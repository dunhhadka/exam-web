import { Controller, useForm } from "react-hook-form";
import { ExamSession, ExamSessionRequest } from "../../types/examsession";
import { Input } from "../../components/common/input";
import { DatePicker, Radio, Space, Button, Row, Col, Divider, Checkbox } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  PublishStatusLabel,
  RequiredStar,
} from "../question/QuestionCreatePage";
import { ErrorText } from "../exams/ExamCreatePage";
import styled from "@emotion/styled";

interface Props {
  initData?: ExamSession;
  onSubmit: (data: ExamSessionRequest) => void;
  loading?: boolean;
}

type ExamSessionFormData = Partial<ExamSessionRequest> & {
  examName?: string;
  startTime?: Dayjs | string | null;
  endTime?: Dayjs | string | null;
};

const ExamSessionCreate = ({ initData, onSubmit, loading = false }: Props) => {
  const {
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<ExamSessionFormData>({
    defaultValues: {
      examId: initData?.exam?.id,
      examName: initData?.exam?.name || "",
      name: initData?.name || "",
      startTime: initData?.startTime,
      endTime: initData?.endTime,
      durationMinutes: initData?.durationMinutes || 60,
      lateJoinMinnutes: initData?.lateJoinMinutes || 15,
      shuffleAnswers: initData?.shuffleAnswers ?? false,
      shuffleQuestion: initData?.shuffleQuestion ?? false,
      attemptLimit: initData?.attemptLimit || 1,
      isPublic: initData?.publicFlag ?? true,
      settings: initData?.settings,
    },
  });

  const handleFormSubmit = (data: ExamSessionFormData) => {
    const requestData: ExamSessionRequest = {
      examId: data.examId!,
      name: data.name!,
      startTime: data.startTime ? dayjs(data.startTime).toISOString() : "",
      endTime: data.endTime ? dayjs(data.endTime).toISOString() : "",
      durationMinutes: data.durationMinutes ?? 60,
      lateJoinMinnutes: data.lateJoinMinnutes ?? 15,
      shuffleAnswers: data.shuffleAnswers ?? false,
      shuffleQuestion: data.shuffleQuestion ?? false,
      attemptLimit: data.attemptLimit ?? 1,
      isPublic: data.isPublic ?? true,
      settings: data.settings || undefined,
    };

    onSubmit(requestData);
  };

  const startTimeValue = watch("startTime");

  return (
    <FormContainer>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Thông tin cơ bản */}
        <FormSection>
          <SectionTitle>Thông tin cơ bản</SectionTitle>

          <FormRow>
            <Controller
              name="examName"
              control={control}
              rules={{ required: "Vui lòng chọn bài kiểm tra" }}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    title="Chọn bài kiểm tra"
                    placeholder="Chọn bài kiểm tra"
                    require
                    error={!!errors.examName}
                    vertical
                  />
                  {errors.examName && (
                    <ErrorMessage>{errors.examName.message}</ErrorMessage>
                  )}
                </>
              )}
            />
          </FormRow>

          <FormRow>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Vui lòng nhập tên đợt thi" }}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    title="Tên đợt thi"
                    placeholder="Ví dụ: Thi giữa kỳ - Lần 1"
                    require
                    error={!!errors.name}
                    vertical
                  />
                  {errors.name && (
                    <ErrorMessage>{errors.name.message}</ErrorMessage>
                  )}
                </>
              )}
            />
          </FormRow>
        </FormSection>

        <StyledDivider />

        {/* Thời gian */}
        <FormSection>
          <SectionTitle>Thời gian thi</SectionTitle>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormRow>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ required: "Vui lòng chọn thời gian bắt đầu" }}
                  render={({ field }) => (
                    <>
                      <Label>
                        Thời gian bắt đầu <RequiredStar>*</RequiredStar>
                      </Label>
                      <StyledDatePicker
                        {...field}
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Chọn ngày và giờ bắt đầu"
                        format="DD/MM/YYYY HH:mm"
                        showTime={{ format: "HH:mm" }}
                        status={errors.startTime ? "error" : ""}
                      />
                      {errors.startTime && (
                        <ErrorMessage>{errors.startTime.message}</ErrorMessage>
                      )}
                    </>
                  )}
                />
              </FormRow>
            </Col>

            <Col xs={24} md={12}>
              <FormRow>
                <Controller
                  name="endTime"
                  control={control}
                  rules={{
                    required: "Vui lòng chọn thời gian kết thúc",
                    validate: (value) => {
                      if (
                        startTimeValue &&
                        value &&
                        dayjs(value).isBefore(dayjs(startTimeValue))
                      ) {
                        return "Thời gian kết thúc phải sau thời gian bắt đầu";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <>
                      <Label>
                        Thời gian kết thúc <RequiredStar>*</RequiredStar>
                      </Label>
                      <StyledDatePicker
                        {...field}
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(date) => field.onChange(date)}
                        placeholder="Chọn ngày và giờ kết thúc"
                        format="DD/MM/YYYY HH:mm"
                        showTime={{ format: "HH:mm" }}
                        status={errors.endTime ? "error" : ""}
                        disabledDate={(current) => {
                          return startTimeValue
                            ? current.isBefore(dayjs(startTimeValue), "day")
                            : false;
                        }}
                      />
                      {errors.endTime && (
                        <ErrorMessage>{errors.endTime.message}</ErrorMessage>
                      )}
                    </>
                  )}
                />
              </FormRow>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <FormRow>
                <Controller
                  name="durationMinutes"
                  control={control}
                  rules={{
                    required: "Vui lòng nhập thời gian làm bài",
                    min: { value: 1, message: "Thời gian phải lớn hơn 0" },
                  }}
                  render={({ field }) => (
                    <>
                      <Input
                        {...field}
                        title="Thời gian làm bài (phút)"
                        numberic
                        placeholder="60"
                        require
                        error={!!errors.durationMinutes}
                        vertical
                      />
                      {errors.durationMinutes && (
                        <ErrorMessage>
                          {errors.durationMinutes.message}
                        </ErrorMessage>
                      )}
                    </>
                  )}
                />
              </FormRow>
            </Col>

            <Col xs={24} md={12}>
              <FormRow>
                <Controller
                  name="lateJoinMinnutes"
                  control={control}
                  rules={{
                    required: "Vui lòng nhập thời gian vào trễ",
                    min: { value: 0, message: "Thời gian không được âm" },
                  }}
                  render={({ field }) => (
                    <>
                      <Input
                        {...field}
                        title="Thời gian được vào trễ (phút)"
                        numberic
                        placeholder="15"
                        require
                        error={!!errors.lateJoinMinnutes}
                        vertical
                      />
                      {errors.lateJoinMinnutes && (
                        <ErrorMessage>
                          {errors.lateJoinMinnutes.message}
                        </ErrorMessage>
                      )}
                    </>
                  )}
                />
              </FormRow>
            </Col>
          </Row>

          <FormRow>
            <Controller
              name="attemptLimit"
              control={control}
              rules={{
                required: "Vui lòng nhập số lần làm bài",
                min: { value: 1, message: "Số lần phải lớn hơn 0" },
              }}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    title="Số lần làm bài tối đa"
                    numberic
                    placeholder="1"
                    require
                    error={!!errors.attemptLimit}
                    vertical
                  />
                  {errors.attemptLimit && (
                    <ErrorMessage>{errors.attemptLimit.message}</ErrorMessage>
                  )}
                </>
              )}
            />
          </FormRow>
        </FormSection>

        <StyledDivider />

        {/* Cài đặt */}
        <FormSection>
          <SectionTitle>Cài đặt</SectionTitle>

          <FormRow>
            <PublishStatusLabel>
              Trạng thái <RequiredStar>*</RequiredStar>
            </PublishStatusLabel>
            <Controller
              control={control}
              name="isPublic"
              render={({ field }) => (
                <>
                  <Radio.Group
                    value={field.value ? "public" : "private"}
                    onChange={(e) => field.onChange(e.target.value === "public")}
                  >
                    <Space direction="horizontal">
                      <Radio value="private">Chỉ mình tôi</Radio>
                      <Radio value="public">Công khai</Radio>
                    </Space>
                  </Radio.Group>
                  {errors.isPublic && (
                    <ErrorMessage>{errors.isPublic.message}</ErrorMessage>
                  )}
                </>
              )}
            />
          </FormRow>

          <CheckboxGroup>
            <Controller
              name="shuffleQuestion"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                >
                  Xáo trộn câu hỏi
                </Checkbox>
              )}
            />

            <Controller
              name="shuffleAnswers"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                >
                  Xáo trộn đáp án
                </Checkbox>
              )}
            />
          </CheckboxGroup>
        </FormSection>

        <ButtonGroup>
          <Button htmlType="button" onClick={() => window.history.back()}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initData ? "Cập nhật" : "Tạo mới"}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
};

export default ExamSessionCreate;

// Styled Components
const FormContainer = styled.div`
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1a1a1a;
`;

const FormRow = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
`;

const StyledDatePicker = styled(DatePicker)`
  width: 100%;
  height: 40px;
`;

const StyledDivider = styled(Divider)`
  margin: 32px 0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ant-checkbox-wrapper {
    font-size: 14px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
`;

const ErrorMessage = styled.span`
  display: block;
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
`;