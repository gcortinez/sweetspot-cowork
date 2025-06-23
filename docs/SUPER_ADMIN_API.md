# Super Admin API Documentation

## Overview

The Super Admin API provides comprehensive management capabilities for the entire SweetSpot platform. Super Admins can manage coworks, view cross-tenant data, monitor system health, and handle billing operations.

## Authentication

All Super Admin endpoints require:
1. Valid JWT authentication token
2. User role must be `SUPER_ADMIN`
3. Each request is logged for audit purposes

**Base URL:** `/api/super-admin`

## Endpoints

### Cowork Management

#### GET /coworks
List all coworks in the system with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `status` (enum) - Filter by status: `ACTIVE`, `SUSPENDED`, `INACTIVE`
- `search` (string) - Search by name, slug, or description
- `sortBy` (enum, default: `createdAt`) - Sort field: `name`, `createdAt`, `updatedAt`
- `sortOrder` (enum, default: `desc`) - Sort order: `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "coworks": [
      {
        "id": "tenant_123",
        "name": "Tech Hub Santiago",
        "slug": "tech-hub-santiago",
        "domain": "techhub.cl",
        "logo": "https://example.com/logo.png",
        "description": "Premium coworking space",
        "status": "ACTIVE",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### GET /coworks/:id
Get detailed information about a specific cowork.

**Response:**
```json
{
  "success": true,
  "data": {
    "cowork": {
      "id": "tenant_123",
      "name": "Tech Hub Santiago",
      "slug": "tech-hub-santiago",
      "status": "ACTIVE",
      // ... other cowork fields
    },
    "stats": {
      "userCount": 45,
      "clientCount": 12,
      "activeBookings": 8,
      "totalRevenue": 125000,
      "spacesCount": 25
    }
  }
}
```

#### POST /coworks
Create a new cowork with admin user.

**Request Body:**
```json
{
  "name": "New Cowork Space",
  "slug": "new-cowork-space",
  "domain": "https://newcowork.com",
  "logo": "https://example.com/logo.png",
  "description": "A new premium coworking space",
  "settings": {
    "timezone": "America/Santiago",
    "currency": "CLP"
  },
  "adminUser": {
    "email": "admin@newcowork.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+56912345678"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cowork": {
      "id": "tenant_456",
      "name": "New Cowork Space",
      "slug": "new-cowork-space",
      "status": "ACTIVE",
      // ... other fields
    }
  },
  "message": "Cowork \"New Cowork Space\" created successfully"
}
```

#### PUT /coworks/:id
Update cowork information.

**Request Body:**
```json
{
  "name": "Updated Cowork Name",
  "description": "Updated description",
  "status": "SUSPENDED"
}
```

#### PUT /coworks/:id/suspend
Suspend a cowork (prevents access but preserves data).

**Request Body:**
```json
{
  "reason": "Payment overdue for 60 days",
  "notifyUsers": true
}
```

#### PUT /coworks/:id/activate
Activate a suspended cowork.

**Request Body:**
```json
{
  "reason": "Payment received and verified",
  "notifyUsers": true
}
```

#### DELETE /coworks/:id
Delete a cowork (soft delete by default).

**Query Parameters:**
- `hard` (boolean, default: false) - Perform hard delete (permanent)

### Cross-Tenant Data Access

#### GET /coworks/:id/users
Get all users from a specific cowork.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `role` (enum) - Filter by role
- `status` (enum) - Filter by status
- `search` (string) - Search users

**Response:**
```json
{
  "success": true,
  "data": {
    "cowork": {
      "id": "tenant_123",
      "name": "Tech Hub Santiago",
      "slug": "tech-hub-santiago"
    },
    "users": [
      {
        "id": "user_123",
        "email": "user@techhub.cl",
        "firstName": "John",
        "lastName": "Doe",
        "role": "COWORK_ADMIN",
        "status": "ACTIVE",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45,
      "totalPages": 1
    }
  }
}
```

#### GET /coworks/:id/clients
Get all clients from a specific cowork.

**Note:** This endpoint is currently in development and will return placeholder data.

### System Analytics

#### GET /analytics
Get system-wide analytics and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTenants": 15,
      "activeTenants": 12,
      "suspendedTenants": 2,
      "inactiveTenants": 1,
      "totalUsers": 450,
      "totalClients": 125,
      "totalRevenue": 2500000,
      "recentTenants": [
        // ... last 5 created tenants
      ]
    },
    "systemHealth": {
      "status": "healthy",
      "uptime": 86400
    }
  },
  "message": "Full analytics dashboard will be implemented in the next phase"
}
```

### Billing Management

#### GET /billing/overview
Get billing overview for all coworks.

**Note:** This endpoint is currently in development and will return placeholder data.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 0,
    "monthlyRecurring": 0,
    "pendingPayments": 0,
    "overduePayments": 0,
    "coworksBilling": [],
    "recentTransactions": []
  },
  "message": "Billing integration will be implemented in the next phase"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Human-readable error description"
}
```

### Common Error Codes

- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - User is not a Super Admin
- **404 Not Found** - Cowork or resource not found
- **400 Bad Request** - Invalid request parameters
- **500 Internal Server Error** - Server error

## Security Features

### Access Control
- All endpoints verify `SUPER_ADMIN` role
- Comprehensive logging of all actions
- Rate limiting to prevent abuse

### Audit Trail
- Every Super Admin action is logged
- Includes user ID, action, timestamp, and details
- Logs are available for compliance and security auditing

### Cross-Tenant Access
- Super Admins can access data across all tenants
- Bypasses normal tenant restrictions with proper authorization
- All cross-tenant queries are logged for security

## Rate Limiting

Super Admin endpoints have specific rate limits:
- **Standard operations**: 100 requests per minute
- **Bulk operations**: 10 requests per minute
- **System analytics**: 20 requests per minute

## Usage Examples

### Get All Coworks
```bash
curl -X GET "https://api.sweetspot.com/api/super-admin/coworks?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create New Cowork
```bash
curl -X POST "https://api.sweetspot.com/api/super-admin/coworks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Innovation Hub",
    "slug": "innovation-hub",
    "adminUser": {
      "email": "admin@innovationhub.com",
      "password": "SecurePass123!",
      "firstName": "Admin",
      "lastName": "User"
    }
  }'
```

### Suspend Cowork
```bash
curl -X PUT "https://api.sweetspot.com/api/super-admin/coworks/tenant_123/suspend" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Payment overdue",
    "notifyUsers": true
  }'
```

## Implementation Status

✅ **Completed (Phase 1)**
- SuperAdminController with all endpoints
- Cross-tenant cowork management
- User management across tenants
- System statistics and health monitoring
- Complete authentication and authorization
- Comprehensive error handling and logging

🚧 **In Development (Future Phases)**
- Client management endpoints
- Advanced billing integration
- Detailed analytics dashboard
- User notification system
- Advanced audit trail interface

## Next Steps

The Super Admin API backend is now complete and ready for frontend integration. The next phase will focus on:

1. Frontend dashboard implementation
2. Billing system integration
3. Advanced analytics features
4. Enhanced audit trail interface