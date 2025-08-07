# 📧 HƯỚNG DẪN TEST GỬI EMAIL ĐẾN VPS

## 🚀 Method 1: Node.js Script (Khuyến nghị)

```bash
# Chạy script test tự động
node test-send-email.js
```

Script này sẽ:
- ✅ Test kết nối SMTP
- ✅ Gửi email đến 4 địa chỉ test khác nhau
- ✅ Hiển thị debug chi tiết
- ✅ Báo cáo kết quả cuối cùng

---

## 🧪 Method 2: Sử dụng swaks (Linux/macOS)

### Cài đặt swaks:
```bash
# Ubuntu/Debian
sudo apt-get install swaks

# macOS
brew install swaks

# CentOS/RHEL
sudo yum install swaks
```

### Test cơ bản:
```bash
swaks --to temp123@tempmail.com \
      --from test@example.com \
      --server 8.219.169.133:2525 \
      --body "Test email from swaks"
```

### Test chi tiết:
```bash
swaks --to temp123@tempmail.com \
      --from test@example.com \
      --server 8.219.169.133:2525 \
      --port 2525 \
      --header "Subject: Test Email $(date)" \
      --body "This is a test email sent at $(date)" \
      --auth-hide-password \
      --tls-optional \
      --debug
```

---

## 📱 Method 3: Telnet Manual Test

```bash
# Kết nối SMTP
telnet 8.219.169.133 2525

# Sau khi kết nối, gõ từng dòng:
HELO test.com
MAIL FROM: <test@example.com>
RCPT TO: <temp123@tempmail.com>
DATA
Subject: Manual Test Email

This is a manual test email.
.
QUIT
```

---

## 🌐 Method 4: Online SMTP Tester

1. **MXToolbox SMTP Test**: https://mxtoolbox.com/diagnostic.aspx
2. **SMTP2GO Tester**: https://www.smtp2go.com/smtp-test-tool/
3. **Wormly SMTP Test**: https://www.wormly.com/test_smtp_server

Cấu hình:
- **Server**: `8.219.169.133`
- **Port**: `2525` (hoặc `587` nếu dùng alternative)
- **Authentication**: None
- **Encryption**: None (Plain)

---

## 💻 Method 5: PowerShell (Windows)

```powershell
# Tạo SMTP client
$SMTPClient = New-Object System.Net.Mail.SmtpClient
$SMTPClient.Host = "8.219.169.133"
$SMTPClient.Port = 2525
$SMTPClient.EnableSsl = $false

# Tạo email
$MailMessage = New-Object System.Net.Mail.MailMessage
$MailMessage.From = "test@example.com"
$MailMessage.To.Add("temp123@tempmail.com")
$MailMessage.Subject = "PowerShell Test Email"
$MailMessage.Body = "This is a test email from PowerShell"

# Gửi email
try {
    $SMTPClient.Send($MailMessage)
    Write-Host "✅ Email sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error sending email: $($_.Exception.Message)" -ForegroundColor Red
}

# Clean up
$MailMessage.Dispose()
$SMTPClient.Dispose()
```

---

## 📋 CHECKLIST TRƯỚC KHI TEST

### 1. Kiểm tra VPS
- [ ] SMTP server đang chạy
- [ ] Port 2525 được bind to 0.0.0.0
- [ ] Firewall allow port 2525
- [ ] Không có errors trong logs

### 2. Chuẩn bị email test
- [ ] Vào https://nguyenhuuhau.xyz/
- [ ] Tạo 1-2 email ảo mới
- [ ] Copy địa chỉ email để dùng trong test

### 3. Chọn phương pháp test
- [ ] **Node.js script** (khuyến nghị cho Windows)
- [ ] **swaks** (tốt nhất cho Linux)
- [ ] **telnet** (debug chi tiết)
- [ ] **Online tools** (không cần cài đặt)

---

## 🔍 PHÂN TÍCH KẾT QUẢ

### ✅ Thành công:
```
✅ Kết nối SMTP thành công!
✅ Email đã được gửi thành công!
📧 Message ID: <random-id>
📨 Response: 250 OK
```

### ❌ Thất bại phổ biến:

**Connection Refused:**
```
❌ ECONNREFUSED: connection refused
```
→ Server không chạy hoặc port sai

**Timeout:**
```
❌ ETIMEDOUT: connection timed out
```
→ Firewall block hoặc IP sai

**Connection Reset:**
```
❌ ECONNRESET: connection reset by peer
```
→ Server từ chối connection

---

## 🎯 VERIFICATION

Sau khi gửi email thành công:

1. **Kiểm tra VPS logs:**
   ```bash
   # Xem logs server
   tail -f server.log
   
   # Hoặc PM2 logs
   pm2 logs --lines 20
   ```

2. **Kiểm tra website:**
   - Vào https://nguyenhuuhau.xyz/
   - Click "Làm mới" để reload emails
   - Email test sẽ xuất hiện trong danh sách

3. **Xác nhận nội dung:**
   - Click vào email để xem chi tiết
   - Kiểm tra From, Subject, Body
   - Xác nhận thời gian nhận

---

## 🚨 TROUBLESHOOTING

### Nếu vẫn không nhận được email:

1. **Kiểm tra email có tồn tại:**
   ```javascript
   // Trong browser console tại website
   fetch('/api/emails')
     .then(r => r.json())
     .then(data => console.log(data));
   ```

2. **Kiểm tra server logs chi tiết:**
   ```bash
   # Tăng debug level
   DEBUG=* node server.js
   ```

3. **Test với email khác:**
   - Tạo email ảo mới
   - Thử domain khác (@10minutemail.com)
   - Test với multiple recipients

4. **Kiểm tra domain matching:**
   - Server chỉ nhận email cho domains được config
   - Xem `availableDomains` trong server.js

---

**🎉 Chúc bạn test thành công!**
