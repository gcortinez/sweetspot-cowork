# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Usa ejecuciones paralelas de procesos de claude code cuando sea posible


## Development Commands

**Core development workflow:**
```bash
npm run dev                 # Start development server on http://localhost:3000
npm run build              # Build for production (includes type checking)
npm run start              # Start production server
npm run lint               # Run ESLint with Next.js config
npm run type-check         # Run TypeScript compiler without emitting
```

**Database operations:**
```bash
npm run db:generate        # Generate Prisma client from schema
npm run db:push           # Push schema changes to Supabase database
npm run db:migrate        # Run database migrations (development)
npm run db:studio         # Open Prisma Studio for database exploration
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
- **Framework**: Next.js 15.3.3 with App Router and Server Actions
- **Authentication**: Supabase Auth with JWT tokens and Row Level Security (RLS)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **UI**: React 19, TailwindCSS, shadcn/ui components, Radix UI primitives
- **Validation**: Zod schemas for type-safe validation
- **State Management**: Zustand for client state, React Context for auth
- **Testing**: Jest (unit), Playwright (e2e), custom performance tests

**Multi-Tenant SaaS Architecture:**
- Complete tenant isolation through database Row Level Security (RLS)
- Four user roles: `SUPER_ADMIN`, `COWORK_ADMIN`, `CLIENT_ADMIN`, `END_USER`
- Super Admins (tenantId: null) manage the platform and can access all coworks
- Each cowork is a separate tenant with isolated data and users

## Key Directories & Patterns

**Server Actions (`src/lib/actions/`):**
- Business logic layer replacing traditional API controllers
- Each module exports actions like `createX`, `updateX`, `deleteX`, `listX`
- Import from centralized `src/lib/actions/index.ts`
- Use Zod validation schemas from `src/lib/validations/`

**Validation Schemas (`src/lib/validations/`):**
- Zod schemas for all data validation
- Named exports to avoid conflicts (e.g., `createSpaceSchema` vs `createTenantSpaceSchema`)
- Type exports derived with `z.infer<typeof schema>`
- Centralized in `index.ts` with specific named exports

**Authentication System:**
- Supabase client/server separation: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`
- Auth context: `src/contexts/auth-context.tsx` (client-side only)
- Protected routes use `src/components/auth/auth-guard.tsx`
- Session management via Supabase SSR with middleware

**API Compatibility Layer (`src/app/api/`):**
- RESTful endpoints that call Server Actions
- Maintains external API compatibility
- Each endpoint validates requests and delegates to appropriate Server Actions

## Critical Implementation Notes

**Environment Setup:**
- Copy `.env.example` to `.env.local` and configure Supabase credentials
- Required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Database URLs for Prisma: `DATABASE_URL`, `DIRECT_URL`

**Authentication Flow:**
- Login/register through `src/contexts/auth-context.tsx` using Supabase browser client
- User records stored in database, linked to Supabase auth via `auth_id` field
- Route protection via `src/components/auth/auth-guard.tsx` and middleware
- Super Admin authentication: users with `tenantId: null` and role `SUPER_ADMIN`

**Hydration & SSR:**
- Use `isMounted` state for client-side only features
- Avoid localStorage access during SSR with `typeof window !== 'undefined'` checks
- Auth context returns consistent loading states for server/client rendering

**Database Schema:**
- Multi-tenant with RLS policies for tenant isolation
- Prisma schema at `prisma/schema.prisma`
- User roles enforced at database level through RLS

**Common Issues to Watch:**
- Validation schema export conflicts: use specific named exports in `src/lib/validations/index.ts`
- Supabase client/server imports: never import server code in client components
- Hydration mismatches: ensure consistent server/client rendering
- Missing auth context: wrap protected areas with `AuthProvider`

**Testing Strategy:**
- Unit tests for Server Actions with mocked dependencies
- Integration tests for API endpoints
- E2E tests for complete user workflows with Playwright
- Performance tests for load testing critical paths

**Deployment Notes:**
- Migrated from Node.js/Express to Next.js Server Actions (production ready)
- Environment-specific configs in `.env.production.example`
- Health checks at `/api/health`, metrics at `/api/metrics`

## Important Development Guidelines

- **Data Usage Guidelines**:
  - Nunca utilices data falsa o dummy ya que esta es una app que ya esta productiva y sus cambios son para optimizar lo que ya existe. Repito nunca uses data falta dummy o ficticia
  - Nunca uses datos mock en ninguna parte de la app siempre usa apis y base de datos

## Development Best Practices:

- Remember to do a commit when you make changes or finish implementation phases before moving to the next step

## Development Recommendations

- Siempre que crees un nuevo componente utiliza context7 MCP server para traer la documentacion mas actualizada
- Siempre prefiere server actions