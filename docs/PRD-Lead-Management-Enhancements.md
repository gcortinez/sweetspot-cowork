# PRD: Lead Management System Enhancements

## Product Requirements Document
**Version:** 1.0  
**Date:** 2025-06-16  
**Author:** Claude Code Assistant  

---

## 1. Executive Summary

This PRD outlines enhancements to the Lead Management System in SweetSpot Cowork platform, focusing on improved lead lifecycle management, user assignment capabilities, and expanded user roles.

## 2. Problem Statement

Current limitations in the lead management system:
- Limited lead status options don't reflect real sales pipeline stages
- No ability to assign leads to cowork staff members
- Missing administrative user role for cowork operations
- Lack of granular lead lifecycle tracking

## 3. Goals & Objectives

### Primary Goals
- **Enhanced Lead Lifecycle Management**: Implement comprehensive lead status tracking
- **User Assignment System**: Enable lead assignment to cowork administrative staff
- **Role-Based Access Control**: Introduce COWORK_USER role for operational staff
- **Improved Sales Pipeline Visibility**: Better tracking of lead progression

### Success Metrics
- 90% of leads properly categorized with appropriate status
- 100% of active leads assigned to responsible staff members
- Reduced lead response time by 50%
- Improved conversion tracking accuracy

## 4. Features & Requirements

### 4.1 Enhanced Lead Status System

**Current States:**
- NEW
- CONTACTED
- QUALIFIED
- CONVERTED
- LOST

**New States Added:**
- **UNQUALIFIED**: Lead doesn't meet criteria or not interested
- **FOLLOW_UP**: Requires follow-up contact
- **DORMANT**: No response after multiple attempts

**Note:** States like PROPOSAL_SENT, NEGOTIATING, and CONTRACT_REVIEW belong to Opportunities, not Leads. Once a proposal is sent, a Lead converts to an Opportunity.

**Business Rules:**
- Status transitions must be logged for audit trail
- Automatic status change to CONVERTED when lead becomes an opportunity
- Status change notifications to assigned users
- Clear separation: Leads are prospects, Opportunities have proposals/negotiations

### 4.2 Opportunity Pipeline Enhancement

**Enhanced Opportunity Stages:**
- **INITIAL_CONTACT**: First contact with qualified lead
- **NEEDS_ANALYSIS**: Understanding requirements
- **PROPOSAL_SENT**: Quotation/proposal sent (this is where Leads convert)
- **NEGOTIATION**: In negotiation phase
- **CONTRACT_REVIEW**: Contract under review (NEW)
- **CLOSED_WON**: Successfully closed - client acquired
- **CLOSED_LOST**: Lost opportunity
- **ON_HOLD**: Temporarily paused (NEW)

**Lead to Opportunity Conversion:**
- When "Convertir a Oportunidad" is clicked, Lead status → CONVERTED
- New Opportunity created with stage PROPOSAL_SENT
- Quotation automatically generated and linked

### 4.3 User Role Expansion

**New Role: COWORK_USER**
- Administrative users of the cowork (not full admins)
- Can manage leads, bookings, and day-to-day operations
- Cannot modify cowork settings or billing
- Reports to COWORK_ADMIN

**Updated Role Hierarchy:**
1. **SUPER_ADMIN**: Platform-wide administration
2. **COWORK_ADMIN**: Full cowork management
3. **COWORK_USER**: Administrative operations (NEW)
4. **CLIENT_ADMIN**: Company/team management
5. **END_USER**: Basic facility access

### 4.3 Lead Assignment System

**Requirements:**
- Assign leads to COWORK_ADMIN or COWORK_USER roles only
- Assignment modal with user selection dropdown
- Automatic notification to assigned user
- Lead ownership tracking and history
- Workload distribution analytics

**UI Components:**
- "Asignar Usuario" button in lead dropdown menu
- Assignment modal with filtered user list
- Assignment history in lead timeline
- Assigned user display in lead table

### 4.4 Status Management Interface

**Features:**
- Dropdown submenu for status changes in lead actions
- Color-coded status badges for visual distinction
- Status change confirmation dialogs
- Bulk status update capabilities (future enhancement)

**Lead Status Color Scheme:**
- NEW: Blue
- CONTACTED: Yellow
- QUALIFIED: Green
- UNQUALIFIED: Gray
- FOLLOW_UP: Amber
- CONVERTED: Purple
- LOST: Red
- DORMANT: Slate

**Opportunity Stage Color Scheme:**
- INITIAL_CONTACT: Blue
- NEEDS_ANALYSIS: Yellow
- PROPOSAL_SENT: Indigo
- NEGOTIATION: Orange
- CONTRACT_REVIEW: Teal
- CLOSED_WON: Green
- CLOSED_LOST: Red
- ON_HOLD: Gray

## 5. Technical Implementation

### 5.1 Database Schema Changes

```sql
-- Update UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'COWORK_USER';

-- Update LeadStatus enum
ALTER TYPE "LeadStatus" ADD VALUE 'UNQUALIFIED';
ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "LeadStatus" ADD VALUE 'NEGOTIATING';
ALTER TYPE "LeadStatus" ADD VALUE 'FOLLOW_UP';
ALTER TYPE "LeadStatus" ADD VALUE 'DORMANT';
```

### 5.2 API Enhancements

**New Endpoints:**
- `PUT /api/leads/:id/assign` - Assign lead to user
- `GET /api/users/cowork-staff` - Get assignable users
- `GET /api/leads/status-history/:id` - Get status change history

**Updated Endpoints:**
- `PUT /api/leads/:id` - Support new status values
- `GET /api/leads` - Include assignment information

### 5.3 Frontend Components

**New Components:**
- `LeadAssignmentModal` - User assignment interface
- `StatusChangeSubmenu` - Nested dropdown for status changes
- `LeadStatusBadge` - Enhanced status display

**Updated Components:**
- `LeadsPage` - New action handlers and UI elements
- `LeadDetailModal` - Support for new statuses
- `CreateLeadModal` - Default assignment options

## 6. User Experience

### 6.1 Lead Management Workflow

1. **Lead Creation**: Auto-assigned to creator or designated lead manager
2. **Initial Contact**: Status updated to CONTACTED with timestamp
3. **Qualification**: Moved to QUALIFIED or UNQUALIFIED based on criteria
4. **Follow-up**: Scheduled follow-ups tracked with FOLLOW_UP status
5. **Conversion**: When ready for proposal, Lead converts to Opportunity
6. **Resolution**: Final Lead status of CONVERTED, LOST, or DORMANT

### 6.2 Opportunity Management Workflow

1. **Opportunity Creation**: Lead converts to Opportunity with PROPOSAL_SENT stage
2. **Quotation**: Automatic quotation generation linked to opportunity
3. **Negotiation**: Stage updated to NEGOTIATION during discussions
4. **Contract Review**: Final terms review before closing
5. **Resolution**: Final stage of CLOSED_WON, CLOSED_LOST, or ON_HOLD

### 6.3 Assignment Process

1. User clicks "Asignar Usuario" in lead dropdown
2. Modal opens with filtered list of COWORK_ADMIN and COWORK_USER roles
3. User selects assignee and adds optional notes
4. Assignment confirmed with notification
5. Lead table updates to show new assignment

## 7. Security & Permissions

### 7.1 Role-Based Access Control

**COWORK_USER Permissions:**
- Read/Write: Leads, Bookings, Visitors
- Read Only: Reports, Analytics
- No Access: Billing, Cowork Settings, User Management

**COWORK_ADMIN Permissions:**
- All COWORK_USER permissions
- Additional: User Management, Cowork Settings, Billing

### 7.2 Data Security

- All lead assignments logged for audit trail
- Status changes tracked with user attribution
- Access controls prevent unauthorized lead access
- Tenant-scoped data isolation maintained

## 8. Analytics & Reporting

### 8.1 Lead Pipeline Analytics

- Lead distribution by status
- Average time in each status
- Conversion rates by status
- Assignment workload distribution

### 8.2 Performance Metrics

- Lead response times
- Conversion rates by assigned user
- Status change patterns
- Pipeline velocity tracking

## 9. Implementation Timeline

### Phase 1 (Week 1): Database & Backend
- Update Prisma schema with new enums
- Implement API endpoints for assignment
- Add status change tracking

### Phase 2 (Week 2): Frontend UI
- Implement assignment modal
- Add status change submenu
- Update lead display components

### Phase 3 (Week 3): Testing & Refinement
- User acceptance testing
- Performance optimization
- Bug fixes and UI polish

### Phase 4 (Week 4): Documentation & Training
- User documentation
- Training materials for cowork staff
- Deployment and monitoring

## 10. Future Enhancements

### 10.1 Automation
- Automatic lead assignment based on criteria
- Status change triggers and workflows
- Email templates for different statuses

### 10.2 Advanced Features
- Lead scoring algorithms
- Bulk operations on leads
- Advanced filtering and search
- Integration with external CRM systems

## 11. Success Criteria

### 11.1 Functional Requirements
- ✅ All new lead statuses implemented and functional
- ✅ COWORK_USER role created and permissions configured
- ✅ Lead assignment system operational
- ✅ Status change tracking working

### 11.2 Performance Requirements
- Lead page load time < 2 seconds
- Assignment modal response < 1 second
- Status updates processed in real-time
- No data loss during status transitions

### 11.3 User Acceptance
- 95% user satisfaction with new interface
- Reduced training time for new staff
- Improved lead management efficiency
- Positive feedback on assignment features

---

## Appendix A: API Specifications

### Lead Assignment Endpoint
```typescript
PUT /api/leads/:id/assign
{
  "assignedUserId": "string",
  "notes": "string (optional)"
}
```

### Get Cowork Staff Endpoint
```typescript
GET /api/users/cowork-staff
Response: {
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "COWORK_ADMIN" | "COWORK_USER"
    }
  ]
}
```

## Appendix B: Database Schema

### Updated User Model
```prisma
model User {
  // ... existing fields
  role UserRole @default(END_USER)
  // ... rest of model
}

enum UserRole {
  SUPER_ADMIN
  COWORK_ADMIN
  COWORK_USER    // NEW
  CLIENT_ADMIN
  END_USER
}
```

### Updated Lead Model
```prisma
model Lead {
  // ... existing fields
  status LeadStatus @default(NEW)
  assignedUserId String?
  assignedUser User? @relation("LeadAssignment", fields: [assignedUserId], references: [id])
  // ... rest of model
}

enum LeadStatus {
  NEW           // Initial state
  CONTACTED     // First contact made
  QUALIFIED     // Meets criteria, shows interest
  UNQUALIFIED   // NEW - Doesn't meet criteria
  PROPOSAL_SENT // NEW - Quote/proposal sent
  NEGOTIATING   // NEW - In negotiation
  FOLLOW_UP     // NEW - Requires follow-up
  CONVERTED     // Successfully converted
  LOST          // Lost to competitor
  DORMANT       // NEW - No response after attempts
}
```