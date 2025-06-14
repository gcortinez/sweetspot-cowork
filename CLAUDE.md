# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SweetSpot Cowork is a comprehensive multi-tenant SaaS platform for coworking space management built with:
- **Frontend**: Next.js 15.3.3, TypeScript, TailwindCSS, shadcn, Zustand
- **Backend**: Express, TypeScript, Prisma ORM
- **Database**: Supabase PostgreSQL with Row Level Security
- **Monorepo**: Turbo-powered with npm workspaces

## Common Development Commands

### Core Commands
```bash
# Development (starts all services)
npm run dev

# Build all packages
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing (backend only currently)
npm run test
```

### Database Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Prisma Studio (from backend)
cd apps/backend && npm run db:studio
```

### Backend-Specific Development Scripts
```bash
cd apps/backend

# Environment validation
npm run script:check-env

# Create super admin user
npm run script:create-super-admin

# Test Supabase connection
npm run script:test-connection

# Test RLS policies
npm run script:test-rls

# Validate multi-tenant setup
npm run script:validate-multitenant
```

### TaskMaster Commands
```bash
# View all project tasks
npm run tasks:list

# Get next task to work on
npm run tasks:next

# View specific task details
npm run tasks:show <task-id>

# Update task status
npm run tasks:status <task-id> <status>
```

## High-Level Architecture

### Multi-Tenant Hierarchy
1. **Super Admin** - Platform-wide administration
2. **Cowork Admin** - Manages specific coworking space
3. **Client Admin** - Manages company/team within a cowork
4. **End User** - Individual users with facility access

### Key Architectural Patterns

#### Backend Structure
```
apps/backend/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer
│   ├── routes/          # Express route definitions
│   ├── middleware/      # Auth, tenant context, validation
│   ├── lib/            # Supabase clients, utilities
│   └── scripts/        # Development and testing scripts
└── prisma/
    └── schema.prisma   # 15+ models for all business domains
```

#### Frontend Structure
```
apps/frontend/
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   ├── contexts/       # React contexts for state
│   ├── hooks/          # Custom React hooks
│   ├── lib/           # Utilities, API clients
│   ├── stores/        # Zustand state stores
│   └── types/         # TypeScript type definitions
```

#### Shared Package
```
packages/shared/
├── src/
│   ├── types/         # Shared TypeScript types
│   └── index.ts       # Main export file
└── dist/              # Compiled CommonJS output
```

### Database Architecture

The Prisma schema defines a comprehensive multi-tenant data model with:
- **Row Level Security (RLS)** for data isolation
- **Tenant-scoped** relationships for all entities
- **Comprehensive enums** for status management
- **Financial precision** with Decimal types
- **Audit trails** with createdAt/updatedAt

Key models include:
- `Tenant`, `User`, `Client` (core entities)
- `Space`, `Plan`, `Service` (resource management)
- `Booking`, `Invoice`, `Payment` (transactions)
- `AccessLog`, `Visitor` (access control)
- `Quotation`, `Contract`, `Membership` (business operations)

### API Design Patterns

1. **Authentication Flow**:
   - Supabase Auth for user authentication
   - JWT tokens with tenant context
   - Middleware validates auth and sets tenant scope

2. **Request Validation**:
   - Zod schemas for all API endpoints
   - Type-safe request/response handling
   - Consistent error responses

3. **Service Layer Pattern**:
   - Controllers handle HTTP logic
   - Services contain business logic
   - Clear separation of concerns

### Development Workflow

1. **Environment Setup**:
   - Copy `.env.example` files in both frontend and backend
   - Configure Supabase credentials
   - Run `scripts/setup-supabase.sh` for automated setup

2. **Type Safety**:
   - Shared types package ensures consistency
   - Prisma generates TypeScript types from schema
   - Zod validation at API boundaries

3. **Testing Strategy**:
   - Backend has comprehensive test scripts
   - Test scripts validate auth, RLS, multi-tenant setup
   - Use `npm run test` in backend for Jest tests

4. **Database Changes**:
   - Modify `prisma/schema.prisma`
   - Run `npm run db:generate` to update client
   - Run `npm run db:push` for development
   - Use migrations for production

### Important Considerations

1. **Multi-Tenant Context**: All database queries must be scoped to the current tenant. The auth middleware sets `req.tenantId` which should be used in all queries.

2. **RLS Policies**: Supabase Row Level Security is critical. Never bypass RLS unless explicitly required for super admin operations.

3. **Environment Variables**: 
   - Backend needs `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Frontend needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Type Imports**: Use `@sweetspot/shared` for importing shared types across workspaces.

5. **Turbo Cache**: Build outputs are cached. Use `npm run clean` if you encounter stale build issues.

6. **Real-time Features**: Supabase Realtime subscriptions are available for live updates. Consider performance implications for large-scale deployments.

## Coding patterns
– Always prefer simple solutions  
– Only use context7 to search for documentation, dont use internet search. 
– Never use fake data. always connect to the database and work with real persistent data 
– Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality  
– You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested  
– When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don’t have duplicate logic.  
– Keep the codebase very clean and organized  
– Avoid writing scripts in files if possible, especially if the script is likely only to be run once  
– Avoid having files over 200–300 lines of code. Refactor at that point.  
– Mocking data is only needed for tests, never mock data for dev or prod  
– Never add stubbing or fake data patterns to code that affects the dev or prod environments  
– Never overwrite my .env file without first asking and confirming

## nextjs
You are a Senior Front-End Developer and an Expert in ReactJS, NextJS, JavaScript, TypeScript, HTML, CSS and modern UI/UX frameworks (e.g., TailwindCSS, Shadcn, Radix). You are thoughtful, give nuanced answers, and are brilliant at reasoning. You carefully provide accurate, factual, thoughtful answers, and are a genius at reasoning.

- Follow the user’s requirements carefully & to the letter.
- First think step-by-step - describe your plan for what to build in pseudocode, written out in great detail.
- Confirm, then write code!
- Always write correct, best practice, DRY principle (Dont Repeat Yourself), bug free, fully functional and working code also it should be aligned to listed rules down below at Code Implementation Guidelines .
- Focus on easy and readability code, over being performant.
- Fully implement all requested functionality.
- Leave NO todo’s, placeholders or missing pieces.
- Ensure code is complete! Verify thoroughly finalised.
- Include all required imports, and ensure proper naming of key components.
- Be concise Minimize any other prose.
- If you think there might not be a correct answer, you say so.
- If you do not know the answer, say so, instead of guessing.

### Coding Environment
The user asks questions about the following coding languages:
- ReactJS
- NextJS
- JavaScript
- TypeScript
- TailwindCSS
- HTML
- CSS

### Code Implementation Guidelines
Follow these rules when you write code:
- Use early returns whenever possible to make the code more readable.
- Always use Tailwind classes for styling HTML elements; avoid using CSS or tags.
- Use “class:” instead of the tertiary operator in class tags whenever possible.
- Use descriptive variable and function/const names. Also, event functions should be named with a “handle” prefix, like “handleClick” for onClick and “handleKeyDown” for onKeyDown.
- Implement accessibility features on elements. For example, a tag should have a tabindex=“0”, aria-label, on:click, and on:keydown, and similar attributes.
- Use consts instead of functions, for example, “const toggle = () =>”. Also, define a type if possible.
- Always use serve actions
- Never use fake data or dummy data.
- avoid the use of any for variable type, follow this best practices instead: Start with Specific Types: Always try to use the most specific type possible.
Use Type Inference: Let TypeScript infer types where possible.
Refactor any: If you find any in your code, try to replace it with more specific types.
Use a Linter: Configure your linter to warn against the use of any.