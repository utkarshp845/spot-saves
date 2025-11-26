#!/bin/bash
# Cloudflare Tunnel Setup Script for Raspberry Pi
# Run this script on your Raspberry Pi 5

set -e

echo "🚀 Setting up Cloudflare Tunnel for SpotSave..."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Installing Cloudflared..."
    cd ~
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
    sudo dpkg -i cloudflared-linux-arm64.deb
    echo "✅ Cloudflared installed!"
else
    echo "✅ Cloudflared already installed"
fi

# Login to Cloudflare
echo ""
echo "🔐 Logging into Cloudflare..."
echo "This will open a browser window. Please authenticate..."
cloudflared tunnel login

# Create tunnel
echo ""
echo "🔨 Creating tunnel 'spotsave'..."
cloudflared tunnel create spotsave || echo "Tunnel 'spotsave' already exists"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep spotsave | awk '{print $1}')
if [ -z "$TUNNEL_ID" ]; then
    echo "❌ Error: Could not find tunnel ID"
    exit 1
fi

echo "✅ Tunnel ID: $TUNNEL_ID"

# Create config directory
mkdir -p ~/.cloudflared

# Create config file
echo ""
echo "📝 Creating configuration file..."
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/pi/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: spotsave.pandeylabs.com
    service: http://localhost:3000
  - service: http_status:404
EOF

echo "✅ Configuration file created at ~/.cloudflared/config.yml"

# Create DNS route
echo ""
echo "🌐 Creating DNS route..."
cloudflared tunnel route dns spotsave spotsave.pandeylabs.com

# Create systemd service
echo ""
echo "⚙️ Creating systemd service..."
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

# Enable and start service
echo ""
echo "🔄 Enabling and starting Cloudflare Tunnel service..."
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Wait a moment and check status
sleep 3
echo ""
echo "📊 Service status:"
sudo systemctl status cloudflared --no-pager -l

echo ""
echo "✅ Cloudflare Tunnel setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify tunnel is running: sudo systemctl status cloudflared"
echo "2. Check logs: sudo journalctl -u cloudflared -f"
echo "3. Visit https://spotsave.pandeylabs.com in your browser"
echo ""
echo "🎉 Setup complete!"

