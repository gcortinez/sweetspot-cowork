import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
    fontFamily: 'Helvetica',
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
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
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
  
  // Client section - compacta
  clientSection: {
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  clientInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  clientInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  
  clientInfoRight: {
    flex: 1,
  },
  
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  
  clientDetail: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 2,
  },
  
  // Description section
  descriptionSection: {
    marginBottom: 15,
  },
  
  description: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
  },
  
  // Items table
  itemsSection: {
    marginBottom: 20,
  },
  
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    marginTop: 15,
    alignItems: 'flex-end',
  },
  
  totalsContainer: {
    width: 260,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
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
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  termsText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
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
    marginBottom: 15,
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  
  opportunityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  
  opportunityDetail: {
    fontSize: 9,
    color: '#a16207',
    marginBottom: 1,
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

// Main PDF component
const QuotationPDFTemplate: React.FC<QuotationPDFProps> = ({ quotation, coworkInfo }) => {
  const formatCurrency = (amount: number) => {
    const currency = quotation.currency || 'CLP'
    const locale = currency === 'CLP' ? 'es-CL' : 'es-CO'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Header */}
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
            <Text style={styles.quotationDate}>{formatDate(quotation.createdAt)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(quotation.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(quotation.status) }]}>
                {getStatusLabel(quotation.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Information - Compacta */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.clientInfo}>
            <View style={styles.clientInfoLeft}>
              <Text style={styles.clientName}>{quotation.client.name}</Text>
              {quotation.client.company && (
                <Text style={styles.clientDetail}>{quotation.client.company}</Text>
              )}
              <Text style={styles.clientDetail}>{quotation.client.email}</Text>
            </View>
            <View style={styles.clientInfoRight}>
              {quotation.client.phone && (
                <Text style={styles.clientDetail}>Tel: {quotation.client.phone}</Text>
              )}
              {quotation.client.address && (
                <Text style={styles.clientDetail}>{quotation.client.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Opportunity Information */}
        {quotation.opportunity && (
          <View style={styles.opportunitySection}>
            <Text style={styles.opportunityTitle}>Oportunidad Relacionada</Text>
            <Text style={styles.opportunityDetail}>Título: {quotation.opportunity.title}</Text>
            <Text style={styles.opportunityDetail}>Etapa: {quotation.opportunity.stage}</Text>
            <Text style={styles.opportunityDetail}>Valor: {formatCurrency(quotation.opportunity.value)}</Text>
          </View>
        )}

        {/* Description */}
        {quotation.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{quotation.description}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Servicios / Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
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
            
            {quotation.items.map((item, index) => (
              <View 
                key={item.id || index} 
                style={[
                  styles.tableRow, 
                  index === quotation.items.length - 1 ? styles.tableRowLast : {}
                ]}
              >
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

        {/* Totals */}
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

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Términos y Condiciones</Text>
          <Text style={styles.termsText}>
            • Esta cotización es válida hasta: {formatDate(quotation.validUntil)}{'\n'}
            • Los precios incluyen IVA donde aplique{'\n'}
            • Forma de pago: Por definir al momento de la contratación{'\n'}
            • Los servicios están sujetos a disponibilidad{'\n'}
            • Esta cotización no constituye una reserva definitiva
          </Text>
        </View>

      </Page>
    </Document>
  )
}

export default QuotationPDFTemplate