import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

// Define types for the PDF template
interface QuotationPDFProps {
  quotation: {
    id: string
    number: string
    title: string
    description?: string
    subtotal: number
    discounts: number
    taxes: number
    total: number
    currency: string
    validUntil: string
    status: string
    notes?: string
    createdAt: string
    client: {
      name: string
      email: string
      phone?: string
      company?: string
      address?: string
      contactPerson?: string
    }
    items: Array<{
      id: string
      description: string
      quantity: number
      unitPrice: number
      total: number
    }>
    opportunity?: {
      title: string
      stage: string
      value: number
    }
    createdBy?: {
      firstName: string
      lastName: string
      email: string
    }
  }
  coworkInfo: {
    name: string
    address: string
    phone: string
    email: string
    website?: string
    logo?: string
  }
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    paddingBottom: 80,
    fontFamily: 'Helvetica',
  },

  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#6b7280',
  },

  continuationText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },

  pageBreak: {
    marginBottom: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#6366f1',
  },

  // Abbreviated header for subsequent pages
  headerAbbreviated: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },

  headerAbbreviatedLeft: {
    flex: 1,
  },

  headerAbbreviatedRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  companyNameSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  quotationTitleSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366f1',
  },

  quotationNumberSmall: {
    fontSize: 12,
    color: '#374151',
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  companyInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  
  quotationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 8,
  },
  
  quotationNumber: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  
  quotationDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Client section
  clientSection: {
    marginBottom: 30,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  clientInfo: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
  },
  
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  clientDetail: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4,
  },
  
  // Description section
  descriptionSection: {
    marginBottom: 30,
  },
  
  description: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.5,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
  },
  
  // Items table
  itemsSection: {
    marginBottom: 30,
  },
  
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },

  tableWithoutBorder: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    wrap: false,
  },
  
  tableRowLast: {
    borderBottomWidth: 0,
  },
  
  tableCell: {
    fontSize: 11,
    color: '#374151',
  },
  
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'uppercase',
  },
  
  tableCellDescription: {
    flex: 3,
  },
  
  tableCellQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  
  tableCellPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  
  tableCellTotal: {
    flex: 1.5,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  
  // Totals section
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  
  totalsContainer: {
    width: 280,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  totalRowFinal: {
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  
  totalLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  
  totalLabelFinal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  totalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  
  totalAmountFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  
  // Terms section
  termsSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  termsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  
  termsText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  // Fixed footer for specific content
  fixedFooter: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  // Status badge
  statusBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  
  statusText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Opportunity section
  opportunitySection: {
    marginBottom: 20,
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  
  opportunityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  
  opportunityDetail: {
    fontSize: 10,
    color: '#a16207',
    marginBottom: 2,
  },
  
  // Notes section
  notesSection: {
    marginTop: 30,
    backgroundColor: '#fef2f2',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 8,
  },
  
  notesText: {
    fontSize: 10,
    color: '#7f1d1d',
    lineHeight: 1.4,
  },
})

// Status colors mapping
const getStatusColor = (status: string) => {
  const colors = {
    'DRAFT': '#6b7280',
    'SENT': '#3b82f6',
    'VIEWED': '#8b5cf6',
    'ACCEPTED': '#10b981',
    'REJECTED': '#ef4444',
    'EXPIRED': '#f97316',
    'CONVERTED': '#059669',
  }
  return colors[status as keyof typeof colors] || '#6b7280'
}

const getStatusBgColor = (status: string) => {
  const colors = {
    'DRAFT': '#f3f4f6',
    'SENT': '#dbeafe',
    'VIEWED': '#e0e7ff',
    'ACCEPTED': '#d1fae5',
    'REJECTED': '#fee2e2',
    'EXPIRED': '#fed7aa',
    'CONVERTED': '#d1fae5',
  }
  return colors[status as keyof typeof colors] || '#f3f4f6'
}

const getStatusLabel = (status: string) => {
  const labels = {
    'DRAFT': 'Borrador',
    'SENT': 'Enviada',
    'VIEWED': 'Vista',
    'ACCEPTED': 'Aceptada',
    'REJECTED': 'Rechazada',
    'EXPIRED': 'Expirada',
    'CONVERTED': 'Convertida',
  }
  return labels[status as keyof typeof labels] || status
}

// Helper components
const HeaderAbbreviated: React.FC<{
  coworkInfo: QuotationPDFProps['coworkInfo']
  quotation: QuotationPDFProps['quotation']
  formatDate: (date: string) => string
  pageContext?: string
}> = ({ coworkInfo, quotation, formatDate, pageContext }) => (
  <View style={styles.headerAbbreviated}>
    <View style={styles.headerAbbreviatedLeft}>
      <Text style={styles.companyNameSmall}>{coworkInfo.name}</Text>
      {pageContext && (
        <Text style={[styles.quotationNumberSmall, { fontSize: 10, marginTop: 2 }]}>
          {pageContext}
        </Text>
      )}
    </View>
    <View style={styles.headerAbbreviatedRight}>
      <Text style={styles.quotationTitleSmall}>COTIZACIÓN</Text>
      <Text style={styles.quotationNumberSmall}>{quotation.number}</Text>
      <View style={[
        styles.statusBadge, 
        { backgroundColor: getStatusBgColor(quotation.status), marginTop: 4, alignSelf: 'flex-end' }
      ]}>
        <Text style={[styles.statusText, { color: getStatusColor(quotation.status), fontSize: 8 }]}>
          {getStatusLabel(quotation.status)}
        </Text>
      </View>
    </View>
  </View>
)

const TableHeader: React.FC<{ showItemNumbers?: boolean }> = ({ showItemNumbers = false }) => (
  <View style={styles.tableHeader}>
    {showItemNumbers && (
      <Text style={[styles.tableCellHeader, { flex: 0.5, textAlign: 'center' }]}>
        #
      </Text>
    )}
    <Text style={[styles.tableCellHeader, styles.tableCellDescription]}>
      Descripción
    </Text>
    <Text style={[styles.tableCellHeader, styles.tableCellQuantity]}>
      Cantidad
    </Text>
    <Text style={[styles.tableCellHeader, styles.tableCellPrice]}>
      Precio Unit.
    </Text>
    <Text style={[styles.tableCellHeader, styles.tableCellTotal]}>
      Total
    </Text>
  </View>
)

const ContinuationIndicator: React.FC<{ message: string }> = ({ message }) => (
  <View style={{ marginTop: 15, marginBottom: 10 }}>
    <Text style={styles.continuationText}>{message}</Text>
    <View style={{
      height: 1,
      backgroundColor: '#e5e7eb',
      marginTop: 5,
      marginHorizontal: 50
    }} />
  </View>
)

// Main PDF component
const QuotationPDFTemplate: React.FC<QuotationPDFProps> = ({ quotation, coworkInfo }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: quotation.currency || 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Dynamic pagination based on content
  const calculateDynamicPagination = () => {
    // Estimate available space for items on first page
    let firstPageSpace = 600 // Approximate pixels after header, client info, description
    
    // Reduce space if description exists
    if (quotation.description) {
      const descriptionLines = Math.ceil(quotation.description.length / 80)
      firstPageSpace -= Math.min(descriptionLines * 15, 120) // Max 8 lines for description
    }
    
    // Reduce space if opportunity exists
    if (quotation.opportunity) {
      firstPageSpace -= 60
    }
    
    // Each table row is approximately 24px
    const rowHeight = 24
    const headerHeight = 40
    const totalSectionHeight = 140
    
    const firstPageItems = Math.floor((firstPageSpace - headerHeight - totalSectionHeight) / rowHeight)
    const subsequentPageSpace = 650 // More space on continuation pages
    const subsequentPageItems = Math.floor((subsequentPageSpace - headerHeight) / rowHeight)
    
    // Ensure minimum items per page
    const firstPageCapacity = Math.max(firstPageItems, 5)
    const subsequentPageCapacity = Math.max(subsequentPageItems, 12)
    
    return { firstPageCapacity, subsequentPageCapacity }
  }

  const { firstPageCapacity, subsequentPageCapacity } = calculateDynamicPagination()
  
  // Split items intelligently
  const itemPages = []
  let remainingItems = [...quotation.items]
  
  // First page items
  if (remainingItems.length > 0) {
    const firstPageItems = remainingItems.splice(0, Math.min(firstPageCapacity, remainingItems.length))
    itemPages.push({ items: firstPageItems, isFirstPage: true })
  }
  
  // Subsequent pages
  while (remainingItems.length > 0) {
    const pageItems = remainingItems.splice(0, Math.min(subsequentPageCapacity, remainingItems.length))
    itemPages.push({ items: pageItems, isFirstPage: false })
  }
  
  // Determine if we need multiple pages
  const needsMultiplePages = itemPages.length > 1 || quotation.notes || 
    (quotation.description && quotation.description.length > 300)

  return (
    <Document>
      {/* First Page - Header, Client Info, Description */}
      <Page size="A4" style={styles.page} render={({ pageNumber, totalPages }) => (
        <>
          {/* Page Number */}
          <Text style={styles.pageNumber}>Página {pageNumber} de {totalPages}</Text>
          
          {/* Main Header (Only on first page) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.companyName}>{coworkInfo.name}</Text>
              <Text style={styles.companyInfo}>{coworkInfo.address}</Text>
              <Text style={styles.companyInfo}>{coworkInfo.phone} • {coworkInfo.email}</Text>
              {coworkInfo.website && (
                <Text style={styles.companyInfo}>{coworkInfo.website}</Text>
              )}
            </View>
            
            <View style={styles.headerRight}>
              <Text style={styles.quotationTitle}>COTIZACIÓN</Text>
              <Text style={styles.quotationNumber}>{quotation.number}</Text>
              <Text style={styles.quotationDate}>Fecha: {formatDate(quotation.createdAt)}</Text>
              <Text style={styles.quotationDate}>Válida hasta: {formatDate(quotation.validUntil)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(quotation.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(quotation.status) }]}>
                  {getStatusLabel(quotation.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Client Information */}
          <View style={[styles.clientSection, { break: false }]} wrap={false}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{quotation.client.name}</Text>
              {quotation.client.company && (
                <Text style={styles.clientDetail}>Empresa: {quotation.client.company}</Text>
              )}
              <Text style={styles.clientDetail}>Email: {quotation.client.email}</Text>
              {quotation.client.phone && (
                <Text style={styles.clientDetail}>Teléfono: {quotation.client.phone}</Text>
              )}
              {quotation.client.address && (
                <Text style={styles.clientDetail}>Dirección: {quotation.client.address}</Text>
              )}
              {quotation.client.contactPerson && (
                <Text style={styles.clientDetail}>Persona de contacto: {quotation.client.contactPerson}</Text>
              )}
            </View>
          </View>

          {/* Page Break Indicator */}
          <View style={styles.pageBreak} break></View>

          {/* Opportunity Information */}
          {quotation.opportunity && (
            <View style={[styles.opportunitySection, { break: false }]} wrap={false}>
              <Text style={styles.opportunityTitle}>Oportunidad Relacionada</Text>
              <Text style={styles.opportunityDetail}>Título: {quotation.opportunity.title}</Text>
              <Text style={styles.opportunityDetail}>Etapa: {quotation.opportunity.stage}</Text>
              <Text style={styles.opportunityDetail}>Valor estimado: {formatCurrency(quotation.opportunity.value)}</Text>
            </View>
          )}

          {/* Description */}
          {quotation.description && (
            <View style={[styles.descriptionSection, { break: false }]} wrap={false}>
              <Text style={styles.sectionTitle}>Descripción del Proyecto</Text>
              <Text style={styles.description}>{quotation.description}</Text>
            </View>
          )}

          {/* Items Table on First Page (if space allows) */}
          {itemPages.length > 0 && itemPages[0].isFirstPage && (
            <>
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Detalle de Servicios</Text>
                <View style={styles.table}>
                  <TableHeader showItemNumbers={true} />
                  
                  {itemPages[0].items.map((item, index) => (
                    <View 
                      key={item.id} 
                      style={[
                        styles.tableRow, 
                        index === itemPages[0].items.length - 1 && itemPages.length === 1 ? styles.tableRowLast : {}
                      ]}
                    >
                      <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>
                        {index + 1}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellDescription]}>
                        {item.description}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellQuantity]}>
                        {item.quantity}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellPrice]}>
                        {formatCurrency(item.unitPrice)}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellTotal]}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Show totals only if all items fit on first page */}
              {itemPages.length === 1 && (
                <View style={styles.totalsSection}>
                  <View style={styles.totalsContainer}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal:</Text>
                      <Text style={styles.totalAmount}>{formatCurrency(quotation.subtotal)}</Text>
                    </View>
                    
                    {quotation.discounts > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Descuentos:</Text>
                        <Text style={[styles.totalAmount, { color: '#10b981' }]}>
                          -{formatCurrency(quotation.discounts)}
                        </Text>
                      </View>
                    )}
                    
                    {quotation.taxes > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Impuestos:</Text>
                        <Text style={[styles.totalAmount, { color: '#f97316' }]}>
                          +{formatCurrency(quotation.taxes)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                      <Text style={styles.totalLabelFinal}>Total:</Text>
                      <Text style={styles.totalAmountFinal}>{formatCurrency(quotation.total)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Continuation indicator */}
          {(itemPages.length > 1 || (itemPages.length === 1 && quotation.notes)) && (
            <ContinuationIndicator message="Continúa en la siguiente página..." />
          )}
        </>
      )}>
      </Page>

      {/* Additional Items Pages (starting from second page of items if needed) */}
      {itemPages.slice(1).map((pageData, pageIndex) => {
        const actualPageIndex = pageIndex + 1; // Since we start from slice(1)
        const globalStartIndex = itemPages.slice(0, actualPageIndex).reduce((sum, page) => sum + page.items.length, 0);
        
        return (
          <Page key={`items-page-${actualPageIndex}`} size="A4" style={styles.page} render={({ pageNumber, totalPages }) => (
            <>
              {/* Page Number */}
              <Text style={styles.pageNumber}>Página {pageNumber} de {totalPages}</Text>
              
              {/* Abbreviated Header */}
              <HeaderAbbreviated 
                coworkInfo={coworkInfo} 
                quotation={quotation} 
                formatDate={formatDate}
                pageContext="Detalle de Servicios (Continuación)"
              />

              {/* Items Table Continuation */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>
                  Detalle de Servicios (Continuación - Página {actualPageIndex + 1})
                </Text>
                <View style={styles.tableWithoutBorder}>
                  <TableHeader showItemNumbers={true} />
                  
                  {pageData.items.map((item, index) => {
                    const globalIndex = globalStartIndex + index;
                    const isLastItem = globalIndex === quotation.items.length - 1;
                    
                    return (
                      <View 
                        key={item.id} 
                        style={[
                          styles.tableRow, 
                          isLastItem ? styles.tableRowLast : {}
                        ]}
                      >
                        <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center' }]}>
                          {globalIndex + 1}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellDescription]}>
                          {item.description}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellQuantity]}>
                          {item.quantity}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellPrice]}>
                          {formatCurrency(item.unitPrice)}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellTotal]}>
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>

              {/* Show totals only on the last items page */}
              {actualPageIndex === itemPages.length - 1 && (
                <View style={styles.totalsSection}>
                  <View style={styles.totalsContainer}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal:</Text>
                      <Text style={styles.totalAmount}>{formatCurrency(quotation.subtotal)}</Text>
                    </View>
                    
                    {quotation.discounts > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Descuentos:</Text>
                        <Text style={[styles.totalAmount, { color: '#10b981' }]}>
                          -{formatCurrency(quotation.discounts)}
                        </Text>
                      </View>
                    )}
                    
                    {quotation.taxes > 0 && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Impuestos:</Text>
                        <Text style={[styles.totalAmount, { color: '#f97316' }]}>
                          +{formatCurrency(quotation.taxes)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                      <Text style={styles.totalLabelFinal}>Total Final:</Text>
                      <Text style={styles.totalAmountFinal}>{formatCurrency(quotation.total)}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Continuation indicators */}
              {actualPageIndex < itemPages.length - 1 && (
                <ContinuationIndicator message="Continúa en la siguiente página..." />
              )}
              
              {actualPageIndex === itemPages.length - 1 && quotation.notes && (
                <ContinuationIndicator message="Ver términos y condiciones en la página siguiente" />
              )}
            </>
          )}>
          </Page>
        )
      })}

      {/* Final Page - Terms, Notes, Footer (only if needed) */}
      {(quotation.notes || needsMultiplePages) && (
        <Page size="A4" style={styles.page} render={({ pageNumber, totalPages }) => (
          <>
            {/* Page Number */}
            <Text style={styles.pageNumber}>Página {pageNumber} de {totalPages}</Text>
            
            {/* Abbreviated Header */}
            <HeaderAbbreviated 
              coworkInfo={coworkInfo} 
              quotation={quotation} 
              formatDate={formatDate}
              pageContext="Términos y Condiciones"
            />

            {/* Terms and Conditions */}
            <View style={[styles.termsSection, { break: false }]} wrap={false}>
              <Text style={styles.termsTitle}>Términos y Condiciones Generales</Text>
              <Text style={styles.termsText}>
                • Validez de la cotización: Esta cotización es válida hasta el {formatDate(quotation.validUntil)}{'\n\n'}
                • Precios: Todos los precios están expresados en {quotation.currency} e incluyen IVA donde aplique{'\n\n'}
                • Forma de pago: Los términos de pago serán definidos al momento de la contratación del servicio{'\n\n'}
                • Disponibilidad: Los servicios cotizados están sujetos a disponibilidad al momento de la confirmación{'\n\n'}
                • Reserva: Esta cotización no constituye una reserva definitiva de los servicios{'\n\n'}
                • Confirmación: Para confirmar los servicios es necesario firmar el contrato correspondiente y cumplir con los términos de pago establecidos{'\n\n'}
                • Modificaciones: Cualquier modificación a los servicios cotizados debe ser aprobada por escrito y puede afectar el precio final{'\n\n'}
                • Cancelaciones: Las políticas de cancelación serán especificadas en el contrato de servicio
              </Text>
            </View>

            {/* Internal Notes */}
            {quotation.notes && (
              <View style={[styles.notesSection, { break: false }]} wrap={false}>
                <Text style={styles.notesTitle}>Notas Adicionales</Text>
                <Text style={styles.notesText}>{quotation.notes}</Text>
              </View>
            )}

            {/* Summary section for multi-page documents */}
            {needsMultiplePages && (
              <View style={{
                marginTop: 30,
                padding: 20,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb'
              }}>
                <Text style={[
                  styles.sectionTitle,
                  { fontSize: 14, marginBottom: 10, color: '#6366f1' }
                ]}>Resumen de la Cotización</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.clientDetail}>Número de cotización:</Text>
                  <Text style={[styles.clientDetail, { fontWeight: 'bold' }]}>{quotation.number}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.clientDetail}>Total de servicios:</Text>
                  <Text style={[styles.clientDetail, { fontWeight: 'bold' }]}>{quotation.items.length} items</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.clientDetail}>Valor total:</Text>
                  <Text style={[styles.clientDetail, { fontWeight: 'bold', color: '#6366f1' }]}>{formatCurrency(quotation.total)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.clientDetail}>Estado:</Text>
                  <Text style={[styles.clientDetail, { fontWeight: 'bold', color: getStatusColor(quotation.status) }]}>{getStatusLabel(quotation.status)}</Text>
                </View>
              </View>
            )}

            {/* Fixed Footer for final page */}
            <View style={styles.fixedFooter}>
              <Text style={styles.footerText}>
                Documento generado el {formatDate(new Date().toISOString())}
              </Text>
              {quotation.createdBy && (
                <Text style={styles.footerText}>
                  Creado por: {quotation.createdBy.firstName} {quotation.createdBy.lastName} ({quotation.createdBy.email})
                </Text>
              )}
              <Text style={styles.footerText}>
                {coworkInfo.name} • {coworkInfo.email} • {coworkInfo.phone}
              </Text>
              {coworkInfo.website && (
                <Text style={styles.footerText}>{coworkInfo.website}</Text>
              )}
            </View>
          </>
        )}>
        </Page>
      )}
    </Document>
  )
}

export default QuotationPDFTemplate