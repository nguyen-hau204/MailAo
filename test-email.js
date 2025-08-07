const nodemailer = require('nodemailer');

// Script test để gửi email đến hệ thống
async function testSendEmail() {
    console.log('🧪 Bắt đầu test gửi email...');
    
    // Nhập email đích từ user
    const targetEmail = process.argv[2];
    
    if (!targetEmail) {
        console.log('❌ Vui lòng cung cấp email đích:');
        console.log('   node test-email.js your-temp-email@tempmail.com');
        process.exit(1);
    }
    
    try {
        // Tạo transporter kết nối đến SMTP server local
        const transporter = nodemailer.createTransport({
            host: 'localhost',
            port: 2525,
            secure: false,
            auth: false,
            tls: {
                rejectUnauthorized: false
            }
        });
        
        // Gửi email test
        const info = await transporter.sendMail({
            from: '"Test Sender" <test@example.com>',
            to: targetEmail,
            subject: '🎉 Email Test từ Hệ Thống Email Ảo',
            text: `
Chào bạn!

Đây là email test từ hệ thống Email Ảo.
Nếu bạn nhận được email này, có nghĩa là hệ thống đang hoạt động tốt!

Thời gian gửi: ${new Date().toLocaleString('vi-VN')}

Chúc bạn sử dụng hệ thống vui vẻ!
            `,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #667eea;">🎉 Email Test từ Hệ Thống Email Ảo</h2>
    
    <p>Chào bạn!</p>
    
    <p>Đây là email test từ hệ thống <strong>Email Ảo</strong>.</p>
    <p>Nếu bạn nhận được email này, có nghĩa là hệ thống đang hoạt động tốt! ✅</p>
    
    <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        <p><strong>📧 Email đích:</strong> ${targetEmail}</p>
        <p><strong>🖥️ Server:</strong> localhost:2525</p>
    </div>
    
    <h3 style="color: #4a5568;">🔧 Thông tin kỹ thuật:</h3>
    <ul>
        <li>Protocol: SMTP</li>
        <li>Port: 2525</li>
        <li>Security: None (Test only)</li>
        <li>Content-Type: HTML + Text</li>
    </ul>
    
    <p style="color: #718096; font-style: italic;">
        Chúc bạn sử dụng hệ thống vui vẻ! 😊
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="font-size: 12px; color: #a0aec0;">
        Email này được gửi tự động từ script test. Đây là email demo.
    </p>
</div>
            `
        });
        
        console.log('✅ Email đã được gửi thành công!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📩 Đến:', targetEmail);
        console.log('🕒 Thời gian:', new Date().toLocaleString('vi-VN'));
        console.log('\n💡 Hãy kiểm tra giao diện web để xem email đã nhận!');
        
    } catch (error) {
        console.error('❌ Lỗi gửi email:', error.message);
        console.log('\n🔧 Kiểm tra:');
        console.log('   - Server có đang chạy không? (npm start)');
        console.log('   - SMTP server có chạy ở port 2525 không?');
        console.log('   - Email đích có đúng format không?');
    }
}

// Chạy test
if (require.main === module) {
    testSendEmail();
}

module.exports = { testSendEmail };
