# 🚀 HƯỚNG DẪN DEPLOY HỆ THỐNG EMAIL ẢO LÊN VPS

## 📋 YÊU CẦU VPS

### ✅ Cấu hình tối thiểu:
- **RAM**: 1GB+
- **CPU**: 1 core+
- **Storage**: 10GB+
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **Network**: Public IP

### ✅ Port cần mở:
- **Port 80**: HTTP
- **Port 443**: HTTPS (optional)
- **Port 25**: SMTP (email)
- **Port 3000**: Web interface
- **Port 22**: SSH

## 🛠️ BƯỚC 1: CHUẨN BỊ VPS

### 1.1 Kết nối SSH
```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Update hệ thống
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 1.3 Cài đặt Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
yum install -y nodejs

# Verify
node --version
npm --version
```

### 1.4 Cài đặt PM2 (Process Manager)
```bash
npm install -g pm2
```

### 1.5 Cài đặt Nginx (optional - cho reverse proxy)
```bash
# Ubuntu/Debian
apt install nginx -y

# CentOS/RHEL
yum install nginx -y

# Start nginx
systemctl start nginx
systemctl enable nginx
```

## 🚀 BƯỚC 2: UPLOAD CODE LÊN VPS

### 2.1 Tạo thư mục project
```bash
mkdir -p /opt/temp-mail-system
cd /opt/temp-mail-system
```

### 2.2 Upload files (có nhiều cách)

#### Option A: Sử dụng SCP từ Windows
```powershell
# Từ máy Windows (chạy trong PowerShell)
scp -r D:\temp-mail-system\* root@YOUR_VPS_IP:/opt/temp-mail-system/
```

#### Option B: Sử dụng Git
```bash
# Trên VPS
git clone YOUR_REPO_URL .
# Hoặc tạo repo Git từ code hiện tại
```

#### Option C: Sử dụng WinSCP/FileZilla
- Kết nối SFTP đến VPS
- Upload toàn bộ folder temp-mail-system

### 2.3 Cài đặt dependencies
```bash
cd /opt/temp-mail-system
npm install
```

## 🌐 BƯỚC 3: CẤU HÌNH DOMAIN

### 3.1 Mua domain (nếu chưa có)
- Namecheap, GoDaddy, CloudFlare, etc.

### 3.2 Cấu hình DNS Records
Trên DNS provider của bạn, thêm:

```
# A Record - trỏ domain về VPS
yourdomain.com    A    YOUR_VPS_IP

# MX Record - để nhận email
@    MX    10    yourdomain.com

# Subdomain (optional)
mail.yourdomain.com    A    YOUR_VPS_IP
```

### 3.3 Kiểm tra DNS
```bash
# Kiểm tra A record
dig yourdomain.com

# Kiểm tra MX record
dig MX yourdomain.com
```

## 🔧 BƯỚC 4: CẤU HÌNH HỆ THỐNG

### 4.1 Tạo file environment
```bash
nano /opt/temp-mail-system/.env
```

Nội dung file .env:
```bash
# Server Configuration
PORT=3000
DOMAIN=yourdomain.com
NODE_ENV=production

# SMTP Configuration
SMTP_PORT=25
SMTP_HOST=0.0.0.0

# Security (optional)
RATE_LIMIT=100
MAX_EMAILS_PER_IP=10
```

### 4.2 Tạo production server
```bash
nano /opt/temp-mail-system/server-production.js
```

### 4.3 Cấu hình Firewall
```bash
# Ubuntu/Debian
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 25
ufw allow 3000
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=25/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

## 🚀 BƯỚC 5: CHẠY HỆ THỐNG

### 5.1 Test chạy manual
```bash
cd /opt/temp-mail-system
DOMAIN=yourdomain.com node server-public.js
```

### 5.2 Chạy với PM2 (production)
```bash
# Tạo PM2 ecosystem file
nano ecosystem.config.js
```

Nội dung:
```javascript
module.exports = {
  apps: [{
    name: 'temp-mail-system',
    script: 'server-public.js',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      DOMAIN: 'yourdomain.com',
      PORT: 3000
    }
  }]
}
```

Khởi động:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5.3 Kiểm tra logs
```bash
pm2 logs temp-mail-system
pm2 status
```

## 🌐 BƯỚC 6: CẤU HÌNH NGINX (OPTIONAL)

### 6.1 Tạo Nginx config
```bash
nano /etc/nginx/sites-available/temp-mail
```

Nội dung:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Enable site
```bash
ln -s /etc/nginx/sites-available/temp-mail /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔒 BƯỚC 7: CẤU HÌNH SSL (OPTIONAL)

### 7.1 Cài đặt Certbot
```bash
# Ubuntu/Debian
apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
yum install certbot python3-certbot-nginx -y
```

### 7.2 Tạo SSL certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## ✅ BƯỚC 8: KIỂM TRA HỆ THỐNG

### 8.1 Test web interface
```bash
curl http://yourdomain.com
```

### 8.2 Test SMTP server
```bash
telnet yourdomain.com 25
```

### 8.3 Test email
- Tạo email ảo từ web interface
- Gửi email từ Gmail/Outlook đến email ảo vừa tạo
- Kiểm tra email có nhận được không

## 🎯 LỆNH NHANH DEPLOY

```bash
#!/bin/bash
# Quick deploy script

# 1. Update system
apt update && apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Create project directory
mkdir -p /opt/temp-mail-system
cd /opt/temp-mail-system

# 5. Setup firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw allow 25 && ufw allow 3000
ufw --force enable

# 6. Ready for file upload
echo "🎉 VPS ready! Now upload your files to /opt/temp-mail-system/"
echo "📧 Don't forget to configure DNS MX record!"
```

## ⚠️ QUAN TRỌNG

1. **DNS MX Record**: Bắt buộc phải có để nhận email
2. **Port 25**: Phải mở và không bị ISP chặn
3. **Domain**: Phải có domain thật, không dùng IP
4. **Firewall**: Cấu hình đúng các port
5. **SSL**: Khuyến khích dùng HTTPS

## 🆘 TROUBLESHOOTING

### Không nhận được email:
```bash
# Check port 25
telnet yourdomain.com 25

# Check DNS
dig MX yourdomain.com

# Check logs
pm2 logs temp-mail-system
```

### Web không truy cập được:
```bash
# Check service
pm2 status

# Check nginx
systemctl status nginx
nginx -t
```
