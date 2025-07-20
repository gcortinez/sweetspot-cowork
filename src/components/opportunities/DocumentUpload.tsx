'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Upload, Loader2, X, FileText } from 'lucide-react'
import { uploadOpportunityDocument } from '@/lib/actions/opportunity-documents'
import { useToast } from '@/hooks/use-toast'
import { DOCUMENT_TYPES, FILE_CONFIG } from '@/lib/validations/documents'
import { cn } from '@/lib/utils'

interface DocumentUploadProps {
  opportunityId: string
  onUploadComplete: () => void
  className?: string
}

export default function DocumentUpload({ 
  opportunityId, 
  onUploadComplete,
  className 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>('general')
  const [description, setDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > FILE_CONFIG.maxSize) {
      toast({
        title: 'Archivo muy grande',
        description: `El archivo debe ser menor a ${FILE_CONFIG.maxSize / (1024 * 1024)}MB`,
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!FILE_CONFIG.allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de archivo no permitido',
        description: 'Solo se permiten PDF, Word, Excel, imágenes y archivos de texto',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const result = await uploadOpportunityDocument(opportunityId, formData)
      
      if (result.success) {
        toast({
          title: 'Documento subido',
          description: 'El archivo se ha subido exitosamente',
        })
        
        // Reset form
        setSelectedFile(null)
        setDocumentType('general')
        setDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        onUploadComplete()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al subir el archivo',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-all',
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400',
          selectedFile && 'bg-gray-50 dark:bg-gray-900/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept={FILE_CONFIG.allowedExtensions.join(',')}
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Máximo {FILE_CONFIG.maxSize / (1024 * 1024)}MB. PDF, Word, Excel, imágenes
            </p>
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Seleccionar archivo
              </Button>
            </label>
          </>
        )}
      </div>

      {/* Document metadata */}
      {selectedFile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de documento</Label>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
              disabled={uploading}
            >
              <SelectTrigger id="documentType">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del documento"
              className="resize-none h-20"
              maxLength={500}
              disabled={uploading}
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      {selectedFile && (
        <Button 
          type="submit" 
          disabled={uploading} 
          className="w-full"
        >
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
      )}
    </form>
  )
}