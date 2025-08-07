const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const SMTPServer = require('smtp-server').SMTPServer;
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 3000;
const SMTP_PORT = 25; // Standard SMTP port

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Storage
const tempEmails = new Map();
const receivedEmails = new Map();

// Sử dụng domain thực (cần có domain name)
const publicDomain = process.env.DOMAIN || 'yourdomain.com';
const availableDomains = [publicDomain];

function generateRandomEmail() {
    const prefixes = ['temp', 'user', 'mail', 'test', 'demo', 'guest'];
    const randomString = Math.random().toString(36).substring(7);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    return `${prefix}${randomString}@${publicDomain}`;
}

// API Routes (giống như cũ)
app.post('/api/create-email', (req, res) => {
    const emailId = uuidv4();
    const email = generateRandomEmail();
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
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

// Các API routes khác (giống server.js)
app.get('/api/email/:id', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    if (new Date() > emailData.expiresAt) {
        emailData.isActive = false;
        tempEmails.set(emailId, emailData);
    }
    
    res.json({
        success: true,
        data: emailData
    });
});

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

// SMTP Server cho external access
const smtpServer = new SMTPServer({
    secure: false,
    authOptional: true,
    // Lắng nghe tất cả interfaces (0.0.0.0) thay vì chỉ localhost
    host: '0.0.0.0',
    onData(stream, session, callback) {
        let emailData = '';
        
        stream.on('data', (chunk) => {
            emailData += chunk;
        });
        
        stream.on('end', async () => {
            try {
                const parsed = await simpleParser(emailData);
                const recipientEmail = session.envelope.rcptTo[0].address;
                
                console.log(`📧 Received email for: ${recipientEmail}`);
                console.log(`📨 From: ${session.envelope.mailFrom.address}`);
                console.log(`📑 Subject: ${parsed.subject}`);
                
                if (receivedEmails.has(recipientEmail)) {
                    const emailMessage = {
                        id: uuidv4(),
                        from: parsed.from?.text || session.envelope.mailFrom.address || 'Unknown',
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
                    
                    console.log(`✅ Email saved for ${recipientEmail}`);
                } else {
                    console.log(`❌ Email ${recipientEmail} not found in system`);
                }
                
                callback();
            } catch (error) {
                console.error('❌ Email processing error:', error);
                callback(error);
            }
        });
    },
    onConnect(session, callback) {
        console.log(`🔗 SMTP Connection from: ${session.remoteAddress}`);
        callback();
    },
    onMailFrom(address, session, callback) {
        console.log(`📤 Mail from: ${address.address}`);
        callback();
    },
    onRcptTo(address, session, callback) {
        console.log(`📥 Mail to: ${address.address}`);
        // Chấp nhận tất cả email đến domain của chúng ta
        if (address.address.endsWith(`@${publicDomain}`)) {
            callback();
        } else {
            callback(new Error('Domain not accepted'));
        }
    }
});

// Cleanup expired emails
setInterval(() => {
    const now = new Date();
    for (const [emailId, emailData] of tempEmails.entries()) {
        if (now > emailData.expiresAt) {
            console.log(`🗑️ Cleanup expired email: ${emailData.email}`);
            tempEmails.delete(emailId);
            receivedEmails.delete(emailData.email);
        }
    }
}, 60000);

// Start servers
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://0.0.0.0:${PORT}`);
});

smtpServer.listen(SMTP_PORT, '0.0.0.0', () => {
    console.log(`📧 SMTP server running on port ${SMTP_PORT} (public access)`);
});

console.log('🚀 PUBLIC Temp Mail System started!');
console.log('📋 Configuration:');
console.log(`   🌐 Web: http://0.0.0.0:${PORT}`);
console.log(`   📧 SMTP: 0.0.0.0:${SMTP_PORT}`);
console.log(`   🏷️  Domain: ${publicDomain}`);
console.log('');
console.log('⚠️  WARNING: This server is now accessible from internet!');
console.log('🔒 Make sure your firewall/router is configured properly.');
console.log('📝 Don\'t forget to set DNS MX record for your domain!');
