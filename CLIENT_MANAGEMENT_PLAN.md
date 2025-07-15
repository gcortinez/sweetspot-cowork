# Plan: Implementar Sistema de Gestión de Clientes

## Análisis del Estado Actual

### ✅ Lo que ya existe:
- **Modelo Client en Prisma**: Incluye campos como `name`, `email`, `phone`, `address`, `taxId`, `contactPerson`, `status`
- **Relación establecida**: `Opportunity.clientId` ya referencia al modelo `Client`
- **Flujo de datos funcional**: Los Server Actions de oportunidades ya incluyen datos del cliente
- **UI parcial**: Los componentes de oportunidades ya muestran información del cliente

### ❌ Lo que falta:
- Interfaz para crear/editar clientes
- Página principal para gestionar clientes
- Selector de clientes en formularios de oportunidades
- Gestión del ciclo de vida del cliente (LEAD → PROSPECT → ACTIVE → INACTIVE → CHURNED)

## Fase 1: Validaciones y Server Actions

### 1.1 Crear esquemas Zod para clientes
**Archivo**: `/src/lib/validations/clients.ts`
- `createClientSchema` - Validación para crear clientes
- `updateClientSchema` - Validación para actualizar clientes
- `listClientsSchema` - Validación para filtros y paginación
- `clientStatsSchema` - Validación para estadísticas de clientes
- Tipos TypeScript derivados con `z.infer`

### 1.2 Implementar Server Actions para clientes
**Archivo**: `/src/lib/actions/clients.ts`
- `createClient(input: CreateClientInput)` - Crear nuevo cliente
- `updateClient(id: string, input: UpdateClientInput)` - Actualizar cliente
- `deleteClient(id: string)` - Eliminar cliente (soft delete)
- `getClient(id: string)` - Obtener cliente por ID
- `listClients(input: ListClientsInput)` - Listar clientes con filtros
- `getClientStats(input: ClientStatsInput)` - Estadísticas de clientes
- `convertLeadToClient(leadId: string, clientData: CreateClientInput)` - Convertir lead a cliente

### 1.3 Actualizar validaciones centrales
**Archivo**: `/src/lib/validations/index.ts`
- Exportar esquemas de clientes con nombres específicos
- Evitar conflictos de nombres con otros módulos

## Fase 2: Componentes de UI

### 2.1 Componente ClientsTable
**Archivo**: `/src/components/clients/ClientsTable.tsx`
- Tabla con columnas: Nombre, Email, Teléfono, Estado, Contacto, Acciones
- Filtros por estado (LEAD, PROSPECT, ACTIVE, INACTIVE, CHURNED)
- Buscador por nombre/email
- Paginación
- Acciones: Ver, Editar, Eliminar, Ver Oportunidades

### 2.2 Componente CreateClientModal
**Archivo**: `/src/components/clients/CreateClientModal.tsx`
- Formulario completo con validación
- Campos: name, email, phone, address, taxId, contactPerson, status
- Integración con Server Actions
- Diseño consistente con otros modales (gradientes purple/blue)

### 2.3 Componente EditClientModal
**Archivo**: `/src/components/clients/EditClientModal.tsx`
- Similar a CreateClientModal pero para edición
- Pre-carga datos existentes del cliente
- Detecta cambios antes de guardar

### 2.4 Componente ClientSelector
**Archivo**: `/src/components/clients/ClientSelector.tsx`
- Selector tipo combobox para formularios
- Búsqueda en tiempo real
- Opción para crear cliente nuevo desde el selector
- Integración con formularios de oportunidades

### 2.5 Componente ClientCard
**Archivo**: `/src/components/clients/ClientCard.tsx`
- Tarjeta para mostrar información resumida del cliente
- Badges para estado del cliente
- Métricas básicas (# oportunidades, valor total)

## Fase 3: Páginas y Navegación

### 3.1 Página principal de clientes
**Archivo**: `/src/app/(protected)/clients/page.tsx`
- Layout similar a opportunities/page.tsx
- Métricas de clientes en cards superiores
- Filtros por estado y búsqueda
- Tabla de clientes con paginación
- Botón para crear nuevo cliente

### 3.2 Página de detalle del cliente
**Archivo**: `/src/app/(protected)/clients/[id]/page.tsx`
- Información completa del cliente
- Historial de oportunidades asociadas
- Actividades relacionadas
- Opciones para editar/eliminar

### 3.3 Integración en CreateOpportunityModal
**Archivo**: `/src/components/opportunities/CreateOpportunityModal.tsx`
- Reemplazar campo clientId con ClientSelector
- Validación para requerir cliente en oportunidades
- Opción para crear cliente nuevo desde el modal

### 3.4 Integración en EditOpportunityModal
**Archivo**: `/src/components/opportunities/EditOpportunityModal.tsx`
- Agregar ClientSelector para cambiar cliente asociado
- Mantener cliente actual seleccionado por defecto

### 3.5 Actualizar navegación
**Archivo**: `/src/components/shared/app-header.tsx` (o similar)
- Agregar link "Clientes" en el menú de navegación
- Icono: Building2 o Users

## Fase 4: Integración con Prospectos (Leads)

### 4.1 Actualizar formularios de leads
**Archivo**: `/src/components/leads/CreateLeadModal.tsx`
- Agregar campo opcional para asociar con cliente existente
- Opción para crear cliente automáticamente

### 4.2 Conversión de leads a clientes
**Archivo**: `/src/components/leads/ConvertLeadModal.tsx` (nuevo)
- Modal para convertir lead en cliente
- Pre-llena información del lead
- Permite completar información adicional del cliente

### 4.3 Sincronización de estados
- Actualizar Server Actions para mantener consistencia
- Cuando lead se convierte a cliente, actualizar referencias
- Notificaciones de cambios de estado

## Fase 5: Mejoras y Optimizaciones

### 5.1 Componentes adicionales
- `ClientMetrics` - Métricas y estadísticas
- `ClientActivityHistory` - Historial de actividades
- `ClientOpportunityList` - Lista de oportunidades del cliente

### 5.2 Validaciones avanzadas
- Validación de email único por tenant
- Validación de taxId (formato colombiano)
- Validación de teléfono

### 5.3 Funcionalidades extra
- Importar clientes desde CSV
- Exportar lista de clientes
- Búsqueda avanzada con filtros múltiples
- Etiquetas/tags para categorizar clientes

## Archivos a Crear/Modificar

### Nuevos archivos:
- `/src/lib/validations/clients.ts`
- `/src/lib/actions/clients.ts`
- `/src/components/clients/ClientsTable.tsx`
- `/src/components/clients/CreateClientModal.tsx`
- `/src/components/clients/EditClientModal.tsx`
- `/src/components/clients/ClientSelector.tsx`
- `/src/components/clients/ClientCard.tsx`
- `/src/app/(protected)/clients/page.tsx`
- `/src/app/(protected)/clients/[id]/page.tsx`

### Archivos a modificar:
- `/src/lib/validations/index.ts` - Agregar exports de clientes
- `/src/lib/actions/index.ts` - Agregar exports de clientes
- `/src/components/opportunities/CreateOpportunityModal.tsx` - Integrar ClientSelector
- `/src/components/opportunities/EditOpportunityModal.tsx` - Integrar ClientSelector
- `/src/components/shared/app-header.tsx` - Agregar navegación

## Resultado Esperado

Al completar este plan tendremos:
- ✅ Sistema completo de gestión de clientes (CRUD)
- ✅ Integración perfecta con pipeline de oportunidades
- ✅ Workflow completo: Lead → Cliente → Oportunidad → Conversión
- ✅ UI/UX consistente con el design system existente
- ✅ Validaciones robustas y manejo de errores
- ✅ Funcionalidad multi-tenant con RLS

## Consideraciones Técnicas

- **Consistencia de diseño**: Usar gradientes purple/blue existentes
- **Validaciones**: Esquemas Zod para type safety
- **Performance**: Paginación y filtros eficientes
- **UX**: Modales no intrusivos, feedback inmediato
- **Mantenibilidad**: Código modular y bien documentado
- **Seguridad**: RLS para aislamiento de tenants

## Estimación de Tiempo

- **Fase 1**: 2-3 horas (Server Actions y validaciones)
- **Fase 2**: 4-5 horas (Componentes UI)
- **Fase 3**: 3-4 horas (Páginas y navegación)
- **Fase 4**: 2-3 horas (Integración con leads)
- **Fase 5**: 2-3 horas (Mejoras y optimizaciones)

**Total estimado**: 13-18 horas de desarrollo