#!/bin/sh

echo "Starting SpotSave frontend..."
echo "Container environment: NODE_ENV=${NODE_ENV:-not set}"
echo "Port: ${PORT:-3000}"

# Force HOSTNAME to 0.0.0.0 for App Runner compatibility
# App Runner sets HOSTNAME to internal hostname, but Next.js needs 0.0.0.0
export HOSTNAME="0.0.0.0"
echo "Hostname: $HOSTNAME (forced to 0.0.0.0 for App Runner)"

# Ensure the server.js file exists
if [ ! -f /app/server.js ]; then
    echo "ERROR: server.js not found in /app/"
    ls -la /app/ | head -20
    exit 1
fi

echo "Starting Next.js server..."
# Use exec to replace shell process, ensuring proper signal handling
# HOSTNAME is already exported above
exec node server.js

