const nodemailer = require('nodemailer');

// Cấu hình VPS
const VPS_IP = '8.219.169.133';
const SMTP_PORT = 2525;
const TEST_DOMAIN = 'nguyenhuuhau.xyz';

// Email cụ thể từ website
const TARGET_EMAIL = 'mailk2uxb5@throwaway.email';

console.log('📧 GỬI EMAIL ĐẾN ĐỊA CHỈ CỤ THỂ');
console.log('================================');
console.log(`VPS: ${VPS_IP}:${SMTP_PORT}`);
console.log(`Website: https://${TEST_DOMAIN}/`);
console.log(`Target Email: ${TARGET_EMAIL}`);
console.log('');

async function sendEmailToTarget() {
    console.log(`🚀 Gửi email đến: ${TARGET_EMAIL}`);
    
    try {
        // Tạo transporter
        const transporter = nodemailer.createTransport({
            host: VPS_IP,
            port: SMTP_PORT,
            secure: false,
            auth: false,
            ignoreTLS: true,
            requireTLS: false,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            debug: false, // Tắt debug để output sạch hơn
            logger: false
        });

        // Verify connection
        console.log('🔍 Kiểm tra kết nối SMTP...');
        await transporter.verify();
        console.log('✅ Kết nối SMTP thành công!');

        // Tạo nội dung email đặc biệt
        const currentTime = new Date().toLocaleString();
        const mailOptions = {
            from: 'test-sender@example.com',
            to: TARGET_EMAIL,
            subject: `🎉 Test Email từ NguyenHau - ${currentTime}`,
            text: `
🎯 EMAIL TEST THÀNH CÔNG!

Xin chào!

Đây là email test được gửi từ script Node.js để kiểm tra hệ thống SMTP của bạn.

📋 THÔNG TIN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Gửi lúc: ${currentTime}
• Gửi đến: ${TARGET_EMAIL}
• SMTP Server: ${VPS_IP}:${SMTP_PORT}
• Từ: test-sender@example.com
• Website: https://${TEST_DOMAIN}/

🎉 NẾU BẠN NHẬN ĐƯỢC EMAIL NÀY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SMTP server đang hoạt động hoàn hảo!
✅ Firewall đã được cấu hình đúng!
✅ Email routing hoạt động tốt!
✅ Hệ thống MailAo sẵn sàng sử dụng!

🔧 CHI TIẾT KỸ THUẬT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Server bind: 0.0.0.0:2525 ✅
- TLS: Disabled ✅  
- Authentication: None ✅
- Domain routing: throwaway.email ✅

💡 HƯỚNG DẪN SỬ DỤNG:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Vào https://${TEST_DOMAIN}/
2. Tạo email ảo mới  
3. Sử dụng email đó để đăng ký các dịch vụ
4. Email sẽ tự động xuất hiện trên website

🎊 CHÚC MỪNG! HỆ THỐNG CỦA BẠN HOẠT ĐỘNG HOÀN HẢO!

---
💻 Developed with ❤️ by NguyenHau
🌐 MailAo Temporary Email System
            `,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
    <h1 style="text-align: center; color: #fff; margin-bottom: 30px;">
        🎉 Email Test Thành Công!
    </h1>
    
    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #fff; margin-top: 0;">📋 Thông Tin Chi Tiết:</h2>
        <table style="width: 100%; color: #fff;">
            <tr><td><strong>🕒 Gửi lúc:</strong></td><td>${currentTime}</td></tr>
            <tr><td><strong>📧 Gửi đến:</strong></td><td>${TARGET_EMAIL}</td></tr>
            <tr><td><strong>🖥️ SMTP Server:</strong></td><td>${VPS_IP}:${SMTP_PORT}</td></tr>
            <tr><td><strong>👤 Từ:</strong></td><td>test-sender@example.com</td></tr>
            <tr><td><strong>🌐 Website:</strong></td><td><a href="https://${TEST_DOMAIN}/" style="color: #ffd700;">https://${TEST_DOMAIN}/</a></td></tr>
        </table>
    </div>
    
    <div style="background: rgba(76, 175, 80, 0.2); padding: 20px; border-radius: 10px; border-left: 5px solid #4CAF50; margin-bottom: 20px;">
        <h2 style="color: #4CAF50; margin-top: 0;">✅ Hệ Thống Hoạt Động Hoàn Hảo!</h2>
        <ul style="color: #fff; line-height: 1.6;">
            <li>SMTP server đang hoạt động 100%</li>
            <li>Firewall đã được cấu hình đúng</li>
            <li>Email routing hoạt động tốt</li>
            <li>Domain parsing chính xác</li>
        </ul>
    </div>
    
    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #fff; margin-top: 0;">🔧 Chi Tiết Kỹ Thuật:</h2>
        <ul style="color: #fff; line-height: 1.6;">
            <li><strong>Server Binding:</strong> 0.0.0.0:2525 ✅</li>
            <li><strong>TLS:</strong> Disabled ✅</li>
            <li><strong>Authentication:</strong> None ✅</li>
            <li><strong>Domain Support:</strong> throwaway.email ✅</li>
        </ul>
    </div>
    
    <div style="background: rgba(33, 150, 243, 0.2); padding: 20px; border-radius: 10px; border-left: 5px solid #2196F3;">
        <h2 style="color: #2196F3; margin-top: 0;">💡 Hướng Dẫn Sử Dụng:</h2>
        <ol style="color: #fff; line-height: 1.8;">
            <li>Vào <a href="https://${TEST_DOMAIN}/" style="color: #ffd700;">https://${TEST_DOMAIN}/</a></li>
            <li>Click "Tạo Email Ngay" để tạo email ảo mới</li>
            <li>Copy địa chỉ email và sử dụng cho đăng ký</li>
            <li>Email sẽ tự động hiển thị trên website</li>
            <li>Click "Làm mới" để cập nhật email mới</li>
        </ol>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.3);">
        <h1 style="color: #ffd700; margin-bottom: 10px;">🎊 CHÚC MỪNG!</h1>
        <p style="color: #fff; font-size: 18px; margin-bottom: 20px;">Hệ thống MailAo của bạn đã sẵn sàng!</p>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px;">💻 Developed with ❤️ by NguyenHau</p>
    </div>
</div>
            `
        };

        // Gửi email
        console.log('📤 Đang gửi email...');
        const result = await transporter.sendMail(mailOptions);
        
        console.log('');
        console.log('🎉 EMAIL GỬI THÀNH CÔNG!');
        console.log('========================');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`📨 Server Response: ${result.response}`);
        console.log(`📬 Email gửi đến: ${TARGET_EMAIL}`);
        console.log('');
        console.log('🔍 KIỂM TRA KẾT QUẢ:');
        console.log('========================');
        console.log(`1. Vào: https://${TEST_DOMAIN}/`);
        console.log(`2. Tìm email: ${TARGET_EMAIL}`);
        console.log(`3. Click "Làm mới" để reload`);
        console.log(`4. Email test sẽ xuất hiện trong danh sách`);
        console.log('');
        console.log('✅ Nếu email hiển thị = SMTP server hoạt động 100%!');
        
        return true;
        
    } catch (error) {
        console.log('');
        console.log('❌ LỖI GỬI EMAIL:');
        console.log('==================');
        console.log(`Error: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('→ SMTP server từ chối kết nối');
            console.log('→ Kiểm tra server có đang chạy không');
        } else if (error.code === 'ENOTFOUND') {
            console.log('→ Không tìm thấy server (kiểm tra IP)');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('→ Timeout - có thể firewall block');
        } else if (error.code === 'ECONNRESET') {
            console.log('→ Kết nối bị reset');
        }
        
        console.log(`→ Chi tiết: ${error}`);
        return false;
    }
}

// Chạy test
console.log('🚀 Bắt đầu gửi email...\n');
sendEmailToTarget().then(success => {
    if (success) {
        console.log('\n🎯 HOÀN TẤT! Hãy kiểm tra website để xem email.');
    } else {
        console.log('\n💔 Thất bại! Cần kiểm tra lại cấu hình server.');
    }
}).catch(console.error);
