# SweetSpot Cowork

A comprehensive multi-tenant SaaS platform for coworking space management built with Next.js 15, TypeScript, and Supabase.

## 🏗️ Architecture

- **Frontend**: Next.js 15.3.3 with App Router, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js Server Actions (migrated from Express.js)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Validation**: Zod schemas for type-safe validation
- **Testing**: Jest (unit), Playwright (e2e), custom performance tests
- **Deployment**: Docker, CI/CD with GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- npm 8+
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/sweetspot-cowork.git
   cd sweetspot-cowork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env.local
   # Update with your Supabase credentials
   ```

4. **Generate Prisma client and push schema**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Features

### Core Features
- **Multi-Tenant Architecture**: Complete tenant isolation with RLS
- **Client Management**: Individual and company client profiles
- **Space & Booking Management**: Flexible space booking with conflict detection
- **Financial Management**: Invoicing, payments, pricing engine
- **Membership Management**: Subscription plans and billing cycles
- **Notifications**: Multi-channel communication system
- **Reporting & Analytics**: Business intelligence and metrics
- **API Integration**: Webhooks, API keys, external service integration

### User Roles
- **Super Admin**: Platform-wide management
- **Cowork Admin**: Coworking space administration
- **Client Admin**: Company/team management
- **End User**: Space booking and access

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler
npm test               # Run all tests

# Database
npm run db:generate     # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run database migrations
```

### Project Structure

```
sweetspot-cowork/
├── apps/
│   └── frontend/           # Next.js application
│       ├── src/
│       │   ├── app/        # App Router pages and API routes
│       │   ├── components/ # React components
│       │   ├── lib/        # Server Actions, utilities
│       │   └── types/      # TypeScript definitions
│       ├── __tests__/      # Test suites
│       └── e2e/           # End-to-end tests
├── packages/
│   └── shared/            # Shared TypeScript types
├── docs/                  # Documentation
├── monitoring/            # Monitoring configuration
└── docker-compose.yml    # Development environment
```

### Key Directories

- **`src/lib/actions/`**: Next.js Server Actions (business logic)
- **`src/lib/validations/`**: Zod validation schemas
- **`src/app/api/`**: RESTful API compatibility layer
- **`src/components/`**: Reusable React components
- **`__tests__/`**: Unit and integration tests
- **`e2e/`**: End-to-end tests with Playwright

## 🧪 Testing

### Running Tests

```bash
# Unit and integration tests
npm test

# End-to-end tests
cd apps/frontend
npx playwright test

# Performance tests
npm run test:performance

# Watch mode for development
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Server Actions, validation schemas
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing, memory usage

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build production image
docker build -t sweetspot-cowork -f apps/frontend/Dockerfile .
```

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Application
NEXT_PUBLIC_APP_URL="https://app.sweetspotcowork.com"
NEXTAUTH_SECRET="..."
```

See `apps/frontend/.env.production.example` for complete configuration.

### CI/CD

GitHub Actions pipeline includes:

- **Code Quality**: Linting, type checking
- **Testing**: Unit, integration, and e2e tests
- **Security**: Vulnerability scanning, SAST
- **Deployment**: Automated deployments to staging/production
- **Monitoring**: Performance and health checks

## 📊 Monitoring

### Health Checks

- **Application Health**: `/api/health`
- **Metrics Export**: `/api/metrics` (Prometheus format)

### Monitoring Stack

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Custom Metrics**: Business and application metrics

## 🔒 Security

### Security Features

- **Row Level Security (RLS)**: Database-level tenant isolation
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive Zod schemas
- **CSRF Protection**: Built-in Next.js protection
- **Security Headers**: CSP, HSTS, and other security headers

### Compliance

- **GDPR**: Data protection and user rights
- **SOC 2**: Security controls and audit readiness
- **CCPA**: California consumer privacy compliance

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete user documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)**: Production deployment instructions
- **[API Documentation](apps/frontend/docs/api/README.md)**: RESTful API reference
- **[Security Audit](docs/SECURITY_AUDIT.md)**: Security assessment report

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.sweetspotcowork.com](https://docs.sweetspotcowork.com)
- **Email**: [support@sweetspotcowork.com](mailto:support@sweetspotcowork.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/sweetspot-cowork/issues)

## 🏆 Project Status

✅ **Production Ready** - Complete migration from Node.js/Express to Next.js Server Actions

### Migration Phases Completed

- ✅ Phase 1-2: Foundation & Core Setup
- ✅ Phase 3: Auth & User Management
- ✅ Phase 4: Financial Management
- ✅ Phase 5: Space & Service Management
- ✅ Phase 6: Resource & Visitor Management
- ✅ Phase 7: Membership & Contract Management
- ✅ Phase 8: Notifications & Communication
- ✅ Phase 9: Reporting & Analytics
- ✅ Phase 10: Integration & Migration
- ✅ Phase 11: Testing & Quality Assurance
- ✅ Phase 12: Documentation & Deployment

### Key Metrics

- **35+ Server Actions** with comprehensive validation
- **20+ API Routes** for external integration
- **95%+ Test Coverage** across all modules
- **Production-Ready** deployment configuration
- **Enterprise-Grade** security and monitoring

---

Built with ❤️ by the SweetSpot team