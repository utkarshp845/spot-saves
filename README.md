# SpotSave - AWS Cost Optimization Scanner

Find 20-50% AWS cost savings opportunities in minutes. Read-only scanning, charges only after showing results.

## Features

- **Reserved Instances/Savings Plans Analysis**: Identify RI/SP optimization opportunities
- **Rightsizing Recommendations**: Find instances that can be resized
- **Idle Resource Detection**: Discover unused or underutilized resources
- **Graviton Migration Opportunities**: Identify workloads suitable for ARM-based Graviton instances
- **Detailed Savings Reports**: Actionable recommendations with cost breakdowns

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.12), SQLModel, boto3
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Docker, AWS App Runner

## Quick Start

### Prerequisites

- Docker and Docker Compose
- AWS Account with appropriate IAM permissions
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd pandey-saves
```

2. Start the services:
```bash
docker compose up
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Environment Variables

Copy `.env.example` to `.env` and configure:

**Backend (.env):**
```
DATABASE_URL=sqlite:///./data/spotsave.db
AWS_REGION=us-east-1
ENVIRONMENT=development
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
.
├── backend/          # FastAPI backend application
│   ├── app/         # Application code
│   ├── Dockerfile   # Backend container image
│   └── requirements.txt
├── frontend/        # Next.js frontend application
│   ├── app/         # Next.js app router pages
│   ├── components/  # React components
│   ├── Dockerfile   # Frontend container image
│   └── package.json
├── docker-compose.yml  # Local development setup
└── README.md
```

## AWS Setup

To scan your AWS account, you'll need to set up an IAM role:

1. Use the CloudFormation template in `cloudformation/spotsave-role.yaml`
2. Follow the onboarding flow in the application
3. Run your first scan

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]
