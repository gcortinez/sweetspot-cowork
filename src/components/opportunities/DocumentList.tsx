'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  listOpportunityDocuments, 
  deleteOpportunityDocument,
  getDocumentDownloadUrl 
} from '@/lib/actions/opportunity-documents'
import { DOCUMENT_TYPES } from '@/lib/validations/documents'
import { 
  FileText, 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  Loader2,
  FileImage,
  FileSpreadsheet,
  FileType,
  FileArchive
} from '@/lib/icons'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  fileName: string
  originalName: string
  fileSize: bigint
  mimeType: string
  fileUrl: string
  documentType: string
  description?: string | null
  tags: string[]
  uploadedAt: Date
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface DocumentListProps {
  opportunityId: string
  refreshTrigger?: number
  className?: string
}

export default function DocumentList({ 
  opportunityId, 
  refreshTrigger,
  className 
}: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const result = await listOpportunityDocuments({
        opportunityId,
        limit: 50 // Load more documents at once
      })
      
      if (result.success && result.data) {
        setDocuments(result.data)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al cargar documentos',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar documentos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [opportunityId, refreshTrigger])

  const handleDownload = async (document: Document) => {
    setDownloadingId(document.id)
    
    try {
      const result = await getDocumentDownloadUrl(document.id)
      
      if (result.success && result.data) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a')
        link.href = result.data.url
        link.download = document.originalName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: 'Descarga iniciada',
          description: `Descargando ${document.originalName}`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al descargar el archivo',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: 'Error',
        description: 'Error al descargar el archivo',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId)
    
    try {
      const result = await deleteOpportunityDocument({ documentId })
      
      if (result.success) {
        toast({
          title: 'Documento eliminado',
          description: 'El documento ha sido eliminado exitosamente',
        })
        loadDocuments()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al eliminar el documento',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Error',
        description: 'Error al eliminar el documento',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  const formatFileSize = (bytes: bigint) => {
    const size = Number(bytes)
    if (size === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
    if (mimeType.includes('pdf')) return FileType
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return FileArchive
    return FileText
  }

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      contract: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      proposal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
      requirement: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      technical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
        <p className="text-gray-500 dark:text-gray-400">No hay documentos adjuntos</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Sube el primer documento usando el formulario de arriba
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {documents.map((doc) => {
        const FileIcon = getFileIcon(doc.mimeType)
        const isDeleting = deletingId === doc.id
        const isDownloading = downloadingId === doc.id
        
        return (
          <Card key={doc.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <FileIcon className="h-10 w-10 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {doc.originalName}
                    </h4>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', getDocumentTypeColor(doc.documentType))}
                      >
                        {DOCUMENT_TYPES[doc.documentType as keyof typeof DOCUMENT_TYPES] || doc.documentType}
                      </Badge>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-2">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.uploadedAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading || isDeleting}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(doc.id)}
                    disabled={isDownloading || isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!deleteConfirmId} 
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}