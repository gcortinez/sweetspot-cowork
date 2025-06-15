-- ============================================================================
-- VISITOR MANAGEMENT SYSTEM - DATABASE MIGRATION
-- This migration adds comprehensive visitor management functionality
-- ============================================================================

-- Create visitor-related enums
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED');
CREATE TYPE "VisitorPurpose" AS ENUM ('MEETING', 'INTERVIEW', 'DELIVERY', 'MAINTENANCE', 'TOUR', 'EVENT', 'OTHER');
CREATE TYPE "PreRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');
CREATE TYPE "VisitorAction" AS ENUM ('CREATED', 'CHECKED_IN', 'CHECKED_OUT', 'EXTENDED', 'CANCELLED');
CREATE TYPE "AccessCodeType" AS ENUM ('TEMPORARY', 'RECURRING', 'EMERGENCY', 'VIP');
CREATE TYPE "NotificationType" AS ENUM (
    'VISITOR_ARRIVAL', 'VISITOR_DEPARTURE', 'VISITOR_LATE', 'VISITOR_NO_SHOW',
    'PRE_REGISTRATION_REQUEST', 'PRE_REGISTRATION_APPROVED', 'PRE_REGISTRATION_DENIED',
    'ACCESS_CODE_GENERATED', 'SECURITY_ALERT', 'HOST_ASSIGNMENT', 'VISIT_REMINDER',
    'POLICY_VIOLATION', 'BADGE_ISSUE', 'EXTENDED_STAY', 'EMERGENCY_NOTIFICATION'
);
CREATE TYPE "NotificationUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "DeliveryMethod" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'SLACK', 'TEAMS', 'WEBHOOK');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED');
CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- ============================================================================
-- VISITOR PRE-REGISTRATION TABLE
-- ============================================================================
CREATE TABLE "visitor_pre_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    
    -- Visitor Information
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    
    -- Visit Details
    "hostUserId" TEXT NOT NULL,
    "expectedArrival" TIMESTAMP(3) NOT NULL,
    "expectedDuration" INTEGER,
    "purpose" "VisitorPurpose" NOT NULL,
    "purposeDetails" TEXT,
    "meetingRoom" TEXT,
    
    -- Pre-approval
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    
    -- Access Configuration
    "accessZones" JSONB DEFAULT '[]',
    "parkingRequired" BOOLEAN NOT NULL DEFAULT false,
    "parkingSpot" TEXT,
    
    -- Communication
    "invitationSent" BOOLEAN NOT NULL DEFAULT false,
    "invitationSentAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    
    -- Compliance Requirements
    "requiresNDA" BOOLEAN NOT NULL DEFAULT false,
    "requiresHealthCheck" BOOLEAN NOT NULL DEFAULT false,
    "customRequirements" JSONB DEFAULT '[]',
    
    -- Status
    "status" "PreRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "visitDate" TIMESTAMP(3),
    "visitorId" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_pre_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_pre_registrations_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id"),
    CONSTRAINT "visitor_pre_registrations_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id")
);

-- ============================================================================
-- MAIN VISITORS TABLE
-- ============================================================================
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    
    -- Visitor Information
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "photoUrl" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    
    -- Visit Details
    "hostUserId" TEXT NOT NULL,
    "purpose" "VisitorPurpose" NOT NULL,
    "purposeDetails" TEXT,
    "expectedDuration" INTEGER,
    "meetingRoom" TEXT,
    
    -- Access Control
    "qrCode" TEXT NOT NULL UNIQUE,
    "badgeNumber" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "accessZones" JSONB DEFAULT '[]',
    
    -- Status Tracking
    "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "actualDuration" INTEGER,
    
    -- Pre-registration
    "preRegistrationId" TEXT,
    "isPreRegistered" BOOLEAN NOT NULL DEFAULT false,
    
    -- Health & Safety
    "healthDeclaration" JSONB DEFAULT '{}',
    "emergencyContact" JSONB DEFAULT '{}',
    
    -- Compliance
    "ndaSigned" BOOLEAN NOT NULL DEFAULT false,
    "ndaSignedAt" TIMESTAMP(3),
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "dataConsent" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitors_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id"),
    CONSTRAINT "visitors_preRegistrationId_fkey" FOREIGN KEY ("preRegistrationId") REFERENCES "visitor_pre_registrations"("id")
);

-- ============================================================================
-- VISITOR LOGS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE "visitor_logs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "action" "VisitorAction" NOT NULL,
    "performedBy" TEXT,
    "details" TEXT,
    "location" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_logs_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id")
);

-- ============================================================================
-- VISITOR BADGES TABLE
-- ============================================================================
CREATE TABLE "visitor_badges" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL DEFAULT 'TEMPORARY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "printedAt" TIMESTAMP(3),
    "printedBy" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnedTo" TEXT,
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_badges_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_badges_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_badges_printedBy_fkey" FOREIGN KEY ("printedBy") REFERENCES "users"("id"),
    CONSTRAINT "visitor_badges_returnedTo_fkey" FOREIGN KEY ("returnedTo") REFERENCES "users"("id")
);

-- ============================================================================
-- VISITOR POLICIES TABLE
-- ============================================================================
CREATE TABLE "visitor_policies" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresEscort" BOOLEAN NOT NULL DEFAULT false,
    "requiresPreRegistration" BOOLEAN NOT NULL DEFAULT false,
    "maxDuration" INTEGER,
    "allowedHours" JSONB DEFAULT '{}',
    "allowedDays" JSONB DEFAULT '[]',
    "restrictedAreas" JSONB DEFAULT '[]',
    "requiredDocuments" JSONB DEFAULT '[]',
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "notificationSettings" JSONB DEFAULT '{}',
    "customRules" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- ============================================================================
-- VISITOR ACCESS CODES TABLE
-- ============================================================================
CREATE TABLE "visitor_access_codes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "codeType" "AccessCodeType" NOT NULL DEFAULT 'TEMPORARY',
    "visitorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "accessZones" JSONB DEFAULT '[]',
    "timeRestrictions" JSONB DEFAULT '{}',
    "ipRestrictions" JSONB DEFAULT '[]',
    "generatedBy" TEXT,
    "generatedFor" TEXT,
    "usageLog" JSONB DEFAULT '[]',
    "lastUsedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_access_codes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_access_codes_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_access_codes_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id")
);

-- ============================================================================
-- ACCESS CODE USAGE TABLE
-- ============================================================================
CREATE TABLE "access_code_usage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "accessCodeId" TEXT NOT NULL,
    "visitorId" TEXT,
    "usedBy" TEXT,
    "location" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB DEFAULT '{}',
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_code_usage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "access_code_usage_accessCodeId_fkey" FOREIGN KEY ("accessCodeId") REFERENCES "visitor_access_codes"("id") ON DELETE CASCADE,
    CONSTRAINT "access_code_usage_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id"),
    CONSTRAINT "access_code_usage_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "users"("id")
);

-- ============================================================================
-- VISITOR NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE "visitor_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "urgency" "NotificationUrgency" NOT NULL DEFAULT 'NORMAL',
    "recipientId" TEXT NOT NULL,
    "visitorId" TEXT,
    "preRegistrationId" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'IN_APP',
    "channels" JSONB DEFAULT '["in_app"]',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "templateData" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id"),
    CONSTRAINT "visitor_notifications_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id"),
    CONSTRAINT "visitor_notifications_preRegistrationId_fkey" FOREIGN KEY ("preRegistrationId") REFERENCES "visitor_pre_registrations"("id")
);

-- ============================================================================
-- VISITOR ANALYTICS TABLE
-- ============================================================================
CREATE TABLE "visitor_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" "AnalyticsPeriod" NOT NULL DEFAULT 'DAILY',
    "totalVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "returningVisitors" INTEGER NOT NULL DEFAULT 0,
    "averageVisitDuration" DOUBLE PRECISION,
    "onTimeArrivals" INTEGER NOT NULL DEFAULT 0,
    "lateArrivals" INTEGER NOT NULL DEFAULT 0,
    "earlyDepartures" INTEGER NOT NULL DEFAULT 0,
    "noShows" INTEGER NOT NULL DEFAULT 0,
    "preRegistrations" INTEGER NOT NULL DEFAULT 0,
    "walkIns" INTEGER NOT NULL DEFAULT 0,
    "purposeBreakdown" JSONB NOT NULL DEFAULT '{}',
    "peakHour" TEXT,
    "peakDay" TEXT,
    "busyHours" JSONB NOT NULL DEFAULT '[]',
    "hostUtilization" JSONB NOT NULL DEFAULT '{}',
    "accessCodesGenerated" INTEGER NOT NULL DEFAULT 0,
    "accessCodesUsed" INTEGER NOT NULL DEFAULT 0,
    "companyBreakdown" JSONB NOT NULL DEFAULT '{}',
    "visitorSources" JSONB NOT NULL DEFAULT '{}',
    "averageProcessingTime" DOUBLE PRECISION,
    "automationRate" DOUBLE PRECISION,
    "weekOverWeekGrowth" DOUBLE PRECISION,
    "monthOverMonthGrowth" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_analytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "visitor_analytics_tenantId_date_period_key" UNIQUE ("tenantId", "date", "period")
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Visitor indexes
CREATE INDEX "visitors_tenantId_status_idx" ON "visitors"("tenantId", "status");
CREATE INDEX "visitors_tenantId_hostUserId_idx" ON "visitors"("tenantId", "hostUserId");
CREATE INDEX "visitors_qrCode_idx" ON "visitors"("qrCode");
CREATE INDEX "visitors_checkedInAt_idx" ON "visitors"("checkedInAt");
CREATE INDEX "visitors_validFrom_validUntil_idx" ON "visitors"("validFrom", "validUntil");

-- Pre-registration indexes
CREATE INDEX "visitor_pre_registrations_tenantId_status_idx" ON "visitor_pre_registrations"("tenantId", "status");
CREATE INDEX "visitor_pre_registrations_email_idx" ON "visitor_pre_registrations"("email");
CREATE INDEX "visitor_pre_registrations_expectedArrival_idx" ON "visitor_pre_registrations"("expectedArrival");

-- Visitor logs indexes
CREATE INDEX "visitor_logs_tenantId_visitorId_idx" ON "visitor_logs"("tenantId", "visitorId");
CREATE INDEX "visitor_logs_timestamp_idx" ON "visitor_logs"("timestamp");

-- Access codes indexes
CREATE INDEX "visitor_access_codes_tenantId_isActive_idx" ON "visitor_access_codes"("tenantId", "isActive");
CREATE INDEX "visitor_access_codes_code_idx" ON "visitor_access_codes"("code");
CREATE INDEX "visitor_access_codes_expiresAt_idx" ON "visitor_access_codes"("expiresAt");

-- Notifications indexes
CREATE INDEX "visitor_notifications_tenantId_recipientId_idx" ON "visitor_notifications"("tenantId", "recipientId");
CREATE INDEX "visitor_notifications_status_idx" ON "visitor_notifications"("status");
CREATE INDEX "visitor_notifications_urgency_idx" ON "visitor_notifications"("urgency");
CREATE INDEX "visitor_notifications_scheduledFor_idx" ON "visitor_notifications"("scheduledFor");

-- Analytics indexes
CREATE INDEX "visitor_analytics_tenantId_date_period_idx" ON "visitor_analytics"("tenantId", "date", "period");

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_visitor_pre_registrations_updated_at BEFORE UPDATE ON visitor_pre_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitor_policies_updated_at BEFORE UPDATE ON visitor_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitor_notifications_updated_at BEFORE UPDATE ON visitor_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visitor_analytics_updated_at BEFORE UPDATE ON visitor_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert default visitor policy
INSERT INTO "visitor_policies" (
    "tenantId", 
    "name", 
    "description", 
    "isActive", 
    "priority", 
    "requiresApproval", 
    "maxDuration"
) 
SELECT 
    "id" as "tenantId",
    'Default Visitor Policy' as "name",
    'Default policy for all visitors' as "description",
    true as "isActive",
    1 as "priority",
    false as "requiresApproval",
    480 as "maxDuration"
FROM "tenants"
ON CONFLICT DO NOTHING;