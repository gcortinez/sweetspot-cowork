# SweetSpot Cowork API Documentation

## Overview

The SweetSpot Cowork API is a comprehensive RESTful API built with Next.js Server Actions and designed for multi-tenant coworking space management. This API provides endpoints for managing clients, bookings, invoices, memberships, notifications, reports, and integrations.

## Quick Start

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://app.sweetspotcowork.com/api`

### Authentication

All API endpoints require authentication using JWT tokens from Supabase Auth. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Making Your First Request

```bash
# Get list of clients
curl -X GET \
  'http://localhost:3000/api/clients' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

## Core Concepts

### Multi-Tenancy

Every API request is automatically scoped to the authenticated user's tenant. The tenant context is extracted from the JWT token and enforced at the database level using Row Level Security (RLS).

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (for list endpoints)
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Field-specific validation errors
  }
}
```

### Pagination

List endpoints support pagination with these query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Filtering and Sorting

Many list endpoints support filtering and sorting:
- `search`: Search term
- `sortBy`: Field to sort by
- `sortOrder`: Sort direction (`asc` or `desc`)
- Entity-specific filters (e.g., `type`, `status`)

## API Endpoints

### Clients

#### List Clients
```http
GET /api/clients
```

Query Parameters:
- `page` (integer): Page number
- `limit` (integer): Items per page (1-100)
- `search` (string): Search by name or email
- `type` (string): Filter by client type (`INDIVIDUAL`, `COMPANY`)
- `status` (string): Filter by status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`)
- `tags` (string): Filter by tags (comma-separated)
- `sortBy` (string): Sort field (`name`, `email`, `createdAt`, `updatedAt`)
- `sortOrder` (string): Sort direction (`asc`, `desc`)

Example Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "client_123",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "INDIVIDUAL",
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

#### Create Client
```http
POST /api/clients
```

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "type": "INDIVIDUAL",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "tags": ["VIP", "Premium"]
}
```

#### Get Client
```http
GET /api/clients/{id}
```

#### Update Client
```http
PUT /api/clients/{id}
```

#### Delete Client
```http
DELETE /api/clients/{id}
```

### Bookings

#### List Bookings
```http
GET /api/bookings
```

Query Parameters:
- `clientId` (string): Filter by client
- `spaceId` (string): Filter by space
- `status` (string): Filter by booking status
- `startDate` (datetime): Filter bookings from date
- `endDate` (datetime): Filter bookings to date

#### Create Booking
```http
POST /api/bookings
```

Request Body:
```json
{
  "clientId": "client_123",
  "spaceId": "space_456",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "notes": "Regular daily booking"
}
```

### Health Check

#### Application Health
```http
GET /api/health
```

Returns application health status and system information for monitoring.

### Metrics

#### Prometheus Metrics
```http
GET /api/metrics
```

Returns metrics in Prometheus format for monitoring and alerting.

## Error Handling

### HTTP Status Codes

- `200` OK - Request successful
- `201` Created - Resource created successfully
- `400` Bad Request - Validation error or malformed request
- `401` Unauthorized - Invalid or missing authentication
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Resource conflict (e.g., duplicate email)
- `500` Internal Server Error - Server error

### Common Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "email": "Invalid email format"
  }
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": "Unauthorized access"
}
```

**Resource Not Found (404):**
```json
{
  "success": false,
  "error": "Client not found"
}
```

**Conflict Error (409):**
```json
{
  "success": false,
  "error": "Client with this email already exists"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **General endpoints**: 1000 requests per hour per user
- **List endpoints**: 500 requests per hour per user
- **Create/Update endpoints**: 200 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## SDK and Client Libraries

### JavaScript/TypeScript

```typescript
// Example usage with Server Actions
import { createClientAction, listClientsAction } from '@/lib/actions/client'

// Create a new client
const result = await createClientAction({
  name: 'Acme Corp',
  email: 'contact@acme.com',
  type: 'COMPANY'
})

// List clients
const clients = await listClientsAction({
  page: 1,
  limit: 20,
  type: 'COMPANY'
})
```

### cURL Examples

```bash
# List clients with filtering
curl -X GET \
  'http://localhost:3000/api/clients?type=COMPANY&status=ACTIVE&limit=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Create a new client
curl -X POST \
  'http://localhost:3000/api/clients' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "type": "INDIVIDUAL"
  }'

# Create a booking
curl -X POST \
  'http://localhost:3000/api/bookings' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientId": "client_123",
    "spaceId": "space_456",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T17:00:00Z"
  }'
```

## Support

- **Documentation**: [https://docs.sweetspotcowork.com](https://docs.sweetspotcowork.com)
- **Support Email**: [support@sweetspotcowork.com](mailto:support@sweetspotcowork.com)
- **Developer Forum**: [https://community.sweetspotcowork.com](https://community.sweetspotcowork.com)

## Changelog

### v1.0.0 (Current)
- Initial API release
- Client management endpoints
- Booking management endpoints
- Complete Server Actions implementation
- Multi-tenant support
- JWT authentication
- Row Level Security (RLS)
- Comprehensive validation
- Health check and metrics endpoints