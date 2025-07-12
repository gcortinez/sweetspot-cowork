# API Compatibility Layer

This directory contains API route handlers that provide backward compatibility during the transition from the Node.js/Express backend to Next.js Server Actions.

## Purpose

- **Backward Compatibility**: Existing frontend code can continue to use API endpoints
- **Gradual Migration**: Components can be migrated to Server Actions incrementally
- **Testing**: Allows testing of Server Actions through familiar HTTP endpoints

## Architecture

```
Frontend Request → API Route → Server Action → Response
```

Each API route is a thin wrapper around the corresponding Server Action:

1. **Input Validation**: Handled by the Server Action's Zod schemas
2. **Business Logic**: Executed in the Server Action
3. **Response Formatting**: Standardized JSON responses

## Available Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/session` - Refresh session
- `POST /api/auth/password-reset` - Request password reset
- `PUT /api/auth/password-reset` - Reset password with token

### Response Format

All API endpoints return a consistent JSON format:

```typescript
// Success Response
{
  success: true,
  data?: any,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  fieldErrors?: Record<string, string>
}
```

## Migration Strategy

1. **Phase 1**: Create API compatibility layer (✅ Current)
2. **Phase 2**: Update components to use Server Actions directly
3. **Phase 3**: Remove API routes once all components are migrated

## Security

- All API routes use the same authentication middleware as the original backend
- Session management is handled by HTTP-only cookies
- Input validation is performed by Server Actions using Zod schemas

## Usage

### With fetch (current approach)
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
const result = await response.json()
```

### With Server Actions (target approach)
```typescript
import { loginAction } from '@/lib/actions/auth'

const result = await loginAction({ email, password })
```

## Environment Variables

The API routes use the same environment variables as the Server Actions:

- `DATABASE_URL` - PostgreSQL database connection
- `DIRECT_URL` - Direct database connection for migrations
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Error Handling

API routes provide consistent error handling:

- **400 Bad Request**: Validation errors or business logic failures
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Unexpected errors

## Rate Limiting

Consider implementing rate limiting for API endpoints to prevent abuse:

```typescript
// Future implementation
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  await rateLimit(request)
  // ... rest of the handler
}
```

## Monitoring

API routes can be monitored using:

- Next.js built-in analytics
- Custom logging middleware
- External monitoring services (e.g., Vercel Analytics, DataDog)

## Testing

API routes can be tested using:

- Jest with supertest for integration tests
- Postman/Insomnia for manual testing
- Cypress for E2E testing