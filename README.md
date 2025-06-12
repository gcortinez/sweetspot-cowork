# SweetSpot Cowork 🏢

**SaaS de Gestión Integral para Coworks**

A comprehensive SaaS platform that enables coworking space owners and operators to efficiently manage all business operations, from client acquisition to billing, including access control and shared resource administration.

## 🎯 Vision

Develop a unified multi-tenant SaaS platform that centralizes all critical coworking operations with automated processes, flexible pricing models, and comprehensive reporting capabilities.

## ✨ Key Features

### 🏗️ Multi-Tenant Architecture
- **4-Level Hierarchy**: Super Admin → Cowork Admin → Client Admin → End User
- **Independent Operations**: Each coworking space operates independently
- **Scalable Management**: Single platform instance supports multiple locations
- **Role-Based Access**: Granular permissions based on user hierarchy

### 🔐 Authentication & Security
- **Supabase Auth**: Secure authentication with role-based access control
- **Row Level Security**: Data isolation between different coworking spaces
- **Advanced Security**: Two-factor authentication, audit logging, encryption

### 💼 Business Management
- **CRM & Sales Pipeline**: Lead management and conversion tracking
- **Flexible Pricing**: Dynamic pricing, custom quotations, membership tiers
- **Digital Contracts**: Electronic signatures and contract lifecycle management
- **Automated Billing**: Consumption tracking and invoice generation

### 🚪 Access Control
- **QR-Based Access**: Unique QR codes for facility entry/exit
- **Real-Time Tracking**: Live occupancy monitoring
- **Schedule Restrictions**: Enforce access hours based on membership plans
- **Visitor Management**: Pre-registration and temporary access codes

### 📊 Analytics & Reporting
- **Real-Time Dashboards**: Live metrics for all user roles
- **Financial Reports**: Revenue trends, profit analysis, payment status
- **Operational Insights**: Space utilization, service popularity, user activity
- **Export Capabilities**: PDF and Excel report generation

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.3+** - React framework with TypeScript
- **Zustand** - State management
- **TailwindCSS** - Styling framework

### Backend
- **Node.js** - Runtime environment
- **Express** - Web application framework
- **TypeScript** - Type safety

### Database & Services
- **Supabase PostgreSQL** - Database with Row Level Security
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage
- **Supabase Realtime** - Live updates
- **Prisma** - ORM with Supabase integration

### Validation & Tools
- **Zod** - Schema validation
- **Docker** - Local development
- **Kubernetes** - Deployment orchestration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (for local development)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gcortinez/sweetspot-cowork.git
   cd sweetspot-cowork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase credentials and other environment variables
   ```

4. **Database setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Project Management

This project uses **TaskMaster** for comprehensive task management and development tracking.

### Task Structure
- **25 main tasks** covering all major features
- **Detailed subtasks** for foundation components
- **Dependency tracking** for logical development order
- **Complexity analysis** for optimal task breakdown

### Key Development Phases

**Phase 1 - Foundation (Months 1-4)**
- Multi-tenant architecture with Supabase
- Authentication and role-based access control
- Core API with Express and Zod
- Basic CRM and client management
- QR-based access control
- Meeting room management
- Automated billing system

**Phase 2 - Advanced Features (Months 5-6)**
- Enhanced CRM with automation
- Sophisticated billing and pricing
- Visitor management portal
- Service marketplace
- Advanced analytics and forecasting

### TaskMaster Commands
```bash
# View all tasks
npm run tasks:list

# Get next task to work on
npm run tasks:next

# View specific task details
npm run tasks:show <task-id>

# Update task status
npm run tasks:status <task-id> <status>
```

## 🏗️ Architecture

### Multi-Tenant Design
- **Row Level Security (RLS)** ensures data isolation
- **Tenant-specific configurations** for customization
- **Shared infrastructure** with independent operations
- **Scalable architecture** supporting growth

### API Design
- **RESTful endpoints** with consistent patterns
- **Zod validation** for type-safe requests
- **Middleware-based** authentication and authorization
- **Comprehensive error handling** and logging

## 📈 Success Metrics

### Operational Efficiency
- 70% reduction in manual administrative tasks
- <24 hours client onboarding time
- 80% reduction in invoice generation time
- 95% user satisfaction with booking process

### Business Impact
- Real-time occupancy visibility
- Positive ROI within 6 months for operators
- 30% increase in additional service revenue
- 50% improvement in payment collection time

### Technical Performance
- 99.9% system uptime
- <2 second page load times
- Zero data security incidents
- 100% audit trail completeness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Project Maintainer**: Gabriel Cortinez  
**Email**: [your-email@example.com]  
**GitHub**: [@gcortinez](https://github.com/gcortinez)

---

**SweetSpot Cowork** - Transforming coworking space management through technology 🚀 