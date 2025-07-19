import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/auth'
import { db } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailRequest {
  quotationId: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await getTenantContext()
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant no encontrado' },
        { status: 401 }
      )
    }

    const body: SendEmailRequest = await request.json()
    const { quotationId, email, subject, message } = body

    // Validate input
    if (!quotationId || !email || !subject) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Get quotation with all related data
    const quotation = await db.quotation.findFirst({
      where: {
        id: quotationId,
        tenantId,
      },
      include: {
        items: true,
        client: true,
        opportunity: true,
        lead: true,
        tenant: true,
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Generate PDF URL (this would be the endpoint that generates the PDF)
    const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/${quotationId}/pdf`

    // Prepare email content
    const emailSubject = subject
    const emailMessage = message || `Estimado/a cliente,

Adjunto encontrará la cotización ${quotation.number} solicitada.

Si tiene alguna pregunta, no dude en contactarnos.

Saludos cordiales,
${quotation.tenant.name}`

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@sweetspotcowork.com',
      to: [email],
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Cotización ${quotation.number}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${quotation.tenant.name}</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <div style="white-space: pre-line; line-height: 1.6; margin-bottom: 30px;">
              ${emailMessage}
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Detalles de la Cotización</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Número:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${quotation.number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Título:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${quotation.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #28a745;">
                    $${quotation.total.toLocaleString()} ${quotation.currency}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Válida hasta:</td>
                  <td style="padding: 8px 0; font-weight: bold;">
                    ${new Date(quotation.validUntil).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${pdfUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold;
                        display: inline-block;">
                📄 Descargar Cotización PDF
              </a>
            </div>
            
            ${quotation.tenant.settings && (quotation.tenant.settings as any).contactInfo ? `
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 5px 0;">
                <strong>${quotation.tenant.name}</strong>
              </p>
              ${(quotation.tenant.settings as any).contactInfo.email ? `
              <p style="margin: 5px 0;">
                📧 ${(quotation.tenant.settings as any).contactInfo.email}
              </p>
              ` : ''}
              ${(quotation.tenant.settings as any).contactInfo.phone ? `
              <p style="margin: 5px 0;">
                📞 ${(quotation.tenant.settings as any).contactInfo.phone}
              </p>
              ` : ''}
              ${(quotation.tenant.settings as any).contactInfo.address ? `
              <p style="margin: 5px 0;">
                📍 ${(quotation.tenant.settings as any).contactInfo.address}
              </p>
              ` : ''}
            </div>
            ` : ''}
          </div>
        </div>
      `,
    })

    if (emailResult.error) {
      console.error('Error sending email:', emailResult.error)
      return NextResponse.json(
        { success: false, error: 'Error al enviar el email' },
        { status: 500 }
      )
    }

    // Update quotation status to SENT if it was DRAFT
    if (quotation.status === 'DRAFT') {
      await db.quotation.update({
        where: { id: quotationId },
        data: { status: 'SENT' },
      })
    }

    // Log the email activity (optional)
    // You could create an activity log here if needed

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      emailId: emailResult.data?.id,
    })

  } catch (error) {
    console.error('Error sending quotation email:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}