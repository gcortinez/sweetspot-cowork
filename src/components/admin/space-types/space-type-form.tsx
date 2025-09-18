'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createSpaceTypeConfigAction, updateSpaceTypeConfigAction } from '@/lib/actions/space-type'
import {
  createSpaceTypeConfigSchema,
  updateSpaceTypeConfigSchema,
  type CreateSpaceTypeConfigRequest,
  type UpdateSpaceTypeConfigRequest,
} from '@/lib/validations/space-type'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Palette, Settings } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SpaceType {
  id: string
  name: string
  key: string
  description?: string | null
  icon?: string | null
  color?: string | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}

interface SpaceTypeFormProps {
  spaceType?: SpaceType
  isEdit?: boolean
}

const ICON_OPTIONS = [
  { value: 'users', label: '👥 Usuarios', description: 'Para espacios de reuniones' },
  { value: 'presentation', label: '📊 Presentación', description: 'Para salas de conferencias' },
  { value: 'phone', label: '📞 Teléfono', description: 'Para cabinas telefónicas' },
  { value: 'calendar', label: '📅 Calendario', description: 'Para espacios de eventos' },
  { value: 'coffee', label: '☕ Café', description: 'Para áreas comunes' },
  { value: 'utensils', label: '🍴 Utensilios', description: 'Para cocinas' },
  { value: 'sofa', label: '🛋️ Sofá', description: 'Para salas de descanso' },
]

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#8B5CF6', label: 'Púrpura' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#84CC16', label: 'Lima' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#14B8A6', label: 'Turquesa' },
  { value: '#F97316', label: 'Naranja' },
]

export function SpaceTypeForm({ spaceType, isEdit = false }: SpaceTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const formSchema = isEdit ? updateSpaceTypeConfigSchema : createSpaceTypeConfigSchema
  const defaultValues = isEdit && spaceType ? {
    name: spaceType.name,
    key: spaceType.key,
    description: spaceType.description || '',
    icon: spaceType.icon || '',
    color: spaceType.color || '',
    isActive: spaceType.isActive,
    sortOrder: spaceType.sortOrder,
  } : {
    name: '',
    key: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    isActive: true,
    sortOrder: 0,
  }

  const form = useForm<CreateSpaceTypeConfigRequest | UpdateSpaceTypeConfigRequest>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Auto-generate key from name
  const watchedName = form.watch('name')
  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
  }

  // Update key when name changes (only for new types)
  if (!isEdit && watchedName) {
    const generatedKey = generateKey(watchedName)
    if (form.getValues('key') !== generatedKey) {
      form.setValue('key', generatedKey)
    }
  }

  const onSubmit = async (data: CreateSpaceTypeConfigRequest | UpdateSpaceTypeConfigRequest) => {
    setIsLoading(true)
    try {
      const result = isEdit && spaceType
        ? await updateSpaceTypeConfigAction({ ...data, id: spaceType.id } as UpdateSpaceTypeConfigRequest)
        : await createSpaceTypeConfigAction(data as CreateSpaceTypeConfigRequest)

      if (result.success) {
        toast.success(isEdit ? 'Tipo de espacio actualizado exitosamente' : 'Tipo de espacio creado exitosamente')
        router.push('/admin/space-types')
        router.refresh()
      } else {
        toast.error(result.error || 'Ocurrió un error')
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as any, { message })
          })
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/space-types">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Volver a Tipos de Espacio</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Editar Tipo de Espacio' : 'Crear Nuevo Tipo de Espacio'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Actualizar configuración del tipo de espacio' : 'Agregar un nuevo tipo de espacio personalizado'}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Tipo</FormLabel>
                      <FormControl>
                        <Input placeholder="Sala de Reuniones" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nombre descriptivo que verán los usuarios
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clave del Sistema</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SALA_REUNIONES"
                          {...field}
                          disabled={isEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEdit ? 'La clave no se puede modificar' : 'Se genera automáticamente del nombre'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe este tipo de espacio y sus características..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Descripción opcional del tipo de espacio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de Visualización</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Orden en que aparece en las listas (menor = primero)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visual Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuración Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar icono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ICON_OPTIONS.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center gap-2">
                                <span>{icon.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Icono que representa este tipo de espacio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COLOR_OPTIONS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.value }}
                                />
                                <span>{color.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Color para identificar este tipo en la interfaz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Vista Previa</h4>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: form.watch('color') || '#3B82F6' }}
                  >
                    {form.watch('icon') ?
                      ICON_OPTIONS.find(i => i.value === form.watch('icon'))?.label.split(' ')[0] || '⚙️'
                      : '⚙️'
                    }
                  </div>
                  <div>
                    <div className="font-medium">
                      {form.watch('name') || 'Nombre del Tipo'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {form.watch('key') || 'CLAVE_SISTEMA'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Tipo Activo
                      </FormLabel>
                      <FormDescription>
                        Los tipos activos están disponibles para crear espacios
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Tipo' : 'Crear Tipo')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}