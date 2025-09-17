# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Usa ejecuciones paralelas de procesos de claude code cuando sea posible


## Development Commands

**Core development workflow:**
```bash
npm run dev                 # Start development server with Turbopack on http://localhost:3000
npm run build              # Build for production (includes type checking)
npm run start              # Start production server
npm run lint               # Run ESLint with Next.js config
npm run type-check         # Run TypeScript compiler without emitting
npm run clean              # Clean Next.js build cache
```

**Database operations:**
```bash
npm run db:generate        # Generate Prisma client from schema
npm run db:push           # Push schema changes to database
npm run db:migrate        # Run database migrations (development)
npm run db:studio         # Open Prisma Studio for database exploration
npm run create-super-admin # Create production super admin user
```

**Testing:**
```bash
npm test                  # Run Jest unit tests
npm run test:watch        # Run tests in watch mode for development
npm run test:e2e          # Run Playwright end-to-end tests
npm run test:performance  # Run performance tests
```

## Architecture Overview

**Technology Stack:**
- **Framework**: Next.js 15.5.0 with App Router and Server Actions
- **Authentication**: Clerk Auth (v6.24.0) with webhook integration
- **Database**: PostgreSQL with Prisma ORM (v6.11.1)
- **UI**: React 19.1.1, TailwindCSS, shadcn/ui components, Radix UI primitives
- **Validation**: Zod schemas (v3.25.63) for type-safe validation
- **State Management**: Zustand (v5.0.5) for client state, Clerk for auth state
- **Testing**: Jest (unit), Playwright (e2e), custom performance tests
- **File Storage**: Vercel Blob for file uploads
- **Email**: Resend for transactional emails
- **Calendar Integration**: FullCalendar, Google Calendar API

**Multi-Tenant SaaS Architecture:**
- Complete tenant isolation through database design and middleware
- Four user roles: `SUPER_ADMIN`, `COWORK_ADMIN`, `COWORK_USER`
- Super Admins (tenantId: null) manage the platform and can access all coworks
- Each cowork is a separate tenant with isolated data and users
- Clerk metadata integration for user role management

## Key Directories & Patterns

**Server Actions (`src/lib/actions/`):**
- Business logic layer replacing traditional API controllers
- Each module exports actions like `createX`, `updateX`, `deleteX`, `listX`
- FormData-based actions for form submissions (e.g., `createSpaceFormAction`)
- All database operations through Server Actions
- Use Zod validation schemas from `src/lib/validations/`

**Validation Schemas (`src/lib/validations/`):**
- Zod schemas for all data validation
- Named exports to avoid conflicts (e.g., `createSpaceSchema` vs `createTenantSpaceSchema`)
- Type exports derived with `z.infer<typeof schema>`
- Preprocessing for form data conversion (e.g., empty strings to undefined)
- Spanish error messages for user-facing validation

**Authentication System:**
- **Clerk Integration**: `@clerk/nextjs/server` for server-side auth
- **Middleware**: `src/middleware.ts` uses `clerkMiddleware` for route protection
- **Server Auth**: `src/lib/server/auth.ts` with `getCurrentUser()` function
- **User Sync**: Database users linked to Clerk via `clerkId` field
- **Protected Routes**: Defined in middleware with route matchers
- **Webhooks**: Clerk webhook integration for user sync at `/api/webhooks/clerk`

**API Compatibility Layer (`src/app/api/`):**
- RESTful endpoints that call Server Actions
- Maintains external API compatibility
- Clerk webhook endpoint for user synchronization
- Each endpoint validates requests and delegates to appropriate Server Actions

## Critical Implementation Notes

**Environment Setup:**
- Copy `.env.example` to `.env.local` and configure credentials
- **Clerk Variables**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key for Clerk
  - `CLERK_SECRET_KEY`: Secret key for Clerk backend
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: "/auth/login"
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: "/auth/register"
  - `CLERK_WEBHOOK_SECRET`: For webhook verification
- **Database URLs**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `DIRECT_URL`: Direct database connection for migrations
- **Other Services**:
  - `RESEND_API_KEY`: For email sending
  - `VERCEL_BLOB_READ_WRITE_TOKEN`: For file storage

**Authentication Flow:**
- Login/register through Clerk components at `/auth/login` and `/auth/register`
- User records automatically synced to database via webhooks
- Route protection via middleware with `clerkMiddleware`
- Role management through Clerk metadata and database sync
- Super Admin authentication: users with `tenantId: null` and role `SUPER_ADMIN`

**Server Components Best Practices (Next.js 15.5):**
- Use Server Components by default (no `'use client'` unless needed)
- Forms use native HTML with Server Actions (FormData)
- Data fetching through Server Actions, not direct Prisma calls in components
- Proper serialization of Decimal and complex types from Prisma
- Avoid hydration issues with consistent server/client rendering

**Database Schema:**
- Multi-tenant design with `tenantId` on all relevant tables
- User-Clerk sync via `clerkId` field
- Prisma schema at `prisma/schema.prisma`
- SpaceTypeConfig for dynamic space type management
- Comprehensive booking and space management models

**Common Issues to Watch:**
- **Decimal Serialization**: Convert Prisma Decimal to Number in Server Actions
- **Button with asChild**: Ensure single child element (no whitespace)
- **Clerk User Sync**: Handle both clerkId and email fallback lookups
- **Form Validation**: Use z.preprocess for empty string to undefined conversion
- **Dynamic Routes**: Pages with auth will show "DYNAMIC_SERVER_USAGE" warnings (normal)

**Testing Strategy:**
- Unit tests for Server Actions with mocked dependencies
- Integration tests for API endpoints
- E2E tests for complete user workflows with Playwright
- Performance tests for load testing critical paths

**Deployment Notes:**
- Production-ready Next.js 15.5 with Server Actions
- Environment-specific configs in `.env.production.example`
- Health checks at `/api/health`, metrics at `/api/metrics`
- Vercel deployment optimized with proper environment variables

## Important Development Guidelines

- **Data Usage Guidelines**:
  - Nunca utilices data falsa o dummy ya que esta es una app que ya esta productiva y sus cambios son para optimizar lo que ya existe. Repito nunca uses data falsa dummy o ficticia
  - Nunca uses datos mock en ninguna parte de la app siempre usa apis y base de datos
  - Siempre usa datos reales de la base de datos PostgreSQL

## Development Best Practices:

- Remember to do a commit when you make changes or finish implementation phases before moving to the next step
- Follow Next.js 15.5 best practices: Server Components by default, Server Actions for mutations
- Use parallel tool executions when possible for better performance
- Always handle Decimal field serialization when passing data to client components
- Ensure Spanish localization for all user-facing text

## Development Recommendations

- Siempre que crees un nuevo componente utiliza context7 MCP server para traer la documentacion mas actualizada
- Siempre prefiere Server Actions sobre API routes tradicionales
- Usa Server Components por defecto, solo usa 'use client' cuando necesites interactividad
- Prefiere formularios HTML nativos con Server Actions sobre bibliotecas de formularios del cliente
- Siempre serializa campos Decimal de Prisma antes de pasar a componentes cliente