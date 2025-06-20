# 🎯 FocusForge - Chrome Extension

> **Thông minh hơn BlockSite, nghiêm khắc hơn StayFocusd, đẹp hơn Strict Workflow.**

FocusForge là Chrome Extension giúp bạn duy trì sự tập trung trong giờ làm việc bằng cách chặn các trang web gây xao nhãng, nhưng vẫn cho bạn sự linh hoạt và tự chủ trong quá trình quản lý.

## 🌟 Tính năng chính

### Tính năng cơ bản

-   ✅ **Chặn website gây xao nhãng**: YouTube, Facebook, TikTok, Reddit theo danh sách tùy chỉnh
-   ⏰ **Chặn theo khung giờ cụ thể**: Ví dụ 08:00–11:30, 13:00–17:30
-   📅 **Chặn theo ngày trong tuần**: Thứ 2-6 hoặc tùy chỉnh
-   🎛️ **Popup giao diện đơn giản**: Bật/tắt Focus Mode nhanh chóng
-   🚫 **Trang chặn thân thiện**: Thông điệp động viên khi bị chặn
-   💾 **Lưu trạng thái**: Tự nhớ cài đặt khi khởi động lại
-   ⚙️ **Quản lý danh sách**: Thêm, sửa, xóa website dễ dàng

### Tính năng nổi bật

-   🔐 **Khóa tắt bằng mật khẩu**: Không thể tắt Focus Mode dễ dàng
-   📊 **Thống kê hành vi**: "Hôm nay bạn đã cố vào YouTube 3 lần 😅"
-   🤔 **Mindful Unlock**: Câu hỏi khiến bạn suy nghĩ trước khi tắt
-   🌅 **Tự động bật**: Extension tự bật Focus Mode theo lịch
-   ⚪ **Whitelist Mode**: Chỉ cho phép truy cập một số trang nhất định
-   🚨 **Truy cập khẩn cấp**: Tạm tắt khi có việc thật sự quan trọng

## 🚀 Cài đặt

### Cách 1: Cài đặt từ Chrome Web Store (Sắp có)

1. Truy cập Chrome Web Store
2. Tìm kiếm "FocusForge"
3. Nhấn "Add to Chrome"

### Cách 2: Cài đặt thủ công (Developer Mode)

1. Tải mã nguồn về máy
2. Mở Chrome → Cài đặt → Extensions
3. Bật "Developer mode"
4. Nhấn "Load unpacked" → Chọn thư mục FocusForge
5. Extension sẽ xuất hiện trong thanh công cụ

## 🎮 Hướng dẫn sử dụng

### Lần đầu sử dụng

1. **Nhấn vào icon FocusForge** trên thanh công cụ
2. **Bật Focus Mode** bằng toggle switch
3. **Cài đặt lịch trình** theo nhu cầu làm việc
4. **Thêm website** muốn chặn vào danh sách

### Quản lý danh sách website

1. Mở popup → Nhấn **"Quản lý danh sách"**
2. **Thêm website mới**:
    - Nhấn "Thêm website"
    - Nhập domain (ví dụ: youtube.com)
    - Chọn danh mục
    - Nhấn "Thêm"
3. **Sử dụng bộ preset**:
    - Chọn "Mạng xã hội", "Giải trí", "Tin tức"...
    - Tự động thêm nhiều website cùng lúc

### Cài đặt lịch trình

1. Mở **"Lịch trình"** từ popup
2. **Thêm lịch trình mới**:
    - Đặt tên (ví dụ: "Giờ làm việc")
    - Chọn thời gian bắt đầu/kết thúc
    - Chọn ngày trong tuần
    - Bật/tắt lịch trình
3. **Sử dụng mẫu có sẵn**:
    - Giờ làm việc chuẩn
    - Sinh viên học tập
    - Freelancer linh hoạt

### Cài đặt bảo mật

1. Vào **"Cài đặt"** → **"Bảo mật"**
2. **Bật "Khóa tắt bằng mật khẩu"**
3. **Đặt mật khẩu** mạnh
4. **Bật "Mindful Unlock"** để có câu hỏi suy nghĩ

## ⌨️ Phím tắt

-   `Ctrl + Shift + F`: Bật/tắt Focus Mode nhanh
-   `Ctrl + Shift + S`: Xem thống kê nhanh
-   `Esc`: Đóng form truy cập khẩn cấp

## 🔧 Cấu trúc dự án

```
FocusForge/
├── manifest.json           # Cấu hình extension
├── background.js           # Service worker chính
├── content.js             # Script chạy trên mọi trang
├── popup.html             # Giao diện popup chính
├── block.html             # Trang hiển thị khi chặn
├── styles/                # CSS files
│   ├── popup.css
│   ├── block.css
│   └── pages.css
├── js/                    # JavaScript files
│   ├── popup.js
│   ├── block.js
│   ├── manage.js
│   ├── schedule.js
│   └── settings.js
├── pages/                 # Trang quản lý
│   ├── manage.html
│   ├── schedule.html
│   ├── settings.html
│   └── stats.html
├── icons/                 # Icon extension
└── README.md
```

## 🛠️ Phát triển

### Yêu cầu hệ thống

-   Chrome Browser 88+
-   Manifest V3 support

### Cài đặt môi trường phát triển

1. Clone repository:

    ```bash
    git clone [repository-url]
    cd FocusForge
    ```

2. Load extension vào Chrome:

    - Mở `chrome://extensions/`
    - Bật Developer mode
    - Load unpacked → Chọn thư mục dự án

3. Reload extension sau khi chỉnh sửa:
    - Nhấn nút reload trên trang extensions
    - Hoặc `Ctrl + R` trên popup

### Kiến trúc extension

#### Background Service Worker (`background.js`)

-   Quản lý logic chặn website chính
-   Xử lý lịch trình và tự động bật/tắt
-   Lưu trữ và đồng bộ dữ liệu
-   Xử lý các message từ popup và content script

#### Content Script (`content.js`)

-   Chạy pada mọi trang web
-   Theo dõi thời gian tập trung
-   Hiển thị widget và thông báo
-   Xử lý keyboard shortcuts

#### Popup (`popup.html` + `popup.js`)

-   Giao diện chính của extension
-   Toggle Focus Mode
-   Hiển thị thống kê nhanh
-   Điều hướng đến các trang quản lý

#### Block Page (`block.html` + `block.js`)

-   Trang hiển thị khi website bị chặn
-   Thống kê số lần cố truy cập
-   Emergency access
-   Thông điệp động viên

## 📊 Dữ liệu được lưu trữ

Extension sử dụng `chrome.storage.local` để lưu:

-   **Cài đặt chính**: Focus mode, whitelist mode, passwords
-   **Danh sách website**: Blocked sites, whitelist
-   **Lịch trình**: Schedules, auto-enable settings
-   **Thống kê**: Daily stats, focus time, attempt counts
-   **Tùy chọn UI**: Widget settings, notifications

## 🔒 Quyền riêng tư

-   **Không thu thập dữ liệu cá nhân**
-   **Không gửi dữ liệu ra ngoài**
-   **Tất cả dữ liệu được lưu locally**
-   **Không tracking hành vi duyệt web**

## 🐛 Báo lỗi và đóng góp

### Báo lỗi

1. Mở issue trên GitHub
2. Mô tả chi tiết lỗi và cách tái hiện
3. Đính kèm screenshot nếu có

### Đóng góp code

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/tên-tính-năng`
3. Commit changes: `git commit -m 'Thêm tính năng ABC'`
4. Push to branch: `git push origin feature/tên-tính-năng`
5. Tạo Pull Request

## 📝 Changelog

### v1.0.0 (2025-06-20)

-   🎉 Phiên bản đầu tiên
-   ✅ Tất cả tính năng cơ bản và nâng cao
-   🎨 Giao diện đẹp và thân thiện
-   📱 Responsive design
-   🔐 Bảo mật với password protection
-   📊 Thống kê chi tiết

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🤝 Hỗ trợ

-   **Email**: support@focusforge.com
-   **GitHub Issues**: [Link to issues]
-   **Documentation**: [Link to docs]

## 🙏 Cảm ơn

Cảm ơn tất cả những người đã đóng góp vào dự án FocusForge!

---

**🎯 FocusForge - Rèn luyện sự tập trung, xây dựng kỷ luật bản thân!**
