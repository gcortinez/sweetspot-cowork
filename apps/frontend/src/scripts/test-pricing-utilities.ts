#!/usr/bin/env tsx

/**
 * Standalone test script for pricing utilities
 * Tests pricing functions without database dependencies
 */

import {
  calculateHourlyBookingPrice,
  calculateBulkDiscount,
  calculateMembershipDiscount,
  PricingCalculator
} from '../lib/utils/pricing'

let testResults: Array<{ test: string; success: boolean; error?: string }> = []

function logTest(testName: string, success: boolean, error?: string) {
  console.log(`${success ? '✅' : '❌'} ${testName}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
  testResults.push({ test: testName, success, error })
}

function testHourlyBookingPrice() {
  console.log('\n⏰ Testing Hourly Booking Price Calculation...\n')

  // Test 1: Basic hourly calculation
  try {
    const startTime = new Date('2024-06-15T09:00:00')
    const endTime = new Date('2024-06-15T13:00:00')
    const price = calculateHourlyBookingPrice(50, startTime, endTime)
    
    if (price === 200) { // 4 hours * $50
      logTest('Basic Hourly Calculation (4 hours)', true)
    } else {
      logTest('Basic Hourly Calculation (4 hours)', false, `Expected 200, got ${price}`)
    }
  } catch (error) {
    logTest('Basic Hourly Calculation (4 hours)', false, String(error))
  }

  // Test 2: Minimum hours enforcement
  try {
    const startTime = new Date('2024-06-15T09:00:00')
    const endTime = new Date('2024-06-15T09:30:00') // 30 minutes
    const price = calculateHourlyBookingPrice(50, startTime, endTime, 2)
    
    if (price === 100) { // 2 minimum hours * $50
      logTest('Minimum Hours Enforcement', true)
    } else {
      logTest('Minimum Hours Enforcement', false, `Expected 100, got ${price}`)
    }
  } catch (error) {
    logTest('Minimum Hours Enforcement', false, String(error))
  }

  // Test 3: Fractional hours (ceiling)
  try {
    const startTime = new Date('2024-06-15T09:00:00')
    const endTime = new Date('2024-06-15T11:30:00') // 2.5 hours
    const price = calculateHourlyBookingPrice(50, startTime, endTime)
    
    if (price === 150) { // ceil(2.5) = 3 hours * $50
      logTest('Fractional Hours (Ceiling)', true)
    } else {
      logTest('Fractional Hours (Ceiling)', false, `Expected 150, got ${price}`)
    }
  } catch (error) {
    logTest('Fractional Hours (Ceiling)', false, String(error))
  }
}

function testBulkDiscount() {
  console.log('\n📦 Testing Bulk Discount Calculation...\n')

  const bulkTiers = [
    { minQuantity: 5, discountPercentage: 10 },
    { minQuantity: 10, discountPercentage: 15 },
    { minQuantity: 20, discountPercentage: 20 }
  ]

  // Test 1: No discount (below minimum)
  try {
    const result = calculateBulkDiscount(3, 100, bulkTiers)
    
    if (result.discountAmount === 0 && result.discountedTotal === 300) {
      logTest('No Bulk Discount (Below Minimum)', true)
    } else {
      logTest('No Bulk Discount (Below Minimum)', false, 
        `Expected 0 discount, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('No Bulk Discount (Below Minimum)', false, String(error))
  }

  // Test 2: 10% discount tier
  try {
    const result = calculateBulkDiscount(7, 100, bulkTiers)
    
    if (result.discountAmount === 70 && result.discountedTotal === 630) {
      logTest('10% Bulk Discount Tier', true)
    } else {
      logTest('10% Bulk Discount Tier', false, 
        `Expected 70 discount, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('10% Bulk Discount Tier', false, String(error))
  }

  // Test 3: Highest applicable tier (20%)
  try {
    const result = calculateBulkDiscount(25, 100, bulkTiers)
    
    if (result.discountAmount === 500 && result.discountedTotal === 2000 && 
        result.appliedTier?.discountPercentage === 20) {
      logTest('Highest Bulk Discount Tier (20%)', true)
    } else {
      logTest('Highest Bulk Discount Tier (20%)', false, 
        `Expected 500 discount with 20% tier, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('Highest Bulk Discount Tier (20%)', false, String(error))
  }
}

function testMembershipDiscount() {
  console.log('\n👑 Testing Membership Discount Calculation...\n')

  const membershipRates = {
    'BRONZE': 5,
    'SILVER': 10,
    'GOLD': 15,
    'PLATINUM': 20
  }

  // Test 1: Bronze membership
  try {
    const result = calculateMembershipDiscount(1000, 'BRONZE', membershipRates)
    
    if (result.discountAmount === 50 && result.discountedAmount === 950) {
      logTest('Bronze Membership Discount (5%)', true)
    } else {
      logTest('Bronze Membership Discount (5%)', false, 
        `Expected 50 discount, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('Bronze Membership Discount (5%)', false, String(error))
  }

  // Test 2: Platinum membership
  try {
    const result = calculateMembershipDiscount(1000, 'PLATINUM', membershipRates)
    
    if (result.discountAmount === 200 && result.discountedAmount === 800) {
      logTest('Platinum Membership Discount (20%)', true)
    } else {
      logTest('Platinum Membership Discount (20%)', false, 
        `Expected 200 discount, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('Platinum Membership Discount (20%)', false, String(error))
  }

  // Test 3: Unknown membership level
  try {
    const result = calculateMembershipDiscount(1000, 'UNKNOWN', membershipRates)
    
    if (result.discountAmount === 0 && result.discountedAmount === 1000) {
      logTest('Unknown Membership Level (No Discount)', true)
    } else {
      logTest('Unknown Membership Level (No Discount)', false, 
        `Expected 0 discount, got ${result.discountAmount}`)
    }
  } catch (error) {
    logTest('Unknown Membership Level (No Discount)', false, String(error))
  }
}

function testPricingCalculatorCore() {
  console.log('\n🧮 Testing PricingCalculator Core Functions...\n')

  // Setup test rules
  const pricingRules = [
    {
      id: 'weekend-surcharge',
      name: 'Weekend Surcharge',
      type: 'PERCENTAGE' as const,
      value: 20,
      conditions: {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      },
      priority: 1,
      isActive: true
    }
  ]

  const discountRules = [
    {
      id: 'early-bird',
      name: 'Early Bird Discount',
      type: 'PERCENTAGE' as const,
      value: 15,
      priority: 1,
      isActive: true,
      stackable: true
    },
    {
      id: 'vip-discount',
      name: 'VIP Discount',
      type: 'FIXED_AMOUNT' as const,
      value: 50,
      maxDiscount: 100,
      priority: 2,
      isActive: true,
      stackable: false,
      couponCode: 'VIP50'
    }
  ]

  const taxRules = [
    {
      id: 'state-tax',
      name: 'State Tax',
      rate: 8.5,
      type: 'SALES_TAX' as const,
      jurisdiction: 'CA',
      isActive: true
    }
  ]

  const calculator = new PricingCalculator(pricingRules, discountRules, taxRules)

  // Test 1: Basic calculation with all rules
  try {
    const lineItems = [
      {
        id: 'item-1',
        description: 'Meeting Room',
        quantity: 1,
        unitPrice: 200.00
      }
    ]

    const context = {
      clientId: 'test-client',
      discountCodes: ['VIP50'],
      date: new Date('2024-06-15T10:00:00')
    }

    const result = calculator.calculatePricing(lineItems, context)
    
    // Verify structure and basic calculations
    if (result.subtotal > 0 && 
        result.hasOwnProperty('discounts') && 
        result.hasOwnProperty('taxes') && 
        result.total > 0) {
      logTest('PricingCalculator Basic Structure', true)
      console.log(`   Subtotal: $${result.subtotal.toFixed(2)}`)
      console.log(`   Total Discounts: $${result.totalDiscounts.toFixed(2)}`)
      console.log(`   Total Taxes: $${result.totalTaxes.toFixed(2)}`)
      console.log(`   Final Total: $${result.total.toFixed(2)}`)
    } else {
      logTest('PricingCalculator Basic Structure', false, 'Invalid result structure')
    }
  } catch (error) {
    logTest('PricingCalculator Basic Structure', false, String(error))
  }

  // Test 2: Subscription pricing
  try {
    const subscriptionResult = calculator.calculateSubscriptionPricing(
      299.99, // monthly rate
      new Date('2024-01-15'), // start date
      new Date('2024-04-10'), // end date (2 months + 26 days)
      'DAILY'
    )

    if (subscriptionResult.totalAmount > 0 && 
        subscriptionResult.fullPeriods === 2 &&
        subscriptionResult.partialPeriod?.days === 26) {
      logTest('Subscription Pricing with Proration', true)
      console.log(`   Total: $${subscriptionResult.totalAmount.toFixed(2)}`)
      console.log(`   Full Periods: ${subscriptionResult.fullPeriods}`)
      console.log(`   Partial Days: ${subscriptionResult.partialPeriod?.days}`)
    } else {
      logTest('Subscription Pricing with Proration', false, 
        `Invalid calculation: ${JSON.stringify(subscriptionResult)}`)
    }
  } catch (error) {
    logTest('Subscription Pricing with Proration', false, String(error))
  }

  // Test 3: Time-based pricing (early bird)
  try {
    const timeBasedResult = calculator.calculateTimeBasedPricing(
      100.00, // base price
      new Date('2024-01-01T10:00:00'), // booking date
      new Date('2024-01-20T14:00:00'), // service date (19 days ahead)
      {
        earlyBird: { days: 14, discount: 10 }
      }
    )

    if (timeBasedResult.adjustment.type === 'early_bird' && 
        timeBasedResult.adjustment.amount === 10 &&
        timeBasedResult.adjustedPrice === 90) {
      logTest('Time-Based Pricing (Early Bird)', true)
      console.log(`   Base Price: $100.00`)
      console.log(`   Early Bird Discount: $${timeBasedResult.adjustment.amount}`)
      console.log(`   Final Price: $${timeBasedResult.adjustedPrice}`)
    } else {
      logTest('Time-Based Pricing (Early Bird)', false, 
        `Invalid calculation: ${JSON.stringify(timeBasedResult)}`)
    }
  } catch (error) {
    logTest('Time-Based Pricing (Early Bird)', false, String(error))
  }

  // Test 4: Time-based pricing (last minute)
  try {
    const timeBasedResult = calculator.calculateTimeBasedPricing(
      100.00, // base price
      new Date('2024-01-20T10:00:00'), // booking date
      new Date('2024-01-20T14:00:00'), // service date (4 hours ahead)
      {
        lastMinute: { hours: 12, surcharge: 25 }
      }
    )

    if (timeBasedResult.adjustment.type === 'last_minute' && 
        timeBasedResult.adjustment.amount === 25 &&
        timeBasedResult.adjustedPrice === 125) {
      logTest('Time-Based Pricing (Last Minute)', true)
      console.log(`   Base Price: $100.00`)
      console.log(`   Last Minute Surcharge: $${timeBasedResult.adjustment.amount}`)
      console.log(`   Final Price: $${timeBasedResult.adjustedPrice}`)
    } else {
      logTest('Time-Based Pricing (Last Minute)', false, 
        `Invalid calculation: ${JSON.stringify(timeBasedResult)}`)
    }
  } catch (error) {
    logTest('Time-Based Pricing (Last Minute)', false, String(error))
  }
}

function testEdgeCases() {
  console.log('\n🔍 Testing Edge Cases...\n')

  // Test 1: Zero amount calculations
  try {
    const result = calculateBulkDiscount(0, 100, [
      { minQuantity: 5, discountPercentage: 10 }
    ])
    
    if (result.originalTotal === 0 && result.discountAmount === 0) {
      logTest('Zero Quantity Bulk Discount', true)
    } else {
      logTest('Zero Quantity Bulk Discount', false, 'Should handle zero quantity')
    }
  } catch (error) {
    logTest('Zero Quantity Bulk Discount', false, String(error))
  }

  // Test 2: Negative price protection
  try {
    const calculator = new PricingCalculator()
    const lineItems = [
      {
        id: 'item-1',
        description: 'Test Item',
        quantity: 1,
        unitPrice: -50 // negative price
      }
    ]

    const context = {
      clientId: 'test-client',
      date: new Date()
    }

    const result = calculator.calculatePricing(lineItems, context)
    
    // Should not allow negative totals
    if (result.total >= 0) {
      logTest('Negative Price Protection', true)
    } else {
      logTest('Negative Price Protection', false, 'Should prevent negative totals')
    }
  } catch (error) {
    logTest('Negative Price Protection', false, String(error))
  }

  // Test 3: Same day booking (edge case for time-based pricing)
  try {
    const calculator = new PricingCalculator()
    const now = new Date()
    
    const result = calculator.calculateTimeBasedPricing(
      100,
      now,
      now, // same time
      {
        lastMinute: { hours: 1, surcharge: 50 }
      }
    )

    if (result.adjustment.type === 'last_minute') {
      logTest('Same Time Booking (Last Minute)', true)
    } else {
      logTest('Same Time Booking (Last Minute)', false, 'Should apply last minute for same time')
    }
  } catch (error) {
    logTest('Same Time Booking (Last Minute)', false, String(error))
  }
}

async function runPricingTests() {
  console.log('💰 Starting Pricing Utilities Tests\n')
  console.log('=' .repeat(50))

  try {
    testHourlyBookingPrice()
    testBulkDiscount()
    testMembershipDiscount()
    testPricingCalculatorCore()
    testEdgeCases()

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    logTest('Test Suite Execution', false, String(error))
  }

  // Print summary
  console.log('\n' + '=' .repeat(50))
  console.log('📋 Pricing Tests Summary\n')

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

  console.log('\n' + '=' .repeat(50))
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests if script is executed directly
if (require.main === module) {
  runPricingTests().catch(console.error)
}

export { runPricingTests }