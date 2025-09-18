'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/server/auth'
import { prisma } from '@/lib/server/prisma'
import {
  createSpaceTypeConfigSchema,
  updateSpaceTypeConfigSchema,
  deleteSpaceTypeConfigSchema,
  getSpaceTypeConfigSchema,
  listSpaceTypeConfigsSchema,
  createDefaultSpaceTypesSchema,
  DEFAULT_SPACE_TYPES,
  type CreateSpaceTypeConfigRequest,
  type UpdateSpaceTypeConfigRequest,
  type DeleteSpaceTypeConfigRequest,
  type GetSpaceTypeConfigRequest,
  type ListSpaceTypeConfigsRequest,
  type CreateDefaultSpaceTypesRequest,
} from '@/lib/validations/space-type'

// Create space type configuration
export async function createSpaceTypeConfigAction(data: CreateSpaceTypeConfigRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = createSpaceTypeConfigSchema.parse(data)

    // Check if key already exists for this tenant
    const existingType = await prisma.spaceTypeConfig.findUnique({
      where: {
        tenantId_key: {
          tenantId: user.tenantId,
          key: validatedData.key,
        },
      },
    })

    if (existingType) {
      return { success: false, error: 'Ya existe un tipo de espacio con esta clave' }
    }

    // Check if name already exists for this tenant
    const existingName = await prisma.spaceTypeConfig.findUnique({
      where: {
        tenantId_name: {
          tenantId: user.tenantId,
          name: validatedData.name,
        },
      },
    })

    if (existingName) {
      return { success: false, error: 'Ya existe un tipo de espacio con este nombre' }
    }

    const spaceTypeConfig = await prisma.spaceTypeConfig.create({
      data: {
        ...validatedData,
        tenantId: user.tenantId,
      },
    })

    revalidatePath('/admin/space-types')
    revalidatePath('/spaces')

    return { success: true, data: spaceTypeConfig }
  } catch (error) {
    console.error('Error creating space type config:', error)
    return { success: false, error: 'Error al crear el tipo de espacio' }
  }
}

// Update space type configuration
export async function updateSpaceTypeConfigAction(data: UpdateSpaceTypeConfigRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = updateSpaceTypeConfigSchema.parse(data)
    const { id, ...updateData } = validatedData

    // Check if the space type exists and belongs to the tenant
    const existingType = await prisma.spaceTypeConfig.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!existingType) {
      return { success: false, error: 'Tipo de espacio no encontrado' }
    }

    // Check if trying to update key and it already exists
    if (updateData.key && updateData.key !== existingType.key) {
      const keyExists = await prisma.spaceTypeConfig.findUnique({
        where: {
          tenantId_key: {
            tenantId: user.tenantId,
            key: updateData.key,
          },
        },
      })

      if (keyExists) {
        return { success: false, error: 'Ya existe un tipo de espacio con esta clave' }
      }
    }

    // Check if trying to update name and it already exists
    if (updateData.name && updateData.name !== existingType.name) {
      const nameExists = await prisma.spaceTypeConfig.findUnique({
        where: {
          tenantId_name: {
            tenantId: user.tenantId,
            name: updateData.name,
          },
        },
      })

      if (nameExists) {
        return { success: false, error: 'Ya existe un tipo de espacio con este nombre' }
      }
    }

    const spaceTypeConfig = await prisma.spaceTypeConfig.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/admin/space-types')
    revalidatePath('/spaces')

    return { success: true, data: spaceTypeConfig }
  } catch (error) {
    console.error('Error updating space type config:', error)
    return { success: false, error: 'Error al actualizar el tipo de espacio' }
  }
}

// Delete space type configuration
export async function deleteSpaceTypeConfigAction(data: DeleteSpaceTypeConfigRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = deleteSpaceTypeConfigSchema.parse(data)

    // Check if the space type exists and belongs to the tenant
    const existingType = await prisma.spaceTypeConfig.findFirst({
      where: {
        id: validatedData.id,
        tenantId: user.tenantId,
      },
    })

    if (!existingType) {
      return { success: false, error: 'Tipo de espacio no encontrado' }
    }

    // Check if any spaces are using this type
    const spacesUsingType = await prisma.space.count({
      where: {
        tenantId: user.tenantId,
        type: existingType.key as any, // Cast to SpaceType enum
      },
    })

    if (spacesUsingType > 0) {
      return {
        success: false,
        error: `No se puede eliminar este tipo de espacio porque ${spacesUsingType} espacio(s) lo están utilizando`
      }
    }

    await prisma.spaceTypeConfig.delete({
      where: { id: validatedData.id },
    })

    revalidatePath('/admin/space-types')
    revalidatePath('/spaces')

    return { success: true }
  } catch (error) {
    console.error('Error deleting space type config:', error)
    return { success: false, error: 'Error al eliminar el tipo de espacio' }
  }
}

// Get single space type configuration
export async function getSpaceTypeConfigAction(data: GetSpaceTypeConfigRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = getSpaceTypeConfigSchema.parse(data)

    const spaceTypeConfig = await prisma.spaceTypeConfig.findFirst({
      where: {
        id: validatedData.id,
        tenantId: user.tenantId,
      },
    })

    if (!spaceTypeConfig) {
      return { success: false, error: 'Tipo de espacio no encontrado' }
    }

    return { success: true, data: spaceTypeConfig }
  } catch (error) {
    console.error('Error getting space type config:', error)
    return { success: false, error: 'Error al obtener el tipo de espacio' }
  }
}

// List space type configurations
export async function listSpaceTypeConfigsAction(data: ListSpaceTypeConfigsRequest = {}) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = listSpaceTypeConfigsSchema.parse(data)
    const { page, limit, search, isActive, sortBy, sortOrder } = validatedData

    const skip = (page - 1) * limit

    const where = {
      tenantId: user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    }

    const [spaceTypeConfigs, totalCount] = await Promise.all([
      prisma.spaceTypeConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.spaceTypeConfig.count({ where }),
    ])

    return {
      success: true,
      data: {
        spaceTypeConfigs,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  } catch (error) {
    console.error('Error listing space type configs:', error)
    return { success: false, error: 'Error al listar los tipos de espacio' }
  }
}

// Create default space types for a tenant
export async function createDefaultSpaceTypesAction(data: CreateDefaultSpaceTypesRequest = {}) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const validatedData = createDefaultSpaceTypesSchema.parse(data)

    // If overwrite is false, check if any default types already exist
    if (!validatedData.overwrite) {
      const existingDefaultTypes = await prisma.spaceTypeConfig.count({
        where: {
          tenantId: user.tenantId,
          isDefault: true,
        },
      })

      if (existingDefaultTypes > 0) {
        return { success: false, error: 'Ya existen tipos de espacio por defecto para este tenant' }
      }
    }

    // If overwrite is true, delete existing default types
    if (validatedData.overwrite) {
      await prisma.spaceTypeConfig.deleteMany({
        where: {
          tenantId: user.tenantId,
          isDefault: true,
        },
      })
    }

    // Create default space types
    const defaultTypes = DEFAULT_SPACE_TYPES.map(type => ({
      ...type,
      tenantId: user.tenantId,
    }))

    const createdTypes = await prisma.spaceTypeConfig.createMany({
      data: defaultTypes,
    })

    revalidatePath('/admin/space-types')
    revalidatePath('/spaces')

    return { success: true, data: { count: createdTypes.count } }
  } catch (error) {
    console.error('Error creating default space types:', error)
    return { success: false, error: 'Error al crear los tipos de espacio por defecto' }
  }
}

// Get space types for form select options
export async function getSpaceTypeOptionsAction() {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    const spaceTypeConfigs = await prisma.spaceTypeConfig.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true,
        name: true,
        icon: true,
        color: true,
      },
    })

    return { success: true, data: spaceTypeConfigs }
  } catch (error) {
    console.error('Error getting space type options:', error)
    return { success: false, error: 'Error al obtener las opciones de tipos de espacio' }
  }
}

// Update space types sort order
export async function updateSpaceTypesSortOrderAction(data: { items: { id: string; sortOrder: number }[] }) {
  try {
    const user = await getCurrentUser()
    if (!user?.tenantId) {
      return { success: false, error: 'No autorizado' }
    }

    // Validate that all items belong to the current tenant
    const existingTypes = await prisma.spaceTypeConfig.findMany({
      where: {
        tenantId: user.tenantId,
        id: { in: data.items.map(item => item.id) }
      },
      select: { id: true }
    })

    if (existingTypes.length !== data.items.length) {
      return { success: false, error: 'Algunos tipos de espacio no pertenecen a tu organización' }
    }

    // Update each space type with its new sort order
    await Promise.all(
      data.items.map(item =>
        prisma.spaceTypeConfig.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    )

    revalidatePath('/admin/space-types')

    return { success: true, message: 'Orden actualizado exitosamente' }
  } catch (error) {
    console.error('Error updating space types sort order:', error)
    return { success: false, error: 'Error al actualizar el orden de los tipos de espacio' }
  }
}