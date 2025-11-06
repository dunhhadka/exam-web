package com.datn.exam.support.enums.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BadRequestError implements ResponseError {
    LOGIN_FAILED(400001, "Sai email hoặc mật khẩu. Vui lòng đăng nhập lại."),
    USERNAME_EXISTED(400002, "Tên đăng nhập đã tồn tại"),
    EMAIL_EXISTED(400003, "Email đã tồn tại"),
    USER_WAS_INACTIVATED(400004, "Người dùng đã bị vô hiệu hóa"),
    USER_WAS_ACTIVATED(400005, "Người dùng đã được kích hoạt"),
    PASSWORD_MISS_MATCH(400006, "Mật khẩu và mật khẩu xác nhận không khớp"),
    INVALID_IDS(400007, "Danh sách ID không được rỗng"),
    QUESTION_TEXT_REQUIRED(400008, "Nội dung câu hỏi là bắt buộc"),
    QUESTION_POINT_REQUIRED(400009, "Điểm số là bắt buộc"),
    QUESTION_TYPE_REQUIRED(400010, "Loại câu hỏi là bắt buộc"),
    QUESTION_LEVEL_REQUIRED(400011, "Mức độ là bắt buộc"),
    QUESTION_IS_POSITIVE(400012, "Điểm phải là số dương"),
    QUESTION_MAX_SCORE(400013, "Điểm không được vượt quá 999.99"),
    QUESTION_MAX_WORD(400014, "Số từ tối đa phải lớn hơn hoặc bằng 1"),
    QUESTION_MIN_WORD(400015, "Số từ tối thiểu phải lớn hơn hoặc bằng 1"),
    QUESTION_NOT_VALID(400016, "Câu hỏi không hợp lệ để xuất bản"),
    QUESTION_TYPE_REQUIRE(400020, "Loại câu hỏi là bắt buộc"),
    QUESTION_ROW_LABEL_REQUIRED(400021, "Nhãn của hàng là bắt buộc"),
    QUESTION_ROW_CORRECT_INDEX_REQUIRED(400022, "Chỉ mục đáp án đúng của hàng là bắt buộc"),
    QUESTION_ROW_CORRECT_INDEX_INVALID(400023, "Chỉ mục đáp án đúng của hàng không hợp lệ: %s"),
    QUESTION_HEADERS_REQUIRED(400025, "Các tiêu đề cột là bắt buộc"),
    QUESTION_HEADERS_SIZE_INVALID(400026, "Số lượng tiêu đề cột phải từ 2 đến 20"),
    QUESTION_ROWS_REQUIRED(400027, "Các hàng là bắt buộc"),
    QUESTION_ROWS_SIZE_INVALID(400028, "Số lượng hàng phải từ 1 đến 20"),
    QUESTION_TABLE_HEADER_MIN_2(400029, "Câu hỏi dạng bảng phải có ít nhất 2 tiêu đề cột"),
    QUESTION_TABLE_HEADER_REQUIRED(400030, "Tiêu đề cột của bảng tại vị trí %s là bắt buộc"),
    QUESTION_TABLE_ROW_MIN_1(400031, "Câu hỏi dạng bảng phải có ít nhất 1 hàng"),
    QUESTION_ROW_EMPTY(400032, "Hàng câu hỏi tại vị trí %s không được rỗng"),
    QUESTION_TRUE_FALSE_REQUIRE_2_ANSWERS(400033, "Câu hỏi Đúng/Sai phải có chính xác 2 đáp án"),
    ANSWER_MIN_TWO_REQUIRE(400034, "Câu hỏi lựa chọn phải có ít nhất 2 đáp án"),
    ANSWER_ORDER_INDEX_INVALID(400035, "Thứ tự sắp xếp của đáp án phải là số không âm"),
    ANSWER_TEXT_REQUIRED(400036, "Nội dung đáp án là bắt buộc"),
    ANSWER_REQUIRE_EXACTLY_ONE_CORRECT(400037, "Câu hỏi phải có chính xác một đáp án đúng"),
    ANSWER_REQUIRE_AT_LEAST_ONE_CORRECT(400038, "Câu hỏi phải có ít nhất một đáp án đúng"),
    ANSWER_ORDER_INDEX_REQUIRED(400017,"Thứ tự sắp xếp không được rỗng"),
    ANSWER_MIN_ORDER_INDEX(400018, "Thứ tự sắp xếp của đáp án phải là số không âm"),
    ANSWER_DUPLICATE_ORDER_INDEX(400019, "Tìm thấy thứ tự sắp xếp bị trùng: %s"),
    ANSWER_MIN_ONE_REQUIRE(400021, "Phải có ít nhất một đáp án"),
    ANSWER_REQUIRE_CORRECT(400022, "Yêu cầu ít nhất một đáp án đúng"),
    EXAM_NAME_REQUIRED(400050, "Tên bài thi là bắt buộc"),
    EXAM_LEVEL_REQUIRED(400051, "Mức độ bài thi là bắt buộc"),
    EXAM_QUESTIONS_REQUIRED(400052, "Danh sách câu hỏi không được rỗng"),
    EXAM_QUESTION_ID_REQUIRED(400053, "ID câu hỏi là bắt buộc"),
    EXAM_QUESTION_POINT_REQUIRED(400054, "Điểm của câu hỏi là bắt buộc"),
    EXAM_MIN_SCORE(400055, "Điểm bài thi phải là số dương"),
    TAG_NOT_FOUND(400060, "Không tìm thấy câu hỏi với các ID: %s"),
    EXAM_SESSION_TIME_WINDOW_INVALID(400061, "Khung thời gian phiên thi không hợp lệ (bắt đầu: %s, kết thúc: %s)"),
    ID_UPLOAD_REQUIRES_UPLOAD_MODE(400062, "Tải lên ID yêu cầu chế độ định danh là TẢI LÊN"),
    WEBCAM_MODE_REQUIRES_MONITORING(400063, "Chế độ định danh qua webcam yêu cầu bật giám sát"),
    NONE_MODE_CANNOT_ENABLE_MONITORING(400064, "Chế độ định danh KHÔNG có không thể bật giám sát"),
    EXAM_SESSION_CLOSED(400070, "Phiên thi này không mở để tham gia."),
    EXAM_SESSION_STARTED(400071, "Phiên thi chưa bắt đầu. Vui lòng thử lại sau."),
    EXAM_SESSION_ENDED(400072, "Phiên thi đã kết thúc. Bạn không thể tham gia nữa."),
    EXAM_SESSION_ID_REQUIRED(400073, "ID phiên thi là bắt buộc"),
    ATTEMPT_LIMIT_REACHED(400074, "Đã đạt đến giới hạn số lần làm bài cho phiên thi này"),
    EXAM_HAS_NO_QUESTIONS(400074, "Bài thi không có câu hỏi nào"),
    SUBMIT_AFTER_DEADLINE(400080, "Đã hết thời gian nộp bài"),
    ATTEMPT_ALREADY_SUBMITTED(400081, "Bài làm này đã được nộp"),
    ATTEMPT_NOT_IN_PROGRESS(400082, "Bài làm không ở trạng thái đang thực hiện"),
    ANSWERS_REQUIRED(400083, "Bạn phải cung cấp ít nhất một câu trả lời để nộp bài"),
    ATTEMPT_QUESTION_MISSING(400084, "Câu trả lời được nộp tham chiếu đến một câu hỏi không tồn tại"),
    INVALID_ANSWER_TYPE(400085, "Loại câu trả lời được cung cấp không hợp lệ"),
    ANSWER_VALIDATION_FAILED(400086, "Một hoặc nhiều câu trả lời không vượt qua kiểm tra hợp lệ"),
    AUTO_GRADING_FAILED(400087, "Chấm điểm tự động thất bại cho một hoặc nhiều câu hỏi"),
    EXAM_SESSION_NOT_FOUND(400088, "Không tìm thấy phiên thi"),
    ATTEMPT_USER_MISMATCH(400089, "Bạn không có quyền nộp bài làm này"),
    ATTEMPT_EXPIRED(400090, "Thời gian làm bài của bạn đã hết. Bài thi của bạn đã được nộp tự động."),
    EMAIL_SEND_FAILED(400091, "Gửi email thất bại. Vui lòng thử lại sau."),
    OTP_STILL_VALID(400092, "Mã OTP vẫn còn hiệu lực. Vui lòng đợi %s giây trước khi yêu cầu mã mới."),
    OTP_INVALID(400093, "Mã OTP không hợp lệ. Vui lòng kiểm tra và thử lại."),
    OTP_EXPIRED(400094, "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."),
    EMAIL_NOT_IN_WHITELIST(400095, "Email của bạn không có trong danh sách được phép. Vui lòng liên hệ quản trị viên."),
    SESSION_TOKEN_REQUIRED(400097, "Yêu cầu mã phiên (session token)"),
    SESSION_TOKEN_MISMATCH(400098, "Mã phiên (session token) không khớp với phiên làm việc"),
    INVALID_SESSION_TOKEN(400099, "Mã phiên (session token) không hợp lệ hoặc đã hết hạn"),
    INVALID_OTP(400101, "Mã OTP không hợp lệ hoặc đã hết hạn"),
    OTP_RESEND_TOO_EARLY(400102, "Gửi lại OTP quá sớm. Vui lòng đợi %s giây trước khi thử lại."),
    TEACHER_CANNOT_JOIN(400103, "Email của giáo viên không được phép tham gia phiên thi này.");
    ;

    private final int code;
    private final String message;

    @Override
    public String getName() {
        return name();
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public int getStatus() {
        return 400;
    }

    @Override
    public int getCode() {
        return code;
    }
}