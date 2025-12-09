# Multi-stage Dockerfile for SpotSave Backend (<150MB final image)
# Supports both amd64 and arm64 architectures

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies only (wget is lighter than curl)
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Health check (using wget, simpler and more reliable)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Run the application
CMD ["/app/entrypoint.sh"]

