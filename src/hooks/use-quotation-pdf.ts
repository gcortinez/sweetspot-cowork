'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { useToast } from '@/hooks/use-toast'
import QuotationPDFTemplate from '@/components/quotations/QuotationPDFTemplate'

interface QuotationPDFData {
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

interface CoworkInfo {
  name: string
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
}

export const useQuotationPDF = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Default cowork info - this could be fetched from settings/tenant config
  const defaultCoworkInfo: CoworkInfo = {
    name: 'SweetSpot Cowork',
    address: 'Calle 123 #45-67, Bogotá, Colombia',
    phone: '+57 (1) 234-5678',
    email: 'info@sweetspot.com',
    website: 'www.sweetspot.com'
  }

  const generatePDF = async (quotation: QuotationPDFData, coworkInfo?: CoworkInfo) => {
    setIsGenerating(true)
    
    try {
      const info = coworkInfo || defaultCoworkInfo
      
      // Create PDF document
      const doc = QuotationPDFTemplate({ quotation, coworkInfo: info })
      
      // Generate PDF blob
      const blob = await pdf(doc).toBlob()
      
      return blob
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "Error al generar el PDF",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPDF = async (quotation: QuotationPDFData, coworkInfo?: CoworkInfo) => {
    try {
      const blob = await generatePDF(quotation, coworkInfo)
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cotizacion-${quotation.number}.pdf`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
      
      toast({
        title: "PDF generado",
        description: "El PDF ha sido descargado exitosamente",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Error",
        description: "Error al descargar el PDF",
        variant: "destructive",
      })
    }
  }

  const previewPDF = async (quotation: QuotationPDFData, coworkInfo?: CoworkInfo) => {
    try {
      const blob = await generatePDF(quotation, coworkInfo)
      
      // Create preview URL
      const url = URL.createObjectURL(blob)
      
      // Open in new tab
      window.open(url, '_blank')
      
      // Clean up after a delay to allow the browser to load the PDF
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 5000)
      
      toast({
        title: "Vista previa generada",
        description: "El PDF se ha abierto en una nueva pestaña",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error previewing PDF:', error)
      toast({
        title: "Error",
        description: "Error al generar la vista previa",
        variant: "destructive",
      })
    }
  }

  const emailPDF = async (quotation: QuotationPDFData, coworkInfo?: CoworkInfo) => {
    try {
      const blob = await generatePDF(quotation, coworkInfo)
      
      // Convert blob to base64 for email attachment
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      
      // Here you would typically send this to your email service
      // For now, we'll just show a success message
      toast({
        title: "PDF preparado",
        description: "El PDF está listo para ser enviado por email",
        duration: 3000,
      })
      
      return base64
    } catch (error) {
      console.error('Error preparing PDF for email:', error)
      toast({
        title: "Error",
        description: "Error al preparar el PDF para envío",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    generatePDF,
    downloadPDF,
    previewPDF,
    emailPDF,
    isGenerating,
  }
}

export default useQuotationPDF