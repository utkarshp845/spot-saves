# Quick Deployment Guide - Raspberry Pi 5 + Cloudflare

**Time: ~15 minutes** | **Difficulty: Easy** 🚀

---

## Prerequisites

- Raspberry Pi 5 with Raspberry Pi OS (64-bit)
- Cloudflare account with pandeylabs.com domain
- SSH access to your Pi

---

## Quick Setup Commands

### 1. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin -y
```

### 2. Clone and Setup

```bash
cd ~
git clone https://github.com/utkarshp845/spot-saves.git spotsave
cd spotsave

# Create .env file
SECRET=$(openssl rand -base64 32)
cat > .env << EOF
NEXTAUTH_URL=https://spotsave.pandeylabs.com
NEXTAUTH_SECRET=$SECRET
NEXT_PUBLIC_API_URL=/api/backend
AWS_REGION=us-east-1
SCAN_SCHEDULE=0 2 * * *
EOF
```

### 3. Build and Start

```bash
# Build (takes 10-15 minutes first time)
docker compose build

# Start services
docker compose up -d

# Verify
docker compose ps
curl http://localhost:3000
```

### 4. Setup Cloudflare Tunnel

```bash
# Install Cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Login (opens browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create spotsave

# Get tunnel ID and create config
TUNNEL_ID=$(cloudflared tunnel list | grep spotsave | awk '{print $1}')
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/pi/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: spotsave.pandeylabs.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Create DNS route
cloudflared tunnel route dns spotsave spotsave.pandeylabs.com

# Setup as service
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

sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

### 5. Configure Cloudflare SSL

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select pandeylabs.com
3. SSL/TLS → Overview → Set to **Full**

### 6. Test!

Visit: **https://spotsave.pandeylabs.com** 🎉

---

## Verification Checklist

- [ ] `docker compose ps` shows all 3 services running
- [ ] `curl http://localhost:3000` works
- [ ] `curl http://localhost:8000/health` returns `{"status":"healthy"}`
- [ ] `sudo systemctl status cloudflared` shows "active (running)"
- [ ] Browser can access https://spotsave.pandeylabs.com

---

## Troubleshooting

**Services not starting?**
```bash
docker compose logs backend
docker compose logs frontend
```

**Cloudflare Tunnel not connecting?**
```bash
sudo journalctl -u cloudflared -f
cloudflared tunnel info spotsave
```

**Need to restart everything?**
```bash
docker compose restart
sudo systemctl restart cloudflared
```

---

## That's It! 🎊

Your SpotSave instance is now live at **https://spotsave.pandeylabs.com**

For detailed instructions, see `RASPBERRY_PI_DEPLOYMENT.md`

