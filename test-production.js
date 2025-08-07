const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns').promises;

// Configuration
const DOMAIN = 'nguyenhuuhau.xyz';
const VPS_IP = '8.219.169.133';
const SMTP_PORT = 587;

console.log('🚀 TESTING PRODUCTION EMAIL SYSTEM');
console.log('===================================\n');

class ProductionTester {
    async runFullTest() {
        console.log('🏁 Starting comprehensive test...\n');
        
        try {
            // 1. Test DNS Configuration
            await this.testDNSConfiguration();
            
            // 2. Test SMTP Connectivity
            await this.testSMTPConnectivity();
            
            // 3. Test Email Sending
            await this.testEmailSending();
            
            // 4. Provide recommendations
            this.provideRecommendations();
            
        } catch (error) {
            console.error('🚨 Test failed:', error);
        }
    }
    
    async testDNSConfiguration() {
        console.log('1️⃣ TESTING DNS CONFIGURATION');
        console.log('-----------------------------');
        
        try {
            // Test A record
            console.log(`🔍 Checking A record for ${DOMAIN}...`);
            const aRecords = await dns.resolve4(DOMAIN);
            console.log('✅ A Records found:', aRecords);
            
            if (aRecords.includes(VPS_IP)) {
                console.log('✅ A record correctly points to VPS IP');
            } else {
                console.log('⚠️  A record does not point to VPS IP');
            }
        } catch (error) {
            console.log('❌ A record lookup failed:', error.message);
        }
        
        try {
            // Test MX record
            console.log(`\n🔍 Checking MX record for ${DOMAIN}...`);
            const mxRecords = await dns.resolveMx(DOMAIN);
            console.log('📧 MX Records found:', mxRecords);
            
            if (mxRecords && mxRecords.length > 0) {
                console.log('✅ MX records exist');
                
                // Check if MX points to our server
                let pointsToUs = false;
                for (const mx of mxRecords) {
                    try {
                        const mxARecords = await dns.resolve4(mx.exchange);
                        if (mxARecords.includes(VPS_IP)) {
                            pointsToUs = true;
                            console.log(`✅ MX record ${mx.exchange} points to our server`);
                        }
                    } catch (e) {
                        console.log(`⚠️  Could not resolve MX: ${mx.exchange}`);
                    }
                }
                
                if (!pointsToUs) {
                    console.log('❌ No MX record points to our server IP');
                }
            } else {
                console.log('❌ No MX records found');
            }
        } catch (error) {
            console.log('❌ MX record lookup failed:', error.message);
            console.log('🚨 THIS IS THE MAIN PROBLEM - No MX records!');
        }
        
        try {
            // Test SPF record
            console.log(`\n🔍 Checking SPF record for ${DOMAIN}...`);
            const txtRecords = await dns.resolveTxt(DOMAIN);
            const spfRecord = txtRecords.find(record => 
                record.join('').toLowerCase().includes('v=spf1')
            );
            
            if (spfRecord) {
                console.log('✅ SPF record found:', spfRecord.join(''));
                if (spfRecord.join('').includes(VPS_IP)) {
                    console.log('✅ SPF record includes our IP');
                } else {
                    console.log('⚠️  SPF record does not include our IP');
                }
            } else {
                console.log('⚠️  No SPF record found');
            }
        } catch (error) {
            console.log('⚠️  SPF record lookup failed:', error.message);
        }
        
        console.log('');
    }
    
    async testSMTPConnectivity() {
        console.log('2️⃣ TESTING SMTP CONNECTIVITY');
        console.log('-----------------------------');
        
        console.log(`🔍 Testing connection to ${VPS_IP}:${SMTP_PORT}...`);
        
        const connected = await this.testTCPConnection(VPS_IP, SMTP_PORT);
        
        if (connected) {
            console.log('✅ TCP connection successful');
            
            // Test SMTP protocol
            console.log('🔍 Testing SMTP protocol...');
            const smtpOk = await this.testSMTPProtocol(VPS_IP, SMTP_PORT);
            
            if (smtpOk) {
                console.log('✅ SMTP protocol working correctly');
            } else {
                console.log('❌ SMTP protocol not responding correctly');
            }
        } else {
            console.log('❌ TCP connection failed');
            console.log('💡 Check if server is running and port is open');
        }
        
        console.log('');
    }
    
    async testEmailSending() {
        console.log('3️⃣ TESTING EMAIL SENDING');
        console.log('-------------------------');
        
        const testEmails = [
            `test${Date.now()}@${DOMAIN}`,
            `demo${Math.floor(Math.random() * 1000)}@${DOMAIN}`,
            `temp${Math.floor(Math.random() * 1000)}@${DOMAIN}`
        ];
        
        console.log('🔍 Testing email delivery to temp emails...');
        
        for (const testEmail of testEmails) {
            console.log(`\n📧 Sending test email to: ${testEmail}`);
            
            try {
                const success = await this.sendTestEmail(testEmail);
                if (success) {
                    console.log('✅ Email sent successfully');
                } else {
                    console.log('❌ Email sending failed');
                }
            } catch (error) {
                console.log('❌ Email sending error:', error.message);
            }
        }
        
        console.log('');
    }
    
    async testTCPConnection(host, port, timeout = 5000) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            let connected = false;
            
            const timer = setTimeout(() => {
                if (!connected) {
                    client.destroy();
                    resolve(false);
                }
            }, timeout);
            
            client.connect(port, host, () => {
                connected = true;
                clearTimeout(timer);
                client.destroy();
                resolve(true);
            });
            
            client.on('error', () => {
                clearTimeout(timer);
                resolve(false);
            });
        });
    }
    
    async testSMTPProtocol(host, port) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            let response = '';
            let step = 0;
            
            const cleanup = () => {
                client.destroy();
            };
            
            const timeout = setTimeout(() => {
                cleanup();
                resolve(false);
            }, 10000);
            
            client.connect(port, host);
            
            client.on('data', (data) => {
                response += data.toString();
                
                if (step === 0 && response.includes('220')) {
                    client.write('EHLO test.com\r\n');
                    step = 1;
                    response = '';
                } else if (step === 1 && response.includes('250')) {
                    client.write('QUIT\r\n');
                    step = 2;
                } else if (step === 2) {
                    clearTimeout(timeout);
                    cleanup();
                    resolve(true);
                }
            });
            
            client.on('error', () => {
                clearTimeout(timeout);
                cleanup();
                resolve(false);
            });
        });
    }
    
    async sendTestEmail(recipientEmail) {
        try {
            const transporter = nodemailer.createTransporter({
                host: VPS_IP,
                port: SMTP_PORT,
                secure: false,
                auth: false,
                ignoreTLS: true,
                requireTLS: false,
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 10000
            });
            
            const mailOptions = {
                from: 'test@external-server.com',
                to: recipientEmail,
                subject: `Production Test - ${new Date().toISOString()}`,
                text: `This is a production test email sent at ${new Date().toISOString()}\n\nIf you receive this, the SMTP server is working correctly!`,
                html: `
                    <h2>🎉 Production Test Email</h2>
                    <p>This is a production test email sent at <strong>${new Date().toISOString()}</strong></p>
                    <p>✅ If you receive this, the SMTP server is working correctly!</p>
                    <hr>
                    <p><small>Server: ${VPS_IP}:${SMTP_PORT}</small></p>
                    <p><small>Domain: ${DOMAIN}</small></p>
                `
            };
            
            const result = await transporter.sendMail(mailOptions);
            console.log(`   📨 Message ID: ${result.messageId}`);
            return true;
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }
    }
    
    provideRecommendations() {
        console.log('💡 RECOMMENDATIONS & NEXT STEPS');
        console.log('===============================\n');
        
        console.log('🔧 IMMEDIATE ACTIONS NEEDED:');
        console.log('1. Configure DNS MX Records:');
        console.log(`   ${DOMAIN}. IN MX 10 ${VPS_IP}.`);
        console.log(`   OR create mail subdomain:`);
        console.log(`   mail.${DOMAIN}. IN A ${VPS_IP}`);
        console.log(`   ${DOMAIN}. IN MX 10 mail.${DOMAIN}.`);
        console.log('');
        
        console.log('2. Add SPF Record:');
        console.log(`   ${DOMAIN}. IN TXT "v=spf1 ip4:${VPS_IP} ~all"`);
        console.log('');
        
        console.log('3. Configure Firewall:');
        console.log(`   sudo ufw allow ${SMTP_PORT}`);
        console.log(`   sudo iptables -A INPUT -p tcp --dport ${SMTP_PORT} -j ACCEPT`);
        console.log('');
        
        console.log('4. Start Production Server:');
        console.log('   node server-production.js');
        console.log('');
        
        console.log('🚨 WHY GARENA CAN\'T SEND EMAILS:');
        console.log('================================');
        console.log('❌ No MX record pointing to your server');
        console.log('❌ Using fake domains (tempmail.com) instead of your real domain');
        console.log('❌ Port 2525 might be blocked by ISPs');
        console.log('❌ DNS not configured for email delivery');
        console.log('');
        
        console.log('✅ SOLUTION:');
        console.log('============');
        console.log('1. Use your real domain (nguyenhuuhau.xyz) for email addresses');
        console.log('2. Configure MX records in your DNS provider');
        console.log('3. Use standard port 587 instead of 2525');
        console.log('4. Test with external SMTP testing tools');
        console.log('');
        
        console.log('📝 TESTING CHECKLIST:');
        console.log('=====================');
        console.log('□ DNS MX records configured');
        console.log('□ Port 587 open in firewall');
        console.log('□ Server running on 0.0.0.0:587');
        console.log('□ Test with swaks or telnet');
        console.log('□ Create temp email with your domain');
        console.log('□ Send test email from external service');
        console.log('');
        
        console.log('🛠️  USEFUL COMMANDS:');
        console.log('====================');
        console.log(`dig MX ${DOMAIN}`);
        console.log(`nslookup -type=mx ${DOMAIN}`);
        console.log(`telnet ${VPS_IP} ${SMTP_PORT}`);
        console.log(`swaks --to temp@${DOMAIN} --from test@example.com --server ${VPS_IP}:${SMTP_PORT}`);
    }
}

// Run the test
const tester = new ProductionTester();
tester.runFullTest().catch(console.error);
