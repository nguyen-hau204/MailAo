#!/bin/bash

# Script fix SMTP server trên VPS
echo "🔧 Script Fix SMTP Server trên VPS"
echo "=================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Đang chạy với quyền root"
else
    echo "💡 Một số command cần sudo, nhập password khi được yêu cầu"
fi

echo ""

# 1. Kiểm tra process Node.js
echo "1️⃣ Kiểm tra Node.js process..."
NODE_PROCESSES=$(ps aux | grep node | grep -v grep)
if [ -z "$NODE_PROCESSES" ]; then
    echo "❌ Không tìm thấy process Node.js nào đang chạy"
    echo "   Khởi động lại server: node server.js hoặc pm2 start"
else
    echo "✅ Node.js processes đang chạy:"
    echo "$NODE_PROCESSES"
fi

echo ""

# 2. Kiểm tra port 2525
echo "2️⃣ Kiểm tra port 2525..."
PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep :2525 || ss -tlnp 2>/dev/null | grep :2525)
if [ -z "$PORT_CHECK" ]; then
    echo "❌ Port 2525 không đang listen"
    echo "   Server có thể chưa khởi động hoặc bind sai địa chỉ"
else
    echo "✅ Port 2525 đang listen:"
    echo "$PORT_CHECK"
    
    # Kiểm tra xem có bind to 0.0.0.0 không
    if echo "$PORT_CHECK" | grep -q "0.0.0.0:2525"; then
        echo "✅ Server bind to 0.0.0.0 (tất cả interfaces)"
    elif echo "$PORT_CHECK" | grep -q "127.0.0.1:2525"; then
        echo "⚠️  Server chỉ bind to localhost (127.0.0.1)"
        echo "   Cần sửa code: smtpServer.listen(2525, '0.0.0.0')"
    fi
fi

echo ""

# 3. Kiểm tra firewall UFW
echo "3️⃣ Kiểm tra UFW firewall..."
if command -v ufw >/dev/null 2>&1; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null)
    echo "$UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        if echo "$UFW_STATUS" | grep -q "2525"; then
            echo "✅ Port 2525 đã được allow trong UFW"
        else
            echo "⚠️  Port 2525 chưa được allow trong UFW"
            echo "   Chạy: sudo ufw allow 2525"
            read -p "Bạn có muốn mở port 2525 ngay không? (y/n): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo ufw allow 2525
                echo "✅ Đã mở port 2525 trong UFW"
            fi
        fi
    else
        echo "💡 UFW không active"
    fi
else
    echo "💡 UFW không được cài đặt"
fi

echo ""

# 4. Kiểm tra iptables
echo "4️⃣ Kiểm tra iptables..."
IPTABLES_RULES=$(sudo iptables -L INPUT -n 2>/dev/null | grep 2525 || echo "")
if [ -z "$IPTABLES_RULES" ]; then
    echo "⚠️  Không thấy rule cho port 2525 trong iptables"
    echo "   Có thể cần thêm rule: sudo iptables -A INPUT -p tcp --dport 2525 -j ACCEPT"
else
    echo "✅ Có rule iptables cho port 2525:"
    echo "$IPTABLES_RULES"
fi

echo ""

# 5. Test kết nối local
echo "5️⃣ Test kết nối local..."
if command -v nc >/dev/null 2>&1; then
    if nc -zv localhost 2525 2>&1 | grep -q "succeeded\|open"; then
        echo "✅ Có thể kết nối local tới port 2525"
    else
        echo "❌ Không thể kết nối local tới port 2525"
    fi
elif command -v telnet >/dev/null 2>&1; then
    timeout 3 telnet localhost 2525 </dev/null >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Có thể kết nối local tới port 2525"
    else
        echo "❌ Không thể kết nối local tới port 2525"
    fi
else
    echo "💡 Không có nc hoặc telnet để test"
fi

echo ""

# 6. Kiểm tra logs
echo "6️⃣ Kiểm tra logs server (5 dòng cuối)..."
if [ -f "server.log" ]; then
    echo "📄 server.log:"
    tail -5 server.log
elif command -v journalctl >/dev/null 2>&1; then
    echo "📄 systemd journal (Node.js related):"
    sudo journalctl -u "*node*" --no-pager -n 5 2>/dev/null || echo "   Không tìm thấy logs"
else
    echo "💡 Không tìm thấy file log"
fi

echo ""

# 7. Hiển thị network info
echo "7️⃣ Network interfaces:"
ip addr show 2>/dev/null | grep -E "inet.*scope global" | head -3

echo ""

# 8. Suggestions
echo "🎯 CÁC BƯỚC KHẮC PHỤC PHỔ BIẾN:"
echo "================================"
echo "1. Nếu server chưa chạy:"
echo "   cd /path/to/your/project && node server.js"
echo "   hoặc: pm2 start server.js"
echo ""
echo "2. Nếu bind sai địa chỉ, sửa trong server.js:"
echo "   smtpServer.listen(2525, '0.0.0.0', () => {...})"
echo ""
echo "3. Mở firewall:"
echo "   sudo ufw allow 2525"
echo "   sudo iptables -A INPUT -p tcp --dport 2525 -j ACCEPT"
echo ""
echo "4. Kiểm tra provider VPS có block port:"
echo "   - Một số provider block port SMTP (25, 465, 587)"
echo "   - Port 2525 thường không bị block"
echo ""
echo "5. Test từ bên ngoài:"
echo "   telnet YOUR_VPS_IP 2525"
echo "   nc -zv YOUR_VPS_IP 2525"
echo ""
echo "6. Update code và restart:"
echo "   git pull && npm install && pm2 restart all"

echo ""
echo "✅ Script hoàn thành!"
