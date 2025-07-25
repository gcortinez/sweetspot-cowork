# Configuración de Vercel Blob Storage

Esta guía te ayudará a configurar Vercel Blob Storage para el sistema de documentos adjuntos en SweetSpot Cowork.

> **Nota**: Documentación actualizada con la última versión de `@vercel/blob` (v1.0.0+)

## 1. 📦 Instalación

```bash
npm install @vercel/blob
# o con pnpm
pnpm install @vercel/blob
# o con yarn
yarn add @vercel/blob
```

## 2. 🔑 Crear el Token de Vercel Blob

### Opción A: Desde el Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com) y entra a tu cuenta
2. Ve a tu proyecto > **Storage** > **Connect Store**
3. Selecciona **Blob** y crea un nuevo store
4. Una vez creado, ve a **Settings** del store
5. Copia el token de lectura/escritura que empieza con `vercel_blob_rw_`

### Opción B: Desde la CLI de Vercel
```bash
npx vercel link  # Vincula tu proyecto
npx vercel env pull  # Descarga las variables de entorno
```

## 3. 🌍 Configurar Variables de Entorno

### En tu proyecto local (.env.local):
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_tu_token_aqui"
```

### En Vercel (para producción):
1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** > **Environment Variables**
3. Agrega:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_tu_token_aqui`
   - **Environments**: Production, Preview, Development

## 4. 🔧 Verificar la Configuración

Una vez configurado, puedes verificar que todo funciona ejecutando:

```bash
npx tsx scripts/setup-storage.ts
```

Si todo está configurado correctamente, verás:
```
🚀 Verifying Vercel Blob Storage configuration...
✅ Vercel Blob Storage is properly configured!
📁 Documents will be stored with path structure: opportunities/{tenantId}/{opportunityId}/{fileName}
🎉 Storage verification process finished
ℹ️  You can now upload documents to opportunities!
```

## 5. 📋 Límites y Consideraciones

### Límites de Vercel Blob (por defecto):
- **Hobby Plan**: 500MB total storage
- **Pro Plan**: 100GB total storage
- **Enterprise**: Límites personalizados

### Límites por archivo (configurados en el código):
- **Tamaño máximo**: 10MB por archivo
- **Tipos permitidos**: 
  - PDF (`application/pdf`)
  - Word (`application/msword`, `.docx`)
  - Excel (`application/vnd.ms-excel`, `.xlsx`)
  - Imágenes (`image/jpeg`, `image/png`, `image/gif`)
  - Texto plano (`text/plain`)
  - ZIP (`application/zip`)

## 6. 🚀 Pasos de Implementación

1. **Configura el token** en tu `.env.local`
2. **Verifica** con el script: `npx tsx scripts/setup-storage.ts`
3. **Haz deploy** a Vercel con las variables de entorno configuradas
4. **Prueba** subiendo un documento en la aplicación

## 7. 🏗️ Arquitectura del Sistema

### Estructura de Archivos
```
opportunities/
  └── {tenantId}/
      └── {opportunityId}/
          └── {timestamp}-{random}-{fileName}.{ext}
```

### Flujo de Subida
1. Usuario selecciona archivo en el modal de oportunidad
2. Validación de tipo y tamaño en el frontend
3. Upload a Vercel Blob con path único por tenant/oportunidad
4. Metadata guardada en PostgreSQL con URL pública
5. Archivo disponible para descarga inmediata

### Opciones de Subida (v1.0.0+)

#### Subida Básica
```typescript
import { put } from '@vercel/blob';

const blob = await put('file.pdf', file, {
  access: 'public',
  addRandomSuffix: true, // Por defecto: true
});
```

#### Subida Multipart (archivos grandes)
```typescript
const blob = await put('big-file.pdf', file, {
  access: 'public',
  multipart: true, // Recomendado para archivos > 5MB
  onUploadProgress(event) {
    console.log(`${event.percentage}% subido`);
  }
});
```

#### Prevenir Sobrescritura
```typescript
// Por defecto, sobrescribir un archivo existente lanza un error
await put('file.pdf', file, { access: 'public' });

// Para permitir sobrescritura:
await put('file.pdf', file, { 
  access: 'public',
  allowOverwrite: true 
});
```

### Seguridad
- **Multi-tenant**: Cada tenant tiene su propia carpeta
- **RLS (Row Level Security)**: Base de datos controla acceso a metadata
- **URLs públicas**: Los archivos son técnicamente públicos pero la estructura de paths previene acceso no autorizado
- **Validación**: Tipos de archivo y tamaños validados en servidor

## 8. 💡 Notas Importantes

- **No hay setup adicional**: Vercel Blob se activa automáticamente con el token
- **Sin buckets**: No necesitas crear buckets como en AWS S3 o Supabase
- **CDN integrado**: Vercel Blob incluye CDN global automáticamente
- **URLs permanentes**: Las URLs no expiran (a diferencia de signed URLs)
- **Eliminación automática**: Cuando se elimina un documento, se borra tanto de la BD como del storage
- **Cache Control**: Por defecto, los archivos se cachean 1 año en navegadores y 5 minutos en edge
- **Formato de URL**: Las URLs ahora usan el formato `[id].blob.vercel-storage.com/...`
- **Tamaño mínimo multipart**: Para uploads multipart, cada parte debe ser mínimo 5MB (excepto la última)

## 9. 🔧 Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN environment variable is not set"
- Verifica que el token esté en tu `.env.local`
- Asegúrate de que el token empiece con `vercel_blob_rw_`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "Error uploading to Vercel Blob"
- Verifica que el token tenga permisos de escritura
- Revisa los límites de tu plan de Vercel
- Verifica que el tipo de archivo esté permitido

### Error: "Archivo no encontrado" al descargar
- El archivo puede haber sido eliminado del storage
- Verifica que la URL en la base de datos sea correcta
- Revisa que el token tenga permisos de lectura

### Error: "BlobAccessError: Access denied"
- Verifica que el token tenga permisos de escritura (`vercel_blob_rw_`)
- Asegúrate de que el token esté asociado al store correcto
- En desarrollo, verifica que las variables de entorno estén cargadas

### Problemas con Vite
Si usas Vite, necesitas cargar las variables de entorno manualmente:

```bash
pnpm install --save-dev dotenv dotenv-expand
```

```javascript
// vite.config.js
import dotenvExpand from 'dotenv-expand';
import { loadEnv, defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    const env = loadEnv(mode, process.cwd(), '');
    dotenvExpand.expand({ parsed: env });
  }
  return {
    // tu configuración...
  };
});
```

## 10. 📚 Referencias

- [Documentación oficial de Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [SDK de Vercel Blob para Node.js](https://www.npmjs.com/package/@vercel/blob)
- [Límites y precios de Vercel](https://vercel.com/pricing)
- [Guía de migración v1.0.0](https://github.com/vercel/storage/blob/main/packages/blob/CHANGELOG.md)
- [Ejemplos de código](https://github.com/vercel/storage/tree/main/packages/blob)

---

**Última actualización**: Julio 2025
**Versión del sistema**: SweetSpot Cowork v1.0.0
**Versión de @vercel/blob**: v1.0.0+