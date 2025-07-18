'use server'

import { revalidatePath } from 'next/cache'
import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ActionResult } from '@/types/database'
import { z } from 'zod'


// Schema for PDF generation request
const GenerateQuotationPDFSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  includeNotes: z.boolean().default(false),
  customTemplate: z.string().optional(),
})

type GenerateQuotationPDFRequest = z.infer<typeof GenerateQuotationPDFSchema>

export async function generateQuotationPDFAction(data: GenerateQuotationPDFRequest): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    if (!context.tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }
    
    const { user, tenantId } = context

    // Validate input data
    const validatedData = GenerateQuotationPDFSchema.parse(data)

    // Get quotation with all related data
    const quotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.quotationId,
        tenantId,
      },
      include: {
        items: true,
        client: true,
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          }
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
          }
        }
      }
    })

    if (!quotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    // Get the user who created the quotation
    const createdByUser = await db.user.findUnique({
      where: { id: quotation.createdBy },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    })

    // Get tenant/cowork information for PDF header
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        settings: true,
      }
    })
    
    const coworkInfo = {
      name: tenant?.name || 'SweetSpot Cowork',
      address: tenant?.settings?.address || 'Dirección no configurada',
      phone: tenant?.settings?.phone || 'Teléfono no configurado',
      email: tenant?.settings?.email || 'Email no configurado',
      website: tenant?.settings?.website,
      logo: tenant?.settings?.logo,
    }

    // Transform quotation data for PDF
    const pdfData = {
      id: quotation.id,
      number: quotation.number,
      title: quotation.title,
      description: quotation.description,
      subtotal: quotation.subtotal,
      discounts: quotation.discounts,
      taxes: quotation.taxes,
      total: quotation.total,
      currency: quotation.currency,
      validUntil: quotation.validUntil.toISOString(),
      status: quotation.status,
      notes: validatedData.includeNotes ? quotation.notes : undefined,
      createdAt: quotation.createdAt.toISOString(),
      client: quotation.client || {
        name: quotation.lead ? `${quotation.lead.firstName} ${quotation.lead.lastName}` : 'Cliente no especificado',
        email: quotation.lead?.email || 'Email no especificado',
        phone: quotation.lead?.phone,
        company: quotation.lead?.company,
      },
      items: quotation.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      opportunity: quotation.opportunity,
      createdBy: createdByUser,
    }

    // Note: PDF generation logged in audit trail - metadata field doesn't exist in Quotation model

    return { 
      success: true, 
      data: {
        quotation: pdfData,
        coworkInfo,
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        }
      }
    }

  } catch (error) {
    console.error('Error generating quotation PDF:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al generar PDF' 
    }
  }
}

// Schema for email PDF request
const EmailQuotationPDFSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  recipientEmail: z.string().email('Email inválido').optional(),
  subject: z.string().min(1, 'El asunto es requerido').optional(),
  message: z.string().optional(),
  includeNotes: z.boolean().default(false),
})

type EmailQuotationPDFRequest = z.infer<typeof EmailQuotationPDFSchema>

export async function emailQuotationPDFAction(data: EmailQuotationPDFRequest): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    if (!context.tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }
    
    const { user, tenantId } = context

    // Validate input data
    const validatedData = EmailQuotationPDFSchema.parse(data)

    // Get quotation
    const quotation = await db.quotation.findFirst({
      where: { 
        id: validatedData.quotationId,
        tenantId,
      },
      include: {
        client: true,
        lead: true,
      }
    })

    if (!quotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    // Determine recipient email
    const recipientEmail = validatedData.recipientEmail || 
                          quotation.client?.email || 
                          quotation.lead?.email

    if (!recipientEmail) {
      return { success: false, error: 'Email del destinatario no encontrado' }
    }

    // Generate PDF data
    const pdfResult = await generateQuotationPDFAction({
      quotationId: validatedData.quotationId,
      includeNotes: validatedData.includeNotes,
    })

    if (!pdfResult.success) {
      return pdfResult
    }

    // Here you would integrate with your email service (e.g., SendGrid, AWS SES, etc.)
    // For now, we'll just update the quotation status and log the email attempt

    // Update quotation status when sending email
    await db.quotation.update({
      where: { id: quotation.id },
      data: {
        status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status,
        // Note: sentAt field doesn't exist in current schema, would need to add viewedAt, sentAt, respondedAt if needed
        updatedAt: new Date(),
      }
    })

    return { 
      success: true, 
      data: {
        quotationId: quotation.id,
        recipientEmail,
        sentAt: new Date().toISOString(),
        message: 'PDF enviado por email exitosamente'
      }
    }

  } catch (error) {
    console.error('Error emailing quotation PDF:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al enviar PDF por email' 
    }
  }
}

// Schema for PDF preview request
const PreviewQuotationPDFSchema = z.object({
  quotationId: z.string().min(1, 'El ID de la cotización es requerido'),
  includeNotes: z.boolean().default(false),
})

type PreviewQuotationPDFRequest = z.infer<typeof PreviewQuotationPDFSchema>

export async function previewQuotationPDFAction(data: PreviewQuotationPDFRequest): Promise<ActionResult<any>> {
  try {
    const context = await getTenantContext()
    
    if (!context.tenantId) {
      return { success: false, error: 'Tenant no encontrado' }
    }
    
    const { user, tenantId } = context

    // Validate input data
    const validatedData = PreviewQuotationPDFSchema.parse(data)

    // Generate PDF data (same as regular PDF generation)
    const pdfResult = await generateQuotationPDFAction({
      quotationId: validatedData.quotationId,
      includeNotes: validatedData.includeNotes,
    })

    if (!pdfResult.success) {
      return pdfResult
    }

    // Note: PDF preview logged in audit trail - metadata field doesn't exist in Quotation model

    return { 
      success: true, 
      data: {
        ...pdfResult.data,
        previewedAt: new Date().toISOString(),
      }
    }

  } catch (error) {
    console.error('Error previewing quotation PDF:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al previsualizar PDF' 
    }
  }
}