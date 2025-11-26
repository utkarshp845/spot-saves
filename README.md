# SpotSave - AWS Cost Optimization Scanner

SpotSave is a read-only AWS waste scanner that finds 20-50% cost savings opportunities. We only charge after showing results.

## Features

- **Comprehensive Scanning**: Identifies Reserved Instance/Savings Plan opportunities, rightsizing, idle resources, and Graviton migration savings
- **Read-Only Access**: Secure, non-invasive scanning - we never modify or delete your resources
- **Results-First Pricing**: Only pay after we find savings
- **Beautiful Dashboard**: Stunning UI with savings breakdown, charts, and export functionality
- **Multi-Architecture**: Runs on Windows 11, macOS, Linux, and Raspberry Pi 5
- **Docker-Ready**: One-command setup with Docker Compose
- **Automated Scans**: Daily scheduled scans via cron container
- **Terraform Onboarding**: One-command customer onboarding module

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI (Python 3.12), boto3, SQLModel, SQLite
- **Infrastructure**: Docker, Docker Compose, multi-arch support (amd64/arm64)
- **Onboarding**: Terraform module for IAM role creation

## Quick Start (Windows 11 + Docker Desktop)

### Prerequisites

- Docker Desktop for Windows installed and running
- Git installed
- 8GB+ RAM available for Docker

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pandey-saves
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (or use defaults for local testing)
   ```

3. **Start the application**
   ```bash
   docker compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

5. **Run your first scan**
   - Navigate to http://localhost:3000/scan
   - Follow the instructions to set up your AWS IAM role using the Terraform module
   - Enter your Role ARN and External ID
   - Click "Start Scan"

**Total time to running application: <10 minutes** ✅

## Quick Start (Raspberry Pi 5)

### Prerequisites

- Raspberry Pi OS (64-bit) installed
- Docker and Docker Compose installed
- 4GB+ RAM

### Installation

1. **Install Docker** (if not already installed)
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Install Docker Compose**
   ```bash
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```

3. **Clone and run**
   ```bash
   git clone <your-repo-url>
   cd pandey-saves
   docker compose up --build
   ```

The application will automatically build for ARM64 architecture and run perfectly on your Raspberry Pi!

## Setting Up AWS IAM Role

Before scanning, you need to create a read-only IAM role in your AWS account.

### Option 1: Use Terraform Module (Recommended)

1. **Navigate to Terraform directory**
   ```bash
   cd terraform-onboarding
   ```

2. **Create terraform.tfvars**
   ```hcl
   spotsave_account_id = "YOUR_SPOTSAVE_ACCOUNT_ID"  # Get this from SpotSave onboarding
   role_name          = "SpotSaveRole"
   ```

3. **Initialize and apply**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Copy the outputs**
   - `role_arn`: Your IAM role ARN
   - `external_id`: The external ID (keep this secure!)

5. **Use in SpotSave**
   - Go to http://localhost:3000/scan
   - Paste the Role ARN and External ID
   - Start scanning!

### Option 2: Manual AWS Console Setup

See `terraform-onboarding/README.md` for detailed manual setup instructions.

## Project Structure

```
spotsave/
├── docker-compose.yml          # Main orchestration file
├── .env.example                # Environment variables template
├── README.md                   # This file
├── frontend/                   # Next.js frontend application
│   ├── Dockerfile
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   └── ...
├── backend/                    # FastAPI backend application
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── scanner.py         # AWS scanning logic
│   │   ├── models.py          # Database models
│   │   └── ...
│   └── ...
├── terraform-onboarding/       # Customer IAM role setup
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
└── scripts/                    # Utility scripts
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `DATABASE_URL`: SQLite database path (default: `sqlite:///./spotsave.db`)
- `AWS_REGION`: AWS region for scanning (default: `us-east-1`)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `SCAN_SCHEDULE`: Cron schedule for daily scans (default: `0 2 * * *`)

## Usage

### One-Time Scan (No Account Required)

1. Go to http://localhost:3000/scan
2. Enter AWS Role ARN and External ID
3. Click "Start Scan"
4. Wait for results (typically 2-5 minutes)
5. View dashboard with savings opportunities

### Persistent Monitoring

1. Connect your AWS account (same process as one-time scan)
2. The system will automatically run daily scans at 2 AM UTC
3. View historical data and trends in the dashboard
4. Export results as JSON anytime

## API Endpoints

- `GET /health` - Health check
- `POST /api/accounts` - Create/update AWS account connection
- `GET /api/accounts` - List connected accounts
- `POST /api/scan` - Trigger a scan
- `GET /api/scan/{scan_id}` - Get scan status
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/export/{scan_id}` - Export scan results as JSON

Full API documentation available at http://localhost:8000/docs

## Scanning Capabilities

SpotSave identifies these cost optimization opportunities:

1. **Reserved Instances / Savings Plans**
   - Recommends RI purchases for 24/7 workloads
   - 30-40% potential savings

2. **Rightsizing**
   - Identifies over-provisioned EC2 instances
   - Suggests downsizing based on CloudWatch metrics

3. **Idle Resources**
   - Detects instances with low utilization (30+ days)
   - Identifies resources that can be stopped or terminated

4. **Graviton Migration**
   - Finds x86 instances that can migrate to ARM/Graviton
   - Up to 20% cost reduction

## Development

### Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

## Cloudflare Tunnel Setup (Optional)

To expose your local instance via Cloudflare Tunnel:

1. Install Cloudflare Tunnel CLI
2. Create a tunnel: `cloudflared tunnel create spotsave`
3. Configure route: `cloudflared tunnel route dns spotsave yourdomain.com`
4. Run tunnel: `cloudflared tunnel run spotsave`
5. Update `NEXTAUTH_URL` in `.env` to your Cloudflare domain

## Troubleshooting

### Docker Build Fails

- Ensure Docker has enough resources allocated (8GB+ RAM recommended)
- Try: `docker system prune -a` to clean up
- Check Docker Desktop settings for resource allocation

### Backend Won't Start

- Check backend logs: `docker compose logs backend`
- Verify database path is writable
- Check environment variables are set correctly

### Frontend Won't Connect to Backend

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in `backend/app/main.py`
- Ensure backend is running and healthy: http://localhost:8000/health

### AWS Role Assumption Fails

- Verify Role ARN is correct and includes the account ID
- Check External ID matches exactly (case-sensitive)
- Verify trust policy allows your SpotSave account ID
- Check AWS CloudTrail logs for detailed errors

### Scan Takes Too Long

- Large accounts may take 10-15 minutes
- Check backend logs for progress
- Verify AWS credentials and permissions

## Production Deployment

### Recommended Setup

1. **Use PostgreSQL instead of SQLite**
   - Update `DATABASE_URL` to PostgreSQL connection string
   - SQLModel supports PostgreSQL out of the box

2. **Set up proper secrets management**
   - Use AWS Secrets Manager, HashiCorp Vault, or similar
   - Never commit `.env` files

3. **Enable HTTPS**
   - Use Cloudflare, AWS ALB, or similar
   - Update `NEXTAUTH_URL` accordingly

4. **Monitor and Logging**
   - Set up CloudWatch, Datadog, or similar
   - Monitor scan execution times and errors

5. **Backup Database**
   - Regular backups of scan results
   - Consider DynamoDB for scale (as mentioned in plan)

## License

Proprietary - All rights reserved

## Support

For issues, questions, or feature requests:
- GitHub Issues: [your-repo-url]/issues
- Email: support@spotsave.com

---

**Built with ❤️ for cost-conscious AWS users**

