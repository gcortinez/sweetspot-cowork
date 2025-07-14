/**
 * Script to create a test lead for debugging
 * This will help test the leads functionality
 */

import { createLead } from '../src/lib/actions/leads'

async function createTestLead() {
  try {
    console.log('🚀 Creating test lead...')

    const testLeadData = {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@empresa.com',
      phone: '+56 9 8877 6655',
      company: 'Empresa Ejemplo',
      position: 'Director de TI',
      source: 'WEBSITE' as const,
      channel: 'Formulario web',
      budget: 500000,
      interests: ['Coworking', 'Oficina Privada'],
      qualificationNotes: 'Lead de prueba creado para testing'
    }

    console.log('📋 Test lead data:', testLeadData)

    const result = await createLead(testLeadData)

    if (result.success) {
      console.log('✅ Test lead created successfully!')
      console.log('📄 Lead details:', result.data)
    } else {
      console.log('❌ Failed to create test lead:', result.error)
    }

  } catch (error) {
    console.error('💥 Error creating test lead:', error)
  }
}

// Note: This script needs to be run in the context of a Next.js app with auth
// For now, it's just a template. The actual testing should be done through the web interface.
console.log('⚠️  This script is a template for testing leads creation.')
console.log('📝 To test, use the web interface at http://localhost:3000/leads')
console.log('🔑 Make sure you are logged in with gcortinez@gmail.com')

export { createTestLead }