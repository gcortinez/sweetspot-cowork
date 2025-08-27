# Plan de Implementación: Sistema de Roles y Permisos Corregido

## 📋 Problemas Identificados

### 🔴 **Problema 1: Jerarquía de Roles Incorrecta**
- `COWORK_USER` no estaba en la jerarquía (ya corregido)
- La lógica de permisos no refleja los roles reales del negocio
- Falta diferenciación clara entre roles de cowork vs roles de cliente

### 🔴 **Problema 2: Navegación Sin Restricciones**
- El sidebar muestra todas las opciones a todos los usuarios
- No hay componentes `AuthGuard` protegiendo las rutas sensibles
- Los usuarios COWORK_USER pueden acceder a funciones administrativas

### 🔴 **Problema 3: Gestión de Servicios Incorrecta**
- Los usuarios COWORK_USER pueden crear/modificar servicios
- No hay restricciones basadas en rol en la página de servicios

### 🔴 **Problema 4: Falta Menú de Administración**
- COWORK_ADMIN no tiene acceso visible a gestión de usuarios
- No existe un menú administrativo diferenciado

### 🔴 **Problema 5: Roles de Cliente Mal Definidos**
- CLIENT_ADMIN y END_USER no tienen funcionalidades específicas
- Falta la lógica de aprobación de servicios

## 🎯 **Arquitectura de Roles Objetivo**

### **1. SUPER_ADMIN (Nivel 5)**
- **Descripción**: Administradores de la plataforma SweetSpot
- **Acceso**: Todos los coworks, configuración global
- **Permisos**: Todo

### **2. COWORK_ADMIN (Nivel 4)**
- **Descripción**: Administradores de coworking individual
- **Acceso**: Su cowork completo
- **Permisos**: 
  - ✅ Gestionar usuarios del cowork
  - ✅ Crear/modificar/eliminar servicios
  - ✅ Ver todos los prospectos y oportunidades
  - ✅ Gestionar espacios y configuración
  - ✅ Reportes y analytics completos

### **3. COWORK_USER (Nivel 3)**
- **Descripción**: Staff del coworking
- **Acceso**: Su cowork asignado
- **Permisos**:
  - ✅ Ver y gestionar prospectos/oportunidades asignados
  - ✅ Ver servicios (solo lectura)
  - ❌ NO crear/modificar servicios
  - ❌ NO gestionar usuarios
  - ❌ NO acceder a configuración administrativa

### **4. CLIENT_ADMIN (Nivel 2)**
- **Descripción**: Administrador de empresa cliente
- **Acceso**: Su organización cliente
- **Permisos**:
  - ✅ Gestionar usuarios de su empresa
  - ✅ Aprobar solicitudes de servicios de sus usuarios
  - ✅ Ver reportes de uso de su empresa
  - ❌ NO acceder a funciones del cowork

### **5. END_USER (Nivel 1)**
- **Descripción**: Empleados de empresas cliente
- **Acceso**: Su perfil y servicios asignados
- **Permisos**:
  - ✅ Ver servicios disponibles
  - ✅ Solicitar servicios (requiere aprobación de CLIENT_ADMIN)
  - ❌ NO gestionar otros usuarios

## 🛠️ **Plan de Implementación**

### **Fase 1: Corregir Jerarquía y Permisos Base**

#### **1.1 Actualizar Role Hierarchy**
```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  END_USER: 1,           // Empleados de empresas cliente
  CLIENT_ADMIN: 2,       // Admin de empresa cliente  
  COWORK_USER: 3,        // Staff del cowork
  COWORK_ADMIN: 4,       // Admin del cowork
  SUPER_ADMIN: 5,        // Admin de plataforma
};
```

#### **1.2 Definir Permisos Específicos**
- Crear sistema de permisos granular
- Definir permisos por recurso (servicios, usuarios, reportes, etc.)
- Implementar permisos por acción (crear, ver, editar, eliminar)

### **Fase 2: Implementar Restricciones en Navegación**

#### **2.1 Sidebar Condicional**
- Mostrar opciones según rol del usuario
- Implementar `AuthGuard` en elementos del menú
- Crear menú administrativo para COWORK_ADMIN

#### **2.2 Páginas Protegidas**
- Agregar `RequireRole` a páginas administrativas
- Implementar checks de permisos en componentes
- Crear páginas específicas para cada rol

### **Fase 3: Corregir Gestión de Servicios**

#### **3.1 Restricciones en Servicios**
- COWORK_USER: Solo ver (read-only)
- COWORK_ADMIN: CRUD completo
- CLIENT_ADMIN/END_USER: Ver servicios disponibles

#### **3.2 UI Condicional**
- Ocultar botones de crear/editar para COWORK_USER
- Mostrar estados diferentes según rol
- Implementar mensajes informativos sobre permisos

### **Fase 4: Implementar Gestión de Usuarios**

#### **4.1 Menú Administrativo**
- Agregar "Administración" al sidebar para COWORK_ADMIN+
- Incluir gestión de usuarios, configuración, reportes

#### **4.2 Funciones de Gestión**
- COWORK_ADMIN puede gestionar usuarios del cowork
- CLIENT_ADMIN puede gestionar usuarios de su empresa
- Implementar invitaciones con roles específicos

### **Fase 5: Sistema de Prospectos/Oportunidades**

#### **5.1 Asignación y Visibilidad**
- COWORK_USER solo ve registros asignados a él
- COWORK_ADMIN ve todos los registros del cowork
- Implementar filtros y asignación

#### **5.2 Workflow de Aprobaciones**
- CLIENT_ADMIN aprueba solicitudes de sus usuarios
- Implementar estados de aprobación
- Notificaciones y workflow automático

### **Fase 6: Reportes y Analytics**

#### **6.1 Reportes por Rol**
- COWORK_ADMIN: Reportes completos del cowork
- CLIENT_ADMIN: Reportes de su empresa
- COWORK_USER: Reportes de sus actividades
- END_USER: Dashboard personal

### **Fase 7: Testing y Validación**

#### **7.1 Test de Permisos**
- Verificar restricciones por rol
- Probar navegación y accesos
- Validar APIs y endpoints

#### **7.2 User Experience**
- Asegurar mensajes claros sobre permisos
- Interfaces intuitivas por rol
- Documentación para usuarios

## 📁 **Archivos a Crear/Modificar**

### **Nuevos Archivos**
1. `src/middleware/role-permissions.ts` - Definición de permisos
2. `src/components/admin/CoworkManagement.tsx` - Panel administrativo
3. `src/components/client/ClientDashboard.tsx` - Dashboard de cliente
4. `src/components/guards/ServiceGuard.tsx` - Protección de servicios
5. `src/hooks/use-service-permissions.ts` - Hook de permisos de servicios
6. `src/pages/admin/users.tsx` - Gestión de usuarios para admins

### **Archivos a Modificar**
1. `src/contexts/clerk-auth-context.tsx` - Jerarquía corregida ✅
2. `src/components/layout/Sidebar.tsx` - Navegación condicional
3. `src/app/(protected)/services/page.tsx` - Restricciones de servicios
4. `src/app/(protected)/dashboard/page.tsx` - Dashboards por rol
5. `src/components/admin/user-management.tsx` - Permisos correctos
6. `src/hooks/use-rbac.ts` - Permisos actualizados
7. Todas las páginas principales - Agregar AuthGuards

## ⏱️ **Estimación de Tiempo**
- **Fase 1-2**: 4-6 horas (base y navegación)
- **Fase 3-4**: 6-8 horas (servicios y usuarios)  
- **Fase 5-6**: 8-10 horas (workflows y reportes)
- **Fase 7**: 2-4 horas (testing)
- **Total**: 20-28 horas de desarrollo

## 🚀 **Prioridad de Implementación**
1. **CRÍTICO**: Restricciones de servicios y navegación
2. **ALTO**: Gestión de usuarios para COWORK_ADMIN
3. **MEDIO**: Workflows de cliente y aprobaciones
4. **BAJO**: Reportes avanzados y analytics

## 📊 **Estado Actual vs Objetivo**

### **Estado Actual**
- ❌ COWORK_USER tiene permisos de admin
- ❌ No hay restricciones en servicios
- ❌ Sidebar sin protecciones
- ❌ Falta menú administrativo
- ❌ Roles de cliente no implementados

### **Estado Objetivo**
- ✅ COWORK_USER con permisos limitados
- ✅ Servicios protegidos por rol
- ✅ Navegación condicional
- ✅ Panel administrativo funcional
- ✅ Sistema completo de cliente/empresa

## 🔧 **Consideraciones Técnicas**

### **Compatibilidad**
- Mantener compatibilidad con Clerk Auth
- No romper funcionalidad existente
- Migración gradual de permisos

### **Performance**
- Lazy loading de componentes por rol
- Optimización de queries por scope
- Cache de permisos en contexto

### **Seguridad**
- Validación tanto frontend como backend
- Tokens y metadata seguros
- Logs de acceso y cambios

### **UX/UI**
- Mensajes claros sobre restricciones
- Interfaces intuitivas por rol
- Feedback visual de permisos

---

**Documento creado**: 2025-08-27  
**Última actualización**: 2025-08-27  
**Estado**: Pendiente de implementación  
**Prioridad**: Crítica