/**
 * Pricing calculation utilities for financial operations
 * Handles automatic pricing, discounts, taxes, and complex billing scenarios
 */

export interface PricingRule {
  id: string
  name: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'MULTIPLIER'
  value: number
  conditions?: {
    minAmount?: number
    maxAmount?: number
    minQuantity?: number
    dateRange?: { start: Date; end: Date }
    clientTypes?: string[]
    spaceTypes?: string[]
    bookingDuration?: { min: number; max: number } // in hours
  }
  priority: number
  isActive: boolean
}

export interface DiscountRule extends PricingRule {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  maxDiscount?: number
  stackable: boolean
  couponCode?: string
}

export interface TaxRule {
  id: string
  name: string
  rate: number // percentage
  type: 'SALES_TAX' | 'VAT' | 'SERVICE_TAX' | 'OTHER'
  jurisdiction: string
  conditions?: {
    serviceTypes?: string[]
    clientLocations?: string[]
    amountThreshold?: number
  }
  isActive: boolean
}

export interface LineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  category?: string
  spaceId?: string
  serviceId?: string
  metadata?: Record<string, any>
}

export interface PricingContext {
  clientId: string
  clientType?: string
  location?: string
  bookingDuration?: number // in hours
  spaceType?: string
  serviceTypes?: string[]
  discountCodes?: string[]
  membershipLevel?: string
  loyaltyPoints?: number
  date: Date
}

export interface PricingResult {
  subtotal: number
  discounts: {
    rule: DiscountRule
    amount: number
    appliedTo: string[] // line item IDs
  }[]
  totalDiscounts: number
  taxableAmount: number
  taxes: {
    rule: TaxRule
    rate: number
    amount: number
  }[]
  totalTaxes: number
  total: number
  breakdown: {
    lineItems: Array<LineItem & { total: number }>
    appliedRules: string[]
    effectiveDiscountRate: number
    effectiveTaxRate: number
  }
}

export class PricingCalculator {
  private pricingRules: PricingRule[] = []
  private discountRules: DiscountRule[] = []
  private taxRules: TaxRule[] = []

  constructor(
    pricingRules: PricingRule[] = [],
    discountRules: DiscountRule[] = [],
    taxRules: TaxRule[] = []
  ) {
    this.pricingRules = pricingRules.sort((a, b) => b.priority - a.priority)
    this.discountRules = discountRules.sort((a, b) => b.priority - a.priority)
    this.taxRules = taxRules
  }

  /**
   * Calculate total pricing with all applicable rules
   */
  calculatePricing(
    lineItems: LineItem[],
    context: PricingContext
  ): PricingResult {
    // 1. Apply pricing rules to line items
    const pricedItems = this.applyPricingRules(lineItems, context)

    // 2. Calculate subtotal
    const subtotal = pricedItems.reduce((sum, item) => sum + item.total, 0)

    // 3. Apply discounts
    const { discounts, totalDiscounts, discountedAmount } = this.applyDiscounts(
      pricedItems,
      subtotal,
      context
    )

    // 4. Calculate taxes on discounted amount
    const taxableAmount = discountedAmount
    const { taxes, totalTaxes } = this.applyTaxes(taxableAmount, context)

    // 5. Calculate final total
    const total = taxableAmount + totalTaxes

    // 6. Build result
    return {
      subtotal,
      discounts,
      totalDiscounts,
      taxableAmount,
      taxes,
      totalTaxes,
      total,
      breakdown: {
        lineItems: pricedItems,
        appliedRules: [
          ...this.getAppliedRuleNames(this.pricingRules, context),
          ...discounts.map(d => d.rule.name),
          ...taxes.map(t => t.rule.name),
        ],
        effectiveDiscountRate: subtotal > 0 ? (totalDiscounts / subtotal) * 100 : 0,
        effectiveTaxRate: taxableAmount > 0 ? (totalTaxes / taxableAmount) * 100 : 0,
      },
    }
  }

  /**
   * Apply pricing rules to line items
   */
  private applyPricingRules(
    lineItems: LineItem[],
    context: PricingContext
  ): Array<LineItem & { total: number }> {
    return lineItems.map(item => {
      let adjustedPrice = item.unitPrice
      
      // Find applicable pricing rules
      const applicableRules = this.pricingRules.filter(rule => 
        this.isPricingRuleApplicable(rule, item, context)
      )

      // Apply rules in priority order
      for (const rule of applicableRules) {
        switch (rule.type) {
          case 'PERCENTAGE':
            adjustedPrice *= (1 + rule.value / 100)
            break
          case 'FIXED_AMOUNT':
            adjustedPrice += rule.value
            break
          case 'MULTIPLIER':
            adjustedPrice *= rule.value
            break
        }
      }

      return {
        ...item,
        total: Math.max(0, adjustedPrice * item.quantity), // Ensure non-negative
      }
    })
  }

  /**
   * Apply discount rules
   */
  private applyDiscounts(
    lineItems: Array<LineItem & { total: number }>,
    subtotal: number,
    context: PricingContext
  ): {
    discounts: PricingResult['discounts']
    totalDiscounts: number
    discountedAmount: number
  } {
    const discounts: PricingResult['discounts'] = []
    let totalDiscounts = 0
    let remainingAmount = subtotal

    // Find applicable discount rules
    const applicableDiscounts = this.discountRules.filter(rule =>
      this.isDiscountRuleApplicable(rule, subtotal, context)
    )

    // Apply stackable discounts first, then non-stackable with highest value
    const stackableDiscounts = applicableDiscounts.filter(d => d.stackable)
    const nonStackableDiscounts = applicableDiscounts.filter(d => !d.stackable)

    // Apply stackable discounts
    for (const rule of stackableDiscounts) {
      const discount = this.calculateDiscount(rule, remainingAmount, lineItems)
      if (discount.amount > 0) {
        discounts.push(discount)
        totalDiscounts += discount.amount
        remainingAmount -= discount.amount
      }
    }

    // Apply best non-stackable discount
    if (nonStackableDiscounts.length > 0) {
      const bestDiscount = nonStackableDiscounts
        .map(rule => this.calculateDiscount(rule, remainingAmount, lineItems))
        .reduce((best, current) => 
          current.amount > best.amount ? current : best
        )

      if (bestDiscount.amount > 0) {
        discounts.push(bestDiscount)
        totalDiscounts += bestDiscount.amount
        remainingAmount -= bestDiscount.amount
      }
    }

    return {
      discounts,
      totalDiscounts,
      discountedAmount: Math.max(0, remainingAmount),
    }
  }

  /**
   * Apply tax rules
   */
  private applyTaxes(
    taxableAmount: number,
    context: PricingContext
  ): {
    taxes: PricingResult['taxes']
    totalTaxes: number
  } {
    const taxes: PricingResult['taxes'] = []
    let totalTaxes = 0

    // Find applicable tax rules
    const applicableTaxes = this.taxRules.filter(rule =>
      this.isTaxRuleApplicable(rule, taxableAmount, context)
    )

    // Apply all applicable taxes
    for (const rule of applicableTaxes) {
      const taxAmount = (taxableAmount * rule.rate) / 100
      taxes.push({
        rule,
        rate: rule.rate,
        amount: taxAmount,
      })
      totalTaxes += taxAmount
    }

    return { taxes, totalTaxes }
  }

  /**
   * Check if pricing rule is applicable
   */
  private isPricingRuleApplicable(
    rule: PricingRule,
    item: LineItem,
    context: PricingContext
  ): boolean {
    if (!rule.isActive) return false

    const conditions = rule.conditions
    if (!conditions) return true

    // Check amount conditions
    const itemTotal = item.unitPrice * item.quantity
    if (conditions.minAmount && itemTotal < conditions.minAmount) return false
    if (conditions.maxAmount && itemTotal > conditions.maxAmount) return false

    // Check quantity conditions
    if (conditions.minQuantity && item.quantity < conditions.minQuantity) return false

    // Check date range
    if (conditions.dateRange) {
      if (context.date < conditions.dateRange.start || context.date > conditions.dateRange.end) {
        return false
      }
    }

    // Check space types
    if (conditions.spaceTypes && item.spaceId) {
      // This would require space type lookup - simplified for now
      if (context.spaceType && !conditions.spaceTypes.includes(context.spaceType)) {
        return false
      }
    }

    // Check booking duration
    if (conditions.bookingDuration && context.bookingDuration) {
      const { min, max } = conditions.bookingDuration
      if (context.bookingDuration < min || context.bookingDuration > max) {
        return false
      }
    }

    return true
  }

  /**
   * Check if discount rule is applicable
   */
  private isDiscountRuleApplicable(
    rule: DiscountRule,
    subtotal: number,
    context: PricingContext
  ): boolean {
    if (!rule.isActive) return false

    // Check coupon code
    if (rule.couponCode && !context.discountCodes?.includes(rule.couponCode)) {
      return false
    }

    // Check basic pricing rule conditions
    return this.isPricingRuleApplicable(rule, { 
      description: '', 
      quantity: 1, 
      unitPrice: subtotal 
    }, context)
  }

  /**
   * Check if tax rule is applicable
   */
  private isTaxRuleApplicable(
    rule: TaxRule,
    taxableAmount: number,
    context: PricingContext
  ): boolean {
    if (!rule.isActive) return false

    const conditions = rule.conditions
    if (!conditions) return true

    // Check amount threshold
    if (conditions.amountThreshold && taxableAmount < conditions.amountThreshold) {
      return false
    }

    // Check service types
    if (conditions.serviceTypes && context.serviceTypes) {
      const hasMatchingService = context.serviceTypes.some(serviceType =>
        conditions.serviceTypes!.includes(serviceType)
      )
      if (!hasMatchingService) return false
    }

    // Check client location
    if (conditions.clientLocations && context.location) {
      if (!conditions.clientLocations.includes(context.location)) {
        return false
      }
    }

    return true
  }

  /**
   * Calculate discount amount for a specific rule
   */
  private calculateDiscount(
    rule: DiscountRule,
    amount: number,
    lineItems: Array<LineItem & { total: number }>
  ): PricingResult['discounts'][0] {
    let discountAmount = 0

    switch (rule.type) {
      case 'PERCENTAGE':
        discountAmount = (amount * rule.value) / 100
        break
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(rule.value, amount)
        break
    }

    // Apply maximum discount limit
    if (rule.maxDiscount && discountAmount > rule.maxDiscount) {
      discountAmount = rule.maxDiscount
    }

    return {
      rule,
      amount: discountAmount,
      appliedTo: lineItems.map(item => item.id || ''),
    }
  }

  /**
   * Get names of applied pricing rules
   */
  private getAppliedRuleNames(rules: PricingRule[], context: PricingContext): string[] {
    return rules
      .filter(rule => this.isPricingRuleApplicable(rule, {
        description: '',
        quantity: 1,
        unitPrice: 0
      }, context))
      .map(rule => rule.name)
  }

  /**
   * Calculate subscription pricing with prorations
   */
  calculateSubscriptionPricing(
    monthlyRate: number,
    startDate: Date,
    endDate: Date,
    prorationType: 'NONE' | 'DAILY' | 'WEEKLY' = 'DAILY'
  ): {
    totalAmount: number
    proratedAmount: number
    fullPeriods: number
    partialPeriod?: {
      days: number
      amount: number
    }
  } {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    const fullMonths = Math.floor(totalDays / 30)
    const remainingDays = totalDays % 30

    let totalAmount = fullMonths * monthlyRate
    let proratedAmount = 0

    if (remainingDays > 0 && prorationType !== 'NONE') {
      switch (prorationType) {
        case 'DAILY':
          proratedAmount = (monthlyRate / 30) * remainingDays
          break
        case 'WEEKLY':
          const weeks = Math.ceil(remainingDays / 7)
          proratedAmount = (monthlyRate / 4) * weeks
          break
      }
    }

    return {
      totalAmount: totalAmount + proratedAmount,
      proratedAmount,
      fullPeriods: fullMonths,
      partialPeriod: remainingDays > 0 ? {
        days: remainingDays,
        amount: proratedAmount,
      } : undefined,
    }
  }

  /**
   * Calculate early bird or late booking pricing adjustments
   */
  calculateTimeBasedPricing(
    basePrice: number,
    bookingDate: Date,
    serviceDate: Date,
    rules: {
      earlyBird?: { days: number; discount: number }
      lastMinute?: { hours: number; surcharge: number }
    }
  ): {
    adjustedPrice: number
    adjustment: {
      type: 'early_bird' | 'last_minute' | 'none'
      amount: number
      percentage: number
    }
  } {
    const timeDiff = serviceDate.getTime() - bookingDate.getTime()
    const daysDiff = timeDiff / (24 * 60 * 60 * 1000)
    const hoursDiff = timeDiff / (60 * 60 * 1000)

    // Early bird discount
    if (rules.earlyBird && daysDiff >= rules.earlyBird.days) {
      const discountAmount = (basePrice * rules.earlyBird.discount) / 100
      return {
        adjustedPrice: basePrice - discountAmount,
        adjustment: {
          type: 'early_bird',
          amount: discountAmount,
          percentage: rules.earlyBird.discount,
        },
      }
    }

    // Last minute surcharge
    if (rules.lastMinute && hoursDiff <= rules.lastMinute.hours) {
      const surchargeAmount = (basePrice * rules.lastMinute.surcharge) / 100
      return {
        adjustedPrice: basePrice + surchargeAmount,
        adjustment: {
          type: 'last_minute',
          amount: surchargeAmount,
          percentage: rules.lastMinute.surcharge,
        },
      }
    }

    return {
      adjustedPrice: basePrice,
      adjustment: {
        type: 'none',
        amount: 0,
        percentage: 0,
      },
    }
  }
}

/**
 * Utility functions for common pricing scenarios
 */

export function calculateHourlyBookingPrice(
  hourlyRate: number,
  startTime: Date,
  endTime: Date,
  minimumHours = 1
): number {
  const duration = Math.max(
    minimumHours,
    Math.ceil((endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000))
  )
  return hourlyRate * duration
}

export function calculateBulkDiscount(
  quantity: number,
  unitPrice: number,
  tiers: Array<{ minQuantity: number; discountPercentage: number }>
): {
  originalTotal: number
  discountedTotal: number
  discountAmount: number
  appliedTier?: { minQuantity: number; discountPercentage: number }
} {
  const originalTotal = quantity * unitPrice
  
  // Find applicable tier (highest discount for quantity)
  const applicableTier = tiers
    .filter(tier => quantity >= tier.minQuantity)
    .sort((a, b) => b.discountPercentage - a.discountPercentage)[0]

  if (!applicableTier) {
    return {
      originalTotal,
      discountedTotal: originalTotal,
      discountAmount: 0,
    }
  }

  const discountAmount = (originalTotal * applicableTier.discountPercentage) / 100
  
  return {
    originalTotal,
    discountedTotal: originalTotal - discountAmount,
    discountAmount,
    appliedTier: applicableTier,
  }
}

export function calculateMembershipDiscount(
  baseAmount: number,
  membershipLevel: string,
  discountRates: Record<string, number>
): {
  originalAmount: number
  discountedAmount: number
  discountAmount: number
  discountRate: number
} {
  const discountRate = discountRates[membershipLevel] || 0
  const discountAmount = (baseAmount * discountRate) / 100
  
  return {
    originalAmount: baseAmount,
    discountedAmount: baseAmount - discountAmount,
    discountAmount,
    discountRate,
  }
}