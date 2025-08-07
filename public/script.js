class TempMailSystem {
    constructor() {
        this.currentEmailId = null;
        this.refreshInterval = null;
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
    }

    async createEmail() {
        try {
            this.showLoading('createEmailBtn');
            
            const response = await fetch('/api/create-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.currentEmailId = result.data.id;
                this.displayEmail(result.data);
                this.startRefreshInterval();
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
}

// Khởi tạo hệ thống
const tempMail = new TempMailSystem();

// Expose globally for onclick handlers
window.tempMail = tempMail;
