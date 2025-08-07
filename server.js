const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const SMTPServer = require('smtp-server').SMTPServer;
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 3000;
const SMTP_PORT = 2525;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Lưu trữ trong memory (production nên dùng database)
const tempEmails = new Map(); // Map<emailId, emailData>
const receivedEmails = new Map(); // Map<email, Array<emailObject>>

// Danh sách domain có sẵn
const availableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'throwaway.email'];

// Tạo tên email ngẫu nhiên
function generateRandomEmail() {
    const prefixes = ['temp', 'user', 'mail', 'test', 'demo', 'guest'];
    const randomString = Math.random().toString(36).substring(7);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
    
    return `${prefix}${randomString}@${domain}`;
}

// API Routes

// Tạo email ảo mới
app.post('/api/create-email', (req, res) => {
    const emailId = uuidv4();
    const email = generateRandomEmail();
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút
    
    const emailData = {
        id: emailId,
        email: email,
        createdAt: createdAt,
        expiresAt: expiresAt,
        isActive: true
    };
    
    tempEmails.set(emailId, emailData);
    receivedEmails.set(email, []);
    
    res.json({
        success: true,
        data: emailData
    });
});

// Lấy thông tin email theo ID
app.get('/api/email/:id', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    // Kiểm tra hết hạn
    if (new Date() > emailData.expiresAt) {
        emailData.isActive = false;
        tempEmails.set(emailId, emailData);
    }
    
    res.json({
        success: true,
        data: emailData
    });
});

// Lấy danh sách email đã nhận
app.get('/api/email/:id/messages', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    const messages = receivedEmails.get(emailData.email) || [];
    
    res.json({
        success: true,
        data: messages
    });
});

// Xóa email ảo
app.delete('/api/email/:id', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    tempEmails.delete(emailId);
    receivedEmails.delete(emailData.email);
    
    res.json({
        success: true,
        message: 'Email đã được xóa'
    });
});

// Gia hạn email
app.put('/api/email/:id/extend', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    // Gia hạn thêm 10 phút
    emailData.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    emailData.isActive = true;
    tempEmails.set(emailId, emailData);
    
    res.json({
        success: true,
        data: emailData
    });
});

// Lấy danh sách tất cả email
app.get('/api/emails', (req, res) => {
    const allEmails = Array.from(tempEmails.values());
    res.json({
        success: true,
        data: allEmails
    });
});

// Tạo SMTP Server để nhận email
const smtpServer = new SMTPServer({
    secure: false,
    authOptional: true,
    disabledCommands: ['AUTH'],
    logger: false,
    onData(stream, session, callback) {
        let emailData = '';
        
        stream.on('data', (chunk) => {
            emailData += chunk;
        });
        
        stream.on('end', async () => {
            try {
                const parsed = await simpleParser(emailData);
                
                // Lấy email người nhận
                const recipientEmail = session.envelope.rcptTo[0].address;
                
                // Kiểm tra xem email có tồn tại trong hệ thống không
                if (receivedEmails.has(recipientEmail)) {
                    const emailMessage = {
                        id: uuidv4(),
                        from: parsed.from?.text || 'Unknown',
                        to: recipientEmail,
                        subject: parsed.subject || 'No Subject',
                        text: parsed.text || '',
                        html: parsed.html || '',
                        receivedAt: new Date(),
                        attachments: parsed.attachments || []
                    };
                    
                    const messages = receivedEmails.get(recipientEmail);
                    messages.push(emailMessage);
                    receivedEmails.set(recipientEmail, messages);
                    
                    console.log(`Email nhận được cho ${recipientEmail}: ${parsed.subject}`);
                }
                
                callback();
            } catch (error) {
                console.error('Lỗi xử lý email:', error);
                callback(error);
            }
        });
    },
    onConnect(session, callback) {
        console.log('SMTP Connection từ:', session.remoteAddress);
        callback();
    },
    onMailFrom(address, session, callback) {
        console.log('Mail from:', address.address);
        callback();
    },
    onRcptTo(address, session, callback) {
        console.log('Mail to:', address.address);
        
        // Kiểm tra xem email có tồn tại trong hệ thống không
        const recipientEmail = address.address;
        if (!receivedEmails.has(recipientEmail)) {
            console.log(`⚠️ Email ${recipientEmail} không tồn tại trong hệ thống`);
            // Vẫn cho phép nhận email, chỉ log thông báo
        }
        
        callback();
    },
    onError(err) {
        console.error('🚨 Lỗi SMTP server:', err);
    }
});

// Dọn dẹp email hết hạn mỗi phút
setInterval(() => {
    const now = new Date();
    for (const [emailId, emailData] of tempEmails.entries()) {
        if (now > emailData.expiresAt) {
            console.log(`Xóa email hết hạn: ${emailData.email}`);
            tempEmails.delete(emailId);
            receivedEmails.delete(emailData.email);
        }
    }
}, 60000); // Mỗi 60 giây

// Khởi động servers
app.listen(PORT, () => {
    console.log(`🌐 Web server đang chạy tại http://localhost:${PORT}`);
});

smtpServer.listen(SMTP_PORT, '0.0.0.0', () => {
    console.log(`📧 SMTP server đang chạy tại port ${SMTP_PORT} (tất cả interfaces)`);
    console.log(`📧 SMTP server có thể nhận email từ bên ngoài qua port ${SMTP_PORT}`);
});

console.log('📮 Hệ thống Email Ảo đã khởi động!');
console.log('💡 Sử dụng API:');
console.log('   POST /api/create-email - Tạo email ảo mới');
console.log('   GET  /api/email/:id - Lấy thông tin email');
console.log('   GET  /api/email/:id/messages - Lấy tin nhắn đã nhận');
console.log('   PUT  /api/email/:id/extend - Gia hạn email');
console.log('   DELETE /api/email/:id - Xóa email');
console.log('');
console.log('🔧 Test SMTP từ bên ngoài:');
console.log(`   telnet YOUR_SERVER_IP ${SMTP_PORT}`);
console.log('   Hoặc sử dụng tool như swaks:');
console.log(`   swaks --to test@tempmail.com --from sender@example.com --server YOUR_SERVER_IP:${SMTP_PORT}`);
console.log('');
console.log('⚠️  Lưu ý: Đảm bảo port 2525 đã được mở trong firewall và router');
