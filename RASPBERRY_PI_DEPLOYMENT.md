# SpotSave - Raspberry Pi 5 Deployment Guide

Complete step-by-step guide to deploy SpotSave on Raspberry Pi 5 and expose it via Cloudflare Tunnel.

---

## Prerequisites

- ✅ Raspberry Pi 5 with Raspberry Pi OS (64-bit) installed
- ✅ Internet connection
- ✅ Cloudflare account with domain (pandeylabs.com)
- ✅ SSH access to Raspberry Pi
- ✅ Git installed on Raspberry Pi

---

## Step 1: Initial Raspberry Pi Setup

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker

```bash
# Download and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in (or run: newgrp docker)
exit
# SSH back in

# Verify Docker installation
docker --version
```

### 1.3 Install Docker Compose

```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker compose version
```

---

## Step 2: Clone Repository

### 2.1 Create Directory and Clone

```bash
cd ~
mkdir -p spotsave
cd spotsave

# Clone repository
git clone https://github.com/utkarshp845/spot-saves.git .
```

### 2.2 Create Environment File

```bash
# Generate secure secrets
SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# AWS Configuration (leave empty if not scanning from Pi)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=

# Application URLs (update after Cloudflare setup)
NEXTAUTH_URL=https://spotsave.pandeylabs.com
NEXTAUTH_SECRET=$SECRET

# API Configuration
NEXT_PUBLIC_API_URL=/api/backend

# Scan Schedule (UTC) - 2 AM daily
SCAN_SCHEDULE=0 2 * * *

# AWS Credentials Path (optional, if using AWS credentials)
AWS_CREDENTIALS_PATH=/home/pi/.aws
EOF

echo "✅ Environment file created!"
```

---

## Step 3: Update Docker Compose for Raspberry Pi

### 3.1 Update docker-compose.yml

We need to remove the hardcoded AWS path. Let's create a production-ready version:

```bash
# The docker-compose.yml already supports ARM64, but let's verify
cat docker-compose.yml | grep -A 2 "platforms"
```

The file already supports ARM64! We just need to make the AWS path configurable.

### 3.2 Update AWS Credentials Path (if needed)

If you want to use AWS credentials from the Pi, create the directory:

```bash
mkdir -p ~/.aws
# Later, you can copy your credentials here if needed
```

---

## Step 4: Build and Test Locally

### 4.1 Build Containers

```bash
cd ~/spotsave
docker compose build
```

This will automatically build for ARM64 architecture. The first build may take 10-15 minutes.

### 4.2 Start Services

```bash
docker compose up -d
```

### 4.3 Verify Everything is Running

```bash
# Check service status
docker compose ps

# Check logs
docker compose logs frontend --tail 50
docker compose logs backend --tail 50

# Test locally
curl http://localhost:3000
curl http://localhost:8000/health
```

You should see the services running! ✅

---

## Step 5: Install Cloudflare Tunnel

### 5.1 Download Cloudflared for ARM64

```bash
cd ~

# Download latest ARM64 release
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb

# Install
sudo dpkg -i cloudflared-linux-arm64.deb

# Verify installation
cloudflared --version
```

### 5.2 Login to Cloudflare

```bash
# This will open a browser - you may need to do this from your local machine
# if SSH doesn't have browser access
cloudflared tunnel login
```

**Note:** If you can't access a browser from the Pi, run this command on your local Mac/PC (with cloudflared installed) and transfer the credentials file.

### 5.3 Create Tunnel

```bash
# Create named tunnel
cloudflared tunnel create spotsave

# Note the tunnel ID shown (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
# Save it somewhere - we'll need it next
```

---

## Step 6: Configure Cloudflare Tunnel

### 6.1 Create Configuration Directory

```bash
mkdir -p ~/.cloudflared
```

### 6.2 Create Configuration File

Replace `<TUNNEL_ID>` with your actual tunnel ID from step 5.3:

```bash
# Get your tunnel ID first
TUNNEL_ID=$(cloudflared tunnel list | grep spotsave | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/pi/.cloudflared/$TUNNEL_ID.json

ingress:
  # Frontend (Next.js)
  - hostname: spotsave.pandeylabs.com
    service: http://localhost:3000
  
  # Backend API (optional - only if you want to expose API docs)
  - hostname: api.spotsave.pandeylabs.com
    service: http://localhost:8000
  
  # Catch-all rule (must be last)
  - service: http_status:404
EOF

echo "✅ Configuration file created at ~/.cloudflared/config.yml"
```

### 6.3 Create DNS Routes

```bash
# Create DNS route for main domain
cloudflared tunnel route dns spotsave spotsave.pandeylabs.com

# Optional: Create route for API subdomain
cloudflared tunnel route dns spotsave api.spotsave.pandeylabs.com
```

---

## Step 7: Update Application for Production

### 7.1 Update Environment Variables

```bash
cd ~/spotsave

# Update NEXTAUTH_URL to use Cloudflare domain
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://spotsave.pandeylabs.com|' .env

# Keep API internal (frontend will proxy requests)
sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=/api/backend|' .env

# Verify changes
cat .env | grep NEXTAUTH_URL
cat .env | grep NEXT_PUBLIC_API_URL
```

### 7.2 Rebuild and Restart

```bash
docker compose down
docker compose up -d --build
```

---

## Step 8: Run Cloudflare Tunnel as Service

### 8.1 Create Systemd Service

```bash
sudo tee /etc/systemd/system/cloudflared.service > /dev/null << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/pi/.cloudflared/config.yml run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable cloudflared

# Start the service
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

### 8.3 View Logs

```bash
# View recent logs
sudo journalctl -u cloudflared -n 50

# Follow logs in real-time
sudo journalctl -u cloudflared -f
```

You should see: `Connection established` when it's working!

---

## Step 9: Configure Cloudflare SSL/TLS

### 9.1 In Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (pandeylabs.com)
3. Go to **SSL/TLS** → **Overview**
4. Set encryption mode to **Full** or **Full (strict)**

### 9.2 Verify DNS

Ensure DNS records are created:
- Go to **DNS** → **Records**
- You should see `spotsave.pandeylabs.com` pointing to a CNAME (Cloudflare will manage this)

---

## Step 10: Test Everything

### 10.1 Test Local Access

```bash
# On Raspberry Pi
curl http://localhost:3000
curl http://localhost:8000/health
```

### 10.2 Test External Access

```bash
# From any computer
curl https://spotsave.pandeylabs.com

# Should return HTML content
```

### 10.3 Open in Browser

Visit: **https://spotsave.pandeylabs.com**

🎉 Your SpotSave instance is now live!

---

## Troubleshooting

### Cloudflare Tunnel Not Connecting

```bash
# Check tunnel status
cloudflared tunnel info spotsave

# Check configuration
cat ~/.cloudflared/config.yml

# Check logs
sudo journalctl -u cloudflared -n 100

# Restart tunnel
sudo systemctl restart cloudflared
```

### Docker Containers Not Starting

```bash
# Check Docker status
sudo systemctl status docker

# Check container logs
docker compose logs backend
docker compose logs frontend

# Check disk space
df -h

# Restart Docker
sudo systemctl restart docker
docker compose up -d
```

### Application Not Loading

```bash
# Verify services are running
docker compose ps

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|8000'

# Test local access first
curl http://localhost:3000

# Check firewall (if enabled)
sudo ufw status
```

---

## Quick Reference Commands

```bash
# Start application
cd ~/spotsave && docker compose up -d

# Stop application
docker compose down

# View logs
docker compose logs -f

# Restart everything
docker compose restart && sudo systemctl restart cloudflared

# Update application
cd ~/spotsave
git pull
docker compose build
docker compose up -d

# Check status
docker compose ps
sudo systemctl status cloudflared
```

---

## Next Steps

1. ✅ Test the application at https://spotsave.pandeylabs.com
2. ✅ Connect your AWS account via the onboarding wizard
3. ✅ Run your first scan
4. ✅ Share with your team!

**Congratulations! SpotSave is now live and accessible worldwide! 🚀**

