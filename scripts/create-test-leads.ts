// Script to create test leads data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function createTestLeads() {
  try {
    console.log('🧪 Creating test leads...')
    
    // Find the SweetSpot Central tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'sweetspot-central' }
    })
    
    if (!tenant) {
      console.log('❌ SweetSpot Central tenant not found')
      return
    }
    
    console.log('✅ Found tenant:', tenant.name, tenant.id)
    
    // Check if leads already exist
    const existingLeads = await prisma.lead.count({
      where: { tenantId: tenant.id }
    })
    
    console.log('📊 Existing leads count:', existingLeads)
    
    if (existingLeads > 0) {
      console.log('⚠️ Leads already exist, skipping creation')
      
      // Show existing leads
      const leads = await prisma.lead.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          status: true,
          source: true
        }
      })
      
      console.log('📋 Existing leads:')
      for (const lead of leads) {
        console.log(`- ${lead.firstName} ${lead.lastName} (${lead.email}) - ${lead.company || 'No company'} - ${lead.status}`)
      }
      
      return
    }
    
    // Create test leads
    const testLeads = [
      {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana.garcia@empresa.com',
        phone: '+56912345678',
        company: 'Tech Solutions',
        status: 'NEW',
        source: 'WEBSITE',
        interests: ['OFICINA_PRIVADA', 'SALA_REUNIONES'],
        notes: 'Interesada en oficina privada para 5 personas',
        tenantId: tenant.id
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@startup.cl',
        phone: '+56987654321',
        company: 'Startup Innovadora',
        status: 'CONTACTED',
        source: 'REFERRAL',
        interests: ['ESCRITORIO_DEDICADO'],
        notes: 'Necesita escritorio dedicado, viene recomendado por cliente actual',
        tenantId: tenant.id
      }
    ]
    
    for (const leadData of testLeads) {
      const lead = await prisma.lead.create({
        data: leadData
      })
      console.log(`✅ Created lead: ${lead.firstName} ${lead.lastName} (${lead.email})`)
    }
    
    console.log('🎉 Test leads created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating test leads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestLeads()