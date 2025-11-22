# Dashboard Thống Kê - Hệ Thống Thi Trắc Nghiệm

## Tổng Quan

Dashboard cung cấp cái nhìn tổng quan về hoạt động thi cử của giáo viên, bao gồm:

### 4 Thống Kê Chính (Stats Cards)

1. **Tổng số bài thi**: Số lượng bài thi mà giáo viên đã tạo
2. **Tổng học viên**: Số lượng học viên unique đã tham gia thi
3. **Điểm trung bình**: Điểm TB của tất cả các bài thi đã nộp
4. **Thời gian TB**: Thời gian trung bình học viên làm bài (tính bằng phút)

### 5 Biểu Đồ Phân Tích

1. **Bar Chart - Phân bố điểm số**
   - Hiển thị phân bố điểm của học viên theo các khoảng: 0-20, 21-40, 41-60, 61-80, 81-100
   - Giúp giáo viên thấy được mức độ nắm bài của học viên

2. **Pie Chart - Trạng thái bài thi**
   - Phân bố các trạng thái: Đã nộp, Đang làm, Bỏ dở
   - Giúp theo dõi tỷ lệ hoàn thành bài thi

3. **Line Chart - Lượt thi gần đây**
   - Hiển thị số lượt thi trong 7 ngày gần nhất
   - Giúp theo dõi hoạt động thi cử hàng ngày

4. **Radar Chart - Điểm TB theo mức độ**
   - So sánh điểm trung bình theo mức độ: Dễ, Trung bình, Khó
   - Giúp đánh giá hiệu quả của bài thi theo độ khó

5. **Area Chart - Bài thi được tạo theo tháng**
   - Hiển thị xu hướng tạo bài thi trong 6 tháng gần nhất
   - Giúp theo dõi năng suất tạo đề của giáo viên

## Cấu Trúc Backend

### API Endpoint
```
GET /api/dashboard/stats
```

### Response Structure
```json
{
  "data": {
    "totalExams": 125,
    "totalStudents": 856,
    "averageScore": 7.8,
    "averageTime": 45.5,
    "cheatingRate": 0.0,
    "scoreDistribution": [
      { "range": "0-20", "count": 5 },
      { "range": "21-40", "count": 12 },
      { "range": "41-60", "count": 28 },
      { "range": "61-80", "count": 45 },
      { "range": "81-100", "count": 35 }
    ],
    "attemptStatusDistribution": [
      { "status": "SUBMITTED", "count": 108 },
      { "status": "IN_PROGRESS", "count": 12 },
      { "status": "ABANDONED", "count": 5 }
    ],
    "attemptsOverTime": [
      { "date": "13/11", "count": 24 },
      { "date": "14/11", "count": 35 },
      ...
    ],
    "scoresByLevel": [
      { "level": "EASY", "averageScore": 85.5 },
      { "level": "MEDIUM", "averageScore": 75.2 },
      { "level": "HARD", "averageScore": 65.8 }
    ],
    "examsCreatedOverTime": [
      { "month": "06/2025", "count": 15 },
      { "month": "07/2025", "count": 18 },
      ...
    ]
  }
}
```

## Cách Hoạt Động

### Backend
1. `DashboardController` - REST API endpoint
2. `DashboardService` - Business logic layer
3. `DashboardServiceImpl` - Implementation với các phương thức:
   - Lấy tất cả exams của giáo viên (filter theo createdBy)
   - Lấy tất cả sessions của các exams đó
   - Lấy tất cả attempts từ các sessions
   - Tính toán các thống kê và biểu đồ

### Frontend
1. `dashboardApi.ts` - RTK Query API slice
2. `Home.tsx` - Dashboard component với:
   - `useGetDashboardStatsQuery()` - Hook để fetch data
   - Stats cards - Hiển thị 4 số liệu chính
   - Chart.js - Render 5 biểu đồ động
   - Loading & Error states

## Lưu Ý Quan Trọng

### Bảo Mật
- Chỉ giáo viên mới có thể xem dashboard của mình
- Dữ liệu được filter theo `createdBy` từ SecurityContext
- Không thể xem dữ liệu của giáo viên khác

### Performance
- Sử dụng `@Transactional(readOnly = true)` cho read operations
- Stream API để xử lý data hiệu quả
- Frontend có caching với RTK Query

### Tính Năng Tương Lai
- [ ] Thêm filter theo khoảng thời gian
- [ ] Export dữ liệu thống kê ra Excel/PDF
- [ ] Phát hiện gian lận thực tế (hiện tại là mock data)
- [ ] Real-time updates với WebSocket
- [ ] So sánh thống kê giữa các kỳ thi

## Testing

### Backend
```bash
cd backend
./mvnw test
```

### Frontend
```bash
cd frontend
npm run test
```

## Troubleshooting

### Không hiển thị dữ liệu
- Kiểm tra user đã login chưa
- Verify API endpoint đang hoạt động
- Check browser console cho errors

### Biểu đồ render sai
- Clear browser cache
- Verify dữ liệu từ API có đúng format
- Check Chart.js version compatibility

## Tech Stack

### Backend
- Spring Boot 3.5.4
- Java 17
- JPA/Hibernate
- PostgreSQL

### Frontend
- React 18
- TypeScript
- RTK Query
- Chart.js
- Ant Design
- Emotion (styled-components)
