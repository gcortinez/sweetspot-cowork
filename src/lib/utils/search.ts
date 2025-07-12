/**
 * Advanced search and filtering utilities for Server Actions
 */

import { Prisma } from '@prisma/client'

// Search configuration
export interface SearchConfig {
  fields: string[]
  caseSensitive?: boolean
  exactMatch?: boolean
  fuzzyMatch?: boolean
}

// Filter configuration
export interface FilterConfig {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array'
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn'
    transform?: (value: any) => any
  }
}

// Sort configuration
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
  nullsFirst?: boolean
}

// Pagination configuration
export interface PaginationConfig {
  page: number
  limit: number
  offset?: number
}

// Advanced search and filter builder
export class QueryBuilder {
  private whereClause: any = {}
  private orderByClause: any[] = []
  private searchFields: string[] = []
  private filters: FilterConfig = {}

  constructor(private baseWhere: any = {}) {
    this.whereClause = { ...baseWhere }
  }

  /**
   * Add search functionality across multiple fields
   */
  addSearch(query: string, config: SearchConfig): this {
    if (!query || query.trim().length === 0) {
      return this
    }

    const searchTerm = config.exactMatch ? query : query.trim()
    const mode = config.caseSensitive ? 'default' : 'insensitive'

    const searchConditions = config.fields.map(field => {
      if (config.exactMatch) {
        return { [field]: { equals: searchTerm, mode } }
      } else if (config.fuzzyMatch) {
        // Simple fuzzy matching by splitting search terms
        const terms = searchTerm.split(' ').filter(term => term.length > 0)
        return {
          AND: terms.map(term => ({
            [field]: { contains: term, mode }
          }))
        }
      } else {
        return { [field]: { contains: searchTerm, mode } }
      }
    })

    if (this.whereClause.OR) {
      this.whereClause.AND = [
        { OR: this.whereClause.OR },
        { OR: searchConditions }
      ]
      delete this.whereClause.OR
    } else {
      this.whereClause.OR = searchConditions
    }

    return this
  }

  /**
   * Add filters with type validation and transformation
   */
  addFilters(filters: Record<string, any>, config: FilterConfig): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      const filterConfig = config[key]
      if (!filterConfig) {
        return
      }

      let processedValue = value

      // Apply transformation if specified
      if (filterConfig.transform) {
        processedValue = filterConfig.transform(value)
      }

      // Type-specific processing
      switch (filterConfig.type) {
        case 'string':
          this.addStringFilter(key, processedValue, filterConfig.operator || 'contains')
          break
        case 'number':
          this.addNumberFilter(key, processedValue, filterConfig.operator || 'equals')
          break
        case 'boolean':
          this.addBooleanFilter(key, processedValue)
          break
        case 'date':
          this.addDateFilter(key, processedValue, filterConfig.operator || 'equals')
          break
        case 'enum':
          this.addEnumFilter(key, processedValue)
          break
        case 'array':
          this.addArrayFilter(key, processedValue, filterConfig.operator || 'in')
          break
      }
    })

    return this
  }

  /**
   * Add string filter
   */
  private addStringFilter(field: string, value: string, operator: string): void {
    switch (operator) {
      case 'equals':
        this.whereClause[field] = { equals: value, mode: 'insensitive' }
        break
      case 'contains':
        this.whereClause[field] = { contains: value, mode: 'insensitive' }
        break
      case 'startsWith':
        this.whereClause[field] = { startsWith: value, mode: 'insensitive' }
        break
      case 'endsWith':
        this.whereClause[field] = { endsWith: value, mode: 'insensitive' }
        break
    }
  }

  /**
   * Add number filter
   */
  private addNumberFilter(field: string, value: number, operator: string): void {
    switch (operator) {
      case 'equals':
        this.whereClause[field] = value
        break
      case 'gt':
        this.whereClause[field] = { gt: value }
        break
      case 'gte':
        this.whereClause[field] = { gte: value }
        break
      case 'lt':
        this.whereClause[field] = { lt: value }
        break
      case 'lte':
        this.whereClause[field] = { lte: value }
        break
    }
  }

  /**
   * Add boolean filter
   */
  private addBooleanFilter(field: string, value: boolean): void {
    this.whereClause[field] = value
  }

  /**
   * Add date filter
   */
  private addDateFilter(field: string, value: string | Date, operator: string): void {
    const date = typeof value === 'string' ? new Date(value) : value

    switch (operator) {
      case 'equals':
        // For date equality, we typically want the entire day
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)
        this.whereClause[field] = { gte: startOfDay, lte: endOfDay }
        break
      case 'gt':
        this.whereClause[field] = { gt: date }
        break
      case 'gte':
        this.whereClause[field] = { gte: date }
        break
      case 'lt':
        this.whereClause[field] = { lt: date }
        break
      case 'lte':
        this.whereClause[field] = { lte: date }
        break
    }
  }

  /**
   * Add enum filter
   */
  private addEnumFilter(field: string, value: string | string[]): void {
    if (Array.isArray(value)) {
      this.whereClause[field] = { in: value }
    } else {
      this.whereClause[field] = value
    }
  }

  /**
   * Add array filter
   */
  private addArrayFilter(field: string, value: any[], operator: string): void {
    switch (operator) {
      case 'in':
        this.whereClause[field] = { in: value }
        break
      case 'notIn':
        this.whereClause[field] = { notIn: value }
        break
    }
  }

  /**
   * Add date range filter
   */
  addDateRange(field: string, startDate?: string | Date, endDate?: string | Date): this {
    if (!startDate && !endDate) {
      return this
    }

    const rangeFilter: any = {}
    
    if (startDate) {
      rangeFilter.gte = typeof startDate === 'string' ? new Date(startDate) : startDate
    }
    
    if (endDate) {
      rangeFilter.lte = typeof endDate === 'string' ? new Date(endDate) : endDate
    }

    this.whereClause[field] = rangeFilter
    return this
  }

  /**
   * Add sorting
   */
  addSort(sorts: SortConfig[]): this
  addSort(field: string, direction: 'asc' | 'desc'): this
  addSort(sortsOrField: SortConfig[] | string, direction?: 'asc' | 'desc'): this {
    if (typeof sortsOrField === 'string') {
      // Single field sorting
      this.orderByClause = [{
        [sortsOrField]: direction || 'asc'
      }]
    } else {
      // Multiple field sorting
      this.orderByClause = sortsOrField.map(sort => ({
        [sort.field]: {
          sort: sort.direction,
          nulls: sort.nullsFirst ? 'first' : 'last'
        }
      }))
    }
    return this
  }

  /**
   * Add a simple filter
   */
  addFilter(field: string, value: any): this {
    if (value !== undefined && value !== null && value !== '') {
      this.whereClause[field] = value
    }
    return this
  }

  /**
   * Add tenant filter for multi-tenant scoping
   */
  addTenantFilter(tenantId: string): this {
    if (tenantId) {
      this.whereClause.tenantId = tenantId
    }
    return this
  }

  /**
   * Add relationship filters
   */
  addRelationshipFilter(relationField: string, filters: any): this {
    this.whereClause[relationField] = filters
    return this
  }

  /**
   * Add aggregation filters (e.g., count-based filters)
   */
  addCountFilter(relationField: string, operator: 'gt' | 'gte' | 'lt' | 'lte' | 'equals', count: number): this {
    this.whereClause[relationField] = {
      _count: {
        [operator]: count
      }
    }
    return this
  }

  /**
   * Build the final query object
   */
  build(): { where: any; orderBy?: any[] } {
    return {
      where: this.whereClause,
      ...(this.orderByClause.length > 0 && { orderBy: this.orderByClause })
    }
  }

  /**
   * Get the where clause only
   */
  getWhere(): any {
    return this.whereClause
  }

  /**
   * Get the order by clause only
   */
  getOrderBy(): any[] {
    return this.orderByClause
  }
}

/**
 * Utility function to build pagination
 */
export function buildPagination(config: PaginationConfig) {
  const offset = config.offset || (config.page - 1) * config.limit
  
  return {
    skip: offset,
    take: config.limit
  }
}

/**
 * Utility function to calculate pagination metadata
 */
export function calculatePaginationMeta(
  totalCount: number, 
  page: number, 
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit)
  
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, totalCount)
  }
}

/**
 * Advanced text search with scoring
 */
export class TextSearchBuilder {
  private searchTerms: string[] = []
  private fields: { field: string; weight: number }[] = []

  constructor(query: string) {
    this.searchTerms = this.parseSearchQuery(query)
  }

  /**
   * Parse search query into terms
   */
  private parseSearchQuery(query: string): string[] {
    // Remove special characters and split by spaces
    const cleaned = query.replace(/[^\w\s]/gi, ' ')
    return cleaned.split(/\s+/).filter(term => term.length > 0)
  }

  /**
   * Add searchable field with weight
   */
  addField(field: string, weight: number = 1): this {
    this.fields.push({ field, weight })
    return this
  }

  /**
   * Build search conditions with scoring
   */
  buildSearchConditions(): any[] {
    if (this.searchTerms.length === 0 || this.fields.length === 0) {
      return []
    }

    const conditions: any[] = []

    // Exact phrase match (highest score)
    const fullQuery = this.searchTerms.join(' ')
    this.fields.forEach(({ field }) => {
      conditions.push({
        [field]: { contains: fullQuery, mode: 'insensitive' }
      })
    })

    // Individual term matches
    this.searchTerms.forEach(term => {
      this.fields.forEach(({ field }) => {
        conditions.push({
          [field]: { contains: term, mode: 'insensitive' }
        })
      })
    })

    return conditions
  }
}

/**
 * Helper function for full-text search across multiple models
 */
export async function performGlobalSearch(
  prisma: any,
  query: string,
  searchConfigs: Array<{
    model: string
    fields: string[]
    select: any
    where?: any
    limit?: number
  }>
): Promise<{
  results: Array<{
    type: string
    data: any[]
    totalCount: number
  }>
  totalResults: number
}> {
  if (!query || query.trim().length === 0) {
    return { results: [], totalResults: 0 }
  }

  const searchPromises = searchConfigs.map(async config => {
    const searchBuilder = new TextSearchBuilder(query)
    config.fields.forEach(field => searchBuilder.addField(field))
    
    const searchConditions = searchBuilder.buildSearchConditions()
    
    if (searchConditions.length === 0) {
      return { type: config.model, data: [], totalCount: 0 }
    }

    const whereClause = {
      ...config.where,
      OR: searchConditions
    }

    const [data, totalCount] = await Promise.all([
      prisma[config.model].findMany({
        where: whereClause,
        select: config.select,
        take: config.limit || 10,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma[config.model].count({ where: whereClause })
    ])

    return {
      type: config.model,
      data,
      totalCount
    }
  })

  const results = await Promise.all(searchPromises)
  const totalResults = results.reduce((sum, result) => sum + result.totalCount, 0)

  return { results, totalResults }
}