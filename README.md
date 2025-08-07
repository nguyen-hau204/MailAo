# 📮 Hệ Thống Email Ảo

Một hệ thống tạo email tạm thời để bảo vệ email chính của bạn khỏi spam và các dịch vụ không mong muốn.

## 👨‍💻 Giới thiệu tác giả

**NguyenHau** - Developer đứng sau dự án MailAo này. Với đam mê phát triển các ứng dụng web hữu ích, tôi đã tạo ra hệ thống email ảo này để giúp mọi người bảo vệ thông tin cá nhân khi sử dụng internet.

### 🎯 Mục tiêu của dự án
- Cung cấp giải pháp email tạm thời miễn phí, dễ sử dụng
- Giúp người dùng tránh spam và bảo vệ email chính
- Xây dựng một công cụ hữu ích cho cộng đồng developer Việt Nam

## ✨ Tính Năng

- 🎲 **Tự động tạo email ảo ngẫu nhiên**
- ⏰ **Email tự động hết hạn sau 10 phút**
- 🔄 **Gia hạn email thêm 10 phút**
- 📥 **Nhận email real-time**
- 📱 **Giao diện responsive, đẹp mắt**
- 📋 **Copy email một click**
- 🗑️ **Xóa email khi không cần**
- 📧 **Xem chi tiết email đã nhận**

## 🚀 Cài Đặt & Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy server

```bash
npm start
```

Hoặc chạy ở chế độ development:

```bash
npm run dev
```

### 3. Mở trình duyệt

Truy cập: http://localhost:3000

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/create-email` | Tạo email ảo mới |
| GET | `/api/email/:id` | Lấy thông tin email |
| GET | `/api/email/:id/messages` | Lấy danh sách tin nhắn |
| PUT | `/api/email/:id/extend` | Gia hạn email |
| DELETE | `/api/email/:id` | Xóa email |
| GET | `/api/emails` | Lấy danh sách tất cả email |

## 📝 Cách Sử Dụng

### 1. Tạo Email Ảo
- Click nút **"Tạo Email Ngay"**
- Hệ thống sẽ tạo một email ảo ngẫu nhiên
- Email có hiệu lực trong 10 phút

### 2. Sử Dụng Email
- Copy địa chỉ email bằng nút **Copy**
- Sử dụng email này để đăng ký các dịch vụ
- Email sẽ tự động nhận tin nhắn

### 3. Xem Email Đã Nhận
- Danh sách email sẽ hiển thị tự động
- Click vào email để xem chi tiết
- Hỗ trợ cả text và HTML

### 4. Quản Lý Email
- **Gia hạn**: Thêm 10 phút sử dụng
- **Làm mới**: Cập nhật email mới nhất
- **Xóa**: Xóa email và dữ liệu

## 🔧 Cấu Hình

### Ports
- **Web Server**: 3000 (có thể thay đổi bằng biến môi trường `PORT`)
- **SMTP Server**: 2525

### Thời Gian Hết Hạn
Email mặc định hết hạn sau **10 phút**. Có thể thay đổi trong code:

```javascript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
```

### Domains Có Sẵn
```javascript
const availableDomains = [
    'tempmail.com', 
    '10minutemail.com', 
    'guerrillamail.com', 
    'throwaway.email'
];
```

## 🧪 Test Email

Để test hệ thống, bạn có thể gửi email đến địa chỉ ảo bằng các cách:

### 1. Sử dụng SMTP Client
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: 'localhost',
    port: 2525,
    secure: false,
    auth: false
});

await transporter.sendMail({
    from: 'test@example.com',
    to: 'your-temp-email@tempmail.com',
    subject: 'Test Email',
    text: 'Đây là email test!'
});
```

### 2. Sử dụng Command Line
```bash
# Cài đặt swaks (trên Ubuntu/Debian)
sudo apt-get install swaks

# Gửi email test
swaks --to your-temp-email@tempmail.com --from test@example.com --server localhost:2525 --body "Test email content"
```

## 🛠️ Cấu Trúc Dự Án

```
temp-mail-system/
├── server.js          # Server chính
├── package.json       # Dependencies
├── README.md          # Documentation
└── public/            # Frontend files
    ├── index.html     # Giao diện chính
    ├── style.css      # CSS styling
    └── script.js      # JavaScript logic
```

## 🔒 Bảo Mật

⚠️ **Lưu ý quan trọng**: Đây là phiên bản demo, không nên sử dụng cho production. Để sử dụng thực tế cần:

- Thêm authentication
- Sử dụng database thay vì memory storage
- Thêm rate limiting
- Cấu hình HTTPS
- Bảo mật SMTP server

## 🐛 Troubleshooting

### Email không nhận được
1. Kiểm tra SMTP server có chạy không
2. Xem log console có lỗi gì
3. Đảm bảo email chưa hết hạn

### Port đã được sử dụng
```bash
# Kiểm tra port đang dùng
netstat -an | findstr :3000
netstat -an | findstr :2525

# Thay đổi port trong code hoặc dừng process
```

### Lỗi dependencies
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra log console
2. Xem file README này
3. Test với email đơn giản trước

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

// auto deploy test 08/07/2025 10:35:02
