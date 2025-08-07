const http = require('http');

// Simple function to test API
function testAPI() {
    console.log('🧪 Testing Temp Mail System API...');
    
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
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.success) {
                    console.log('✅ Email created successfully!');
                    console.log('📮 Email:', response.data.email);
                    console.log('🆔 ID:', response.data.id);
                    console.log('⏰ Expires:', response.data.expiresAt);
                    console.log('\n🎯 Test completed!');
                    console.log('🌐 Open browser: http://localhost:3000');
                    console.log('📧 Use this email:', response.data.email);
                } else {
                    console.log('❌ Failed:', response.message);
                }
            } catch (error) {
                console.log('❌ Parse error:', error.message);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.log('❌ Connection error:', error.message);
        console.log('💡 Make sure server is running with: npm start');
    });
    
    req.write(postData);
    req.end();
}

// Run test
testAPI();
