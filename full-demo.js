const http = require('http');
const nodemailer = require('nodemailer');

async function fullDemo() {
    console.log('🎯 FULL DEMO - HỆ THỐNG EMAIL ẢO');
    console.log('=================================');
    
    // Tạo 3 email ảo
    const emails = [];
    
    for (let i = 1; i <= 3; i++) {
        console.log(`\n📧 Tạo email ảo thứ ${i}...`);
        
        const email = await createEmail();
        if (email) {
            emails.push(email);
            console.log(`✅ Created: ${email.email}`);
            
            // Gửi email test
            await sendTestEmail(email.email, i);
        }
        
        // Chờ 1 giây giữa các email
        await sleep(1000);
    }
    
    console.log('\n📊 DEMO SUMMARY:');
    console.log('================');
    
    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n${i + 1}. Email: ${email.email}`);
        console.log(`   ID: ${email.id}`);
        console.log(`   Expires: ${new Date(email.expiresAt).toLocaleString('vi-VN')}`);
        
        // Kiểm tra messages
        const messages = await getMessages(email.id);
        console.log(`   Messages: ${messages ? messages.length : 0}`);
    }
    
    console.log('\n🎉 DEMO HOÀN THÀNH!');
    console.log('==================');
    console.log('🌐 Mở trình duyệt: http://localhost:3000');
    console.log('💡 Sử dụng các email trên để test!');
}

// Tạo email
function createEmail() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({});
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/create-email',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.success ? response.data : null);
                } catch (error) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
    });
}

// Gửi email test
async function sendTestEmail(targetEmail, index) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'localhost',
            port: 2525,
            secure: false,
            auth: false
        });
        
        const subjects = [
            '🎉 Welcome to Temp Mail Demo!',
            '📧 Test Email #2 - Newsletter',
            '🚀 Demo Email #3 - Verification'
        ];
        
        await transporter.sendMail({
            from: `"Demo Sender ${index}" <demo${index}@example.com>`,
            to: targetEmail,
            subject: subjects[index - 1],
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #667eea;">Email Test #${index}</h2>
    <p>Đây là email demo thứ ${index} gửi đến <strong>${targetEmail}</strong></p>
    <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
    <div style="background: #f0f4f8; padding: 15px; border-radius: 8px;">
        <p>🎯 Demo thành công!</p>
        <p>📧 Hệ thống email ảo hoạt động tốt</p>
    </div>
</div>
            `
        });
        
        console.log(`📨 Sent email ${index} to ${targetEmail}`);
    } catch (error) {
        console.log(`❌ Failed to send email ${index}:`, error.message);
    }
}

// Lấy messages
function getMessages(emailId) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/email/${emailId}/messages`,
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.success ? response.data : null);
                } catch (error) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.end();
    });
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demo
fullDemo().catch(console.error);
