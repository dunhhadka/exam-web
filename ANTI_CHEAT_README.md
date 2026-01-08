# Tài Liệu Anti-Cheat Settings

## Tổng Quan

Hệ thống anti-cheat được áp dụng từ màn hình `CheckInWizard` để đảm bảo tính toàn vẹn của kỳ thi. Các settings được lấy từ backend thông qua `SessionInfoResponse.settings` và được áp dụng ngay khi component mount.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
## Các Tính Năng Chặn

### 1. `disableCopyPaste` - Khóa Copy-Paste

**Cách hoạt động:**
- Chặn sự kiện `copy`, `cut`, `paste` trên toàn bộ document
- Chặn context menu (chuột phải)
- Chặn các phím tắt:
  - `Ctrl+C` / `Cmd+C` (Copy)
  - `Ctrl+V` / `Cmd+V` (Paste)
  - `Ctrl+X` / `Cmd+X` (Cut)
  - `Ctrl+A` / `Cmd+A` (Select All)
  - `F12` (Developer Tools)
  - `Ctrl+Shift+I` / `Cmd+Shift+I` (DevTools)
  - `Ctrl+Shift+J` / `Cmd+Shift+J` (Console)
  - `Ctrl+U` / `Cmd+U` (View Source)

**Implementation:**
```typescript
// Chặn clipboard events
document.addEventListener('copy', handleCopy, true)
document.addEventListener('cut', handleCut, true)
document.addEventListener('paste', handlePaste, true)
document.addEventListener('contextmenu', handleContextMenu, true)
document.addEventListener('keydown', handleKeyDown, true)
```

**Lưu ý:**
- Sử dụng `capture phase` (tham số thứ 3 = `true`) để chặn sớm nhất có thể
- Các event handlers return `false` để ngăn chặn hành vi mặc định

---

### 2. `disableDeveloperTools` - Chặn Developer Tools

**Cách hoạt động:**
- **Phát hiện bằng window size:** So sánh `outerWidth/innerWidth` và `outerHeight/innerHeight`
  - Nếu chênh lệch > 160px → DevTools có thể đang mở
  - Check định kỳ mỗi 500ms
- **Phát hiện bằng console:** Override `console.log()` để phát hiện khi DevTools được mở
- **Cảnh báo:**
  - Lần 1: Alert cảnh báo
  - Lần 3+: Alert vi phạm nghiêm trọng

**Implementation:**
```typescript
// Check window size mỗi 500ms
const checkDevTools = () => {
  const threshold = 160
  const widthThreshold = window.outerWidth - window.innerWidth > threshold
  const heightThreshold = window.outerHeight - window.innerHeight > threshold
  
  if (widthThreshold || heightThreshold) {
    // Phát hiện DevTools mở
  }
}
setInterval(checkDevTools, 500)

// Override console.log
const originalLog = console.log
console.log = function (...args) {
  // Phát hiện console được sử dụng
  originalLog.apply(console, args)
}
```

**Hạn chế:**
- Có thể bị bypass bằng cách mở DevTools trước khi vào trang
- Một số trình duyệt có thể không chính xác 100%

---

### 3. `preventTabSwitch` - Cảnh báo khi rời màn hình

**Cách hoạt động:**
- Lắng nghe sự kiện `visibilitychange` (tab bị ẩn/hiện)
- Lắng nghe sự kiện `blur` (window mất focus)
- Khi phát hiện tab/window bị ẩn hoặc mất focus → Hiển thị cảnh báo

**Implementation:**
```typescript
const handleVisibilityChange = () => {
  if (document.hidden) {
    // Tab đã bị ẩn
    alert('⚠️ Cảnh báo: Bạn đã rời khỏi màn hình làm bài!')
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange)
window.addEventListener('blur', handleBlur)
window.addEventListener('focus', handleFocus)
```

**Lưu ý:**
- Chỉ cảnh báo, không chặn hoàn toàn (vì có thể do người dùng vô tình)
- Có thể mở rộng để gọi API ghi log vi phạm

---

### 4. `preventMinimize` / `requireFullscreen` - Yêu cầu Fullscreen

**Cách hoạt động:**
- Khi `requireFullscreen = true`: Tự động yêu cầu fullscreen khi component mount
- Kiểm tra định kỳ mỗi 1 giây để đảm bảo vẫn ở chế độ fullscreen
- Hỗ trợ đa trình duyệt:
  - Standard: `document.documentElement.requestFullscreen()`
  - Webkit: `webkitRequestFullscreen()`
  - Mozilla: `mozRequestFullScreen()`
  - IE/Edge: `msRequestFullscreen()`

**Implementation:**
```typescript
const requestFullscreen = async () => {
  if (document.documentElement.requestFullscreen) {
    await document.documentElement.requestFullscreen()
  } else if ((document.documentElement as any).webkitRequestFullscreen) {
    await (document.documentElement as any).webkitRequestFullscreen()
  }
  // ... các fallback khác
}

// Yêu cầu ngay khi mount
if (settings.requireFullscreen) {
  requestFullscreen()
}

// Check định kỳ
setInterval(checkFullscreen, 1000)
```

**Lưu ý:**
- Người dùng có thể từ chối fullscreen (browser security)
- Một số trình duyệt yêu cầu user interaction trước khi cho phép fullscreen

---

## Luồng Hoạt Động

1. **Component Mount:**
   ```
   CheckInWizard mount
   → PrepareCheckCandidateSystem fetch sessionInfo
   → Pass settings to CheckInWizard
   → useAntiCheat(settings) được gọi
   → Các useEffect trong useAntiCheat áp dụng settings
   ```

2. **Áp dụng Settings:**
   - Mỗi setting có một `useEffect` riêng
   - Chỉ áp dụng nếu setting = `true`
   - Cleanup khi component unmount

3. **Cleanup:**
   - Tất cả event listeners được remove khi component unmount
   - Intervals/timeouts được clear
   - Console functions được restore về original

---

## Cấu Trúc Backend

### SessionInfoResponse
```java
public class SessionInfoResponse {
    private Map<String, Object> settings;
    // ...
}
```

### ExamSession Entity
```java
@Entity
public class ExamSession {
    @Column(name = "settings", columnDefinition = "jsonb")
    private Map<String, Object> settings;
    // ...
}
```

### Settings Format (JSON)
```json
{
  "disableCopyPaste": true,
  "disableDeveloperTools": true,
  "preventTabSwitch": true,
  "preventMinimize": true,
  "requireFullscreen": false
}
```

---

## Hạn Chế và Lưu Ý

### 1. Bảo Mật
- ⚠️ **Không thể chặn 100%:** Người dùng có thể bypass bằng cách:
  - Mở DevTools trước khi vào trang
  - Sử dụng browser extensions
  - Disable JavaScript
  - Sử dụng tools bên ngoài (screen capture, etc.)

### 2. Trải Nghiệm Người Dùng
- ⚠️ **Fullscreen có thể gây khó chịu:** Một số người dùng không muốn fullscreen
- ⚠️ **Cảnh báo quá nhiều:** Có thể làm gián đoạn quá trình làm bài

### 3. Performance
- ✅ **Event listeners:** Sử dụng capture phase có thể ảnh hưởng performance nhẹ
- ✅ **Intervals:** Check DevTools mỗi 500ms, fullscreen mỗi 1s → không đáng kể

### 4. Browser Compatibility
- ✅ **Modern browsers:** Chrome, Firefox, Safari, Edge đều hỗ trợ tốt
- ⚠️ **Older browsers:** Một số tính năng có thể không hoạt động

---

## Testing

### Test disableCopyPaste
1. Vào trang với `disableCopyPaste: true`
2. Thử `Ctrl+C` → Không hoạt động
3. Thử chuột phải → Menu không hiện
4. Thử `Ctrl+V` → Không hoạt động

### Test disableDeveloperTools
1. Vào trang với `disableDeveloperTools: true`
2. Mở DevTools (`F12`) → Cảnh báo xuất hiện
3. Check console → Cảnh báo xuất hiện

### Test preventTabSwitch
1. Vào trang với `preventTabSwitch: true`
2. Chuyển sang tab khác → Cảnh báo xuất hiện
3. Quay lại → Cảnh báo biến mất

### Test requireFullscreen
1. Vào trang với `requireFullscreen: true`
2. Browser tự động yêu cầu fullscreen
3. Thoát fullscreen → Tự động yêu cầu lại

---

## Cải Thiện Tương Lai

- [ ] Thêm toast notifications thay vì alert (UX tốt hơn)
- [ ] Ghi log vi phạm lên backend
- [ ] Thêm countdown trước khi kết thúc bài thi khi vi phạm
- [ ] Phát hiện screenshot tools
- [ ] Phát hiện virtual machines
- [ ] Thêm watermark trên màn hình
- [ ] Record screen trong quá trình thi

