# SweetSpot Cowork Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security Configuration](#security-configuration)
8. [Performance Optimization](#performance-optimization)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- Network: 100 Mbps

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 1 Gbps

### Software Dependencies

**Required:**
- Node.js 18+ LTS
- npm 8+
- Docker 24+
- Docker Compose 2.0+
- PostgreSQL 15+ (for database)
- Redis 7+ (for caching)

**Optional:**
- Nginx (reverse proxy)
- Certbot (SSL certificates)
- Grafana (monitoring)
- Prometheus (metrics)

### External Services

**Required:**
- Supabase account and project
- Database hosting (if not self-hosted)
- Email service (SMTP or service like SendGrid)

**Optional:**
- CDN service (CloudFlare, AWS CloudFront)
- Error tracking (Sentry)
- Analytics service
- File storage (AWS S3, Google Cloud Storage)

## Environment Setup

### Development Environment

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/sweetspot-cowork.git
   cd sweetspot-cowork
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd packages/shared && npm run build
   cd ../../apps/frontend && npm install
   cd ../backend && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env.local
   
   # Backend
   cp apps/backend/.env.example apps/backend/.env.local
   ```

4. **Database Setup**
   ```bash
   cd apps/frontend
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or individually
   cd apps/frontend && npm run dev
   cd apps/backend && npm run dev
   ```

### Staging Environment

1. **Environment Variables**
   ```bash
   # Copy production example
   cp apps/frontend/.env.production.example apps/frontend/.env.staging
   
   # Update with staging-specific values
   vim apps/frontend/.env.staging
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Run Tests**
   ```bash
   npm run test
   npm run test:e2e
   ```

## Database Configuration

### Supabase Setup

1. **Create Supabase Project**
   - Visit https://supabase.com
   - Create new project
   - Note project URL and keys

2. **Configure Database URL**
   ```bash
   # Supabase provides connection strings
   DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
   ```

3. **Run Migrations**
   ```bash
   cd apps/frontend
   npx prisma db push
   ```

4. **Enable Row Level Security**
   ```sql
   -- Run in Supabase SQL editor
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
   -- ... enable for all tables
   ```

### Self-Hosted PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # CentOS/RHEL
   sudo yum install postgresql postgresql-server
   ```

2. **Configure Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE sweetspot_cowork;
   CREATE USER sweetspot_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE sweetspot_cowork TO sweetspot_user;
   ```

3. **Update Connection String**
   ```bash
   DATABASE_URL="postgresql://sweetspot_user:secure_password@localhost:5432/sweetspot_cowork"
   ```

## Docker Deployment

### Single-Container Deployment

1. **Build Image**
   ```bash
   docker build -t sweetspot-cowork -f apps/frontend/Dockerfile .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name sweetspot-cowork \
     -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXT_PUBLIC_SUPABASE_URL="your-supabase-url" \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
     sweetspot-cowork
   ```

### Docker Compose Deployment

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Update .env with your values
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **View Logs**
   ```bash
   docker-compose logs -f frontend
   ```

4. **Scale Services**
   ```bash
   docker-compose up -d --scale frontend=3
   ```

### Production Docker Setup

1. **Multi-Stage Build**
   ```dockerfile
   # Dockerfile already configured for production
   # Uses multi-stage build for optimization
   ```

2. **Health Checks**
   ```bash
   # Health check endpoint available at /api/health
   curl http://localhost:3000/api/health
   ```

3. **Resource Limits**
   ```yaml
   # docker-compose.yml
   services:
     frontend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
           reservations:
             cpus: '1'
             memory: 1G
   ```

## Production Deployment

### Cloud Deployment Options

#### Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd apps/frontend
   vercel --prod
   ```

3. **Environment Variables**
   - Set in Vercel dashboard
   - Include all required environment variables
   - Configure domain and SSL

#### AWS Deployment

1. **ECS Deployment**
   ```bash
   # Build and push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -t sweetspot-cowork .
   docker tag sweetspot-cowork:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/sweetspot-cowork:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/sweetspot-cowork:latest
   ```

2. **RDS Database**
   ```bash
   # Create RDS PostgreSQL instance
   aws rds create-db-instance \
     --db-instance-identifier sweetspot-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username sweetspot \
     --master-user-password SecurePassword123 \
     --allocated-storage 20
   ```

#### Google Cloud Platform

1. **Cloud Run Deployment**
   ```bash
   gcloud run deploy sweetspot-cowork \
     --image gcr.io/your-project/sweetspot-cowork \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Cloud SQL Database**
   ```bash
   gcloud sql instances create sweetspot-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

### Self-Hosted Deployment

#### Using PM2

1. **Install PM2**
   ```bash
   npm install -g pm2
   ```

2. **Create Ecosystem File**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'sweetspot-frontend',
       script: './apps/frontend/server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   ```

3. **Deploy with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Using Systemd

1. **Create Service File**
   ```ini
   # /etc/systemd/system/sweetspot-cowork.service
   [Unit]
   Description=SweetSpot Cowork Application
   After=network.target
   
   [Service]
   Type=simple
   User=sweetspot
   WorkingDirectory=/opt/sweetspot-cowork
   ExecStart=/usr/bin/node apps/frontend/server.js
   Restart=on-failure
   Environment=NODE_ENV=production
   Environment=PORT=3000
   
   [Install]
   WantedBy=multi-user.target
   ```

2. **Enable and Start Service**
   ```bash
   sudo systemctl enable sweetspot-cowork
   sudo systemctl start sweetspot-cowork
   sudo systemctl status sweetspot-cowork
   ```

### Reverse Proxy Configuration

#### Nginx Configuration

1. **Install Nginx**
   ```bash
   sudo apt install nginx
   ```

2. **Configure Virtual Host**
   ```nginx
   # /etc/nginx/sites-available/sweetspot-cowork
   server {
       listen 80;
       server_name app.sweetspotcowork.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/sweetspot-cowork /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

#### SSL Certificate Setup

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d app.sweetspotcowork.com
   ```

3. **Auto-Renewal**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Monitoring & Logging

### Application Monitoring

#### Health Checks

1. **Health Check Endpoint**
   ```typescript
   // Health check available at /api/health
   {
     "status": "healthy",
     "timestamp": "2024-01-15T10:30:00Z",
     "version": "1.0.0",
     "database": "connected",
     "cache": "connected"
   }
   ```

2. **Monitoring Script**
   ```bash
   #!/bin/bash
   # monitor.sh
   response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
   if [ $response != "200" ]; then
       echo "Health check failed: $response"
       # Send alert
   fi
   ```

#### Prometheus & Grafana

1. **Start Monitoring Stack**
   ```bash
   docker-compose up -d prometheus grafana
   ```

2. **Access Dashboards**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001

3. **Import Dashboards**
   - Use provided Grafana dashboard configs
   - Monitor application metrics
   - Set up alerting rules

### Logging Configuration

#### Application Logs

1. **Log Levels**
   ```bash
   LOG_LEVEL=info  # error, warn, info, debug
   ```

2. **Log Format**
   ```json
   {
     "timestamp": "2024-01-15T10:30:00Z",
     "level": "info",
     "message": "User logged in",
     "userId": "user_123",
     "tenantId": "tenant_456"
   }
   ```

#### Centralized Logging

1. **Using ELK Stack**
   ```bash
   # docker-compose.yml includes ELK configuration
   docker-compose up -d elasticsearch logstash kibana
   ```

2. **Log Shipping**
   ```bash
   # Configure Filebeat or similar
   filebeat.inputs:
   - type: log
     paths:
       - /var/log/sweetspot-cowork/*.log
   ```

## Security Configuration

### Authentication & Authorization

1. **JWT Configuration**
   ```bash
   JWT_SECRET="your-strong-secret-key-at-least-32-characters"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   ```

2. **Session Security**
   ```javascript
   // Secure session configuration
   {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 24 * 60 * 60 * 1000 // 24 hours
   }
   ```

### HTTPS Configuration

1. **Force HTTPS**
   ```javascript
   // next.config.js includes HSTS headers
   {
     key: 'Strict-Transport-Security',
     value: 'max-age=31536000; includeSubDomains; preload'
   }
   ```

2. **SSL Best Practices**
   - Use TLS 1.2 or higher
   - Strong cipher suites only
   - HSTS enabled
   - Certificate pinning (optional)

### Security Headers

1. **Content Security Policy**
   ```javascript
   // Configured in next.config.js
   "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval'"
   ```

2. **Additional Headers**
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: origin-when-cross-origin

### Data Protection

1. **Encryption at Rest**
   ```bash
   # Database encryption
   ALTER SYSTEM SET ssl = on;
   ```

2. **Encryption in Transit**
   - All connections use HTTPS/TLS
   - Database connections encrypted
   - Redis connections secured

### Security Scanning

1. **Vulnerability Scanning**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Container Scanning**
   ```bash
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image sweetspot-cowork:latest
   ```

## Performance Optimization

### Application Performance

1. **Next.js Optimization**
   ```javascript
   // next.config.js includes optimizations
   {
     swcMinify: true,
     compress: true,
     generateEtags: true
   }
   ```

2. **Database Optimization**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
   CREATE INDEX idx_bookings_client_id ON bookings(client_id);
   CREATE INDEX idx_bookings_date ON bookings(start_time, end_time);
   ```

3. **Caching Strategy**
   ```bash
   # Redis configuration
   REDIS_URL="redis://redis:6379"
   CACHE_TTL="3600"  # 1 hour
   ```

### CDN Configuration

1. **Static Asset Optimization**
   ```javascript
   // next.config.js
   {
     images: {
       formats: ['image/webp', 'image/avif'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920]
     }
   }
   ```

2. **CloudFlare Setup**
   - Configure DNS
   - Enable caching rules
   - Set up page rules
   - Enable security features

### Load Balancing

1. **Nginx Load Balancing**
   ```nginx
   upstream sweetspot_backend {
       server localhost:3000;
       server localhost:3001;
       server localhost:3002;
   }
   
   server {
       location / {
           proxy_pass http://sweetspot_backend;
       }
   }
   ```

2. **Docker Swarm**
   ```bash
   docker service create \
     --name sweetspot-cowork \
     --replicas 3 \
     --publish 3000:3000 \
     sweetspot-cowork:latest
   ```

## Backup & Recovery

### Database Backup

1. **Automated Backups**
   ```bash
   #!/bin/bash
   # backup.sh
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   aws s3 cp backup_*.sql s3://sweetspot-backups/
   ```

2. **Backup Schedule**
   ```bash
   # crontab -e
   0 2 * * * /opt/scripts/backup.sh
   ```

### File Backup

1. **Application Files**
   ```bash
   tar -czf sweetspot_app_$(date +%Y%m%d).tar.gz /opt/sweetspot-cowork
   ```

2. **User Uploads**
   ```bash
   # Sync to cloud storage
   aws s3 sync /opt/sweetspot-cowork/uploads s3://sweetspot-uploads
   ```

### Disaster Recovery

1. **Recovery Procedures**
   ```bash
   # Database restore
   psql $DATABASE_URL < backup_20240115_020000.sql
   
   # Application restore
   tar -xzf sweetspot_app_20240115.tar.gz -C /opt/
   ```

2. **Recovery Testing**
   - Monthly recovery drills
   - Document recovery procedures
   - Test backup integrity
   - Verify RTO/RPO requirements

## Troubleshooting

### Common Issues

#### Application Won't Start

1. **Check Environment Variables**
   ```bash
   printenv | grep NEXT_PUBLIC
   printenv | grep DATABASE_URL
   ```

2. **Check Database Connection**
   ```bash
   npx prisma db push --preview-feature
   ```

3. **Check Port Availability**
   ```bash
   netstat -tulpn | grep :3000
   ```

#### Performance Issues

1. **Check Resource Usage**
   ```bash
   top
   df -h
   free -m
   ```

2. **Check Database Performance**
   ```sql
   SELECT * FROM pg_stat_activity;
   ```

3. **Check Application Logs**
   ```bash
   tail -f /var/log/sweetspot-cowork/app.log
   ```

#### Database Issues

1. **Connection Pool Exhausted**
   ```bash
   # Increase connection limit
   DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=20"
   ```

2. **Migration Failures**
   ```bash
   npx prisma migrate reset
   npx prisma db push
   ```

### Debug Mode

1. **Enable Debug Logging**
   ```bash
   LOG_LEVEL=debug
   NODE_ENV=development
   ```

2. **Database Query Logging**
   ```javascript
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
     log      = ["query", "info", "warn", "error"]
   }
   ```

### Support Resources

1. **Log Analysis**
   - Application logs: `/var/log/sweetspot-cowork/`
   - System logs: `/var/log/syslog`
   - Nginx logs: `/var/log/nginx/`

2. **Monitoring Tools**
   - Grafana dashboards
   - Prometheus metrics
   - Application performance monitoring

3. **Contact Support**
   - Email: support@sweetspotcowork.com
   - Emergency: +1-XXX-XXX-XXXX
   - Documentation: https://docs.sweetspotcowork.com

For additional deployment assistance, contact our DevOps team at devops@sweetspotcowork.com