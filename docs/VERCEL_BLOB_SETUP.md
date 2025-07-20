# Configuración de Vercel Blob Storage

Esta guía te ayudará a configurar Vercel Blob Storage para el sistema de documentos adjuntos en SweetSpot Cowork.

## 1. 🔑 Crear el Token de Vercel Blob

### Opción A: Desde el Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com) y entra a tu cuenta
2. Ve a **Settings** > **Tokens**
3. Crea un nuevo token con permisos de **Blob Storage**
4. Copia el token que empieza con `vercel_blob_rw_`

### Opción B: Desde la CLI de Vercel
```bash
npx vercel login
npx vercel blob --help
```

## 2. 🌍 Configurar Variables de Entorno

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

## 3. 🔧 Verificar la Configuración

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

## 4. 📋 Límites y Consideraciones

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

## 5. 🚀 Pasos de Implementación

1. **Configura el token** en tu `.env.local`
2. **Verifica** con el script: `npx tsx scripts/setup-storage.ts`
3. **Haz deploy** a Vercel con las variables de entorno configuradas
4. **Prueba** subiendo un documento en la aplicación

## 6. 🏗️ Arquitectura del Sistema

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

### Seguridad
- **Multi-tenant**: Cada tenant tiene su propia carpeta
- **RLS (Row Level Security)**: Base de datos controla acceso a metadata
- **URLs públicas**: Los archivos son técnicamente públicos pero la estructura de paths previene acceso no autorizado
- **Validación**: Tipos de archivo y tamaños validados en servidor

## 7. 💡 Notas Importantes

- **No hay setup adicional**: Vercel Blob se activa automáticamente con el token
- **Sin buckets**: No necesitas crear buckets como en AWS S3 o Supabase
- **CDN integrado**: Vercel Blob incluye CDN global automáticamente
- **URLs permanentes**: Las URLs no expiran (a diferencia de signed URLs)
- **Eliminación automática**: Cuando se elimina un documento, se borra tanto de la BD como del storage

## 8. 🔧 Troubleshooting

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

## 9. 📚 Referencias

- [Documentación oficial de Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [SDK de Vercel Blob para Node.js](https://www.npmjs.com/package/@vercel/blob)
- [Límites y precios de Vercel](https://vercel.com/pricing)

---

**Última actualización**: Julio 2025
**Versión del sistema**: SweetSpot Cowork v1.0.0