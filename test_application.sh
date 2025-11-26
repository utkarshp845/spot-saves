#!/bin/bash
# SpotSave Application Test Script
# Tests all major components of the application

set -e

echo "🧪 SpotSave Application Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $response)"
        ((FAILED++))
        return 1
    fi
}

# 1. Check Docker containers are running
echo "1️⃣  Checking Docker Containers..."
echo "-----------------------------------"
backend_status=$(docker compose ps --format json | grep -A 5 "spotsave-backend" | grep "Status" | grep -o "healthy\|Up" | head -1)
if [ "$backend_status" = "healthy" ] || [ "$backend_status" = "Up" ]; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Backend container is not running${NC}"
    ((FAILED++))
fi

frontend_status=$(docker compose ps | grep "spotsave-frontend" | grep -o "Up")
if [ -n "$frontend_status" ]; then
    echo -e "${GREEN}✓ Frontend container is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Frontend container is not running${NC}"
    ((FAILED++))
fi

cron_status=$(docker compose ps | grep "spotsave-cron" | grep -o "Up")
if [ -n "$cron_status" ]; then
    echo -e "${GREEN}✓ Cron container is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Cron container is not running${NC}"
    ((FAILED++))
fi

echo ""
echo "2️⃣  Testing Backend API Endpoints..."
echo "-----------------------------------"

# Test health endpoint
test_endpoint "Backend Health Check" "http://localhost:8000/health"

# Test API docs
test_endpoint "API Documentation" "http://localhost:8000/docs" 200

# Test OpenAPI schema
test_endpoint "OpenAPI Schema" "http://localhost:8000/openapi.json" 200

# Test accounts endpoint (should return empty array)
echo -n "Testing GET /api/accounts... "
response=$(curl -s "http://localhost:8000/api/accounts")
if echo "$response" | grep -q "\[\]"; then
    echo -e "${GREEN}✓ PASS${NC} (Returns empty array)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} (Unexpected response: $response)"
fi

# Test dashboard endpoint (should return empty dashboard)
echo -n "Testing GET /api/dashboard... "
response=$(curl -s "http://localhost:8000/api/dashboard")
if echo "$response" | grep -q "total_potential_savings_annual"; then
    echo -e "${GREEN}✓ PASS${NC} (Returns dashboard data)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Missing expected fields)"
    ((FAILED++))
fi

echo ""
echo "3️⃣  Testing Frontend..."
echo "-----------------------------------"

# Test frontend homepage
test_endpoint "Frontend Homepage" "http://localhost:3000" 200

# Test scan page
test_endpoint "Scan Page" "http://localhost:3000/scan" 200

# Test dashboard page
test_endpoint "Dashboard Page" "http://localhost:3000/dashboard" 200

echo ""
echo "4️⃣  Testing Database Connectivity..."
echo "-----------------------------------"

# Check if database file exists
if [ -f "backend/data/spotsave.db" ]; then
    echo -e "${GREEN}✓ Database file exists${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Database file not found (will be created on first use)${NC}"
fi

echo ""
echo "5️⃣  Testing API Functionality..."
echo "-----------------------------------"

# Test creating an account (with mock data)
echo -n "Testing POST /api/accounts (create account)... "
response=$(curl -s -X POST "http://localhost:8000/api/accounts" \
    -H "Content-Type: application/json" \
    -d '{
        "account_name": "Test Account",
        "role_arn": "arn:aws:iam::123456789012:role/TestRole",
        "external_id": "test-external-id-123"
    }')

if echo "$response" | grep -q "Test Account"; then
    echo -e "${GREEN}✓ PASS${NC} (Account created)"
    ACCOUNT_ID=$(echo "$response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Could not create account: $response)"
    ((FAILED++))
fi

echo ""
echo "6️⃣  Testing Error Handling..."
echo "-----------------------------------"

# Test invalid scan request
echo -n "Testing invalid scan request... "
response=$(curl -s -X POST "http://localhost:8000/api/scan" \
    -H "Content-Type: application/json" \
    -d '{}')
    
if echo "$response" | grep -q "detail\|error"; then
    echo -e "${GREEN}✓ PASS${NC} (Properly rejects invalid request)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARN${NC} (Unexpected response)"
fi

echo ""
echo "7️⃣  Testing Container Logs..."
echo "-----------------------------------"

# Check for errors in backend logs
backend_errors=$(docker compose logs backend 2>&1 | grep -i "error\|exception\|traceback" | grep -v "GET /favicon.ico" | wc -l)
if [ "$backend_errors" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors in backend logs${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Found $backend_errors potential errors in backend logs${NC}"
    ((FAILED++))
fi

# Check for errors in frontend logs
frontend_errors=$(docker compose logs frontend 2>&1 | grep -i "error\|exception" | wc -l)
if [ "$frontend_errors" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors in frontend logs${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Found $frontend_errors potential errors in frontend logs${NC}"
    ((FAILED++))
fi

# Check for errors in cron logs
cron_errors=$(docker compose logs cron 2>&1 | grep -i "error\|exception\|traceback\|ModuleNotFoundError" | wc -l)
if [ "$cron_errors" -eq 0 ]; then
    echo -e "${GREEN}✓ No errors in cron logs${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Found $cron_errors potential errors in cron logs${NC}"
    ((FAILED++))
fi

echo ""
echo "=================================="
echo "📊 Test Results Summary"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo ""

TOTAL=$((PASSED + FAILED))
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Application is working correctly.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi

