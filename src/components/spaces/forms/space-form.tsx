'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import {
  createSpaceSchema,
  updateSpaceSchema,
  type CreateSpaceRequest,
  type UpdateSpaceRequest,
  SpaceTypeSchema,
} from '@/lib/validations/space'
import { createSpaceAction, updateSpaceAction } from '@/lib/actions/space'
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
import { Separator } from '@/components/ui/separator'
import { MapPin, Settings, DollarSign, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface SpaceFormProps {
  space?: any // Space from database
  isEdit?: boolean
}

export function SpaceForm({ space, isEdit = false }: SpaceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const formSchema = isEdit ? updateSpaceSchema : createSpaceSchema
  const defaultValues = isEdit && space ? {
    name: space.name || '',
    description: space.description || '',
    type: space.type,
    capacity: space.capacity || 1,
    hourlyRate: space.hourlyRate ? parseFloat(space.hourlyRate.toString()) : undefined,
    floor: space.floor || '',
    zone: space.zone || '',
    area: space.area ? parseFloat(space.area.toString()) : undefined,
    maxAdvanceBooking: space.maxAdvanceBooking || 30,
    minBookingDuration: space.minBookingDuration || 60,
    maxBookingDuration: space.maxBookingDuration || undefined,
    cancellationHours: space.cancellationHours || 24,
    requiresApproval: space.requiresApproval || false,
    allowRecurring: space.allowRecurring || true,
    isActive: space.isActive || true,
    coordinates: space.coordinates || undefined,
    images: space.images ? JSON.parse(space.images) : [],
  } : {
    name: '',
    description: '',
    type: 'MEETING_ROOM' as const,
    capacity: 1,
    hourlyRate: undefined,
    floor: '',
    zone: '',
    area: undefined,
    maxAdvanceBooking: 30,
    minBookingDuration: 60,
    maxBookingDuration: undefined,
    cancellationHours: 24,
    requiresApproval: false,
    allowRecurring: true,
    isActive: true,
    coordinates: undefined,
    images: [],
  }

  const form = useForm<CreateSpaceRequest | UpdateSpaceRequest>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (data: CreateSpaceRequest | UpdateSpaceRequest) => {
    setIsLoading(true)
    try {
      const result = isEdit && space
        ? await updateSpaceAction({ ...data, id: space.id } as UpdateSpaceRequest)
        : await createSpaceAction(data as CreateSpaceRequest)

      if (result.success) {
        toast.success(isEdit ? 'Space updated successfully' : 'Space created successfully')
        router.push('/spaces')
        router.refresh()
      } else {
        toast.error(result.error || 'An error occurred')
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as any, { message })
          })
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Space' : 'Create New Space'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update space details and settings' : 'Add a new space to your coworking location'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Space Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Conference Room A" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this space
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Space Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select space type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SpaceTypeSchema.options.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this space, its features, and ideal use cases..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the space
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum people
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="25.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Square meters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Price per hour
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor</FormLabel>
                      <FormControl>
                        <Input placeholder="1st Floor" {...field} />
                      </FormControl>
                      <FormDescription>
                        Which floor is this space on?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="East Wing" {...field} />
                      </FormControl>
                      <FormDescription>
                        Area or zone within the building
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxAdvanceBooking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Advance Booking (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        How far in advance can users book?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cancellationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cancellation Notice (hours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="24"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 24)}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum hours before cancellation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minBookingDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          placeholder="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum booking duration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBookingDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          placeholder="480"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum booking duration (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Requires Approval
                        </FormLabel>
                        <FormDescription>
                          Bookings need admin approval
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

                <FormField
                  control={form.control}
                  name="allowRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Recurring
                        </FormLabel>
                        <FormDescription>
                          Enable recurring bookings
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

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Space is available for booking
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
              </div>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEdit ? 'Update Space' : 'Create Space')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}