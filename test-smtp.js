const nodemailer = require('nodemailer');
const net = require('net');

// Cấu hình VPS của bạn
const VPS_IP = 'YOUR_VPS_IP';  // Thay bằng IP VPS thực tế
const SMTP_PORT = 2525;

console.log('🧪 Test kết nối SMTP server trên VPS...\n');

// Test 1: Kiểm tra port có mở không
async function testPortConnection() {
    console.log('1️⃣ Kiểm tra kết nối port...');
    
    return new Promise((resolve) => {
        const client = new net.Socket();
        const timeout = setTimeout(() => {
            client.destroy();
            console.log('❌ Timeout - Không thể kết nối đến VPS');
            console.log('   Có thể port 2525 bị block hoặc firewall chặn');
            resolve(false);
        }, 5000);

        client.connect(SMTP_PORT, VPS_IP, () => {
            clearTimeout(timeout);
            console.log('✅ Port 2525 đã mở và có thể kết nối');
            client.destroy();
            resolve(true);
        });

        client.on('error', (err) => {
            clearTimeout(timeout);
            console.log('❌ Lỗi kết nối:', err.message);
            console.log('   Kiểm tra: firewall, port forwarding, server đang chạy');
            resolve(false);
        });
    });
}

// Test 2: Gửi email test
async function testSendEmail() {
    console.log('\n2️⃣ Test gửi email...');
    
    try {
        const transporter = nodemailer.createTransporter({
            host: VPS_IP,
            port: SMTP_PORT,
            secure: false,
            auth: false,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        const testEmail = {
            from: 'test@example.com',
            to: 'temp123@tempmail.com', // Thay bằng email ảo thực tế
            subject: 'Test Email từ Script',
            text: 'Đây là email test từ script Node.js',
            html: '<h1>Test Email</h1><p>Đây là email test từ script Node.js</p>'
        };

        const result = await transporter.sendMail(testEmail);
        console.log('✅ Email đã được gửi thành công!');
        console.log('📧 Message ID:', result.messageId);
        console.log('📨 Response:', result.response);

    } catch (error) {
        console.log('❌ Lỗi gửi email:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('   SMTP server từ chối kết nối');
        } else if (error.code === 'ENOTFOUND') {
            console.log('   Không tìm thấy server (kiểm tra IP)');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   Timeout - có thể firewall block');
        }
    }
}

// Test 3: Debug commands cho VPS
function showDebugCommands() {
    console.log('\n🔧 COMMANDS DEBUG CHO VPS:');
    console.log('=====================================');
    console.log('# Kiểm tra process đang chạy:');
    console.log('ps aux | grep node');
    console.log('');
    console.log('# Kiểm tra port đang listen:');
    console.log('netstat -tlnp | grep 2525');
    console.log('ss -tlnp | grep 2525');
    console.log('');
    console.log('# Kiểm tra firewall:');
    console.log('sudo ufw status');
    console.log('sudo iptables -L');
    console.log('');
    console.log('# Mở port trong firewall:');
    console.log('sudo ufw allow 2525');
    console.log('sudo iptables -A INPUT -p tcp --dport 2525 -j ACCEPT');
    console.log('');
    console.log('# Test từ VPS local:');
    console.log('telnet localhost 2525');
    console.log('nc -zv localhost 2525');
    console.log('');
    console.log('# Test logs server:');
    console.log('tail -f /var/log/syslog | grep node');
    console.log('journalctl -u your-service-name -f');
    console.log('');
    console.log('# Restart server:');
    console.log('pm2 restart all');
    console.log('systemctl restart your-service');
}

// Chạy tests
async function runTests() {
    if (VPS_IP === 'YOUR_VPS_IP') {
        console.log('⚠️  Cần thay VPS_IP bằng IP thực tế của VPS!');
        console.log('   Sửa dòng: const VPS_IP = "YOUR_VPS_IP";');
        showDebugCommands();
        return;
    }

    console.log(`🎯 Testing VPS: ${VPS_IP}:${SMTP_PORT}\n`);

    const portOpen = await testPortConnection();
    
    if (portOpen) {
        await testSendEmail();
    }

    showDebugCommands();
    
    console.log('\n📝 CHECKLIST TROUBLESHOOTING:');
    console.log('=====================================');
    console.log('□ VPS server đang chạy');
    console.log('□ Port 2525 đã mở trong firewall');
    console.log('□ SMTP server bind to 0.0.0.0 (không phải 127.0.0.1)');
    console.log('□ Provider VPS không block port 2525');
    console.log('□ DNS/IP chính xác');
    console.log('□ Không có reverse proxy/load balancer chặn');
}

// Chạy script
runTests().catch(console.error);
