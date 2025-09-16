# Plan de Implementación: Módulo de Gestión de Espacios y Reservas

## 📋 Resumen Ejecutivo

Implementación completa del módulo de Gestión de Espacios y Reservas para SweetSpot Cowork, sistema SaaS multi-tenant para gestión de espacios de coworking. Este módulo permitirá la administración integral de espacios físicos, reservas, check-in/check-out, membresías y control de aforo en tiempo real.

### Objetivos Principales
- Gestión completa de espacios del coworking (oficinas, salas, escritorios)
- Sistema de reservas con disponibilidad en tiempo real
- Mapa interactivo del coworking
- Check-in/check-out automático y manual
- Gestión de tipos de membresía
- Sincronización con calendarios externos
- Control de capacidad y aforo por zona

## 🏗️ Arquitectura y Stack Tecnológico

### Stack Actual (a mantener)
- **Framework**: Next.js 15.3.3 con App Router y Server Actions
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: Clerk Auth
- **UI**: React 19, TailwindCSS, shadcn/ui, Radix UI
- **Validación**: Zod schemas
- **Estado**: Zustand + React Context

### Nuevas Integraciones Necesarias
- **Mapas**: react-leaflet o mapbox-gl para visualización interactiva
- **Calendario**: @fullcalendar/react para gestión de reservas
- **QR**: qrcode + react-qr-reader para check-in/check-out
- **Fechas**: date-fns para manejo avanzado de fechas
- **APIs**: Google Calendar API, Microsoft Graph API

## 📊 Modelo de Datos

### Modelos Existentes a Extender

#### Space (existente - requiere extensión)
```prisma
model Space {
  // Campos existentes
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  type        SpaceType
  description String?
  capacity    Int
  amenities   Json?
  hourlyRate  Decimal?
  isActive    Boolean   @default(true)

  // Campos nuevos a agregar
  floor           String?
  zone            String?
  coordinates     Json?      // {x: number, y: number} para mapa
  images          Json?      // Array de URLs
  area            Float?     // metros cuadrados
  maxAdvanceBooking Int      @default(30) // días de anticipación
  minBookingDuration Int     @default(60) // minutos
  maxBookingDuration Int?    // minutos
  cancellationHours Int      @default(24)
  requiresApproval Boolean   @default(false)
  allowRecurring  Boolean    @default(true)

  // Nuevas relaciones
  availabilitySchedules SpaceAvailabilitySchedule[]
  maintenanceSchedules  SpaceMaintenanceSchedule[]
  checkIns             CheckInOut[]
}
```

### Nuevos Modelos a Crear

#### SpaceAvailabilitySchedule
```prisma
model SpaceAvailabilitySchedule {
  id        String   @id @default(cuid())
  spaceId   String
  dayOfWeek Int      // 0-6 (Domingo-Sábado)
  startTime String   // "09:00"
  endTime   String   // "18:00"
  isActive  Boolean  @default(true)

  space Space @relation(fields: [spaceId], references: [id])

  @@unique([spaceId, dayOfWeek])
}
```

#### BookingRecurrence
```prisma
model BookingRecurrence {
  id              String   @id @default(cuid())
  bookingId       String
  pattern         RecurrencePattern // DAILY, WEEKLY, MONTHLY
  interval        Int      @default(1)
  daysOfWeek      Json?    // [1,3,5] para L,Mi,V
  dayOfMonth      Int?     // Para recurrencia mensual
  endDate         DateTime?
  occurrences     Int?     // Número de ocurrencias
  exceptions      Json?    // Fechas excluidas

  booking Booking @relation(fields: [bookingId], references: [id])
}
```

#### CheckInOut
```prisma
model CheckInOut {
  id            String    @id @default(cuid())
  tenantId      String
  bookingId     String
  spaceId       String
  userId        String
  checkInTime   DateTime  @default(now())
  checkOutTime  DateTime?
  checkInMethod String    // QR, MANUAL, AUTO
  qrCode        String?
  notes         String?

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  booking Booking @relation(fields: [bookingId], references: [id])
  space   Space   @relation(fields: [spaceId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@index([tenantId, checkInTime])
  @@index([spaceId, checkInTime])
}
```

#### SpaceMaintenanceSchedule
```prisma
model SpaceMaintenanceSchedule {
  id          String   @id @default(cuid())
  spaceId     String
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  isRecurring Boolean  @default(false)
  recurrence  Json?
  createdBy   String

  space Space @relation(fields: [spaceId], references: [id])
}
```

## 🎯 Fases de Implementación Detalladas

### FASE 1: Gestión de Espacios (3-4 días)

#### Día 1-2: Modelo de datos y Server Actions
- [ ] Actualizar schema.prisma con campos adicionales para Space
- [ ] Crear nuevos modelos (SpaceAvailabilitySchedule, etc.)
- [ ] Ejecutar migraciones de Prisma
- [ ] Actualizar `/lib/validations/space.ts` con nuevos schemas:
  - `SpaceWithScheduleSchema`
  - `SpaceImageUploadSchema`
  - `BulkSpaceImportSchema`
- [ ] Extender `/lib/actions/space.ts`:
  ```typescript
  - uploadSpaceImages(spaceId, images)
  - updateSpaceAvailability(spaceId, schedule)
  - bulkImportSpaces(spaces)
  - getSpaceWithAvailability(spaceId)
  - duplicateSpace(spaceId)
  ```

#### Día 3-4: Interfaz de Usuario
- [ ] Crear páginas en `/app/(protected)/spaces/`:
  - `page.tsx` - Lista de espacios con DataTable
  - `new/page.tsx` - Formulario de creación
  - `[id]/page.tsx` - Vista detallada
  - `[id]/edit/page.tsx` - Formulario de edición
  - `[id]/availability/page.tsx` - Gestión de horarios

- [ ] Crear componentes en `/components/spaces/`:
  ```typescript
  - SpaceList.tsx - Lista con filtros avanzados
  - SpaceForm.tsx - Formulario unificado
  - SpaceGallery.tsx - Gestión de imágenes con drag & drop
  - AmenitySelector.tsx - Selector de amenidades
  - SpaceStatusBadge.tsx - Badge de estado
  - SpaceFilters.tsx - Filtros avanzados
  ```

### FASE 2: Mapa Interactivo (2-3 días)

#### Día 5: Setup y componente base
- [ ] Instalar dependencias: `npm install react-leaflet leaflet @types/leaflet`
- [ ] Crear componente base `/components/spaces/map/SpaceMap.tsx`
- [ ] Configurar estilos de Leaflet
- [ ] Implementar carga de planos de piso

#### Día 6-7: Componentes del mapa
- [ ] Crear componentes especializados:
  ```typescript
  - FloorPlanViewer.tsx - Visualización de planos
  - SpaceMarker.tsx - Marcadores interactivos
  - AvailabilityOverlay.tsx - Capa de disponibilidad
  - ZoneSelector.tsx - Selector de zonas
  - MapLegend.tsx - Leyenda del mapa
  - MapControls.tsx - Controles de navegación
  ```
- [ ] Implementar funcionalidades:
  - Click en espacio para ver detalles
  - Filtros en tiempo real
  - Cambio de pisos
  - Vista de disponibilidad por colores

### FASE 3: Sistema de Reservas (4-5 días)

#### Día 8-9: Backend de reservas
- [ ] Actualizar `/lib/validations/booking.ts`:
  ```typescript
  - RecurringBookingSchema
  - BookingConflictSchema
  - BookingModificationSchema
  ```
- [ ] Extender `/lib/actions/booking.ts`:
  ```typescript
  - createRecurringBooking(data, recurrence)
  - checkAvailability(spaceId, startTime, endTime)
  - detectConflicts(bookingData)
  - modifyBooking(bookingId, changes)
  - cancelBooking(bookingId, reason)
  - getUpcomingBookings(userId)
  - getBookingsBySpace(spaceId, dateRange)
  ```

#### Día 10-11: Interfaz de reservas
- [ ] Crear páginas en `/app/(protected)/bookings/`:
  - `page.tsx` - Dashboard de reservas
  - `new/page.tsx` - Nueva reserva con wizard
  - `[id]/page.tsx` - Detalle de reserva
  - `calendar/page.tsx` - Vista calendario

- [ ] Crear componentes en `/components/bookings/`:
  ```typescript
  - BookingCalendar.tsx - Calendario con FullCalendar
  - TimeSlotPicker.tsx - Selector de horarios
  - RecurrenceSettings.tsx - Configuración de recurrencia
  - ConflictResolver.tsx - Resolución de conflictos
  - BookingWizard.tsx - Wizard paso a paso
  - BookingCard.tsx - Tarjeta de reserva
  - QuickBooking.tsx - Reserva rápida
  ```

#### Día 12: Validaciones y reglas de negocio
- [ ] Implementar validaciones:
  - Horario dentro de disponibilidad
  - Sin conflictos con otras reservas
  - Respeto de tiempo mínimo/máximo
  - Validación de membresía
- [ ] Cálculo de precios dinámicos
- [ ] Aplicación de descuentos por membresía
- [ ] Políticas de cancelación

### FASE 4: Check-in/Check-out (2 días)

#### Día 13: Backend y generación QR
- [ ] Crear `/lib/actions/check-in.ts`:
  ```typescript
  - performCheckIn(bookingId, method)
  - performCheckOut(checkInId)
  - generateBookingQR(bookingId)
  - validateQRCode(qrCode)
  - getActiveCheckIns(spaceId?)
  - autoCheckOut() // Cron job
  ```
- [ ] Implementar generación de códigos QR únicos
- [ ] Sistema de validación de QR

#### Día 14: Interfaz de check-in
- [ ] Crear página `/app/(protected)/check-in/page.tsx`
- [ ] Crear componentes:
  ```typescript
  - CheckInScanner.tsx - Escáner de QR
  - CheckInForm.tsx - Check-in manual
  - CheckInList.tsx - Lista de check-ins activos
  - OccupancyMonitor.tsx - Monitor en tiempo real
  - CheckInSuccess.tsx - Confirmación
  ```

### FASE 5: Gestión de Membresías (3 días)

#### Día 15: Modelo de membresías mejorado
- [ ] Extender modelo Membership en Prisma
- [ ] Crear `/lib/actions/membership-enhanced.ts`:
  ```typescript
  - createMembershipPlan(plan)
  - assignMembership(userId, planId)
  - upgradeMembership(membershipId, newPlanId)
  - suspendMembership(membershipId, reason)
  - getMembershipBenefits(membershipId)
  - checkMembershipLimits(membershipId, bookingData)
  ```

#### Día 16-17: Interfaz de membresías
- [ ] Crear páginas en `/app/(protected)/memberships/`:
  - `page.tsx` - Lista de membresías
  - `plans/page.tsx` - Planes disponibles
  - `[id]/page.tsx` - Detalle de membresía

- [ ] Crear componentes:
  ```typescript
  - MembershipCard.tsx - Tarjeta de membresía
  - MembershipComparison.tsx - Comparación de planes
  - MembershipUpgrade.tsx - Wizard de upgrade
  - MembershipUsage.tsx - Uso de la membresía
  - BenefitsList.tsx - Lista de beneficios
  ```

### FASE 6: Calendario y Sincronización (2 días)

#### Día 18: Calendario integrado
- [ ] Instalar: `npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid`
- [ ] Crear `/components/calendar/BookingCalendar.tsx`
- [ ] Implementar vistas: día, semana, mes
- [ ] Drag & drop de reservas
- [ ] Vista de múltiples espacios

#### Día 19: Sincronización externa
- [ ] Implementar `/lib/actions/calendar-sync.ts`:
  ```typescript
  - connectGoogleCalendar(authCode)
  - connectOutlookCalendar(authCode)
  - syncBookingsToExternal(userId)
  - importExternalEvents(userId)
  - generateICalFeed(userId)
  ```
- [ ] Crear componentes de configuración
- [ ] Implementar webhooks para sincronización

### FASE 7: Control de Aforo y Analytics (2 días)

#### Día 20: Backend de monitoreo
- [ ] Crear `/lib/actions/occupancy.ts`:
  ```typescript
  - getCurrentOccupancy(zoneId?)
  - getOccupancyHistory(dateRange)
  - setCapacityLimits(spaceId, limits)
  - getOccupancyPredictions()
  - generateOccupancyReport()
  ```

#### Día 21: Dashboard de ocupación
- [ ] Crear `/app/(protected)/occupancy/page.tsx`
- [ ] Crear componentes:
  ```typescript
  - OccupancyDashboard.tsx - Dashboard principal
  - OccupancyHeatmap.tsx - Mapa de calor
  - CapacityAlert.tsx - Alertas de capacidad
  - ZoneOccupancyChart.tsx - Gráficos por zona
  - OccupancyTrends.tsx - Tendencias
  ```

## 📁 Estructura Final de Archivos

```
src/
├── app/(protected)/
│   ├── spaces/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── edit/page.tsx
│   │       └── availability/page.tsx
│   ├── bookings/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── calendar/page.tsx
│   │   └── [id]/page.tsx
│   ├── check-in/
│   │   └── page.tsx
│   ├── memberships/
│   │   ├── page.tsx
│   │   ├── plans/page.tsx
│   │   └── [id]/page.tsx
│   └── occupancy/
│       └── page.tsx
│
├── components/
│   ├── spaces/
│   │   ├── SpaceList.tsx
│   │   ├── SpaceForm.tsx
│   │   ├── SpaceGallery.tsx
│   │   ├── AmenitySelector.tsx
│   │   ├── SpaceStatusBadge.tsx
│   │   ├── SpaceFilters.tsx
│   │   └── map/
│   │       ├── SpaceMap.tsx
│   │       ├── FloorPlanViewer.tsx
│   │       ├── SpaceMarker.tsx
│   │       └── AvailabilityOverlay.tsx
│   ├── bookings/
│   │   ├── BookingCalendar.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── RecurrenceSettings.tsx
│   │   ├── ConflictResolver.tsx
│   │   ├── BookingWizard.tsx
│   │   └── QuickBooking.tsx
│   ├── check-in/
│   │   ├── CheckInScanner.tsx
│   │   ├── CheckInForm.tsx
│   │   ├── CheckInList.tsx
│   │   └── OccupancyMonitor.tsx
│   ├── calendar/
│   │   ├── BookingCalendar.tsx
│   │   ├── CalendarSync.tsx
│   │   └── EventDetails.tsx
│   └── memberships/
│       ├── MembershipCard.tsx
│       ├── MembershipComparison.tsx
│       └── MembershipUsage.tsx
│
├── lib/
│   ├── actions/
│   │   ├── space-enhanced.ts
│   │   ├── booking-enhanced.ts
│   │   ├── check-in.ts
│   │   ├── membership-enhanced.ts
│   │   ├── calendar-sync.ts
│   │   └── occupancy.ts
│   └── validations/
│       ├── space-enhanced.ts
│       ├── booking-enhanced.ts
│       ├── check-in.ts
│       └── membership-enhanced.ts
│
└── hooks/
    ├── use-spaces.ts
    ├── use-bookings.ts
    ├── use-occupancy.ts
    ├── use-calendar.ts
    └── use-check-in.ts
```

## 🔧 Configuración y Setup

### Variables de Entorno Necesarias
```env
# Mapas
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_MAP_STYLE_URL=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Microsoft Calendar
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=

# QR Settings
QR_CODE_SECRET=
QR_CODE_EXPIRY_HOURS=24

# Ocupación
MAX_OCCUPANCY_PERCENTAGE=85
AUTO_CHECKOUT_HOURS=2
```

### Dependencias a Instalar
```bash
# Core
npm install react-leaflet leaflet @types/leaflet
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install qrcode react-qr-reader
npm install date-fns date-fns-tz
npm install recharts

# APIs
npm install @googleapis/calendar
npm install @microsoft/microsoft-graph-client

# Utilidades
npm install react-dropzone
npm install react-color
npm install react-hook-form-persist
```

## 🧪 Testing Strategy

### Unit Tests
- Server Actions: Mock de Prisma y servicios externos
- Validaciones: Test de todos los schemas Zod
- Componentes: Testing con React Testing Library

### Integration Tests
- Flujo completo de reserva
- Check-in/Check-out
- Sincronización de calendarios
- Cálculo de precios

### E2E Tests
- Crear y gestionar espacios
- Realizar reserva completa
- Check-in con QR
- Vista de calendario

## 📊 Métricas de Éxito

### KPIs Técnicos
- Tiempo de respuesta < 200ms para búsquedas
- Disponibilidad del sistema > 99.9%
- Sin conflictos de reservas duplicadas
- Sincronización de calendarios < 5 segundos

### KPIs de Negocio
- Reducción 60% en tiempo de gestión de reservas
- Aumento 40% en utilización de espacios
- Reducción 80% en conflictos de reservas
- Satisfacción del usuario > 90%
- ROI positivo en 3 meses

## 🚀 Plan de Despliegue

### Fase Alpha (Semana 1-2)
- Despliegue en ambiente de staging
- Testing con equipo interno
- Ajustes basados en feedback

### Fase Beta (Semana 3)
- Despliegue a grupo piloto de usuarios
- Monitoreo de métricas
- Corrección de bugs críticos

### Producción (Semana 4)
- Despliegue gradual por tenants
- Monitoreo 24/7
- Soporte activo

## 📝 Documentación a Generar

1. **Manual de Usuario**
   - Guía de reservas
   - Uso del mapa interactivo
   - Check-in/Check-out

2. **Manual de Administrador**
   - Gestión de espacios
   - Configuración de disponibilidad
   - Gestión de membresías

3. **API Documentation**
   - Endpoints REST
   - Server Actions
   - Webhooks

4. **Guías de Integración**
   - Google Calendar
   - Microsoft Calendar
   - Sistemas externos

## ⚠️ Consideraciones y Riesgos

### Técnicos
- Performance con múltiples reservas simultáneas
- Sincronización de calendarios externos
- Compatibilidad de navegadores para QR scanner
- Escalabilidad del mapa interactivo

### Negocio
- Adopción por parte de usuarios
- Cambio de procesos existentes
- Capacitación del personal
- Migración de datos históricos

### Mitigación
- Implementación de caché agresivo
- Queue system para operaciones pesadas
- Progressive enhancement para features avanzados
- Plan de capacitación y soporte

## 🔄 Mantenimiento y Evolución

### Mantenimiento Regular
- Actualización de dependencias mensual
- Revisión de logs semanalmente
- Backup de configuraciones

### Evolución Futura
- IA para predicción de ocupación
- Integración con IoT para sensores
- App móvil nativa
- Sistema de pagos integrado
- Analytics avanzado con ML

## ✅ Checklist de Implementación

### Pre-desarrollo
- [ ] Validar requerimientos con stakeholders
- [ ] Revisar diseños UI/UX
- [ ] Configurar ambiente de desarrollo
- [ ] Crear branch de feature

### Durante desarrollo
- [ ] Daily standups
- [ ] Code reviews en cada PR
- [ ] Testing continuo
- [ ] Documentación inline

### Post-desarrollo
- [ ] Testing de aceptación
- [ ] Documentación completa
- [ ] Training de usuarios
- [ ] Plan de rollback

## 📞 Contactos y Recursos

### Equipo
- Product Owner: [Definir]
- Tech Lead: [Definir]
- QA Lead: [Definir]

### Recursos
- Diseños en Figma: [URL]
- API Docs: [URL]
- Jira Board: [URL]

---

**Última actualización**: 16 de Septiembre de 2025
**Versión**: 1.0.0
**Estado**: Pendiente de Aprobación