#!/bin/bash

# 🚀 VPS Deploy Script for Temp Mail System
# Usage: bash deploy-vps.sh yourdomain.com

set -e

DOMAIN=${1:-"yourdomain.com"}
PROJECT_DIR="/opt/temp-mail-system"

echo "🚀 DEPLOYING TEMP MAIL SYSTEM TO VPS"
echo "====================================="
echo "Domain: $DOMAIN"
echo "Directory: $PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Update system
log "📦 Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install Node.js
log "📥 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

node_version=$(node --version)
npm_version=$(npm --version)
log "✅ Node.js $node_version installed"
log "✅ NPM $npm_version installed"

# Step 3: Install PM2
log "📥 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2_version=$(pm2 --version)
log "✅ PM2 $pm2_version installed"

# Step 4: Create project directory
log "📁 Creating project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Step 5: Create logs directory
mkdir -p logs

# Step 6: Setup firewall
log "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 25/tcp
ufw allow 3000/tcp
ufw --force enable

log "✅ Firewall configured"

# Step 7: Install dependencies (if package.json exists)
if [ -f "package.json" ]; then
    log "📦 Installing npm dependencies..."
    npm install --production
    log "✅ Dependencies installed"
else
    warn "package.json not found. Make sure to upload your project files first."
fi

# Step 8: Create .env file
log "⚙️ Creating environment configuration..."
cat > .env << EOF
# Server Configuration
PORT=3000
DOMAIN=$DOMAIN
NODE_ENV=production

# SMTP Configuration  
SMTP_PORT=25
SMTP_HOST=0.0.0.0

# Security
RATE_LIMIT=100
MAX_EMAILS_PER_IP=10
EMAIL_EXPIRY_MINUTES=10
EOF

log "✅ Environment file created"

# Step 9: Update ecosystem.config.js with actual domain
if [ -f "ecosystem.config.js" ]; then
    log "⚙️ Updating PM2 configuration..."
    sed -i "s/yourdomain.com/$DOMAIN/g" ecosystem.config.js
    log "✅ PM2 config updated"
fi

# Step 10: Create systemd service (alternative to PM2 startup)
log "🔧 Creating systemd service..."
cat > /etc/systemd/system/temp-mail-system.service << EOF
[Unit]
Description=Temp Mail System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/pm2-runtime start ecosystem.config.js --env production
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable temp-mail-system

# Step 11: Setup log rotation
log "📝 Setting up log rotation..."
cat > /etc/logrotate.d/temp-mail-system << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Step 12: Install Nginx (optional)
read -p "🌐 Do you want to install Nginx reverse proxy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "📥 Installing Nginx..."
    apt install nginx -y
    
    # Create Nginx config
    cat > /etc/nginx/sites-available/temp-mail << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Increase max body size for file uploads
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout       300s;
        proxy_send_timeout          300s;
        proxy_read_timeout          300s;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/temp-mail /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    systemctl enable nginx
    
    log "✅ Nginx configured and enabled"
    
    # Ask about SSL
    read -p "🔒 Do you want to setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "📥 Installing Certbot..."
        apt install certbot python3-certbot-nginx -y
        
        log "🔒 Setting up SSL certificate..."
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        log "✅ SSL certificate installed"
    fi
fi

# Final steps
log "🎯 Final setup steps..."

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "======================"
echo ""
echo "📋 Next steps:"
echo "1. 📁 Upload your project files to: $PROJECT_DIR"
echo "2. 🌐 Configure DNS records:"
echo "   - A record: $DOMAIN → YOUR_VPS_IP"  
echo "   - MX record: @ → $DOMAIN (priority 10)"
echo "3. 🚀 Start the application:"
echo "   cd $PROJECT_DIR"
echo "   pm2 start ecosystem.config.js --env production"
echo "4. 💾 Save PM2 process:"
echo "   pm2 save && pm2 startup"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status                 # Check status"
echo "   pm2 logs temp-mail-system  # View logs"  
echo "   pm2 restart temp-mail-system # Restart app"
echo "   pm2 monit                  # Monitor resources"
echo ""
echo "🌐 Your site will be available at:"
echo "   http://$DOMAIN (or https if SSL enabled)"
echo ""
echo "📧 Test SMTP server:"
echo "   telnet $DOMAIN 25"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Make sure port 25 is not blocked by your ISP"
echo "   - Configure proper DNS MX record"
echo "   - Upload project files before starting PM2"

# Create a quick test script
cat > test-system.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Temp Mail System..."
echo "=============================="

# Test web server
echo "🌐 Testing web server..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web server is running"
else
    echo "❌ Web server is not responding"
fi

# Test SMTP port
echo "📧 Testing SMTP server..."
if timeout 5 bash -c '</dev/tcp/localhost/25'; then
    echo "✅ SMTP server port 25 is open"
else
    echo "❌ SMTP server port 25 is not accessible"
fi

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "🔍 Recent logs:"
pm2 logs temp-mail-system --lines 10
EOF

chmod +x test-system.sh

log "✅ Deployment script completed!"
log "📝 Run ./test-system.sh to test your installation"
