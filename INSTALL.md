# Hướng dẫn cài đặt FocusForge

## Cài đặt Extension trên Chrome

### Bước 1: Kích hoạt Developer Mode

1. Mở Chrome và đi tới `chrome://extensions/`
2. Bật **Developer mode** ở góc trên bên phải
3. Sẽ xuất hiện các nút mới: "Load unpacked", "Pack extension", "Update"

### Bước 2: Load Extension

1. Click nút **"Load unpacked"**
2. Chọn thư mục `FocusForge` (thư mục chứa file `manifest.json`)
3. Extension sẽ được tải và hiện trong danh sách

### Bước 3: Kiểm tra hoạt động

1. Icon FocusForge sẽ xuất hiện ở thanh công cụ Chrome
2. Click vào icon để mở popup
3. Thử bật/tắt Focus Mode
4. Thử truy cập các trang web như facebook.com, youtube.com khi Focus Mode bật

## Gỡ lỗi thường gặp

### Extension không load được

-   Kiểm tra file `manifest.json` có đúng format JSON không
-   Đảm bảo tất cả files được reference trong manifest đều tồn tại
-   Kiểm tra console trong `chrome://extensions/` để xem lỗi

### Extension load nhưng không hoạt động

-   Mở DevTools (F12) → Console để xem lỗi JavaScript
-   Kiểm tra Permissions trong `chrome://extensions/` → Details → Site access
-   Thử reload extension bằng nút refresh

### Không chặn được website

-   Kiểm tra Focus Mode đã được bật chưa
-   Kiểm tra website có trong danh sách blocked sites không
-   Kiểm tra thời gian hiện tại có trong lịch trình làm việc không

## Cập nhật Extension

Khi có thay đổi code:

1. Vào `chrome://extensions/`
2. Click nút **Reload** (⟳) trên card FocusForge
3. Extension sẽ được tải lại với code mới

## Phím tắt

-   `Ctrl+Shift+F`: Bật/tắt Focus Mode nhanh
-   `Ctrl+Shift+S`: Mở trang thống kê
-   `Ctrl+Shift+M`: Mở trang quản lý website

## Debug và Development

### Xem Background Script logs:

1. Vào `chrome://extensions/`
2. Click **"Inspect views: background page"** dưới FocusForge
3. DevTools sẽ mở cho background script

### Xem Content Script logs:

1. Mở trang web bất kỳ
2. Mở DevTools (F12)
3. Content script logs sẽ hiện trong Console

### Xem Popup logs:

1. Right-click vào icon FocusForge
2. Chọn **"Inspect popup"**
3. DevTools sẽ mở cho popup

## Sự cố và Giải pháp

| Vấn đề                     | Giải pháp                                        |
| -------------------------- | ------------------------------------------------ |
| Icon không hiện            | Kiểm tra file icons trong thư mục `/icons/`      |
| Popup không mở             | Kiểm tra `popup.html` và `popup.js` có lỗi không |
| Không chặn được trang      | Kiểm tra permissions và content script           |
| Settings không lưu         | Kiểm tra Chrome storage permissions              |
| Lịch trình không hoạt động | Kiểm tra timezone và format thời gian            |

## Chuẩn bị xuất bản lên Chrome Web Store

1. Tạo file ZIP chứa toàn bộ extension
2. Chuẩn bị screenshots và mô tả
3. Đăng ký tài khoản Chrome Web Store Developer
4. Upload và chờ review

---

**Chúc bạn sử dụng FocusForge hiệu quả! 🎯**
