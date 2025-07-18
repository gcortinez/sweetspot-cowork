// Script to add leads directly using production environment
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addLeads() {
  try {
    console.log('🧪 Adding test leads...')
    
    // Find SweetSpot Central tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'sweetspot-central' }
    })
    
    if (!tenant) {
      console.log('❌ SweetSpot Central tenant not found')
      return
    }
    
    console.log('✅ Found tenant:', tenant.name, tenant.id)
    
    // Check existing leads
    const existingCount = await prisma.lead.count({
      where: { tenantId: tenant.id }
    })
    
    console.log('📊 Existing leads count:', existingCount)
    
    // Create test leads
    const lead1 = await prisma.lead.create({
      data: {
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@empresa.com',
        phone: '+56912345678',
        company: 'Empresa Tech',
        status: 'NEW',
        source: 'WEBSITE',
        interests: ['OFICINA_PRIVADA'],
        notes: 'Interesada en oficina privada para 3 personas',
        tenantId: tenant.id
      }
    })
    
    const lead2 = await prisma.lead.create({
      data: {
        firstName: 'Pedro',
        lastName: 'Martínez',
        email: 'pedro.martinez@startup.cl',
        phone: '+56987654321',
        company: 'Startup Digital',
        status: 'CONTACTED',
        source: 'REFERRAL',
        interests: ['ESCRITORIO_DEDICADO'],
        notes: 'Necesita escritorio dedicado, startup en crecimiento',
        tenantId: tenant.id
      }
    })
    
    console.log('✅ Created leads:')
    console.log(`- ${lead1.firstName} ${lead1.lastName} (${lead1.email})`)
    console.log(`- ${lead2.firstName} ${lead2.lastName} (${lead2.email})`)
    
    // Verify total count
    const totalCount = await prisma.lead.count({
      where: { tenantId: tenant.id }
    })
    
    console.log('📊 Total leads now:', totalCount)
    
  } catch (error) {
    console.error('❌ Error adding leads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addLeads()