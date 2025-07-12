/**
 * Pricing integration utilities for spaces, services, and bookings
 * Integrates the pricing calculator with space and service management
 */

import { PricingCalculator, type LineItem, type PricingContext } from './pricing'

export interface SpacePricingConfig {
  basePrice: number
  currency: string
  pricingMode: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'FIXED'
  minimumDuration?: number // in hours
  maximumDuration?: number // in hours
  pricingTiers?: Array<{
    name: string
    duration: number // in hours
    price: number
    discountPercentage?: number
  }>
  peakHours?: Array<{
    dayOfWeek: number // 0-6, Sunday = 0
    startHour: number // 0-23
    endHour: number // 0-23
    multiplier: number
  }>
  seasonalRates?: Array<{
    name: string
    startDate: Date
    endDate: Date
    multiplier: number
  }>
}

export interface ServicePricingConfig {
  basePrice: number
  currency: string
  pricingMode: 'PER_UNIT' | 'PER_HOUR' | 'FIXED' | 'TIERED'
  minimumQuantity?: number
  maximumQuantity?: number
  pricingTiers?: Array<{
    name: string
    minQuantity: number
    maxQuantity?: number
    price: number
    discountPercentage?: number
  }>
  bundleDiscounts?: Array<{
    serviceIds: string[]
    discountPercentage: number
    name: string
  }>
}

export interface BookingPricingCalculation {
  spaceLineItems: LineItem[]
  serviceLineItems: LineItem[]
  additionalFees: LineItem[]
  subtotal: number
  discounts: number
  taxes: number
  total: number
  breakdown: {
    spaceCost: number
    serviceCost: number
    additionalFees: number
    appliedDiscounts: Array<{
      name: string
      amount: number
      percentage?: number
    }>
    appliedTaxes: Array<{
      name: string
      rate: number
      amount: number
    }>
  }
}

export class SpaceServicePricingCalculator {
  private pricingCalculator: PricingCalculator

  constructor(pricingCalculator: PricingCalculator) {
    this.pricingCalculator = pricingCalculator
  }

  /**
   * Calculate pricing for a space booking
   */
  calculateSpacePricing(
    spaceConfig: SpacePricingConfig,
    startTime: Date,
    endTime: Date,
    context: PricingContext
  ): LineItem[] {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) // hours
    
    let baseAmount = spaceConfig.basePrice
    let effectiveDuration = duration

    // Apply minimum duration
    if (spaceConfig.minimumDuration && duration < spaceConfig.minimumDuration) {
      effectiveDuration = spaceConfig.minimumDuration
    }

    // Apply maximum duration
    if (spaceConfig.maximumDuration && duration > spaceConfig.maximumDuration) {
      effectiveDuration = spaceConfig.maximumDuration
    }

    // Calculate base cost based on pricing mode
    switch (spaceConfig.pricingMode) {
      case 'HOURLY':
        baseAmount = spaceConfig.basePrice * effectiveDuration
        break
      case 'DAILY':
        baseAmount = spaceConfig.basePrice * Math.ceil(effectiveDuration / 24)
        break
      case 'MONTHLY':
        baseAmount = spaceConfig.basePrice * Math.ceil(effectiveDuration / (24 * 30))
        break
      case 'FIXED':
        baseAmount = spaceConfig.basePrice
        break
    }

    // Apply pricing tiers
    if (spaceConfig.pricingTiers && spaceConfig.pricingTiers.length > 0) {
      for (const tier of spaceConfig.pricingTiers) {
        if (effectiveDuration >= tier.duration) {
          baseAmount = tier.price * (effectiveDuration / tier.duration)
          if (tier.discountPercentage) {
            baseAmount *= (1 - tier.discountPercentage / 100)
          }
        }
      }
    }

    // Apply peak hour multipliers
    if (spaceConfig.peakHours && spaceConfig.peakHours.length > 0) {
      const peakMultiplier = this.calculatePeakHourMultiplier(
        startTime,
        endTime,
        spaceConfig.peakHours
      )
      baseAmount *= peakMultiplier
    }

    // Apply seasonal rates
    if (spaceConfig.seasonalRates && spaceConfig.seasonalRates.length > 0) {
      const seasonalMultiplier = this.calculateSeasonalMultiplier(
        startTime,
        endTime,
        spaceConfig.seasonalRates
      )
      baseAmount *= seasonalMultiplier
    }

    return [{
      description: `Space booking (${effectiveDuration.toFixed(2)} hours)`,
      quantity: 1,
      unitPrice: baseAmount,
      category: 'space',
      spaceId: context.clientId, // This would be the actual space ID
      metadata: {
        duration: effectiveDuration,
        pricingMode: spaceConfig.pricingMode,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    }]
  }

  /**
   * Calculate pricing for services
   */
  calculateServicePricing(
    services: Array<{
      serviceConfig: ServicePricingConfig
      quantity: number
      duration?: number // for hourly services
      serviceId: string
      serviceName: string
    }>,
    context: PricingContext
  ): LineItem[] {
    const lineItems: LineItem[] = []

    for (const service of services) {
      let unitPrice = service.serviceConfig.basePrice
      let effectiveQuantity = service.quantity

      // Apply minimum/maximum quantity
      if (service.serviceConfig.minimumQuantity && 
          effectiveQuantity < service.serviceConfig.minimumQuantity) {
        effectiveQuantity = service.serviceConfig.minimumQuantity
      }

      if (service.serviceConfig.maximumQuantity && 
          effectiveQuantity > service.serviceConfig.maximumQuantity) {
        effectiveQuantity = service.serviceConfig.maximumQuantity
      }

      // Calculate base cost based on pricing mode
      switch (service.serviceConfig.pricingMode) {
        case 'PER_UNIT':
          unitPrice = service.serviceConfig.basePrice
          break
        case 'PER_HOUR':
          unitPrice = service.serviceConfig.basePrice * (service.duration || 1)
          break
        case 'FIXED':
          unitPrice = service.serviceConfig.basePrice
          effectiveQuantity = 1
          break
        case 'TIERED':
          if (service.serviceConfig.pricingTiers) {
            for (const tier of service.serviceConfig.pricingTiers) {
              if (effectiveQuantity >= tier.minQuantity &&
                  (!tier.maxQuantity || effectiveQuantity <= tier.maxQuantity)) {
                unitPrice = tier.price
                if (tier.discountPercentage) {
                  unitPrice *= (1 - tier.discountPercentage / 100)
                }
                break
              }
            }
          }
          break
      }

      lineItems.push({
        description: `${service.serviceName} (x${effectiveQuantity})`,
        quantity: effectiveQuantity,
        unitPrice,
        category: 'service',
        serviceId: service.serviceId,
        metadata: {
          pricingMode: service.serviceConfig.pricingMode,
          originalQuantity: service.quantity,
          duration: service.duration,
        },
      })
    }

    // Apply bundle discounts
    this.applyBundleDiscounts(lineItems, services)

    return lineItems
  }

  /**
   * Calculate complete booking pricing
   */
  calculateBookingPricing(
    spaceConfig: SpacePricingConfig | null,
    services: Array<{
      serviceConfig: ServicePricingConfig
      quantity: number
      duration?: number
      serviceId: string
      serviceName: string
    }>,
    startTime: Date,
    endTime: Date,
    context: PricingContext,
    additionalFees: LineItem[] = []
  ): BookingPricingCalculation {
    const spaceLineItems = spaceConfig ? 
      this.calculateSpacePricing(spaceConfig, startTime, endTime, context) : []
    
    const serviceLineItems = this.calculateServicePricing(services, context)
    
    const allLineItems = [...spaceLineItems, ...serviceLineItems, ...additionalFees]
    
    // Use the pricing calculator for final calculations
    const pricingResult = this.pricingCalculator.calculatePricing(allLineItems, context)

    const spaceCost = spaceLineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const serviceCost = serviceLineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const additionalFeesCost = additionalFees.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    return {
      spaceLineItems,
      serviceLineItems,
      additionalFees,
      subtotal: pricingResult.subtotal,
      discounts: pricingResult.totalDiscounts,
      taxes: pricingResult.totalTaxes,
      total: pricingResult.total,
      breakdown: {
        spaceCost,
        serviceCost,
        additionalFees: additionalFeesCost,
        appliedDiscounts: pricingResult.discounts.map(d => ({
          name: d.rule.name,
          amount: d.amount,
          percentage: d.rule.type === 'PERCENTAGE' ? d.rule.value : undefined,
        })),
        appliedTaxes: pricingResult.taxes.map(t => ({
          name: t.rule.name,
          rate: t.rate,
          amount: t.amount,
        })),
      },
    }
  }

  /**
   * Calculate peak hour multiplier based on booking time
   */
  private calculatePeakHourMultiplier(
    startTime: Date,
    endTime: Date,
    peakHours: Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
      multiplier: number
    }>
  ): number {
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    let weightedMultiplier = 0
    let totalHours = 0

    // Check each hour of the booking
    for (let i = 0; i < Math.ceil(duration); i++) {
      const currentTime = new Date(startTime.getTime() + i * 60 * 60 * 1000)
      const dayOfWeek = currentTime.getDay()
      const hour = currentTime.getHours()

      let hourMultiplier = 1
      for (const peak of peakHours) {
        if (peak.dayOfWeek === dayOfWeek && 
            hour >= peak.startHour && 
            hour < peak.endHour) {
          hourMultiplier = Math.max(hourMultiplier, peak.multiplier)
        }
      }

      const hourDuration = Math.min(1, duration - i)
      weightedMultiplier += hourMultiplier * hourDuration
      totalHours += hourDuration
    }

    return totalHours > 0 ? weightedMultiplier / totalHours : 1
  }

  /**
   * Calculate seasonal multiplier based on booking dates
   */
  private calculateSeasonalMultiplier(
    startTime: Date,
    endTime: Date,
    seasonalRates: Array<{
      name: string
      startDate: Date
      endDate: Date
      multiplier: number
    }>
  ): number {
    let maxMultiplier = 1

    for (const season of seasonalRates) {
      // Check if booking overlaps with seasonal period
      if (startTime <= season.endDate && endTime >= season.startDate) {
        maxMultiplier = Math.max(maxMultiplier, season.multiplier)
      }
    }

    return maxMultiplier
  }

  /**
   * Apply bundle discounts to service line items
   */
  private applyBundleDiscounts(
    lineItems: LineItem[],
    services: Array<{
      serviceConfig: ServicePricingConfig
      serviceId: string
    }>
  ): void {
    const serviceIds = services.map(s => s.serviceId)
    
    for (const service of services) {
      if (service.serviceConfig.bundleDiscounts) {
        for (const bundle of service.serviceConfig.bundleDiscounts) {
          // Check if all required services are present
          const hasAllServices = bundle.serviceIds.every(id => serviceIds.includes(id))
          
          if (hasAllServices) {
            // Apply discount to matching line items
            for (const lineItem of lineItems) {
              if (lineItem.serviceId && bundle.serviceIds.includes(lineItem.serviceId)) {
                const discount = lineItem.unitPrice * (bundle.discountPercentage / 100)
                lineItem.unitPrice -= discount
                
                // Add metadata about the applied bundle discount
                lineItem.metadata = {
                  ...lineItem.metadata,
                  bundleDiscount: {
                    name: bundle.name,
                    percentage: bundle.discountPercentage,
                    amount: discount * lineItem.quantity,
                  },
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Helper function to extract pricing config from space data
 */
export function extractSpacePricingConfig(space: any): SpacePricingConfig {
  return {
    basePrice: space.basePrice || 0,
    currency: space.currency || 'USD',
    pricingMode: space.pricingMode || 'HOURLY',
    minimumDuration: space.minimumBookingDuration,
    maximumDuration: space.maximumBookingDuration,
    pricingTiers: space.pricingTiers || [],
    peakHours: space.peakHours || [],
    seasonalRates: space.seasonalRates || [],
  }
}

/**
 * Helper function to extract pricing config from service data
 */
export function extractServicePricingConfig(service: any): ServicePricingConfig {
  return {
    basePrice: service.basePrice || 0,
    currency: service.currency || 'USD',
    pricingMode: service.pricingMode || 'PER_UNIT',
    minimumQuantity: service.minimumQuantity,
    maximumQuantity: service.maximumQuantity,
    pricingTiers: service.pricingTiers || [],
    bundleDiscounts: service.bundleDiscounts || [],
  }
}