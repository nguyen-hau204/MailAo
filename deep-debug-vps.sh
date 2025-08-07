#!/bin/bash

echo "🔍 DEEP DEBUG SMTP SERVER - VPS Analysis"
echo "========================================="
echo "VPS IP: 8.219.169.133"
echo "Domain: nguyenhuuhau.xyz"
echo "Target Port: 2525"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. System Info
echo -e "${BLUE}1️⃣ SYSTEM INFO${NC}"
echo "================================="
uname -a
echo "Public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Cannot detect')"
echo "Date: $(date)"
echo ""

# 2. Node.js Processes
echo -e "${BLUE}2️⃣ NODE.JS PROCESSES${NC}"
echo "================================="
NODE_PROCS=$(ps aux | grep node | grep -v grep)
if [ -z "$NODE_PROCS" ]; then
    echo -e "${RED}❌ No Node.js processes running${NC}"
else
    echo -e "${GREEN}✅ Node.js processes found:${NC}"
    echo "$NODE_PROCS"
fi
echo ""

# 3. Port Analysis
echo -e "${BLUE}3️⃣ PORT 2525 ANALYSIS${NC}"
echo "================================="

# Check if port is listening
PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep :2525 || ss -tlnp 2>/dev/null | grep :2525)
if [ -z "$PORT_CHECK" ]; then
    echo -e "${RED}❌ Port 2525 is NOT listening${NC}"
else
    echo -e "${GREEN}✅ Port 2525 is listening:${NC}"
    echo "$PORT_CHECK"
    
    # Check binding address
    if echo "$PORT_CHECK" | grep -q "0.0.0.0:2525"; then
        echo -e "${GREEN}✅ Bound to 0.0.0.0 (all interfaces)${NC}"
    elif echo "$PORT_CHECK" | grep -q "127.0.0.1:2525"; then
        echo -e "${RED}❌ Bound to localhost only (127.0.0.1)${NC}"
        echo -e "${YELLOW}   FIX: Update server.js to bind to '0.0.0.0'${NC}"
    elif echo "$PORT_CHECK" | grep -q ":::2525"; then
        echo -e "${GREEN}✅ Bound to IPv6 all interfaces${NC}"
    fi
fi
echo ""

# 4. Firewall Analysis
echo -e "${BLUE}4️⃣ FIREWALL ANALYSIS${NC}"
echo "================================="

# UFW
if command -v ufw >/dev/null 2>&1; then
    echo "UFW Status:"
    UFW_STATUS=$(sudo ufw status 2>/dev/null)
    echo "$UFW_STATUS"
    
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        if echo "$UFW_STATUS" | grep -q "2525"; then
            echo -e "${GREEN}✅ Port 2525 allowed in UFW${NC}"
        else
            echo -e "${RED}❌ Port 2525 NOT allowed in UFW${NC}"
            echo -e "${YELLOW}   FIX: sudo ufw allow 2525${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  UFW is inactive${NC}"
    fi
else
    echo "UFW not installed"
fi

echo ""

# iptables
echo "iptables Rules for port 2525:"
IPTABLES_2525=$(sudo iptables -L INPUT -n --line-numbers 2>/dev/null | grep -E "2525|dpt:2525" || echo "No rules found")
echo "$IPTABLES_2525"

echo ""
echo "All iptables INPUT rules:"
sudo iptables -L INPUT --line-numbers 2>/dev/null | head -10

echo ""

# 5. Network Tests
echo -e "${BLUE}5️⃣ NETWORK CONNECTIVITY TESTS${NC}"
echo "================================="

# Test local connection
echo "Testing local connection..."
if command -v nc >/dev/null 2>&1; then
    if timeout 3 nc -zv localhost 2525 2>&1 | grep -q "succeeded\|open\|Connected"; then
        echo -e "${GREEN}✅ Local connection to port 2525 successful${NC}"
    else
        echo -e "${RED}❌ Local connection to port 2525 failed${NC}"
    fi
else
    echo "netcat not available for testing"
fi

# Test public IP connection
echo "Testing public IP connection..."
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null)
if [ ! -z "$PUBLIC_IP" ] && command -v nc >/dev/null 2>&1; then
    if timeout 3 nc -zv $PUBLIC_IP 2525 2>&1 | grep -q "succeeded\|open\|Connected"; then
        echo -e "${GREEN}✅ Public IP connection to port 2525 successful${NC}"
    else
        echo -e "${RED}❌ Public IP connection to port 2525 failed${NC}"
    fi
fi

echo ""

# 6. Process Details
echo -e "${BLUE}6️⃣ SERVER PROCESS DETAILS${NC}"
echo "================================="
if pgrep -f "node.*server.js" >/dev/null; then
    PID=$(pgrep -f "node.*server.js")
    echo "Server PID: $PID"
    echo "Process details:"
    ps -p $PID -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || echo "Cannot get process details"
    
    echo ""
    echo "Open files by server process:"
    sudo lsof -p $PID 2>/dev/null | grep -E "TCP|LISTEN" || echo "Cannot get open files"
else
    echo -e "${RED}❌ No server.js process found${NC}"
fi

echo ""

# 7. Logs Analysis
echo -e "${BLUE}7️⃣ LOGS ANALYSIS${NC}"
echo "================================="

# Check for server logs
if [ -f "server.log" ]; then
    echo "Last 10 lines from server.log:"
    tail -10 server.log
elif [ -f "nohup.out" ]; then
    echo "Last 10 lines from nohup.out:"
    tail -10 nohup.out
else
    echo "No server log file found"
fi

echo ""

# System logs
echo "System logs related to Node.js:"
sudo journalctl --no-pager -n 5 | grep -i node 2>/dev/null || echo "No Node.js related system logs"

echo ""

# 8. Cloud Provider Check
echo -e "${BLUE}8️⃣ CLOUD PROVIDER ANALYSIS${NC}"
echo "================================="

# Try to detect cloud provider
if curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/ >/dev/null 2>&1; then
    echo "Detected: AWS EC2"
    echo -e "${YELLOW}⚠️  Check AWS Security Groups for port 2525${NC}"
elif curl -s --connect-timeout 2 -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/ >/dev/null 2>&1; then
    echo "Detected: Google Cloud"
    echo -e "${YELLOW}⚠️  Check GCP Firewall Rules for port 2525${NC}"
elif curl -s --connect-timeout 2 http://169.254.169.254/metadata/v1/ >/dev/null 2>&1; then
    echo "Detected: DigitalOcean"
    echo -e "${YELLOW}⚠️  Check DigitalOcean Firewall for port 2525${NC}"
else
    echo "Cloud provider not detected or unknown"
fi

echo ""

# 9. Alternative SMTP Ports
echo -e "${BLUE}9️⃣ ALTERNATIVE SMTP PORTS${NC}"
echo "================================="
echo "Checking if common SMTP ports are blocked:"

SMTP_PORTS=(25 465 587 2525)
for port in "${SMTP_PORTS[@]}"; do
    if timeout 3 nc -zv 8.8.8.8 $port 2>/dev/null; then
        echo -e "${GREEN}✅ Port $port: Outbound connection OK${NC}"
    else
        echo -e "${RED}❌ Port $port: Outbound connection blocked${NC}"
    fi
done

echo ""

# 10. Recommendations
echo -e "${BLUE}🎯 SPECIFIC RECOMMENDATIONS${NC}"
echo "================================="

echo "Based on the analysis above:"
echo ""

if [ -z "$NODE_PROCS" ]; then
    echo -e "${RED}🚨 CRITICAL: Start Node.js server first!${NC}"
    echo "   cd $(pwd) && node server.js"
fi

if [ -z "$PORT_CHECK" ]; then
    echo -e "${RED}🚨 CRITICAL: Port 2525 not listening!${NC}"
    echo "   Server may not be running or crashed"
fi

if echo "$PORT_CHECK" | grep -q "127.0.0.1:2525"; then
    echo -e "${RED}🚨 CRITICAL: Server bound to localhost only!${NC}"
    echo "   Update server.js: smtpServer.listen(2525, '0.0.0.0')"
fi

echo ""
echo -e "${YELLOW}💡 NEXT STEPS:${NC}"
echo "1. Fix any CRITICAL issues above"
echo "2. Restart server: pm2 restart all"
echo "3. Test again: nc -zv 8.219.169.133 2525"
echo "4. Check cloud provider firewall settings"
echo "5. Consider using port 587 instead of 2525"

echo ""
echo -e "${GREEN}✅ Debug analysis complete!${NC}"
