const nodemailer = require('nodemailer');

// Cấu hình VPS
const VPS_IP = '8.219.169.133';
const SMTP_PORT = 2525; // Hoặc 587 nếu đang dùng server-port587.js
const TEST_DOMAIN = 'nguyenhuuhau.xyz';

console.log('📧 TEST GỬI EMAIL ĐẾN VPS');
console.log('========================');
console.log(`VPS: ${VPS_IP}:${SMTP_PORT}`);
console.log(`Website: https://${TEST_DOMAIN}/`);
console.log('');

// Tạo email ảo test (giả lập như website tạo)
const testEmails = [
    'temp123@tempmail.com',
    'user456@10minutemail.com', 
    'test789@guerrillamail.com',
    'demo999@throwaway.email'
];

async function sendTestEmail(recipientEmail) {
    console.log(`🚀 Gửi email đến: ${recipientEmail}`);
    
    try {
        // Tạo transporter
        const transporter = nodemailer.createTransport({
            host: VPS_IP,
            port: SMTP_PORT,
            secure: false,
            auth: false,
            ignoreTLS: true,  // Bỏ qua TLS
            requireTLS: false, // Không bắt buộc TLS
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            debug: true, // Bật debug để xem chi tiết
            logger: true
        });

        // Verify connection
        console.log('🔍 Kiểm tra kết nối SMTP...');
        await transporter.verify();
        console.log('✅ Kết nối SMTP thành công!');

        // Tạo nội dung email test
        const mailOptions = {
            from: 'test@example.com',
            to: recipientEmail,
            subject: `Test Email - ${new Date().toLocaleString()}`,
            text: `
Đây là email test từ script Node.js.

Thông tin:
- Gửi lúc: ${new Date().toLocaleString()}
- Gửi đến: ${recipientEmail}
- SMTP Server: ${VPS_IP}:${SMTP_PORT}
- Từ: test@example.com

Nếu bạn nhận được email này, SMTP server đã hoạt động tốt!
            `,
            html: `
<h2>🎉 Email Test Thành Công!</h2>
<p>Đây là email test từ script Node.js.</p>

<h3>📋 Thông tin:</h3>
<ul>
    <li><strong>Gửi lúc:</strong> ${new Date().toLocaleString()}</li>
    <li><strong>Gửi đến:</strong> ${recipientEmail}</li>
    <li><strong>SMTP Server:</strong> ${VPS_IP}:${SMTP_PORT}</li>
    <li><strong>Từ:</strong> test@example.com</li>
</ul>

<p>✅ <strong>Nếu bạn nhận được email này, SMTP server đã hoạt động tốt!</strong></p>

<hr>
<p><em>Website: <a href="https://${TEST_DOMAIN}/">https://${TEST_DOMAIN}/</a></em></p>
            `
        };

        // Gửi email
        console.log('📤 Đang gửi email...');
        const result = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email đã được gửi thành công!');
        console.log(`📧 Message ID: ${result.messageId}`);
        console.log(`📨 Response: ${result.response}`);
        console.log('');
        
        return true;
        
    } catch (error) {
        console.log('❌ Lỗi gửi email:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('   → SMTP server từ chối kết nối');
            console.log('   → Kiểm tra server có đang chạy không');
        } else if (error.code === 'ENOTFOUND') {
            console.log('   → Không tìm thấy server (kiểm tra IP)');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('   → Timeout - có thể firewall block');
        } else if (error.code === 'ECONNRESET') {
            console.log('   → Kết nối bị reset - server có thể từ chối');
        }
        
        console.log(`   → Full error: ${error}`);
        console.log('');
        return false;
    }
}

async function runTests() {
    console.log('🏁 Bắt đầu test gửi email...\n');
    
    let successCount = 0;
    
    // Test với từng email
    for (let i = 0; i < testEmails.length; i++) {
        const email = testEmails[i];
        console.log(`📋 Test ${i + 1}/${testEmails.length}`);
        
        const success = await sendTestEmail(email);
        if (success) {
            successCount++;
        }
        
        // Đợi 2 giây giữa các lần gửi
        if (i < testEmails.length - 1) {
            console.log('⏱️  Đợi 2 giây...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('📊 KẾT QUẢ CUỐI CÙNG:');
    console.log('========================');
    console.log(`✅ Thành công: ${successCount}/${testEmails.length}`);
    console.log(`❌ Thất bại: ${testEmails.length - successCount}/${testEmails.length}`);
    
    if (successCount > 0) {
        console.log('');
        console.log('🎉 SMTP SERVER HOẠT ĐỘNG TỐT!');
        console.log(`📱 Kiểm tra email tại: https://${TEST_DOMAIN}/`);
        console.log('💡 Tạo email ảo mới trên website và test nhận email');
    } else {
        console.log('');
        console.log('🚨 SMTP SERVER CÓ VẤN ĐỀ!');
        console.log('💡 Kiểm tra lại cấu hình server và firewall');
    }
}

// Chạy test
runTests().catch(console.error);
