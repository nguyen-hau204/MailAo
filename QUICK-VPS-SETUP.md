# ⚡ QUICK VPS SETUP - 5 PHÚT DEPLOY

## 🚀 Bước 1: Chuẩn bị
```bash
# Thay YOUR_DOMAIN.COM bằng domain thật của bạn
export DOMAIN="YOUR_DOMAIN.COM"
export VPS_IP="YOUR_VPS_IP"
```

## 📁 Bước 2: Upload Files (từ Windows)
```powershell
# Upload tất cả files
scp -r D:\temp-mail-system\* root@$VPS_IP:/opt/temp-mail-system/
```

## 🔧 Bước 3: Chạy Script Deploy (trên VPS)
```bash
# SSH vào VPS
ssh root@$VPS_IP

# Chạy deploy script
cd /opt/temp-mail-system
bash deploy-vps.sh YOUR_DOMAIN.COM
```

## 🌐 Bước 4: Cấu hình DNS
Trên DNS provider (Cloudflare, Namecheap, etc):
```
# A Record
YOUR_DOMAIN.COM    A    YOUR_VPS_IP

# MX Record (quan trọng!)
@                 MX   10   YOUR_DOMAIN.COM
```

## 🚀 Bước 5: Start Application
```bash
# Start với PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Check status
pm2 status
```

## ✅ Bước 6: Test
```bash
# Test script
./test-system.sh

# Test manual
curl http://YOUR_DOMAIN.COM
telnet YOUR_DOMAIN.COM 25
```

---

## 🔍 Kiểm tra nhanh
- **Web:** http://YOUR_DOMAIN.COM
- **SMTP:** telnet YOUR_DOMAIN.COM 25
- **Logs:** `pm2 logs temp-mail-system`

## 🆘 Troubleshooting

### Port 25 bị chặn?
```bash
# Test port 25
telnet smtp.gmail.com 25

# Nếu không kết nối được → ISP chặn port 25
# Giải pháp: Dùng port 587 hoặc liên hệ ISP
```

### DNS chưa trỏ đúng?
```bash
# Kiểm tra A record
dig YOUR_DOMAIN.COM

# Kiểm tra MX record  
dig MX YOUR_DOMAIN.COM

# Phải thấy IP của VPS
```

### Email không nhận được?
1. Kiểm tra MX record
2. Kiểm tra port 25 mở
3. Kiểm tra logs: `pm2 logs`
4. Test với email đơn giản trước

---

## 📋 Checklist Deploy

- [ ] VPS có public IP
- [ ] Domain đã mua 
- [ ] DNS A record trỏ về VPS
- [ ] DNS MX record cấu hình
- [ ] Port 25, 80, 443 mở
- [ ] Code upload lên VPS
- [ ] Dependencies cài đặt
- [ ] PM2 chạy ổn định
- [ ] Test web interface
- [ ] Test SMTP server
- [ ] Test nhận email thật

🎉 **HOÀN THÀNH! Hệ thống email ảo đã sẵn sàng nhận email từ internet!**
