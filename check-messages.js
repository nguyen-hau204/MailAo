const http = require('http');

// Check messages for the test email
const emailId = 'f4370b55-f9f3-4510-bbd9-b1c072d2da8e'; // From latest test

function checkMessages() {
    console.log('📬 Checking messages for email...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/email/${emailId}/messages`,
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.success) {
                    console.log(`✅ Messages retrieved! Count: ${response.data.length}`);
                    
                    if (response.data.length > 0) {
                        console.log('\n📧 Emails received:');
                        response.data.forEach((msg, index) => {
                            console.log(`\n${index + 1}. Subject: ${msg.subject}`);
                            console.log(`   From: ${msg.from}`);
                            console.log(`   To: ${msg.to}`);
                            console.log(`   Received: ${new Date(msg.receivedAt).toLocaleString('vi-VN')}`);
                            console.log(`   Preview: ${msg.text.substring(0, 100)}...`);
                        });
                    } else {
                        console.log('📭 No messages yet. Email may still be processing...');
                    }
                } else {
                    console.log('❌ Failed to get messages:', response.message);
                }
            } catch (error) {
                console.log('❌ Parse error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Connection error:', error.message);
    });
    
    req.end();
}

checkMessages();
