# Plan para Agregar Archivos Adjuntos a Oportunidades

## Resumen del Plan
Sistema completo de gestión de documentos adjuntos para oportunidades, utilizando Supabase Storage y base de datos PostgreSQL con Row Level Security (RLS).

## Arquitectura Propuesta

**Almacenamiento de Archivos:**
- **Supabase Storage** para almacenar archivos (ya configurado en el proyecto)
- **Base de datos**: Tabla `opportunity_documents` para metadatos
- **Organización**: Bucket `opportunities` con estructura `/tenant-id/opportunity-id/file-name`

## 1. Base de Datos - Tabla `opportunity_documents`

```sql
CREATE TABLE opportunity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Metadatos del archivo
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  
  -- Información del upload
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Categorización
  document_type VARCHAR(50) DEFAULT 'general', -- 'contract', 'proposal', 'requirement', 'general'
  description TEXT,
  
  -- Indexación y búsqueda
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_opportunity_documents_opportunity_id ON opportunity_documents(opportunity_id);
CREATE INDEX idx_opportunity_documents_tenant_id ON opportunity_documents(tenant_id);
CREATE INDEX idx_opportunity_documents_type ON opportunity_documents(document_type);
CREATE INDEX idx_opportunity_documents_active ON opportunity_documents(is_active);

-- RLS (Row Level Security)
ALTER TABLE opportunity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents in their tenant" ON opportunity_documents
  FOR ALL TO authenticated
  USING (tenant_id = get_current_tenant_id());
```

## 2. Configuración de Supabase Storage

```typescript
// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const storageClient = createClient(supabaseUrl, supabaseServiceKey)

// Configuración del bucket
const OPPORTUNITIES_BUCKET = 'opportunities'

export const storageConfig = {
  bucket: OPPORTUNITIES_BUCKET,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ]
}
```

## 3. Server Actions para Gestión de Documentos

```typescript
// src/lib/actions/opportunity-documents.ts
'use server'

import { storageClient, storageConfig } from '@/lib/storage'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function uploadOpportunityDocument(
  opportunityId: string,
  formData: FormData
) {
  try {
    const user = await getUserWithTenant()
    const file = formData.get('file') as File
    
    // Validaciones
    if (!file || file.size === 0) {
      return { success: false, error: 'No se seleccionó archivo' }
    }

    if (file.size > storageConfig.maxFileSize) {
      return { success: false, error: 'Archivo muy grande (máximo 10MB)' }
    }

    if (!storageConfig.allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de archivo no permitido' }
    }

    // Verificar que la oportunidad existe y pertenece al tenant
    const opportunity = await db.opportunity.findFirst({
      where: { id: opportunityId, tenantId: user.tenantId }
    })

    if (!opportunity) {
      return { success: false, error: 'Oportunidad no encontrada' }
    }

    // Generar nombre único
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `${user.tenantId}/${opportunityId}/${fileName}`

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from(storageConfig.bucket)
      .upload(filePath, file)

    if (uploadError) {
      return { success: false, error: 'Error al subir archivo' }
    }

    // Obtener URL pública
    const { data: urlData } = storageClient.storage
      .from(storageConfig.bucket)
      .getPublicUrl(filePath)

    // Guardar metadatos en la base de datos
    const document = await db.opportunityDocument.create({
      data: {
        opportunityId,
        tenantId: user.tenantId,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: urlData.publicUrl,
        uploadedBy: user.id,
        documentType: formData.get('documentType') as string || 'general',
        description: formData.get('description') as string || null,
      }
    })

    revalidatePath(`/opportunities/${opportunityId}`)
    
    return { success: true, data: document }
  } catch (error) {
    console.error('Error uploading document:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function deleteOpportunityDocument(documentId: string) {
  try {
    const user = await getUserWithTenant()
    
    // Buscar documento
    const document = await db.opportunityDocument.findFirst({
      where: { id: documentId, tenantId: user.tenantId }
    })

    if (!document) {
      return { success: false, error: 'Documento no encontrado' }
    }

    // Eliminar archivo de storage
    const filePath = document.fileUrl.split('/').slice(-3).join('/')
    await storageClient.storage
      .from(storageConfig.bucket)
      .remove([filePath])

    // Eliminar registro de la base de datos
    await db.opportunityDocument.delete({
      where: { id: documentId }
    })

    revalidatePath(`/opportunities/${document.opportunityId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function listOpportunityDocuments(opportunityId: string) {
  try {
    const user = await getUserWithTenant()
    
    const documents = await db.opportunityDocument.findMany({
      where: {
        opportunityId,
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return { success: true, data: documents }
  } catch (error) {
    console.error('Error listing documents:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
```

## 4. Componentes React para Upload y Gestión

### DocumentUpload Component

```typescript
// src/components/opportunities/DocumentUpload.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2 } from 'lucide-react'
import { uploadOpportunityDocument } from '@/lib/actions/opportunity-documents'
import { useToast } from '@/hooks/use-toast'

interface DocumentUploadProps {
  opportunityId: string
  onUploadComplete: () => void
}

export default function DocumentUpload({ opportunityId, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setUploading(true)
    try {
      const result = await uploadOpportunityDocument(opportunityId, formData)
      
      if (result.success) {
        toast({
          title: "Documento subido",
          description: "El archivo se ha subido exitosamente"
        })
        onUploadComplete()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir el archivo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Zona de drag & drop */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          // Manejar archivos soltados
        }}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Máximo 10MB. PDF, Word, Excel, imágenes permitidas
        </p>
        <Input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
          required
          disabled={uploading}
        />
      </div>

      {/* Metadatos del documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de documento</label>
          <Select name="documentType" defaultValue="general">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="contract">Contrato</SelectItem>
              <SelectItem value="proposal">Propuesta</SelectItem>
              <SelectItem value="requirement">Requisitos</SelectItem>
              <SelectItem value="technical">Documentación Técnica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
          <Textarea
            name="description"
            placeholder="Breve descripción del documento"
            className="resize-none"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Subir Documento
          </>
        )}
      </Button>
    </form>
  )
}
```

### DocumentList Component

```typescript
// src/components/opportunities/DocumentList.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listOpportunityDocuments, deleteOpportunityDocument } from '@/lib/actions/opportunity-documents'
import { FileText, Download, Trash2, Calendar, User } from 'lucide-react'

interface DocumentListProps {
  opportunityId: string
  refreshTrigger?: number
}

export default function DocumentList({ opportunityId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDocuments = async () => {
    try {
      const result = await listOpportunityDocuments(opportunityId)
      if (result.success) {
        setDocuments(result.data)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [opportunityId, refreshTrigger])

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`¿Eliminar el documento "${fileName}"?`)) return

    try {
      const result = await deleteOpportunityDocument(documentId)
      if (result.success) {
        loadDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      contract: 'bg-green-100 text-green-800',
      proposal: 'bg-blue-100 text-blue-800', 
      requirement: 'bg-purple-100 text-purple-800',
      technical: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors.general
  }

  if (loading) {
    return <div className="text-center py-4">Cargando documentos...</div>
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay documentos adjuntos</p>
        </div>
      ) : (
        documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{doc.originalName}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <Badge className={getDocumentTypeColor(doc.documentType)}>
                        {doc.documentType}
                      </Badge>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-2">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(doc.id, doc.originalName)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
```

## 5. Integración en OpportunityDetailModal

```typescript
// Agregar tabs de documentos en OpportunityDetailModal
<Tabs defaultValue="details" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="details">Detalles</TabsTrigger>
    <TabsTrigger value="activities">Actividades</TabsTrigger>
    <TabsTrigger value="documents">Documentos</TabsTrigger>
    <TabsTrigger value="quotations">Cotizaciones</TabsTrigger>
  </TabsList>
  
  <TabsContent value="documents" className="space-y-4">
    <DocumentUpload
      opportunityId={opportunity.id}
      onUploadComplete={() => setRefreshTrigger(Date.now())}
    />
    <DocumentList
      opportunityId={opportunity.id}
      refreshTrigger={refreshTrigger}
    />
  </TabsContent>
</Tabs>
```

## 6. Validaciones y Esquemas

```typescript
// src/lib/validations/documents.ts
import { z } from 'zod'

export const uploadDocumentSchema = z.object({
  opportunityId: z.string().uuid(),
  documentType: z.enum(['general', 'contract', 'proposal', 'requirement', 'technical']),
  description: z.string().optional(),
})

export const documentFilterSchema = z.object({
  opportunityId: z.string().uuid(),
  documentType: z.enum(['general', 'contract', 'proposal', 'requirement', 'technical']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})
```

## 7. Prisma Schema Updates

```prisma
// Agregar al schema.prisma
model OpportunityDocument {
  id            String   @id @default(cuid())
  opportunityId String   @map("opportunity_id")
  tenantId      String   @map("tenant_id")
  
  // Metadatos del archivo
  fileName      String   @map("file_name")
  originalName  String   @map("original_name")
  fileSize      BigInt   @map("file_size")
  mimeType      String   @map("mime_type")
  fileUrl       String   @map("file_url")
  
  // Información del upload
  uploadedById  String   @map("uploaded_by")
  uploadedAt    DateTime @default(now()) @map("uploaded_at")
  
  // Categorización
  documentType  String   @default("general") @map("document_type")
  description   String?
  tags          String[]
  isActive      Boolean  @default(true) @map("is_active")
  
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  uploadedBy    User        @relation(fields: [uploadedById], references: [id])
  
  @@map("opportunity_documents")
  @@index([opportunityId])
  @@index([tenantId])
  @@index([documentType])
  @@index([isActive])
}

// Agregar relación en Opportunity model
model Opportunity {
  // ... campos existentes
  documents OpportunityDocument[]
}

// Agregar relación en User model
model User {
  // ... campos existentes
  uploadedDocuments OpportunityDocument[]
}

// Agregar relación en Tenant model
model Tenant {
  // ... campos existentes
  opportunityDocuments OpportunityDocument[]
}
```

## Cronograma de Implementación

1. **Día 1**: Migración de base de datos + configuración de Storage
2. **Día 2**: Server Actions para upload/delete/list
3. **Día 3**: Componente DocumentUpload con drag & drop
4. **Día 4**: Componente DocumentList con gestión
5. **Día 5**: Integración en OpportunityDetailModal + testing

## Beneficios del Sistema

- **Organización centralizada** por oportunidad
- **Control de acceso** mediante RLS
- **Tipos de documento** para mejor categorización
- **Metadatos ricos** (descripción, tags, tipo)
- **Drag & drop** para mejor UX
- **Gestión de archivos** completa (upload, view, delete)
- **Auditoría** de quién subió cada documento
- **Escalabilidad** con Supabase Storage
- **Seguridad** con validaciones y límites de tamaño

## Consideraciones Técnicas

- **Límite de archivo**: 10MB por archivo
- **Tipos permitidos**: PDF, Word, Excel, imágenes, texto
- **Organización de storage**: `/tenant-id/opportunity-id/file-name`
- **RLS**: Aislamiento completo entre tenants
- **Optimización**: Índices en campos de búsqueda frecuente
- **Backup**: Supabase maneja respaldos automáticos

## Notas de Implementación

- Verificar que el bucket `opportunities` existe en Supabase Storage
- Configurar políticas de acceso en Supabase Storage
- Implementar validación de tipos de archivo en frontend y backend
- Considerar compresión de imágenes para optimizar espacio
- Implementar preview de documentos (opcional, fase 2)