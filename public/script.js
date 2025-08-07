// API Client for Tempmail.id.vn
class TempmailAPI {
    constructor() {
        this.apiToken = localStorage.getItem('tempmail_api_token') || '';
        this.baseURL = 'https://tempmail.id.vn/api';
        this.currentEmail = null;
    }

    setApiToken(token) {
        this.apiToken = token;
        localStorage.setItem('tempmail_api_token', token);
    }

    async createEmail(user = '', domain = 'tempmail.id.vn') {
        try {
            const response = await fetch(`${this.baseURL}/email/create`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify({ user, domain })
            });

            const result = await response.json();
            if (response.ok) {
                this.currentEmail = result;
                return { success: true, data: result };
            } else {
                return { success: false, message: result.message || 'API Error' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getEmailList() {
        try {
            const response = await fetch(`${this.baseURL}/email`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result };
            } else {
                return { success: false, message: result.message || 'API Error' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getMessages(mailId) {
        try {
            const response = await fetch(`${this.baseURL}/email/${mailId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result };
            } else {
                return { success: false, message: result.message || 'API Error' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getMessageContent(messageId) {
        try {
            const response = await fetch(`${this.baseURL}/message/${messageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            if (response.ok) {
                const content = await response.text();
                return { success: true, data: content };
            } else {
                return { success: false, message: 'Failed to get message content' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getNetflixCode(email) {
        try {
            const response = await fetch(`${this.baseURL}/netflix/get-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result };
            } else {
                return { success: false, message: result.message || 'API Error' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getUserInfo() {
        try {
            const response = await fetch(`${this.baseURL}/user`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true, data: result };
            } else {
                return { success: false, message: result.message || 'API Error' };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

class TempMailSystem {
    constructor() {
        this.currentEmailId = null;
        this.refreshInterval = null;
        this.useLocalAPI = true; // true: local API, false: tempmail.id.vn API
        this.tempmailAPI = new TempmailAPI();
        this.currentMailId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        // Tự động tạo email khi load trang lần đầu
        // this.createEmail();
    }

    bindEvents() {
        // Tạo email mới
        document.getElementById('createEmailBtn').addEventListener('click', () => {
            this.createEmail();
        });

        // Copy email
        document.getElementById('copyEmailBtn').addEventListener('click', () => {
            this.copyEmail();
        });

        // Gia hạn email
        document.getElementById('extendEmailBtn').addEventListener('click', () => {
            this.extendEmail();
        });

        // Làm mới
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });

        // Xóa email
        document.getElementById('deleteEmailBtn').addEventListener('click', () => {
            this.deleteEmail();
        });

        // Đóng modal
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Đóng modal khi click outside
        document.getElementById('emailModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('emailModal')) {
                this.closeModal();
            }
        });

        // API switch
        document.querySelectorAll('input[name="apiType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleAPISwitch(e.target.value);
            });
        });

        // Save token
        document.getElementById('saveTokenBtn').addEventListener('click', () => {
            this.saveAPIToken();
        });

        // Netflix code
        document.getElementById('netflixCodeBtn').addEventListener('click', () => {
            this.getNetflixCode();
        });
    }

    async createEmail() {
        try {
            this.showLoading('createEmailBtn');
            
            let result;
            
            if (this.useLocalAPI) {
                // Sử dụng API local
                const response = await fetch('/api/create-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                result = await response.json();
                
                if (result.success) {
                    this.currentEmailId = result.data.id;
                    this.displayEmail(result.data);
                    this.startRefreshInterval();
                }
            } else {
                // Sử dụng Tempmail.id.vn API
                if (!this.tempmailAPI.apiToken) {
                    this.showNotification('Vui lòng nhập API Token trước khi sử dụng!', 'error');
                    return;
                }
                
                // Lấy custom user và domain nếu có
                const customUser = document.getElementById('customUser').value.trim();
                const customDomain = document.getElementById('customDomain').value;
                
                result = await this.tempmailAPI.createEmail(customUser, customDomain);
                
                if (result.success) {
                    this.currentMailId = result.data.id;
                    // Chuyển đổi format để tương thích với displayEmail
                    const emailData = {
                        email: result.data.email,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 giờ
                        isActive: true
                    };
                    this.displayEmailTempmail(emailData, result.data);
                    this.startTempmailRefreshInterval();
                }
            }

            if (result.success) {
                this.showNotification('Email ảo đã được tạo thành công!', 'success');
            } else {
                this.showNotification('Lỗi tạo email: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error creating email:', error);
            this.showNotification('Lỗi kết nối server', 'error');
        } finally {
            this.hideLoading('createEmailBtn');
        }
    }

    displayEmail(emailData) {
        document.getElementById('currentEmail').textContent = emailData.email;
        document.getElementById('emailExpiry').textContent = new Date(emailData.expiresAt).toLocaleString('vi-VN');
        
        const statusElement = document.getElementById('emailStatus');
        if (emailData.isActive) {
            statusElement.textContent = 'Đang hoạt động';
            statusElement.className = 'status active';
        } else {
            statusElement.textContent = 'Đã hết hạn';
            statusElement.className = 'status expired';
        }

        document.getElementById('currentEmailSection').style.display = 'block';
        document.getElementById('messagesSection').style.display = 'block';
    }

    async copyEmail() {
        const emailText = document.getElementById('currentEmail').textContent;
        
        try {
            await navigator.clipboard.writeText(emailText);
            this.showNotification('Đã copy email vào clipboard!', 'success');
        } catch (error) {
            // Fallback cho browser cũ
            const textArea = document.createElement('textarea');
            textArea.value = emailText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Đã copy email vào clipboard!', 'success');
        }
    }

    async extendEmail() {
        if (!this.currentEmailId) return;

        try {
            this.showLoading('extendEmailBtn');

            const response = await fetch(`/api/email/${this.currentEmailId}/extend`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.displayEmail(result.data);
                this.showNotification('Email đã được gia hạn thêm 10 phút!', 'success');
            } else {
                this.showNotification('Lỗi gia hạn: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error extending email:', error);
            this.showNotification('Lỗi kết nối server', 'error');
        } finally {
            this.hideLoading('extendEmailBtn');
        }
    }

    async refreshData() {
        if (!this.currentEmailId) return;

        try {
            this.showLoading('refreshBtn');
            
            // Refresh email info
            await this.updateEmailInfo();
            
            // Refresh messages
            await this.loadMessages();
            
            this.showNotification('Đã làm mới dữ liệu!', 'info');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Lỗi làm mới dữ liệu', 'error');
        } finally {
            this.hideLoading('refreshBtn');
        }
    }

    async updateEmailInfo() {
        if (!this.currentEmailId) return;

        try {
            const response = await fetch(`/api/email/${this.currentEmailId}`);
            const result = await response.json();

            if (result.success) {
                this.displayEmail(result.data);
            }
        } catch (error) {
            console.error('Error updating email info:', error);
        }
    }

    async loadMessages() {
        if (!this.currentEmailId) return;

        try {
            const response = await fetch(`/api/email/${this.currentEmailId}/messages`);
            const result = await response.json();

            if (result.success) {
                this.displayMessages(result.data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        const messageCount = document.getElementById('messageCount');
        
        messageCount.textContent = `${messages.length} tin nhắn`;

        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-inbox"></i>
                    <p>Chưa có email nào được gửi đến địa chỉ này</p>
                    <p>Email sẽ tự động xuất hiện khi có người gửi</p>
                </div>
            `;
            return;
        }

        const messagesHTML = messages.map(message => `
            <div class="message-item" onclick="tempMail.showMessage('${message.id}')">
                <div class="message-header">
                    <div class="message-subject">${message.subject || 'Không có tiêu đề'}</div>
                    <div class="message-date">${new Date(message.receivedAt).toLocaleString('vi-VN')}</div>
                </div>
                <div class="message-from">Từ: ${message.from}</div>
                <div class="message-preview">${this.getTextPreview(message.text || message.html)}</div>
            </div>
        `).join('');

        messagesList.innerHTML = messagesHTML;
        this.messages = messages; // Lưu để hiển thị chi tiết
    }

    getTextPreview(content) {
        if (!content) return 'Không có nội dung';
        
        // Remove HTML tags
        const textContent = content.replace(/<[^>]*>/g, '');
        return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    }

    showMessage(messageId) {
        if (!this.messages) return;
        
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        document.getElementById('modalSubject').textContent = message.subject || 'Không có tiêu đề';
        document.getElementById('modalFrom').textContent = message.from;
        document.getElementById('modalTo').textContent = message.to;
        document.getElementById('modalDate').textContent = new Date(message.receivedAt).toLocaleString('vi-VN');
        
        const content = message.html || message.text || 'Không có nội dung';
        document.getElementById('modalContent').innerHTML = message.html ? content : `<pre>${content}</pre>`;
        
        document.getElementById('emailModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('emailModal').style.display = 'none';
    }

    async deleteEmail() {
        if (!this.currentEmailId) return;

        if (!confirm('Bạn có chắc chắn muốn xóa email này không?')) {
            return;
        }

        try {
            this.showLoading('deleteEmailBtn');

            const response = await fetch(`/api/email/${this.currentEmailId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.currentEmailId = null;
                this.stopRefreshInterval();
                document.getElementById('currentEmailSection').style.display = 'none';
                document.getElementById('messagesSection').style.display = 'none';
                this.showNotification('Email đã được xóa!', 'success');
            } else {
                this.showNotification('Lỗi xóa email: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting email:', error);
            this.showNotification('Lỗi kết nối server', 'error');
        } finally {
            this.hideLoading('deleteEmailBtn');
        }
    }

    startRefreshInterval() {
        this.stopRefreshInterval();
        this.refreshInterval = setInterval(() => {
            this.updateEmailInfo();
            this.loadMessages();
        }, 5000); // Refresh mỗi 5 giây
    }

    stopRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showLoading(buttonId) {
        const button = document.getElementById(buttonId);
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        button.dataset.originalText = originalText;
    }

    hideLoading(buttonId) {
        const button = document.getElementById(buttonId);
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Phương thức dành cho Tempmail.id.vn API
    displayEmailTempmail(emailData, rawData) {
        document.getElementById('currentEmail').textContent = emailData.email;
        document.getElementById('emailExpiry').textContent = 'Không giới hạn';
        
        const statusElement = document.getElementById('emailStatus');
        statusElement.textContent = 'Đang hoạt động';
        statusElement.className = 'status active';

        document.getElementById('currentEmailSection').style.display = 'block';
        document.getElementById('messagesSection').style.display = 'block';
        
        // Ẩn nút gia hạn vì Tempmail.id.vn không cần gia hạn
        document.getElementById('extendEmailBtn').style.display = 'none';
    }

    async refreshTempmailData() {
        if (!this.currentMailId) return;

        try {
            this.showLoading('refreshBtn');
            
            // Refresh messages từ Tempmail.id.vn
            await this.loadTempmailMessages();
            
            this.showNotification('Đã làm mới dữ liệu!', 'info');
        } catch (error) {
            console.error('Error refreshing tempmail data:', error);
            this.showNotification('Lỗi làm mới dữ liệu', 'error');
        } finally {
            this.hideLoading('refreshBtn');
        }
    }

    async loadTempmailMessages() {
        if (!this.currentMailId) return;

        try {
            const result = await this.tempmailAPI.getMessages(this.currentMailId);

            if (result.success) {
                // Chuyển đổi format tin nhắn từ Tempmail.id.vn
                const messages = result.data.messages ? result.data.messages.map(msg => ({
                    id: msg.id,
                    subject: msg.subject,
                    from: msg.from,
                    to: msg.to,
                    receivedAt: msg.received_at || new Date().toISOString(),
                    text: msg.body,
                    html: msg.html_body
                })) : [];
                
                this.displayMessages(messages);
            }
        } catch (error) {
            console.error('Error loading tempmail messages:', error);
        }
    }

    startTempmailRefreshInterval() {
        this.stopRefreshInterval();
        this.refreshInterval = setInterval(() => {
            this.loadTempmailMessages();
        }, 10000); // Refresh mỗi 10 giây cho Tempmail.id.vn
    }

    // Override refreshData để hỗ trợ cả hai API
    async refreshData() {
        if (this.useLocalAPI) {
            if (!this.currentEmailId) return;

            try {
                this.showLoading('refreshBtn');
                
                await this.updateEmailInfo();
                await this.loadMessages();
                
                this.showNotification('Đã làm mới dữ liệu!', 'info');
            } catch (error) {
                console.error('Error refreshing data:', error);
                this.showNotification('Lỗi làm mới dữ liệu', 'error');
            } finally {
                this.hideLoading('refreshBtn');
            }
        } else {
            await this.refreshTempmailData();
        }
    }

    // Phương thức chuyển đổi giữa các API
    switchAPI(useLocal = true) {
        this.useLocalAPI = useLocal;
        
        // Reset trạng thái hiện tại
        this.currentEmailId = null;
        this.currentMailId = null;
        this.stopRefreshInterval();
        
        // Ẩn các section
        document.getElementById('currentEmailSection').style.display = 'none';
        document.getElementById('messagesSection').style.display = 'none';
        
        // Hiển thị lại nút gia hạn cho local API
        if (useLocal) {
            document.getElementById('extendEmailBtn').style.display = 'inline-flex';
        }
        
        this.showNotification(
            `Đã chuyển sang sử dụng ${useLocal ? 'API Local' : 'Tempmail.id.vn API'}`, 
            'info'
        );
    }

    // Phương thức thiết lập API token
    setTempmailToken(token) {
        this.tempmailAPI.setApiToken(token);
        this.showNotification('API Token đã được lưu!', 'success');
    }

    // Phương thức lấy mã Netflix
    async getNetflixCode() {
        if (this.useLocalAPI) {
            this.showNotification('Tính năng này chỉ khả dụng với Tempmail.id.vn API', 'error');
            return;
        }

        const currentEmail = document.getElementById('currentEmail').textContent;
        if (!currentEmail) {
            this.showNotification('Vui lòng tạo email trước khi sử dụng tính năng này!', 'error');
            return;
        }

        try {
            const result = await this.tempmailAPI.getNetflixCode(currentEmail);
            
            if (result.success) {
                this.showNotification(
                    `Mã Netflix: ${result.data.code || 'Không tìm thấy mã'}`, 
                    'success'
                );
            } else {
                this.showNotification('Không tìm thấy mã Netflix: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error getting Netflix code:', error);
            this.showNotification('Lỗi khi lấy mã Netflix', 'error');
        }
    }

    // Phương thức xử lý chuyển đổi API
    handleAPISwitch(apiType) {
        const useLocal = apiType === 'local';
        
        // Hiện/ẩn cài đặt Tempmail
        const tempmailSettings = document.getElementById('tempmailSettings');
        const customEmailSection = document.getElementById('customEmailSection');
        const netflixBtn = document.getElementById('netflixCodeBtn');
        
        if (useLocal) {
            tempmailSettings.style.display = 'none';
            customEmailSection.style.display = 'none';
            netflixBtn.style.display = 'none';
        } else {
            tempmailSettings.style.display = 'block';
            customEmailSection.style.display = 'block';
            netflixBtn.style.display = 'inline-flex';
            
            // Nạp token đã lưu (nếu có)
            const savedToken = localStorage.getItem('tempmail_api_token');
            if (savedToken) {
                document.getElementById('apiToken').value = savedToken;
            }
        }
        
        this.switchAPI(useLocal);
    }

    // Phương thức lưu API token
    saveAPIToken() {
        const tokenInput = document.getElementById('apiToken');
        const token = tokenInput.value.trim();
        
        if (!token) {
            this.showNotification('Vui lòng nhập API Token!', 'error');
            return;
        }
        
        this.setTempmailToken(token);
    }

    // Cập nhật createEmail để sử dụng custom user và domain
    async createEmailWithCustom() {
        if (!this.useLocalAPI) {
            const customUser = document.getElementById('customUser').value.trim();
            const customDomain = document.getElementById('customDomain').value;
            
            const result = await this.tempmailAPI.createEmail(customUser, customDomain);
            return result;
        }
        
        // Sử dụng API local
        const response = await fetch('/api/create-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return await response.json();
    }
}

// Khởi tạo hệ thống
const tempMail = new TempMailSystem();

// Expose globally for onclick handlers
window.tempMail = tempMail;
