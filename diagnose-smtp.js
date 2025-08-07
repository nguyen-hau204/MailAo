const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

console.log('🔍 CHẨN ĐOÁN HỆ THỐNG EMAIL ẢO');
console.log('================================\n');

// Cấu hình
const SMTP_PORT = 2525;
const PUBLIC_IP = '8.219.169.133'; // IP VPS của bạn
const DOMAIN = 'nguyenhuuhau.xyz'; // Domain thực của bạn

class SMTPDiagnostic {
    async runFullDiagnostic() {
        console.log('🏁 BẮT ĐẦU CHẨN ĐOÁN TOÀN DIỆN\n');

        // 1. Kiểm tra cấu hình local
        await this.checkLocalConfiguration();
        
        // 2. Kiểm tra network connectivity
        await this.checkNetworkConnectivity();
        
        // 3. Kiểm tra SMTP server
        await this.checkSMTPServer();
        
        // 4. Kiểm tra DNS configuration
        await this.checkDNSConfiguration();
        
        // 5. Đưa ra khuyến nghị
        this.provideSolutions();
    }

    async checkLocalConfiguration() {
        console.log('1️⃣ KIỂM TRA CẤU HÌNH LOCAL');
        console.log('---------------------------');

        // Kiểm tra port đang listen
        console.log('🔍 Kiểm tra port đang listen...');
        try {
            const netstatOutput = await this.runCommand('netstat -tlnp');
            if (netstatOutput.includes(':2525')) {
                console.log('✅ Port 2525 đang được listen');
            } else {
                console.log('❌ Port 2525 KHÔNG được listen - Server chưa chạy!');
                return;
            }
        } catch (error) {
            console.log('⚠️  Không thể check netstat (Windows)');
            console.log('💡 Thử check bằng cách khác...');
        }

        // Kiểm tra process Node.js
        console.log('\n🔍 Kiểm tra process Node.js...');
        try {
            const psOutput = await this.runCommand('tasklist');
            if (psOutput.includes('node.exe')) {
                console.log('✅ Node.js process đang chạy');
            } else {
                console.log('❌ Không tìm thấy Node.js process');
            }
        } catch (error) {
            console.log('⚠️  Không thể check processes');
        }

        console.log('');
    }

    async checkNetworkConnectivity() {
        console.log('2️⃣ KIỂM TRA KẾT NỐI NETWORK');
        console.log('---------------------------');

        // Test kết nối local
        console.log('🔍 Test kết nối local (localhost:2525)...');
        const localConnected = await this.testConnection('127.0.0.1', SMTP_PORT);
        
        if (localConnected) {
            console.log('✅ Kết nối local thành công');
        } else {
            console.log('❌ Không thể kết nối local - Server không chạy hoặc sai port');
            return;
        }

        // Test kết nối từ external IP
        console.log('\n🔍 Test kết nối external (VPS IP:2525)...');
        const externalConnected = await this.testConnection(PUBLIC_IP, SMTP_PORT);
        
        if (externalConnected) {
            console.log('✅ Kết nối external thành công');
        } else {
            console.log('❌ Không thể kết nối external - Firewall hoặc network issue');
        }

        console.log('');
    }

    async checkSMTPServer() {
        console.log('3️⃣ KIỂM TRA SMTP SERVER');
        console.log('----------------------');

        console.log('🔍 Test SMTP commands...');
        
        try {
            const smtpTest = await this.testSMTPCommands('127.0.0.1', SMTP_PORT);
            if (smtpTest) {
                console.log('✅ SMTP server respond correctly');
            } else {
                console.log('❌ SMTP server không respond đúng protocol');
            }
        } catch (error) {
            console.log('❌ Lỗi test SMTP:', error.message);
        }

        console.log('');
    }

    async checkDNSConfiguration() {
        console.log('4️⃣ KIỂM TRA DNS CONFIGURATION');
        console.log('-----------------------------');

        console.log('🔍 Check DNS MX records...');
        try {
            const mxRecords = await this.runCommand(`nslookup -type=mx ${DOMAIN}`);
            console.log('📋 MX Records for', DOMAIN + ':');
            console.log(mxRecords);
            
            if (mxRecords.includes(PUBLIC_IP) || mxRecords.includes(DOMAIN)) {
                console.log('✅ MX record có vẻ OK');
            } else {
                console.log('❌ MX record chưa được cấu hình hoặc không point đến server');
            }
        } catch (error) {
            console.log('⚠️  Không thể check MX records:', error.message);
        }

        console.log('');
    }

    provideSolutions() {
        console.log('💡 KHUYẾN NGHỊ VÀ GIẢI PHÁP');
        console.log('===========================\n');

        console.log('🔧 1. KHẮC PHỤC NETWORK:');
        console.log('   ▪️ Đảm bảo server chạy trên 0.0.0.0:2525 (không phải 127.0.0.1)');
        console.log('   ▪️ Mở port 2525 trong firewall:');
        console.log('     ufw allow 2525');
        console.log('     iptables -A INPUT -p tcp --dport 2525 -j ACCEPT');
        console.log('   ▪️ Kiểm tra cloud provider security groups\n');

        console.log('🌐 2. KHẮC PHỤC DNS:');
        console.log('   ▪️ Thêm MX record trong DNS:');
        console.log(`     ${DOMAIN}. IN MX 10 ${PUBLIC_IP}.`);
        console.log('   ▪️ Hoặc tạo subdomain cho mail:');
        console.log(`     mail.${DOMAIN}. IN A ${PUBLIC_IP}`);
        console.log(`     ${DOMAIN}. IN MX 10 mail.${DOMAIN}.\n`);

        console.log('📧 3. KHẮC PHỤC SMTP:');
        console.log('   ▪️ Sử dụng port 587 thay vì 2525 (ít bị block hơn)');
        console.log('   ▪️ Cấu hình reverse DNS (PTR record)');
        console.log('   ▪️ Thêm SPF record: "v=spf1 ip4:' + PUBLIC_IP + ' ~all"\n');

        console.log('🚨 4. TẠI SAO GARENA KHÔNG GỬI ĐƯỢC:');
        console.log('   ❌ Domain tempmail.com không thuộc về bạn');
        console.log('   ❌ Không có MX record point đến server của bạn');
        console.log('   ❌ Port 2525 có thể bị ISP block');
        console.log('   ❌ Server có thể không accessible từ internet\n');

        console.log('✅ 5. GIẢI PHÁP KHUYẾN NGHỊ:');
        console.log('   1️⃣ Dùng domain thực của bạn (nguyenhuuhau.xyz)');
        console.log('   2️⃣ Cấu hình MX record point đến VPS IP');
        console.log('   3️⃣ Chuyển sang port 25 hoặc 587');
        console.log('   4️⃣ Đảm bảo firewall mở port');
        console.log('   5️⃣ Test từ external service như mail-tester.com');

        console.log('\n📝 NEXT STEPS:');
        console.log('==============');
        console.log('1. Chạy: node server-port587.js (thử port 587)');
        console.log('2. Cấu hình DNS MX record');
        console.log('3. Test với external SMTP tester');
        console.log('4. Sử dụng domain thực thay vì domain giả');
    }

    async testConnection(host, port, timeout = 5000) {
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

    async testSMTPCommands(host, port) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            let response = '';
            let step = 0;

            client.connect(port, host, () => {
                // SMTP server should send greeting
            });

            client.on('data', (data) => {
                response += data.toString();
                
                if (step === 0 && response.includes('220')) {
                    // Server greeting received, send HELO
                    client.write('HELO test.com\r\n');
                    step = 1;
                    response = '';
                } else if (step === 1 && response.includes('250')) {
                    // HELO accepted
                    client.write('QUIT\r\n');
                    step = 2;
                } else if (step === 2) {
                    client.destroy();
                    resolve(true);
                }
            });

            client.on('error', () => {
                resolve(false);
            });

            setTimeout(() => {
                client.destroy();
                resolve(false);
            }, 10000);
        });
    }

    async runCommand(command) {
        return new Promise((resolve, reject) => {
            const process = spawn('cmd', ['/c', command], { shell: true });
            let output = '';
            
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            process.on('close', (code) => {
                resolve(output);
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }
}

// Chạy chẩn đoán
const diagnostic = new SMTPDiagnostic();
diagnostic.runFullDiagnostic().catch(console.error);
