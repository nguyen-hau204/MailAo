const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const SMTPServer = require('smtp-server').SMTPServer;
const { simpleParser } = require('mailparser');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// 🚨 PRODUCTION CONFIGURATION
const SMTP_PORT = 587; // Standard submission port (less likely to be blocked)
const REAL_DOMAIN = 'nguyenhuuhau.xyz'; // Your actual domain
const PUBLIC_IP = '8.219.169.133'; // Your VPS IP

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ========= Tempmail.id.vn PROXY (server-side) =========
const TEMPMail_HOST = 'tempmail.id.vn';
const TEMPMail_API_BASE = '/api';

function tempmailRequest(path, method = 'GET', data = null, expectText = false) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const headers = {
            'Accept': expectText ? 'text/plain,*/*' : 'application/json',
            'Authorization': `Bearer ${process.env.TEMPMAIL_API_TOKEN || ''}`,
        };
        if (payload) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const options = {
            hostname: TEMPMail_HOST,
            port: 443,
            path: `${TEMPMail_API_BASE}${path}`,
            method,
            headers,
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', (chunk) => (raw += chunk));
            res.on('end', () => {
                try {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        if (expectText) {
                            return resolve(raw);
                        }
                        return resolve(raw ? JSON.parse(raw) : {});
                    } else {
                        let errBody = raw;
                        try { errBody = JSON.parse(raw); } catch (_) {}
                        reject({ status: res.statusCode, body: errBody });
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

app.get('/proxy/tempmail/config', (req, res) => {
    const enabled = Boolean(process.env.TEMPMAIL_API_TOKEN);
    res.json({ success: true, enabled });
});

app.post('/proxy/tempmail/email/create', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).json({ success: false, message: 'Tempmail proxy not configured' });
    }
    try {
        const { user = '', domain = 'tempmail.id.vn' } = req.body || {};
        const result = await tempmailRequest('/email/create', 'POST', { user, domain });
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.body?.message || 'Proxy error', detail: err.body || undefined });
    }
});

app.get('/proxy/tempmail/email', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).json({ success: false, message: 'Tempmail proxy not configured' });
    }
    try {
        const result = await tempmailRequest('/email', 'GET');
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.body?.message || 'Proxy error', detail: err.body || undefined });
    }
});

app.get('/proxy/tempmail/email/:mailId', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).json({ success: false, message: 'Tempmail proxy not configured' });
    }
    try {
        const result = await tempmailRequest(`/email/${encodeURIComponent(req.params.mailId)}`, 'GET');
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.body?.message || 'Proxy error', detail: err.body || undefined });
    }
});

app.get('/proxy/tempmail/message/:messageId', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).send('Tempmail proxy not configured');
    }
    try {
        const content = await tempmailRequest(`/message/${encodeURIComponent(req.params.messageId)}`, 'GET', null, true);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(content);
    } catch (err) {
        res.status(err.status || 500).send(typeof err.body === 'string' ? err.body : (err.body?.message || 'Proxy error'));
    }
});

app.post('/proxy/tempmail/netflix/get-code', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).json({ success: false, message: 'Tempmail proxy not configured' });
    }
    try {
        const { email } = req.body || {};
        const result = await tempmailRequest('/netflix/get-code', 'POST', { email });
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.body?.message || 'Proxy error', detail: err.body || undefined });
    }
});

app.get('/proxy/tempmail/user', async (req, res) => {
    if (!process.env.TEMPMAIL_API_TOKEN) {
        return res.status(501).json({ success: false, message: 'Tempmail proxy not configured' });
    }
    try {
        const result = await tempmailRequest('/user', 'GET');
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.body?.message || 'Proxy error', detail: err.body || undefined });
    }
});

// Storage
const tempEmails = new Map();
const receivedEmails = new Map();

// 🎯 USE REAL DOMAIN - This is crucial for external email delivery
function generateRandomEmail() {
    const prefixes = ['temp', 'user', 'mail', 'test', 'demo', 'guest', 'inbox', 'recv'];
    const randomString = Math.random().toString(36).substring(2, 8); // 6 characters
    const timestamp = Date.now().toString(36).slice(-4); // 4 characters from timestamp
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    // Use your REAL domain - this is why Garena can't send emails
    return `${prefix}${randomString}${timestamp}@${REAL_DOMAIN}`;
}

// API Routes (same as before)
app.post('/api/create-email', (req, res) => {
    const emailId = uuidv4();
    const email = generateRandomEmail();
    const createdAt = new Date();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes instead of 10
    
    const emailData = {
        id: emailId,
        email: email,
        createdAt: createdAt,
        expiresAt: expiresAt,
        isActive: true
    };
    
    tempEmails.set(emailId, emailData);
    receivedEmails.set(email, []);
    
    console.log(`📧 Created new temp email: ${email}`);
    
    res.json({
        success: true,
        data: emailData
    });
});

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

app.put('/api/email/:id/extend', (req, res) => {
    const emailId = req.params.id;
    const emailData = tempEmails.get(emailId);
    
    if (!emailData) {
        return res.status(404).json({
            success: false,
            message: 'Email không tồn tại'
        });
    }
    
    emailData.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    emailData.isActive = true;
    tempEmails.set(emailId, emailData);
    
    res.json({
        success: true,
        data: emailData
    });
});

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

// 🚀 PRODUCTION SMTP SERVER CONFIGURATION
const smtpServer = new SMTPServer({
    secure: false, // No TLS initially
    authOptional: true, // Allow unauthenticated
    disabledCommands: ['AUTH'], // Disable AUTH for simplicity
    allowInsecureAuth: true,
    hideSTARTTLS: true, // Don't advertise STARTTLS to avoid confusion
    
    // 🎯 ACCEPT EMAILS FOR YOUR DOMAIN ONLY
    onRcptTo(address, session, callback) {
        const recipientEmail = address.address.toLowerCase();
        
        console.log(`📥 Incoming email for: ${recipientEmail}`);
        
        // Only accept emails for your domain
        if (!recipientEmail.endsWith(`@${REAL_DOMAIN.toLowerCase()}`)) {
            console.log(`❌ Rejected: ${recipientEmail} - Not our domain`);
            return callback(new Error(`5.1.1 User unknown in virtual mailbox table`));
        }
        
        // Check if the email exists in our system
        if (!receivedEmails.has(recipientEmail)) {
            console.log(`⚠️  Email ${recipientEmail} not found in active emails`);
            // Still accept it - maybe it was recently created
        }
        
        console.log(`✅ Accepted: ${recipientEmail}`);
        callback();
    },
    
    onMailFrom(address, session, callback) {
        console.log(`📤 Mail from: ${address.address}`);
        // Accept from any sender
        callback();
    },
    
    onConnect(session, callback) {
        console.log(`🔗 SMTP Connection from: ${session.remoteAddress}`);
        callback();
    },
    
    onData(stream, session, callback) {
        let emailData = '';
        
        console.log(`📨 Receiving email data...`);
        
        stream.on('data', (chunk) => {
            emailData += chunk;
        });
        
        stream.on('end', async () => {
            try {
                const parsed = await simpleParser(emailData);
                
                // Process all recipients
                for (const recipient of session.envelope.rcptTo) {
                    const recipientEmail = recipient.address.toLowerCase();
                    
                    console.log(`📧 Processing email for: ${recipientEmail}`);
                    console.log(`   From: ${session.envelope.mailFrom?.address || 'unknown'}`);
                    console.log(`   Subject: ${parsed.subject || 'No Subject'}`);
                    
                    // Create or get the email list
                    if (!receivedEmails.has(recipientEmail)) {
                        receivedEmails.set(recipientEmail, []);
                        console.log(`📝 Created new mailbox for: ${recipientEmail}`);
                    }
                    
                    const emailMessage = {
                        id: uuidv4(),
                        from: parsed.from?.text || session.envelope.mailFrom?.address || 'Unknown Sender',
                        to: recipientEmail,
                        subject: parsed.subject || 'No Subject',
                        text: parsed.text || '',
                        html: parsed.html || '',
                        receivedAt: new Date(),
                        attachments: parsed.attachments || [],
                        headers: parsed.headers || new Map()
                    };
                    
                    const messages = receivedEmails.get(recipientEmail);
                    messages.unshift(emailMessage); // Add to beginning
                    
                    // Keep only last 50 emails per inbox
                    if (messages.length > 50) {
                        messages.splice(50);
                    }
                    
                    receivedEmails.set(recipientEmail, messages);
                    
                    console.log(`✅ Email saved for ${recipientEmail} (${messages.length} total messages)`);
                }
                
                callback();
            } catch (error) {
                console.error('❌ Email processing error:', error);
                callback(error);
            }
        });
    },
    
    onError(err) {
        console.error('🚨 SMTP server error:', err);
    }
});

// Enhanced error handling
smtpServer.on('error', (err) => {
    console.error('🚨 SMTP Server Error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${SMTP_PORT} is already in use!`);
        console.error('💡 Kill existing process or use different port');
        process.exit(1);
    }
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    smtpServer.close(() => {
        console.log('✅ SMTP server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup expired emails every 5 minutes
setInterval(() => {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [emailId, emailData] of tempEmails.entries()) {
        if (now > emailData.expiresAt) {
            console.log(`🗑️ Cleaning expired email: ${emailData.email}`);
            tempEmails.delete(emailId);
            receivedEmails.delete(emailData.email);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired emails`);
    }
}, 5 * 60 * 1000); // Every 5 minutes

// Start servers
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://0.0.0.0:${PORT}`);
});

smtpServer.listen(SMTP_PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error(`❌ Failed to start SMTP server on port ${SMTP_PORT}:`, err);
        if (err.code === 'EACCES') {
            console.error('💡 Try running with sudo or use port > 1024');
        }
        process.exit(1);
    }
    console.log(`📧 SMTP server running on ${PUBLIC_IP}:${SMTP_PORT}`);
});

console.log('🚀 PRODUCTION Temp Mail System Started!');
console.log('==========================================');
console.log(`📧 SMTP Server: ${PUBLIC_IP}:${SMTP_PORT}`);
console.log(`🌐 Web Interface: http://${PUBLIC_IP}:${PORT}`);
console.log(`🏷️  Domain: ${REAL_DOMAIN}`);
console.log('');
console.log('🔧 DNS Configuration Required:');
console.log('==============================');
console.log(`Add MX record: ${REAL_DOMAIN}. IN MX 10 ${PUBLIC_IP}.`);
console.log(`Add A record: mail.${REAL_DOMAIN}. IN A ${PUBLIC_IP}`);
console.log(`Add SPF record: ${REAL_DOMAIN}. IN TXT "v=spf1 ip4:${PUBLIC_IP} ~all"`);
console.log('');
console.log('📝 Test Commands:');
console.log('=================');
console.log(`telnet ${PUBLIC_IP} ${SMTP_PORT}`);
console.log(`swaks --to test@${REAL_DOMAIN} --from external@example.com --server ${PUBLIC_IP}:${SMTP_PORT}`);
console.log('');
console.log('🚨 IMPORTANT NOTES:');
console.log('===================');
console.log('1. Configure DNS MX records to point to your server');
console.log('2. Open port 587 in firewall and cloud security groups');
console.log('3. Some ISPs block port 25, use port 587 instead');
console.log('4. Configure reverse DNS (PTR record) for better deliverability');
console.log('5. Test with external services like mail-tester.com');
console.log('');
