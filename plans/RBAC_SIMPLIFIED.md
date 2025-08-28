# Sistema Simplificado de Roles y Permisos - SweetSpot Cowork

## 📋 Resumen
Sistema RBAC simplificado con 3 roles principales y permisos granulares para la plataforma SweetSpot Cowork.

## 🎯 Roles del Sistema

### 1. SUPER_ADMIN
**Descripción**: Administradores de la plataforma SweetSpot  
**Características**:
- Acceso total a la plataforma
- Puede crear y gestionar múltiples coworks
- Ve estadísticas globales del sistema
- Gestiona todos los usuarios de todos los coworks

### 2. COWORK_ADMIN  
**Descripción**: Administradores de un cowork específico  
**Características**:
- Control total sobre su cowork
- Puede invitar y gestionar usuarios
- Crea y gestiona servicios
- Ve estadísticas de su cowork
- Gestión completa del CRM

### 3. COWORK_USER
**Descripción**: Usuarios operativos del cowork  
**Características**:
- Gestiona prospectos y oportunidades
- Crea y edita clientes
- Ve servicios (solo lectura)
- No puede invitar usuarios ni gestionar servicios

## 🔑 Matriz de Permisos

| Recurso | Acción | SUPER_ADMIN | COWORK_ADMIN | COWORK_USER |
|---------|--------|-------------|--------------|-------------|
| **Dashboard** | | | | |
| Dashboard | Ver | ✅ | ✅ | ✅ |
| Estadísticas Globales | Ver | ✅ | ❌ | ❌ |
| Estadísticas Cowork | Ver | ✅ | ✅ | ❌ |
| **Coworks** | | | | |
| Coworks | Ver Todos | ✅ | ❌ | ❌ |
| Coworks | Crear | ✅ | ❌ | ❌ |
| Coworks | Editar | ✅ | ❌ | ❌ |
| Coworks | Eliminar | ✅ | ❌ | ❌ |
| **Usuarios** | | | | |
| Usuarios | Ver | ✅ | ✅ | ✅ |
| Usuarios | Invitar | ✅ | ✅ | ❌ |
| Usuarios | Crear | ✅ | ✅ | ❌ |
| Usuarios | Editar | ✅ | ✅ | ❌ |
| Usuarios | Eliminar | ✅ | ✅ | ❌ |
| **Servicios** | | | | |
| Servicios | Ver | ✅ | ✅ | ✅ |
| Servicios | Crear | ✅ | ✅ | ❌ |
| Servicios | Editar | ✅ | ✅ | ❌ |
| Servicios | Eliminar | ✅ | ✅ | ❌ |
| **Prospectos** | | | | |
| Prospectos | Ver | ✅ | ✅ | ✅ |
| Prospectos | Crear | ✅ | ✅ | ✅ |
| Prospectos | Editar | ✅ | ✅ | ✅ |
| Prospectos | Eliminar | ✅ | ✅ | ❌ |
| **Oportunidades** | | | | |
| Oportunidades | Ver | ✅ | ✅ | ✅ |
| Oportunidades | Crear | ✅ | ✅ | ✅ |
| Oportunidades | Editar | ✅ | ✅ | ✅ |
| Oportunidades | Eliminar | ✅ | ✅ | ❌ |
| **Clientes** | | | | |
| Clientes | Ver | ✅ | ✅ | ✅ |
| Clientes | Crear | ✅ | ✅ | ✅ |
| Clientes | Editar | ✅ | ✅ | ✅ |
| Clientes | Eliminar | ✅ | ✅ | ❌ |

## 🏗️ Arquitectura Técnica

### Enum de Recursos
```typescript
enum Resource {
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_PLATFORM = 'dashboard:platform',
  STATS_GLOBAL = 'stats:global',
  STATS_COWORK = 'stats:cowork',
  
  // Coworks
  COWORK_VIEW = 'cowork:view',
  COWORK_CREATE = 'cowork:create',
  COWORK_EDIT = 'cowork:edit',
  COWORK_DELETE = 'cowork:delete',
  
  // Usuarios
  USER_VIEW = 'user:view',
  USER_INVITE = 'user:invite',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  
  // Servicios
  SERVICE_VIEW = 'service:view',
  SERVICE_CREATE = 'service:create',
  SERVICE_EDIT = 'service:edit',
  SERVICE_DELETE = 'service:delete',
  
  // CRM
  PROSPECT_VIEW = 'prospect:view',
  PROSPECT_CREATE = 'prospect:create',
  PROSPECT_EDIT = 'prospect:edit',
  PROSPECT_DELETE = 'prospect:delete',
  
  OPPORTUNITY_VIEW = 'opportunity:view',
  OPPORTUNITY_CREATE = 'opportunity:create',
  OPPORTUNITY_EDIT = 'opportunity:edit',
  OPPORTUNITY_DELETE = 'opportunity:delete',
  
  CLIENT_VIEW = 'client:view',
  CLIENT_CREATE = 'client:create',
  CLIENT_EDIT = 'client:edit',
  CLIENT_DELETE = 'client:delete',
}
```

### Jerarquía de Roles
```typescript
const ROLE_HIERARCHY = {
  COWORK_USER: 1,    // Nivel más bajo
  COWORK_ADMIN: 2,   // Nivel medio
  SUPER_ADMIN: 3,    // Nivel más alto
}
```

## 🛡️ Componentes de Protección

### CanAccess Component
```tsx
// Uso simple para mostrar/ocultar elementos
<CanAccess permission="service:create">
  <Button>Crear Servicio</Button>
</CanAccess>
```

### PermissionGuard Component
```tsx
// Protección de páginas completas
<PermissionGuard 
  require="service:view"
  fallback={<AccessDenied />}
>
  <ServicesPage />
</PermissionGuard>
```

### usePermissions Hook
```tsx
const { can, cannot, hasRole } = usePermissions();

// Verificar permisos
if (can('service:edit')) {
  // Permitir edición
}

// Verificar rol
if (hasRole('COWORK_ADMIN')) {
  // Mostrar opciones de admin
}
```

## 📁 Estructura de Archivos

```
src/
├── lib/
│   └── auth/
│       └── permissions.ts      # Core del sistema de permisos
├── hooks/
│   └── use-permissions.ts      # Hook principal
├── components/
│   └── guards/
│       ├── PermissionGuard.tsx # Protección de rutas
│       └── CanAccess.tsx       # Renderizado condicional
└── contexts/
    └── clerk-auth-context.tsx  # Integración con Clerk
```

## 🚀 Flujo de Implementación

### 1. Autenticación (Clerk)
- Usuario se autentica con Clerk
- Se obtiene el rol desde la base de datos
- Se establece el contexto de autenticación

### 2. Cálculo de Permisos
- Se mapea el rol a sus permisos correspondientes
- Se cachean los permisos en el contexto
- Se proveen a través del hook usePermissions

### 3. Protección de UI
- Componentes verifican permisos antes de renderizar
- Navegación se adapta según permisos
- Botones/acciones se ocultan si no hay permisos

### 4. Validación Backend
- Server Actions verifican permisos
- API routes validan antes de ejecutar
- Doble verificación para seguridad

## 🎯 Casos de Uso

### Super Admin
```tsx
// Ve selector de coworks
<CanAccess permission="cowork:view">
  <CoworkSelector />
</CanAccess>

// Accede a estadísticas globales
<CanAccess permission="stats:global">
  <GlobalStats />
</CanAccess>
```

### Cowork Admin
```tsx
// Gestiona servicios
<CanAccess permission="service:create">
  <CreateServiceButton />
</CanAccess>

// Invita usuarios
<CanAccess permission="user:invite">
  <InviteUserModal />
</CanAccess>
```

### Cowork User
```tsx
// Ve servicios (solo lectura)
<CanAccess permission="service:view">
  <ServicesList readOnly={cannot('service:edit')} />
</CanAccess>

// Gestiona prospectos
<CanAccess permission="prospect:create">
  <CreateProspectButton />
</CanAccess>
```

## 🔒 Consideraciones de Seguridad

1. **Frontend**: Primera línea de defensa, mejora UX
2. **Middleware**: Verificación en rutas protegidas
3. **Backend**: Validación obligatoria en todas las acciones
4. **Base de Datos**: RLS policies como última línea de defensa

## 📊 Ventajas del Sistema

- ✅ **Simple**: Solo 3 roles, fácil de entender
- ✅ **Granular**: Permisos específicos por acción
- ✅ **Escalable**: Fácil agregar nuevos permisos
- ✅ **Mantenible**: Centralizado en un solo lugar
- ✅ **Performante**: Cálculo con memoización
- ✅ **Seguro**: Múltiples capas de verificación

## 🚦 Estado de Implementación

- [ ] Core del sistema de permisos
- [ ] Hook usePermissions
- [ ] Componentes de protección
- [ ] Integración con Sidebar
- [ ] Protección de servicios
- [ ] Testing completo

---

**Última actualización**: 2025-08-28  
**Versión**: 1.0.0  
**Estado**: En implementación