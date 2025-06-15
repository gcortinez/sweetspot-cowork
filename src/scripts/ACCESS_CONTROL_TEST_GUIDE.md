# Access Control Testing Guide

## Overview
This guide explains how to test the Access Control system implementation.

## Test Scripts

### 1. Unit Tests (`test-access-control-unit.ts`)
Tests core functionality without database dependencies:
- Schema validation
- JWT token generation and verification
- QR code generation
- Time and day restrictions
- Permission matching

**Run:** `npx tsx src/scripts/test-access-control-unit.ts`

### 2. Integration Tests (`test-access-control.ts`)
Tests with database integration:
- QR code generation and scanning
- Access zones and rules
- Occupancy tracking
- Access logs
- Violation handling

**Run:** `npx tsx src/scripts/test-access-control.ts`
*Note: Requires database connection*

### 3. API Tests (`test-access-control-api.ts`)
Tests HTTP endpoints:
- QR code endpoints
- Access zone endpoints
- Access rule endpoints
- Occupancy endpoints
- Access log endpoints
- Violation endpoints

**Run:** 
1. Start server: `npm run dev`
2. Run tests: `npx tsx src/scripts/test-access-control-api.ts`

## API Endpoints

### QR Code Management
- `POST /api/access-control/qr-codes` - Generate QR code
- `POST /api/access-control/qr-codes/scan` - Scan QR code
- `GET /api/access-control/my-qr-codes` - Get user's QR codes
- `DELETE /api/access-control/qr-codes/:id` - Revoke QR code
- `GET /api/access-control/qr-codes/scans` - Get scan history

### Access Zones
- `POST /api/access-control/access-zones` - Create zone
- `GET /api/access-control/access-zones` - List zones
- `PUT /api/access-control/access-zones/:id` - Update zone

### Access Rules
- `POST /api/access-control/access-rules` - Create rule
- `GET /api/access-control/access-rules` - List rules
- `PUT /api/access-control/access-rules/:id` - Update rule
- `DELETE /api/access-control/access-rules/:id` - Delete rule

### Occupancy
- `GET /api/access-control/occupancy` - Get current occupancy
- `POST /api/access-control/occupancy/update` - Update occupancy

### Logs & Violations
- `GET /api/access-control/access-logs` - Get access logs
- `GET /api/access-control/violations` - Get violations
- `PUT /api/access-control/violations/:id/resolve` - Resolve violation

## Testing with cURL

### Generate QR Code
```bash
curl -X POST http://localhost:4000/api/access-control/qr-codes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MEMBER",
    "userId": "USER_ID",
    "validFor": 24,
    "permissions": ["general_access"],
    "maxScans": 10
  }'
```

### Scan QR Code
```bash
curl -X POST http://localhost:4000/api/access-control/qr-codes/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeData": "QR_CODE_TOKEN",
    "location": "Main Entrance"
  }'
```

## Expected Results

### Successful QR Code Generation
- Returns QR code ID, token, and image URL
- Valid from/until dates set correctly
- Permissions array included

### Successful QR Code Scan
- Returns success: true
- accessGranted: true/false based on validation
- userInfo object with user details
- Updates scan count

### Access Rule Validation
- Time restrictions enforced
- Day restrictions checked
- Membership/plan requirements validated
- Occupancy limits respected

## Common Issues

1. **Database Connection**: Ensure DATABASE_URL is correctly configured
2. **JWT Secret**: Set QR_JWT_SECRET environment variable
3. **Tenant Context**: Ensure user has valid tenantId
4. **Permissions**: Check user role has required permissions