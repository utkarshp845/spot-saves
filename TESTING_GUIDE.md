# SpotSave Testing Guide

## Quick Test (2 minutes)

Run the automated test script:

```bash
./test_application.sh
```

This will test all major components automatically.

## Manual Testing Steps

### 1. Verify Containers are Running (30 seconds)

```bash
docker compose ps
```

Expected output: All three containers (backend, frontend, cron) should show "Up" status, with backend showing "(healthy)".

### 2. Test Backend API (1 minute)

**Health Check:**
```bash
curl http://localhost:8000/health
```

Expected: JSON response with `"status": "healthy"`

**API Documentation:**
Open in browser: http://localhost:8000/docs

You should see the FastAPI Swagger UI with all available endpoints.

**Test Account Creation:**
```bash
curl -X POST "http://localhost:8000/api/accounts" \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "Test Account",
    "role_arn": "arn:aws:iam::123456789012:role/TestRole",
    "external_id": "test-id-123"
  }'
```

Expected: JSON response with account details including an `id` field.

**Test Dashboard:**
```bash
curl http://localhost:8000/api/dashboard
```

Expected: JSON response with `total_potential_savings_annual: 0.0` and empty opportunities array.

### 3. Test Frontend (1 minute)

**Homepage:**
Open in browser: http://localhost:3000

Expected: Beautiful landing page with "Find 20-50% AWS Cost Savings" heading.

**Scan Page:**
Open in browser: http://localhost:3000/scan

Expected: Form with fields for Role ARN and External ID.

**Dashboard Page:**
Open in browser: http://localhost:3000/dashboard

Expected: Dashboard showing empty state (no scans yet).

### 4. Test Full User Flow (Optional - requires AWS setup)

1. **Set up AWS IAM Role** (using Terraform):
   ```bash
   cd terraform-onboarding
   terraform init
   terraform apply
   # Copy the Role ARN and External ID from output
   ```

2. **Run a Scan**:
   - Go to http://localhost:3000/scan
   - Paste Role ARN and External ID
   - Click "Start Scan"
   - Wait 2-5 minutes for results

3. **View Results**:
   - Dashboard will automatically update
   - You should see savings opportunities
   - Click "Export JSON" to download results

### 5. Check Logs for Errors

```bash
# Backend logs
docker compose logs backend --tail 50

# Frontend logs
docker compose logs frontend --tail 50

# Cron logs
docker compose logs cron --tail 50
```

Expected: No errors, just startup messages and HTTP requests.

## Testing Specific Features

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# List accounts
curl http://localhost:8000/api/accounts

# Get dashboard
curl http://localhost:8000/api/dashboard

# Create account
curl -X POST http://localhost:8000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"account_name": "Test", "role_arn": "arn:aws:iam::123:role/Test", "external_id": "test"}'

# Trigger scan (replace ACCOUNT_ID with actual ID from above)
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"account_id": 1, "scan_type": "full"}'
```

### Test Frontend Pages

- **Homepage**: http://localhost:3000
- **Scan Page**: http://localhost:3000/scan
- **Dashboard**: http://localhost:3000/dashboard

All pages should load without errors in the browser console (open DevTools F12).

### Test Database

```bash
# Check if database exists
ls -lh backend/data/spotsave.db

# View database contents (requires sqlite3)
sqlite3 backend/data/spotsave.db ".tables"
sqlite3 backend/data/spotsave.db "SELECT * FROM accounts;"
```

## Performance Testing

### Response Times

```bash
# Test backend response time
time curl -s http://localhost:8000/health

# Test frontend response time
time curl -s http://localhost:3000
```

Expected: Both should respond in < 1 second.

### Load Testing (Optional)

Using Apache Bench:
```bash
# Test backend
ab -n 100 -c 10 http://localhost:8000/health

# Test frontend
ab -n 100 -c 10 http://localhost:3000
```

## Common Issues & Solutions

### Issue: Containers not starting
**Solution**: Check Docker is running and ports 3000/8000 are available

### Issue: Backend not healthy
**Solution**: Check backend logs: `docker compose logs backend`

### Issue: Frontend not loading
**Solution**: Check frontend logs: `docker compose logs frontend` and verify NEXT_PUBLIC_API_URL

### Issue: Database errors
**Solution**: Check database directory permissions: `ls -la backend/data`

## Test Checklist

- [ ] All containers running (`docker compose ps`)
- [ ] Backend health check returns 200 (`curl http://localhost:8000/health`)
- [ ] Frontend loads (`curl http://localhost:3000`)
- [ ] API docs accessible (http://localhost:8000/docs)
- [ ] Can create account via API
- [ ] Dashboard page loads
- [ ] Scan page loads
- [ ] No errors in container logs
- [ ] Database file exists after first API call

## Next Steps After Testing

Once all tests pass:

1. **Set up AWS IAM Role** using Terraform module
2. **Run a real scan** with your AWS account
3. **Review results** in the dashboard
4. **Export JSON** for analysis

## Automated Testing

For CI/CD integration, the test script can be run in any environment:

```bash
# Run all tests
./test_application.sh

# Exit code 0 = all passed
# Exit code 1 = some failed
```

