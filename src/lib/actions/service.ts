// import { revalidatePath } from 'next/cache' // Removed to avoid client component issues
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
// Remove broken getUserAction import
import type { ActionResult } from '@/types/database'
import {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
  getServiceSchema,
  listServicesSchema,
  checkServiceAvailabilitySchema,
  bulkUpdateServicesSchema,
  getServiceStatsSchema,
  calculateServicePricingSchema,
  createServicePackageSchema,
  updateServicePackageSchema,
  type CreateServiceRequest,
  type UpdateServiceRequest,
  type DeleteServiceRequest,
  type GetServiceRequest,
  type ListServicesRequest,
  type CheckServiceAvailabilityRequest,
  type BulkUpdateServicesRequest,
  type GetServiceStatsRequest,
  type CalculateServicePricingRequest,
  type CreateServicePackageRequest,
  type UpdateServicePackageRequest,
} from '@/lib/validations/service'
import { PricingCalculator } from '@/lib/utils/pricing'

// Helper function to safely parse JSON fields
function safeJsonParse(value: string | null, fallback: any = null) {
  if (!value) return fallback
  
  try {
    return JSON.parse(value)
  } catch (error) {
    // If parsing fails, return the original value or fallback
    // Suppress warnings for simple strings that are expected not to be JSON
    if (value !== 'ALWAYS' && value !== 'BUSINESS_HOURS' && value !== 'SCHEDULED') {
      console.warn('Failed to parse JSON field:', value, error)
    }
    return value === 'null' ? fallback : value
  }
}

// Helper function to get user with tenant info using Clerk auth
async function getUserWithTenant() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { 
      id: true, 
      tenantId: true, 
      role: true,
      firstName: true,
      lastName: true,
      email: true,
      clerkId: true
    }
  })

  if (!dbUser) {
    throw new Error('User not found in database')
  }

  if (!dbUser.tenantId) {
    throw new Error('User does not have a tenant assigned')
  }

  return dbUser
}

/**
 * Create a new service
 */
export async function createServiceAction(data: CreateServiceRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId

    // Validate input data
    const validatedData = createServiceSchema.parse(data)

    // Create service
    const service = await prisma.service.create({
      data: {
        ...validatedData,
        tenantId,
        pricing: validatedData.pricing ? JSON.stringify(validatedData.pricing) : null,
        availability: validatedData.availability ? JSON.stringify(validatedData.availability) : null,
        requirements: validatedData.requirements ? JSON.stringify(validatedData.requirements) : null,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        duration: validatedData.duration ? JSON.stringify(validatedData.duration) : null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        tenant: true,
      },
    })

    // revalidatePath('/services') // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        ...service,
        pricing: safeJsonParse(service.pricing),
        availability: safeJsonParse(service.availability),
        requirements: safeJsonParse(service.requirements),
        images: safeJsonParse(service.images, []),
        tags: safeJsonParse(service.tags, []),
        duration: safeJsonParse(service.duration),
        metadata: safeJsonParse(service.metadata),
      }
    }
  } catch (error: any) {
    console.error('Create service error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create service' }
  }
}

/**
 * Update an existing service
 */
export async function updateServiceAction(data: UpdateServiceRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = updateServiceSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingService) {
      return { success: false, error: 'Service not found' }
    }

    // Prepare update data with JSON stringification for JSON fields only
    const processedUpdateData: any = { ...updateData }
    
    // Only stringify the fields that are stored as JSON in Prisma
    if (updateData.tags && Array.isArray(updateData.tags)) {
      processedUpdateData.tags = JSON.stringify(updateData.tags)
    }
    if (updateData.metadata && typeof updateData.metadata === 'object') {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }
    if (updateData.pricingTiers && Array.isArray(updateData.pricingTiers)) {
      processedUpdateData.pricingTiers = JSON.stringify(updateData.pricingTiers)
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
      },
    })

    // revalidatePath('/services') // Removed to avoid client component issues
    // revalidatePath(`/services/${id}`) // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        ...service,
        pricing: safeJsonParse(service.pricing),
        availability: safeJsonParse(service.availability),
        requirements: safeJsonParse(service.requirements),
        images: safeJsonParse(service.images, []),
        tags: safeJsonParse(service.tags, []),
        duration: safeJsonParse(service.duration),
        metadata: safeJsonParse(service.metadata),
      }
    }
  } catch (error: any) {
    console.error('Update service error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update service' }
  }
}

/**
 * Delete a service
 */
export async function deleteServiceAction(data: DeleteServiceRequest): Promise<ActionResult<void>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = deleteServiceSchema.parse(data)

    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
    })

    if (!existingService) {
      return { success: false, error: 'Service not found' }
    }

    // Check for active bookings with this service
    const activeBookings = await prisma.booking.count({
      where: {
        services: {
          some: {
            serviceId: validatedData.id,
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
            },
          },
        },
      },
    })

    if (activeBookings > 0) {
      return { 
        success: false, 
        error: 'Cannot delete service with active bookings. Please complete or cancel all bookings first.' 
      }
    }

    // Soft delete by setting isActive to false instead of actual deletion
    await prisma.service.update({
      where: { id: validatedData.id },
      data: { 
        isActive: false,
        status: 'DISCONTINUED',
      },
    })

    // revalidatePath('/services') // Removed to avoid client component issues
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete service error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to delete service' }
  }
}

/**
 * Get services by category for quotations
 */
export async function getServicesByCategoryAction(category?: string): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Build where clause
    const where: any = {
      tenantId,
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    // Get services
    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        unit: true,
        serviceType: true,
        availability: true,
        maxQuantity: true,
        minimumOrder: true,
        pricingTiers: true,
        dynamicPricing: true,
        metadata: true,
        tags: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Serialize pricing data
    const serializedServices = services.map(service => ({
      ...service,
      price: service.price ? Number(service.price) : 0,
      pricingTiers: service.pricingTiers ? JSON.parse(service.pricingTiers as string) : [],
      metadata: service.metadata ? JSON.parse(service.metadata as string) : {},
      tags: service.tags ? JSON.parse(service.tags as string) : [],
    }))

    return { 
      success: true, 
      data: serializedServices 
    }

  } catch (error: any) {
    console.error('Error getting services by category:', error)
    return { success: false, error: error.message || 'Failed to get services' }
  }
}

/**
 * Get service packages for quotations
 */
export async function getServicePackagesAction(): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Get service packages (services with package configurations)
    const packages = await prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
        serviceType: 'SUBSCRIPTION',
        pricingTiers: {
          not: '[]'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price: true,
        unit: true,
        pricingTiers: true,
        metadata: true,
        tags: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Serialize and format packages
    const serializedPackages = packages.map(pkg => ({
      ...pkg,
      price: pkg.price ? Number(pkg.price) : 0,
      pricingTiers: pkg.pricingTiers ? JSON.parse(pkg.pricingTiers as string) : [],
      metadata: pkg.metadata ? JSON.parse(pkg.metadata as string) : {},
      tags: pkg.tags ? JSON.parse(pkg.tags as string) : [],
    }))

    return { 
      success: true, 
      data: serializedPackages 
    }

  } catch (error: any) {
    console.error('Error getting service packages:', error)
    return { success: false, error: error.message || 'Failed to get service packages' }
  }
}

/**
 * Create predefined coworking services
 */
export async function createCoworkingServicesAction(): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    const predefinedServices = [
      {
        name: 'Oficina Virtual - Plan Mensual',
        description: 'Domicilio comercial, recepción de correspondencia, y acceso a salas de reuniones',
        category: 'BUSINESS_SUPPORT',
        serviceType: 'SUBSCRIPTION',
        price: 50000,
        unit: 'month',
        availability: 'ALWAYS',
        pricingTiers: [
          { minQuantity: 1, price: 50000, discountType: 'NONE' },
          { minQuantity: 6, price: 45000, discountType: 'TIER_PRICE' },
          { minQuantity: 12, price: 40000, discountType: 'TIER_PRICE' },
        ],
        metadata: {
          includes: ['Domicilio comercial', 'Recepción de correspondencia', '2 horas de sala de reuniones'],
          duration: 'monthly',
          renewable: true,
        },
        tags: ['virtual', 'office', 'monthly', 'business'],
      },
      {
        name: 'Oficina Virtual - Plan Anual',
        description: 'Domicilio comercial, recepción de correspondencia, y acceso a salas de reuniones - Plan anual con descuento',
        category: 'BUSINESS_SUPPORT',
        serviceType: 'SUBSCRIPTION',
        price: 480000,
        unit: 'year',
        availability: 'ALWAYS',
        pricingTiers: [
          { minQuantity: 1, price: 480000, discountType: 'NONE' },
        ],
        metadata: {
          includes: ['Domicilio comercial', 'Recepción de correspondencia', '24 horas de sala de reuniones'],
          duration: 'yearly',
          renewable: true,
          discount: '20% vs plan mensual',
        },
        tags: ['virtual', 'office', 'annual', 'business', 'discount'],
      },
      {
        name: 'Puesto de Trabajo - Día',
        description: 'Acceso a puesto de trabajo por día completo',
        category: 'STORAGE',
        serviceType: 'CONSUMABLE',
        price: 15000,
        unit: 'day',
        availability: 'BUSINESS_HOURS',
        pricingTiers: [
          { minQuantity: 1, price: 15000, discountType: 'NONE' },
          { minQuantity: 5, discount: 10, discountType: 'PERCENTAGE' },
          { minQuantity: 10, discount: 15, discountType: 'PERCENTAGE' },
        ],
        metadata: {
          includes: ['Puesto de trabajo', 'Internet WiFi', 'Café básico'],
          duration: 'daily',
          workingHours: '8:00 - 20:00',
        },
        tags: ['hotdesk', 'daily', 'flexible'],
      },
      {
        name: 'Puesto de Trabajo - Mensual',
        description: 'Acceso ilimitado a puesto de trabajo por mes',
        category: 'STORAGE',
        serviceType: 'SUBSCRIPTION',
        price: 200000,
        unit: 'month',
        availability: 'BUSINESS_HOURS',
        pricingTiers: [
          { minQuantity: 1, price: 200000, discountType: 'NONE' },
          { minQuantity: 3, price: 180000, discountType: 'TIER_PRICE' },
          { minQuantity: 6, price: 160000, discountType: 'TIER_PRICE' },
        ],
        metadata: {
          includes: ['Puesto de trabajo dedicado', 'Internet WiFi', 'Café ilimitado', 'Casillero'],
          duration: 'monthly',
          renewable: true,
        },
        tags: ['hotdesk', 'monthly', 'dedicated'],
      },
      {
        name: 'Sala de Reuniones - Por Hora',
        description: 'Reserva de sala de reuniones equipada',
        category: 'EVENT_SERVICES',
        serviceType: 'ON_DEMAND',
        price: 25000,
        unit: 'hour',
        availability: 'BUSINESS_HOURS',
        maxQuantity: 8,
        minimumOrder: 1,
        pricingTiers: [
          { minQuantity: 1, price: 25000, discountType: 'NONE' },
          { minQuantity: 4, discount: 10, discountType: 'PERCENTAGE' },
          { minQuantity: 8, discount: 20, discountType: 'PERCENTAGE' },
        ],
        metadata: {
          includes: ['Sala equipada', 'Proyector', 'Pizarra', 'Café para asistentes'],
          capacity: '8 personas',
          equipment: ['Proyector', 'Pizarra', 'Sistema de audio'],
        },
        tags: ['meeting', 'room', 'hourly', 'equipped'],
      },
      {
        name: 'Oficina Privada - Mensual',
        description: 'Oficina privada completamente equipada',
        category: 'STORAGE',
        serviceType: 'SUBSCRIPTION',
        price: 800000,
        unit: 'month',
        availability: 'ALWAYS',
        pricingTiers: [
          { minQuantity: 1, price: 800000, discountType: 'NONE' },
          { minQuantity: 6, price: 750000, discountType: 'TIER_PRICE' },
          { minQuantity: 12, price: 700000, discountType: 'TIER_PRICE' },
        ],
        metadata: {
          includes: ['Oficina privada', 'Muebles completos', 'Internet dedicado', 'Teléfono', 'Limpieza'],
          size: '15m²',
          capacity: '4 personas',
          features: ['Ventana', 'Aire acondicionado', 'Acceso 24/7'],
        },
        tags: ['private', 'office', 'monthly', 'premium'],
      },
      {
        name: 'Casillero Postal',
        description: 'Servicio de casillero postal y manejo de correspondencia',
        category: 'MAIL',
        serviceType: 'SUBSCRIPTION',
        price: 20000,
        unit: 'month',
        availability: 'BUSINESS_HOURS',
        pricingTiers: [
          { minQuantity: 1, price: 20000, discountType: 'NONE' },
          { minQuantity: 12, price: 18000, discountType: 'TIER_PRICE' },
        ],
        metadata: {
          includes: ['Casillero postal', 'Recepción de correspondencia', 'Notificaciones'],
          duration: 'monthly',
          renewable: true,
        },
        tags: ['mail', 'postal', 'monthly', 'business'],
      },
      {
        name: 'Impresión B&N',
        description: 'Servicio de impresión en blanco y negro',
        category: 'PRINTING',
        serviceType: 'CONSUMABLE',
        price: 50,
        unit: 'page',
        availability: 'BUSINESS_HOURS',
        pricingTiers: [
          { minQuantity: 1, price: 50, discountType: 'NONE' },
          { minQuantity: 100, discount: 10, discountType: 'PERCENTAGE' },
          { minQuantity: 500, discount: 20, discountType: 'PERCENTAGE' },
        ],
        metadata: {
          paperSizes: ['A4', 'Letter'],
          quality: 'Estándar',
          delivery: 'Inmediato',
        },
        tags: ['printing', 'bw', 'consumable'],
      },
      {
        name: 'Impresión Color',
        description: 'Servicio de impresión a color',
        category: 'PRINTING',
        serviceType: 'CONSUMABLE',
        price: 200,
        unit: 'page',
        availability: 'BUSINESS_HOURS',
        pricingTiers: [
          { minQuantity: 1, price: 200, discountType: 'NONE' },
          { minQuantity: 50, discount: 10, discountType: 'PERCENTAGE' },
          { minQuantity: 200, discount: 20, discountType: 'PERCENTAGE' },
        ],
        metadata: {
          paperSizes: ['A4', 'Letter'],
          quality: 'Alta calidad',
          delivery: 'Inmediato',
        },
        tags: ['printing', 'color', 'consumable'],
      },
      {
        name: 'Parking Mensual',
        description: 'Estacionamiento mensual asegurado',
        category: 'PARKING',
        serviceType: 'SUBSCRIPTION',
        price: 80000,
        unit: 'month',
        availability: 'ALWAYS',
        pricingTiers: [
          { minQuantity: 1, price: 80000, discountType: 'NONE' },
          { minQuantity: 6, price: 75000, discountType: 'TIER_PRICE' },
        ],
        metadata: {
          includes: ['Estacionamiento asegurado', 'Acceso 24/7', 'Vigilancia'],
          duration: 'monthly',
          renewable: true,
        },
        tags: ['parking', 'monthly', 'secure'],
      },
    ]

    // Check which services already exist to avoid duplicates
    const existingServices = await prisma.service.findMany({
      where: {
        tenantId,
        name: {
          in: predefinedServices.map(s => s.name)
        }
      },
      select: { name: true }
    })

    const existingServiceNames = new Set(existingServices.map(s => s.name))
    const servicesToCreate = predefinedServices.filter(s => !existingServiceNames.has(s.name))

    // Create only non-existing services
    const createdServices = []
    for (const serviceData of servicesToCreate) {
      const service = await prisma.service.create({
        data: {
          tenantId,
          name: serviceData.name,
          description: serviceData.description,
          category: serviceData.category as any,
          serviceType: serviceData.serviceType as any,
          price: serviceData.price,
          unit: serviceData.unit,
          availability: serviceData.availability as any,
          maxQuantity: serviceData.maxQuantity,
          minimumOrder: serviceData.minimumOrder,
          pricingTiers: JSON.stringify(serviceData.pricingTiers),
          metadata: JSON.stringify(serviceData.metadata),
          tags: JSON.stringify(serviceData.tags),
          isActive: true,
        },
      })
      createdServices.push(service)
    }

    // Build response message
    const totalPredefined = predefinedServices.length
    const alreadyExisting = existingServices.length
    const newlyCreated = createdServices.length

    let message = ''
    if (newlyCreated > 0 && alreadyExisting > 0) {
      message = `${newlyCreated} servicios nuevos creados, ${alreadyExisting} ya existían`
    } else if (newlyCreated > 0) {
      message = `${newlyCreated} servicios predefinidos creados exitosamente`
    } else {
      message = `Todos los servicios predefinidos (${totalPredefined}) ya existen`
    }

    // revalidatePath('/services') // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        created: createdServices,
        existing: existingServices,
        summary: {
          total: totalPredefined,
          created: newlyCreated,
          existing: alreadyExisting
        }
      },
      message 
    }

  } catch (error: any) {
    console.error('Error creating predefined services:', error)
    return { success: false, error: error.message || 'Failed to create predefined services' }
  }
}

/**
 * Delete all services for the current tenant (for development/testing)
 */
export async function deleteAllServicesAction(): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId

    // Delete all services for this tenant
    const result = await prisma.service.deleteMany({
      where: { tenantId }
    })

    return { 
      success: true, 
      data: { deletedCount: result.count },
      message: `${result.count} servicios eliminados exitosamente` 
    }

  } catch (error: any) {
    console.error('Error deleting all services:', error)
    return { success: false, error: error.message || 'Failed to delete all services' }
  }
}

/**
 * Get a service by ID
 */
export async function getServiceAction(data: GetServiceRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = getServiceSchema.parse(data)

    // Get service
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.id,
        tenantId,
      },
      include: {
        tenant: true,
      },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }
    
    return { 
      success: true, 
      data: {
        ...service,
        pricing: safeJsonParse(service.pricing),
        availability: safeJsonParse(service.availability),
        requirements: safeJsonParse(service.requirements),
        images: safeJsonParse(service.images, []),
        tags: safeJsonParse(service.tags, []),
        duration: safeJsonParse(service.duration),
        metadata: safeJsonParse(service.metadata),
      }
    }
  } catch (error: any) {
    console.error('Get service error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get service' }
  }
}

/**
 * List services with filtering and pagination
 */
export async function listServicesAction(data: ListServicesRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = listServicesSchema.parse(data)

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (validatedData.search) {
      where.OR = [
        { name: { contains: validatedData.search, mode: 'insensitive' } },
        { description: { contains: validatedData.search, mode: 'insensitive' } },
      ]
    }

    if (validatedData.type) {
      where.type = validatedData.type
    }

    if (validatedData.category) {
      where.category = validatedData.category
    }

    if (validatedData.status) {
      where.status = validatedData.status
    }

    if (validatedData.priceRange) {
      // Note: This assumes basePrice is stored in the pricing JSON
      // In a real implementation, you might want to extract common pricing fields
      if (validatedData.priceRange.min || validatedData.priceRange.max) {
        // This is a simplified approach - in production you'd need proper JSON querying
        where.pricing = { not: null }
      }
    }

    if (validatedData.isActive !== undefined) {
      where.isActive = validatedData.isActive
    }

    if (validatedData.isBookable !== undefined) {
      where.isBookable = validatedData.isBookable
    }

    // Build order by
    const orderBy: any = {}
    orderBy[validatedData.sortBy] = validatedData.sortOrder

    // Get total count
    const total = await prisma.service.count({ where })

    // Get services
    const services = await prisma.service.findMany({
      where,
      orderBy,
      skip: (validatedData.page - 1) * validatedData.limit,
      take: validatedData.limit,
      include: {
        tenant: true,
      },
    })

    // Process JSON fields safely
    const processedServices = services.map(service => ({
      ...service,
      pricing: safeJsonParse(service.pricing),
      availability: safeJsonParse(service.availability),
      requirements: safeJsonParse(service.requirements),
      images: safeJsonParse(service.images, []),
      tags: safeJsonParse(service.tags, []),
      duration: safeJsonParse(service.duration),
      metadata: safeJsonParse(service.metadata),
    }))
    
    return { 
      success: true, 
      data: {
        services: processedServices,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total,
          pages: Math.ceil(total / validatedData.limit),
        },
      }
    }
  } catch (error: any) {
    console.error('List services error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to list services' }
  }
}

/**
 * Check service availability for a specific date/time
 */
export async function checkServiceAvailabilityAction(data: CheckServiceAvailabilityRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = checkServiceAvailabilitySchema.parse(data)

    // Check if service exists and belongs to tenant
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        tenantId,
        isActive: true,
        isBookable: true,
      },
    })

    if (!service) {
      return { success: false, error: 'Service not found or not bookable' }
    }

    // Parse availability rules
    const availability = safeJsonParse(service.availability)
    
    // Check basic availability
    let isAvailable = true
    const issues: string[] = []

    if (availability && !availability.isAlwaysAvailable) {
      const requestedDay = validatedData.date.getDay() // 0 = Sunday, 6 = Saturday
      
      // Check day availability
      if (availability.availableDays && !availability.availableDays.includes(requestedDay)) {
        isAvailable = false
        issues.push('Service not available on this day of week')
      }

      // Check time availability (if time is specified)
      if (validatedData.startTime && availability.availableHours) {
        const [startHour, startMinute] = validatedData.startTime.split(':').map(Number)
        const requestedMinutes = startHour * 60 + startMinute
        
        const [availStartHour, availStartMinute] = availability.availableHours.start.split(':').map(Number)
        const [availEndHour, availEndMinute] = availability.availableHours.end.split(':').map(Number)
        const availableStartMinutes = availStartHour * 60 + availStartMinute
        const availableEndMinutes = availEndHour * 60 + availEndMinute
        
        if (requestedMinutes < availableStartMinutes || requestedMinutes > availableEndMinutes) {
          isAvailable = false
          issues.push(`Service only available between ${availability.availableHours.start} and ${availability.availableHours.end}`)
        }
      }

      // Check blackout dates
      if (availability.blackoutDates) {
        const isBlackedOut = availability.blackoutDates.some((blackout: any) => {
          const blackoutStart = new Date(blackout.start)
          const blackoutEnd = new Date(blackout.end)
          return validatedData.date >= blackoutStart && validatedData.date <= blackoutEnd
        })
        
        if (isBlackedOut) {
          isAvailable = false
          issues.push('Service not available during this period')
        }
      }

      // Check advance booking requirements
      if (availability.advanceBookingRequired) {
        const now = new Date()
        const requiredAdvanceMs = availability.advanceBookingRequired * 60 * 60 * 1000 // hours to milliseconds
        const requestedTime = validatedData.date.getTime()
        
        if (requestedTime - now.getTime() < requiredAdvanceMs) {
          isAvailable = false
          issues.push(`Service requires ${availability.advanceBookingRequired} hours advance booking`)
        }
      }

      // Check maximum advance booking
      if (availability.maxAdvanceBookingDays) {
        const now = new Date()
        const maxAdvanceMs = availability.maxAdvanceBookingDays * 24 * 60 * 60 * 1000 // days to milliseconds
        const requestedTime = validatedData.date.getTime()
        
        if (requestedTime - now.getTime() > maxAdvanceMs) {
          isAvailable = false
          issues.push(`Service can only be booked up to ${availability.maxAdvanceBookingDays} days in advance`)
        }
      }
    }

    // Check capacity if service has limits
    if (availability?.capacityLimit && validatedData.quantity > availability.capacityLimit) {
      isAvailable = false
      issues.push(`Requested quantity (${validatedData.quantity}) exceeds service capacity (${availability.capacityLimit})`)
    }

    // Check space compatibility if space is specified
    if (validatedData.spaceId) {
      const space = await prisma.space.findFirst({
        where: {
          id: validatedData.spaceId,
          tenantId,
          isActive: true,
        },
      })

      if (!space) {
        isAvailable = false
        issues.push('Specified space not found or not available')
      } else {
        const requirements = safeJsonParse(service.requirements)
        
        if (requirements) {
          // Check space type compatibility
          if (requirements.spaceTypes && !requirements.spaceTypes.includes(space.type)) {
            isAvailable = false
            issues.push(`Service not compatible with space type: ${space.type}`)
          }

          // Check minimum capacity
          if (requirements.minimumSpaceCapacity && space.capacity < requirements.minimumSpaceCapacity) {
            isAvailable = false
            issues.push(`Space capacity (${space.capacity}) below minimum required (${requirements.minimumSpaceCapacity})`)
          }
        }
      }
    }

    return { 
      success: true, 
      data: {
        isAvailable,
        issues,
        service: {
          id: service.id,
          name: service.name,
          type: service.type,
          category: service.category,
          status: service.status,
        },
        requestedDate: validatedData.date,
        requestedTime: validatedData.startTime,
        quantity: validatedData.quantity,
      }
    }
  } catch (error: any) {
    console.error('Check service availability error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to check service availability' }
  }
}

/**
 * Bulk update services
 */
export async function bulkUpdateServicesAction(data: BulkUpdateServicesRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = bulkUpdateServicesSchema.parse(data)

    // Check if all services exist and belong to tenant
    const existingServices = await prisma.service.findMany({
      where: {
        id: { in: validatedData.serviceIds },
        tenantId,
      },
      select: { id: true },
    })

    if (existingServices.length !== validatedData.serviceIds.length) {
      return { success: false, error: 'One or more services not found' }
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.updates.status) updateData.status = validatedData.updates.status
    if (validatedData.updates.category) updateData.category = validatedData.updates.category
    if (validatedData.updates.isActive !== undefined) updateData.isActive = validatedData.updates.isActive
    if (validatedData.updates.isBookable !== undefined) updateData.isBookable = validatedData.updates.isBookable
    if (validatedData.updates.requiresApproval !== undefined) updateData.requiresApproval = validatedData.updates.requiresApproval
    if (validatedData.updates.metadata) updateData.metadata = JSON.stringify(validatedData.updates.metadata)

    // Update pricing if specified
    if (validatedData.updates.basePrice !== undefined) {
      // This is a simplified approach - in production you'd need more sophisticated JSON updates
      const services = await prisma.service.findMany({
        where: { id: { in: validatedData.serviceIds } },
        select: { id: true, pricing: true },
      })

      // Update each service individually to modify pricing
      for (const service of services) {
        const pricing = safeJsonParse(service.pricing, {})
        pricing.basePrice = validatedData.updates.basePrice
        
        await prisma.service.update({
          where: { id: service.id },
          data: {
            ...updateData,
            pricing: JSON.stringify(pricing),
          },
        })
      }
    } else {
      // Bulk update without pricing changes
      await prisma.service.updateMany({
        where: {
          id: { in: validatedData.serviceIds },
          tenantId,
        },
        data: updateData,
      })
    }

    // revalidatePath('/services') // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        updatedCount: validatedData.serviceIds.length,
        serviceIds: validatedData.serviceIds,
      }
    }
  } catch (error: any) {
    console.error('Bulk update services error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to bulk update services' }
  }
}

/**
 * Get service statistics
 */
export async function getServiceStatsAction(data: GetServiceStatsRequest = {}): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = getServiceStatsSchema.parse(data)

    // Build date range
    const startDate = validatedData.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = validatedData.endDate || new Date()

    // Get service usage from booking services
    const serviceUsage = await prisma.$queryRaw`
      SELECT 
        s.id as serviceId,
        s.name,
        s.type,
        s.category,
        COUNT(bs.id) as bookingCount,
        SUM(bs.quantity) as totalQuantity,
        SUM(bs.totalPrice) as totalRevenue
      FROM "Service" s
      LEFT JOIN "BookingService" bs ON s.id = bs.serviceId
      LEFT JOIN "Booking" b ON bs.bookingId = b.id
      WHERE s.tenantId = ${tenantId}
        ${validatedData.serviceId ? `AND s.id = ${validatedData.serviceId}` : ''}
        AND (b.startTime IS NULL OR b.startTime >= ${startDate})
        AND (b.endTime IS NULL OR b.endTime <= ${endDate})
      GROUP BY s.id, s.name, s.type, s.category
      ORDER BY totalRevenue DESC NULLS LAST
    ` as any[]

    return { 
      success: true, 
      data: {
        stats: serviceUsage.map(stat => ({
          service: {
            id: stat.serviceid,
            name: stat.name,
            type: stat.type,
            category: stat.category,
          },
          bookingCount: Number(stat.bookingcount) || 0,
          totalQuantity: Number(stat.totalquantity) || 0,
          totalRevenue: Number(stat.totalrevenue) || 0,
        })),
        period: {
          startDate,
          endDate,
          groupBy: validatedData.groupBy,
        },
      }
    }
  } catch (error: any) {
    console.error('Get service stats error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to get service statistics' }
  }
}

/**
 * Calculate service pricing
 */
export async function calculateServicePricingAction(data: CalculateServicePricingRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = calculateServicePricingSchema.parse(data)

    // Get service details
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        tenantId,
        isActive: true,
      },
    })

    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // Parse pricing configuration
    const pricing = safeJsonParse(service.pricing)

    if (!pricing) {
      return { success: false, error: 'Service pricing not configured' }
    }

    let finalPrice = 0
    let breakdown: any = {
      basePrice: pricing.basePrice,
      quantity: validatedData.quantity,
      subtotal: 0,
      fees: [],
      discounts: [],
      total: 0,
    }

    // Calculate base pricing
    switch (pricing.pricingModel) {
      case 'FIXED':
        finalPrice = pricing.basePrice
        break
      
      case 'PER_ITEM':
      case 'PER_PERSON':
        finalPrice = pricing.basePrice * validatedData.quantity
        break
      
      case 'HOURLY':
        const duration = validatedData.duration || 1
        finalPrice = pricing.basePrice * duration * validatedData.quantity
        breakdown.duration = duration
        break
      
      case 'DAILY':
        finalPrice = pricing.basePrice * validatedData.quantity
        break
      
      case 'CUSTOM':
        // Apply pricing tiers if available
        if (pricing.tiers && pricing.tiers.length > 0) {
          const applicableTier = pricing.tiers
            .filter((tier: any) => 
              validatedData.quantity >= tier.minQuantity && 
              (!tier.maxQuantity || validatedData.quantity <= tier.maxQuantity)
            )
            .sort((a: any, b: any) => b.minQuantity - a.minQuantity)[0]
          
          if (applicableTier) {
            finalPrice = applicableTier.pricePerUnit * validatedData.quantity
            
            if (applicableTier.discountPercentage) {
              const discount = (finalPrice * applicableTier.discountPercentage) / 100
              breakdown.discounts.push({
                type: 'tier_discount',
                percentage: applicableTier.discountPercentage,
                amount: discount,
              })
              finalPrice -= discount
            }
          } else {
            finalPrice = pricing.basePrice * validatedData.quantity
          }
        } else {
          finalPrice = pricing.basePrice * validatedData.quantity
        }
        break
      
      default:
        finalPrice = pricing.basePrice * validatedData.quantity
    }

    breakdown.subtotal = finalPrice

    // Apply setup fee
    if (pricing.setupFee) {
      breakdown.fees.push({
        type: 'setup_fee',
        amount: pricing.setupFee,
      })
      finalPrice += pricing.setupFee
    }

    // Apply minimum/maximum charges
    if (pricing.minimumCharge && finalPrice < pricing.minimumCharge) {
      const minimumAdjustment = pricing.minimumCharge - finalPrice
      breakdown.fees.push({
        type: 'minimum_charge_adjustment',
        amount: minimumAdjustment,
      })
      finalPrice = pricing.minimumCharge
    }

    if (pricing.maximumCharge && finalPrice > pricing.maximumCharge) {
      const maximumAdjustment = finalPrice - pricing.maximumCharge
      breakdown.discounts.push({
        type: 'maximum_charge_cap',
        amount: maximumAdjustment,
      })
      finalPrice = pricing.maximumCharge
    }

    breakdown.total = finalPrice

    // Create line item for integration with pricing calculator
    const lineItems = [{
      id: service.id,
      description: `${service.name} x ${validatedData.quantity}`,
      quantity: validatedData.quantity,
      unitPrice: breakdown.total / validatedData.quantity,
      category: 'service',
      serviceId: service.id,
    }]

    // Build pricing context for potential discounts
    const context = {
      clientId: validatedData.clientId || 'anonymous',
      serviceTypes: [service.type],
      discountCodes: validatedData.discountCodes || [],
      date: validatedData.date,
    }

    // Use pricing calculator for additional discounts/taxes
    const calculator = new PricingCalculator([], [], [])
    const finalPricing = calculator.calculatePricing(lineItems, context)

    return { 
      success: true, 
      data: {
        service: {
          id: service.id,
          name: service.name,
          type: service.type,
          category: service.category,
          pricingModel: pricing.pricingModel,
        },
        quantity: validatedData.quantity,
        duration: validatedData.duration,
        breakdown,
        finalPricing,
        calculatedPrice: finalPricing.total,
      }
    }
  } catch (error: any) {
    console.error('Calculate service pricing error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to calculate service pricing' }
  }
}

/**
 * Create a service package
 */
export async function createServicePackageAction(data: CreateServicePackageRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = createServicePackageSchema.parse(data)

    // Verify all services exist and belong to tenant
    const serviceIds = validatedData.services.map(s => s.serviceId)
    const existingServices = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        tenantId,
        isActive: true,
      },
      select: { id: true, name: true },
    })

    if (existingServices.length !== serviceIds.length) {
      return { success: false, error: 'One or more services not found' }
    }

    // Create service package
    const servicePackage = await prisma.servicePackage.create({
      data: {
        ...validatedData,
        tenantId,
        services: JSON.stringify(validatedData.services),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      include: {
        tenant: true,
      },
    })

    // revalidatePath('/services/packages') // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        ...servicePackage,
        services: JSON.parse(servicePackage.services),
        metadata: servicePackage.metadata ? JSON.parse(servicePackage.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Create service package error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to create service package' }
  }
}

/**
 * Update a service package
 */
export async function updateServicePackageAction(data: UpdateServicePackageRequest): Promise<ActionResult<any>> {
  try {
    // Get current user and validate auth
    const user = await getUserWithTenant()
    const tenantId = user.tenantId
    if (!tenantId) {
      return { success: false, error: 'Tenant context required' }
    }

    // Validate input data
    const validatedData = updateServicePackageSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if package exists and belongs to tenant
    const existingPackage = await prisma.servicePackage.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!existingPackage) {
      return { success: false, error: 'Service package not found' }
    }

    // Verify services if being updated
    if (updateData.services) {
      const serviceIds = updateData.services.map(s => s.serviceId)
      const existingServices = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          tenantId,
          isActive: true,
        },
        select: { id: true },
      })

      if (existingServices.length !== serviceIds.length) {
        return { success: false, error: 'One or more services not found' }
      }
    }

    // Prepare update data
    const processedUpdateData: any = { ...updateData }
    if (updateData.services) {
      processedUpdateData.services = JSON.stringify(updateData.services)
    }
    if (updateData.metadata) {
      processedUpdateData.metadata = JSON.stringify(updateData.metadata)
    }

    // Update service package
    const servicePackage = await prisma.servicePackage.update({
      where: { id },
      data: processedUpdateData,
      include: {
        tenant: true,
      },
    })

    // revalidatePath('/services/packages') // Removed to avoid client component issues
    // revalidatePath(`/services/packages/${id}`) // Removed to avoid client component issues
    
    return { 
      success: true, 
      data: {
        ...servicePackage,
        services: JSON.parse(servicePackage.services),
        metadata: servicePackage.metadata ? JSON.parse(servicePackage.metadata) : null,
      }
    }
  } catch (error: any) {
    console.error('Update service package error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {}),
      }
    }

    return { success: false, error: 'Failed to update service package' }
  }
}