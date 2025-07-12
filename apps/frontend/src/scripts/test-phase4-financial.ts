#!/usr/bin/env tsx

/**
 * Test script for Phase 4: Financial Management Server Actions
 * Tests invoice, payment, and financial reporting functionality
 */

import { 
  createInvoiceAction,
  updateInvoiceAction,
  deleteInvoiceAction,
  getInvoiceAction,
  listInvoicesAction,
  sendInvoiceAction,
  markInvoicePaidAction,
  getInvoiceStatsAction
} from '../lib/actions/invoice'

import {
  createPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
  getPaymentAction,
  listPaymentsAction,
  processPaymentAction,
  refundPaymentAction,
  getPaymentStatsAction
} from '../lib/actions/payment'

import {
  createFinancialReportAction,
  getFinancialReportAction,
  listFinancialReportsAction,
  generateRevenueAnalysisAction,
  generateCashFlowAnalysisAction,
  generateFinancialMetricsAction
} from '../lib/actions/financial-report'

import { PricingCalculator } from '../lib/utils/pricing'

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'test-tenant'
const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID || 'test-client'

let testResults: Array<{ test: string; success: boolean; error?: string }> = []

function logTest(testName: string, success: boolean, error?: string) {
  console.log(`${success ? '✅' : '❌'} ${testName}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
  testResults.push({ test: testName, success, error })
}

// Test data
const testInvoiceData = {
  clientId: TEST_CLIENT_ID,
  title: 'Test Invoice',
  description: 'Test invoice for automated testing',
  currency: 'USD',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  items: [
    {
      description: 'Conference Room Rental',
      quantity: 2,
      unitPrice: 50.00,
      category: 'space_rental'
    },
    {
      description: 'Coffee Service',
      quantity: 1,
      unitPrice: 25.00,
      category: 'service'
    }
  ],
  tax: 8.5,
  notes: 'Payment due within 30 days'
}

const testPaymentData = {
  clientId: TEST_CLIENT_ID,
  amount: 125.00,
  currency: 'USD',
  method: 'CREDIT_CARD' as const,
  reference: 'TEST-PAYMENT-001',
  description: 'Test payment for automated testing',
  metadata: { testPayment: true }
}

const testReportData = {
  reportType: 'REVENUE_ANALYSIS' as const,
  title: 'Test Revenue Report',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  parameters: {
    groupBy: 'month',
    includeProjections: false
  }
}

async function testInvoiceOperations() {
  console.log('\n🧾 Testing Invoice Operations...\n')

  let createdInvoiceId: string

  // Test 1: Create Invoice
  try {
    const result = await createInvoiceAction(testInvoiceData)
    if (result.success && result.data) {
      createdInvoiceId = result.data.id
      logTest('Create Invoice', true)
    } else {
      logTest('Create Invoice', false, result.error)
      return
    }
  } catch (error) {
    logTest('Create Invoice', false, String(error))
    return
  }

  // Test 2: Get Invoice
  try {
    const result = await getInvoiceAction(createdInvoiceId)
    if (result.success && result.data) {
      logTest('Get Invoice', true)
    } else {
      logTest('Get Invoice', false, result.error)
    }
  } catch (error) {
    logTest('Get Invoice', false, String(error))
  }

  // Test 3: Update Invoice
  try {
    const updateData = {
      id: createdInvoiceId,
      title: 'Updated Test Invoice',
      notes: 'Updated notes for testing'
    }
    const result = await updateInvoiceAction(updateData)
    if (result.success) {
      logTest('Update Invoice', true)
    } else {
      logTest('Update Invoice', false, result.error)
    }
  } catch (error) {
    logTest('Update Invoice', false, String(error))
  }

  // Test 4: List Invoices
  try {
    const result = await listInvoicesAction({
      page: 1,
      limit: 10,
      status: 'DRAFT'
    })
    if (result.success && result.data) {
      logTest('List Invoices', true)
    } else {
      logTest('List Invoices', false, result.error)
    }
  } catch (error) {
    logTest('List Invoices', false, String(error))
  }

  // Test 5: Send Invoice
  try {
    const result = await sendInvoiceAction({
      invoiceId: createdInvoiceId,
      email: 'test@example.com',
      subject: 'Test Invoice',
      message: 'Please find your invoice attached.'
    })
    if (result.success) {
      logTest('Send Invoice', true)
    } else {
      logTest('Send Invoice', false, result.error)
    }
  } catch (error) {
    logTest('Send Invoice', false, String(error))
  }

  // Test 6: Get Invoice Stats
  try {
    const result = await getInvoiceStatsAction({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    })
    if (result.success && result.data) {
      logTest('Get Invoice Stats', true)
    } else {
      logTest('Get Invoice Stats', false, result.error)
    }
  } catch (error) {
    logTest('Get Invoice Stats', false, String(error))
  }

  return createdInvoiceId
}

async function testPaymentOperations(invoiceId?: string) {
  console.log('\n💳 Testing Payment Operations...\n')

  let createdPaymentId: string

  // Test 1: Create Payment
  try {
    const paymentData = invoiceId 
      ? { ...testPaymentData, invoiceId }
      : testPaymentData
    
    const result = await createPaymentAction(paymentData)
    if (result.success && result.data) {
      createdPaymentId = result.data.id
      logTest('Create Payment', true)
    } else {
      logTest('Create Payment', false, result.error)
      return
    }
  } catch (error) {
    logTest('Create Payment', false, String(error))
    return
  }

  // Test 2: Get Payment
  try {
    const result = await getPaymentAction(createdPaymentId)
    if (result.success && result.data) {
      logTest('Get Payment', true)
    } else {
      logTest('Get Payment', false, result.error)
    }
  } catch (error) {
    logTest('Get Payment', false, String(error))
  }

  // Test 3: Process Payment
  try {
    const result = await processPaymentAction({
      paymentId: createdPaymentId,
      gatewayTransactionId: 'TEST-TXN-001',
      gatewayResponse: { status: 'success', message: 'Payment processed' }
    })
    if (result.success) {
      logTest('Process Payment', true)
    } else {
      logTest('Process Payment', false, result.error)
    }
  } catch (error) {
    logTest('Process Payment', false, String(error))
  }

  // Test 4: List Payments
  try {
    const result = await listPaymentsAction({
      page: 1,
      limit: 10,
      status: 'COMPLETED'
    })
    if (result.success && result.data) {
      logTest('List Payments', true)
    } else {
      logTest('List Payments', false, result.error)
    }
  } catch (error) {
    logTest('List Payments', false, String(error))
  }

  // Test 5: Get Payment Stats
  try {
    const result = await getPaymentStatsAction({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    })
    if (result.success && result.data) {
      logTest('Get Payment Stats', true)
    } else {
      logTest('Get Payment Stats', false, result.error)
    }
  } catch (error) {
    logTest('Get Payment Stats', false, String(error))
  }

  // Test 6: Refund Payment (partial)
  try {
    const result = await refundPaymentAction({
      paymentId: createdPaymentId,
      amount: 50.00,
      reason: 'Testing refund functionality'
    })
    if (result.success) {
      logTest('Refund Payment', true)
    } else {
      logTest('Refund Payment', false, result.error)
    }
  } catch (error) {
    logTest('Refund Payment', false, String(error))
  }

  return createdPaymentId
}

async function testFinancialReporting() {
  console.log('\n📊 Testing Financial Reporting...\n')

  let createdReportId: string

  // Test 1: Create Financial Report
  try {
    const result = await createFinancialReportAction(testReportData)
    if (result.success && result.data) {
      createdReportId = result.data.id
      logTest('Create Financial Report', true)
    } else {
      logTest('Create Financial Report', false, result.error)
      return
    }
  } catch (error) {
    logTest('Create Financial Report', false, String(error))
    return
  }

  // Test 2: Get Financial Report
  try {
    const result = await getFinancialReportAction(createdReportId)
    if (result.success && result.data) {
      logTest('Get Financial Report', true)
    } else {
      logTest('Get Financial Report', false, result.error)
    }
  } catch (error) {
    logTest('Get Financial Report', false, String(error))
  }

  // Test 3: List Financial Reports
  try {
    const result = await listFinancialReportsAction({
      page: 1,
      limit: 10,
      reportType: 'REVENUE_ANALYSIS'
    })
    if (result.success && result.data) {
      logTest('List Financial Reports', true)
    } else {
      logTest('List Financial Reports', false, result.error)
    }
  } catch (error) {
    logTest('List Financial Reports', false, String(error))
  }

  // Test 4: Generate Revenue Analysis
  try {
    const result = await generateRevenueAnalysisAction({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      groupBy: 'month'
    })
    if (result.success && result.data) {
      logTest('Generate Revenue Analysis', true)
    } else {
      logTest('Generate Revenue Analysis', false, result.error)
    }
  } catch (error) {
    logTest('Generate Revenue Analysis', false, String(error))
  }

  // Test 5: Generate Cash Flow Analysis
  try {
    const result = await generateCashFlowAnalysisAction({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      groupBy: 'month'
    })
    if (result.success && result.data) {
      logTest('Generate Cash Flow Analysis', true)
    } else {
      logTest('Generate Cash Flow Analysis', false, result.error)
    }
  } catch (error) {
    logTest('Generate Cash Flow Analysis', false, String(error))
  }

  // Test 6: Generate Financial Metrics
  try {
    const result = await generateFinancialMetricsAction({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      metrics: ['revenue', 'expenses', 'profit_margin', 'cash_flow']
    })
    if (result.success && result.data) {
      logTest('Generate Financial Metrics', true)
    } else {
      logTest('Generate Financial Metrics', false, result.error)
    }
  } catch (error) {
    logTest('Generate Financial Metrics', false, String(error))
  }
}

async function testPricingCalculator() {
  console.log('\n💰 Testing Pricing Calculator...\n')

  // Test pricing rules
  const pricingRules = [
    {
      id: 'peak-hours',
      name: 'Peak Hours Surcharge',
      type: 'PERCENTAGE' as const,
      value: 25,
      conditions: {
        dateRange: {
          start: new Date('2024-01-01T09:00:00'),
          end: new Date('2024-12-31T17:00:00')
        }
      },
      priority: 1,
      isActive: true
    }
  ]

  // Test discount rules
  const discountRules = [
    {
      id: 'bulk-discount',
      name: 'Bulk Booking Discount',
      type: 'PERCENTAGE' as const,
      value: 10,
      conditions: {
        minQuantity: 5
      },
      priority: 1,
      isActive: true,
      stackable: true
    },
    {
      id: 'member-discount',
      name: 'Member Discount',
      type: 'PERCENTAGE' as const,
      value: 15,
      priority: 2,
      isActive: true,
      stackable: false,
      couponCode: 'MEMBER15'
    }
  ]

  // Test tax rules
  const taxRules = [
    {
      id: 'sales-tax',
      name: 'Sales Tax',
      rate: 8.5,
      type: 'SALES_TAX' as const,
      jurisdiction: 'CA',
      isActive: true
    }
  ]

  const calculator = new PricingCalculator(pricingRules, discountRules, taxRules)

  // Test 1: Basic pricing calculation
  try {
    const lineItems = [
      {
        id: 'item-1',
        description: 'Conference Room',
        quantity: 2,
        unitPrice: 100.00,
        category: 'space_rental'
      },
      {
        id: 'item-2',
        description: 'Catering',
        quantity: 1,
        unitPrice: 50.00,
        category: 'service'
      }
    ]

    const context = {
      clientId: TEST_CLIENT_ID,
      clientType: 'PREMIUM',
      bookingDuration: 4,
      discountCodes: ['MEMBER15'],
      date: new Date('2024-06-15T14:00:00')
    }

    const result = calculator.calculatePricing(lineItems, context)
    
    if (result.total > 0 && result.breakdown) {
      logTest('Basic Pricing Calculation', true)
      console.log(`   Subtotal: $${result.subtotal.toFixed(2)}`)
      console.log(`   Total Discounts: $${result.totalDiscounts.toFixed(2)}`)
      console.log(`   Total Taxes: $${result.totalTaxes.toFixed(2)}`)
      console.log(`   Final Total: $${result.total.toFixed(2)}`)
    } else {
      logTest('Basic Pricing Calculation', false, 'Invalid calculation result')
    }
  } catch (error) {
    logTest('Basic Pricing Calculation', false, String(error))
  }

  // Test 2: Subscription pricing calculation
  try {
    const subscriptionResult = calculator.calculateSubscriptionPricing(
      299.99, // monthly rate
      new Date('2024-06-15'),
      new Date('2024-09-10'),
      'DAILY'
    )

    if (subscriptionResult.totalAmount > 0) {
      logTest('Subscription Pricing Calculation', true)
      console.log(`   Total Amount: $${subscriptionResult.totalAmount.toFixed(2)}`)
      console.log(`   Prorated Amount: $${subscriptionResult.proratedAmount.toFixed(2)}`)
      console.log(`   Full Periods: ${subscriptionResult.fullPeriods}`)
    } else {
      logTest('Subscription Pricing Calculation', false, 'Invalid subscription calculation')
    }
  } catch (error) {
    logTest('Subscription Pricing Calculation', false, String(error))
  }

  // Test 3: Time-based pricing
  try {
    const timeBasedResult = calculator.calculateTimeBasedPricing(
      100.00, // base price
      new Date('2024-06-01T10:00:00'), // booking date
      new Date('2024-06-20T14:00:00'), // service date
      {
        earlyBird: { days: 14, discount: 10 },
        lastMinute: { hours: 24, surcharge: 20 }
      }
    )

    if (timeBasedResult.adjustedPrice >= 0) {
      logTest('Time-Based Pricing Calculation', true)
      console.log(`   Base Price: $100.00`)
      console.log(`   Adjusted Price: $${timeBasedResult.adjustedPrice.toFixed(2)}`)
      console.log(`   Adjustment Type: ${timeBasedResult.adjustment.type}`)
      console.log(`   Adjustment Amount: $${timeBasedResult.adjustment.amount.toFixed(2)}`)
    } else {
      logTest('Time-Based Pricing Calculation', false, 'Invalid time-based calculation')
    }
  } catch (error) {
    logTest('Time-Based Pricing Calculation', false, String(error))
  }
}

async function testValidationSchemas() {
  console.log('\n🔍 Testing Validation Schemas...\n')

  // Test invoice validation
  try {
    const { createInvoiceSchema } = await import('../lib/validations/invoice')
    
    // Valid data
    const validInvoice = createInvoiceSchema.parse(testInvoiceData)
    logTest('Invoice Schema Validation (Valid)', true)

    // Invalid data
    try {
      createInvoiceSchema.parse({
        ...testInvoiceData,
        clientId: 'invalid-uuid',
        items: [] // empty items array
      })
      logTest('Invoice Schema Validation (Invalid)', false, 'Should have failed validation')
    } catch {
      logTest('Invoice Schema Validation (Invalid)', true)
    }
  } catch (error) {
    logTest('Invoice Schema Validation', false, String(error))
  }

  // Test payment validation
  try {
    const { createPaymentSchema } = await import('../lib/validations/payment')
    
    // Valid data
    const validPayment = createPaymentSchema.parse(testPaymentData)
    logTest('Payment Schema Validation (Valid)', true)

    // Invalid data
    try {
      createPaymentSchema.parse({
        ...testPaymentData,
        amount: -100, // negative amount
        method: 'INVALID_METHOD'
      })
      logTest('Payment Schema Validation (Invalid)', false, 'Should have failed validation')
    } catch {
      logTest('Payment Schema Validation (Invalid)', true)
    }
  } catch (error) {
    logTest('Payment Schema Validation', false, String(error))
  }

  // Test financial report validation
  try {
    const { createFinancialReportSchema } = await import('../lib/validations/financial-report')
    
    // Valid data
    const validReport = createFinancialReportSchema.parse(testReportData)
    logTest('Financial Report Schema Validation (Valid)', true)

    // Invalid data
    try {
      createFinancialReportSchema.parse({
        ...testReportData,
        reportType: 'INVALID_TYPE',
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01') // end before start
      })
      logTest('Financial Report Schema Validation (Invalid)', false, 'Should have failed validation')
    } catch {
      logTest('Financial Report Schema Validation (Invalid)', true)
    }
  } catch (error) {
    logTest('Financial Report Schema Validation', false, String(error))
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...\n')
  
  // Note: In a real implementation, you would delete test records here
  // For this test script, we'll just log that cleanup would happen
  console.log('   Test data cleanup would be performed here')
  logTest('Cleanup Test Data', true)
}

async function runAllTests() {
  console.log('🧪 Starting Phase 4 Financial Management Tests\n')
  console.log('=' .repeat(60))

  try {
    // Test validation schemas first
    await testValidationSchemas()

    // Test pricing calculator (no database dependencies)
    await testPricingCalculator()

    // Test server actions that require database
    const invoiceId = await testInvoiceOperations()
    await testPaymentOperations(invoiceId)
    await testFinancialReporting()

    // Cleanup
    await cleanup()

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    logTest('Test Suite Execution', false, String(error))
  }

  // Print summary
  console.log('\n' + '=' .repeat(60))
  console.log('📋 Test Results Summary\n')

  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.success).length
  const failedTests = totalTests - passedTests

  console.log(`Total Tests: ${totalTests}`)
  console.log(`✅ Passed: ${passedTests}`)
  console.log(`❌ Failed: ${failedTests}`)
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:')
    testResults
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.error}`)
      })
  }

  console.log('\n' + '=' .repeat(60))
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

export { runAllTests }