import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCoworks() {
  try {
    console.log('🌱 Seeding coworks...')

    // Create sample coworks/tenants
    const coworks = await Promise.all([
      prisma.tenant.upsert({
        where: { slug: 'sweetspot-central' },
        update: {},
        create: {
          name: 'SweetSpot Central',
          slug: 'sweetspot-central',
          description: 'Cowork principal en el centro de la ciudad',
          status: 'ACTIVE'
        }
      }),
      
      prisma.tenant.upsert({
        where: { slug: 'sweetspot-norte' },
        update: {},
        create: {
          name: 'SweetSpot Norte',
          slug: 'sweetspot-norte', 
          description: 'Sucursal norte de la ciudad',
          status: 'ACTIVE'
        }
      }),
      
      prisma.tenant.upsert({
        where: { slug: 'sweetspot-sur' },
        update: {},
        create: {
          name: 'SweetSpot Sur',
          slug: 'sweetspot-sur',
          description: 'Sucursal sur de la ciudad',
          status: 'ACTIVE'
        }
      })
    ])

    console.log('✅ Created coworks:', coworks.map(c => c.name))
    console.log(`🏢 Total coworks: ${coworks.length}`)

  } catch (error) {
    console.error('❌ Error seeding coworks:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCoworks()