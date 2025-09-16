'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { QrCode, Download, Copy, RefreshCw, Calendar, Clock, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Booking {
  id: string
  title: string
  spaceId: string
  spaceName: string
  startDateTime: string
  endDateTime: string
  attendeeCount: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  qrCodeData?: string
}

interface QRCodeGeneratorProps {
  booking: Booking
  onRegenerateQR?: () => void
  showBookingDetails?: boolean
  size?: number
}

export function QRCodeGenerator({
  booking,
  onRegenerateQR,
  showBookingDetails = true,
  size = 200,
}: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQRCode = async (data: string) => {
    try {
      setIsGenerating(true)
      const QRCode = await import('qrcode')

      const qrOptions = {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }

      const dataURL = await QRCode.toDataURL(data, qrOptions)
      setQrCodeDataURL(dataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (booking.qrCodeData) {
      generateQRCode(booking.qrCodeData)
    } else {
      // Generate QR data if not provided
      const qrData = JSON.stringify({
        bookingId: booking.id,
        spaceId: booking.spaceId,
        timestamp: Date.now(),
        type: 'space_access'
      })
      generateQRCode(qrData)
    }
  }, [booking.qrCodeData, booking.id, booking.spaceId, size])

  const handleDownload = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = `booking-qr-${booking.id}.png`
    link.href = qrCodeDataURL
    link.click()
    toast.success('QR code downloaded')
  }

  const handleCopy = async () => {
    if (!qrCodeDataURL) return

    try {
      const response = await fetch(qrCodeDataURL)
      const blob = await response.blob()

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ])
        toast.success('QR code copied to clipboard')
      } else {
        // Fallback for browsers that don't support clipboard API
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)

          canvas.toBlob(async (blob) => {
            if (blob && navigator.clipboard) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
                ])
                toast.success('QR code copied to clipboard')
              } catch {
                toast.error('Could not copy QR code')
              }
            }
          })
        }
        img.src = qrCodeDataURL
      }
    } catch (error) {
      console.error('Error copying QR code:', error)
      toast.error('Failed to copy QR code')
    }
  }

  const handleRegenerate = async () => {
    if (onRegenerateQR) {
      onRegenerateQR()
    } else {
      // Generate new QR with updated timestamp
      const qrData = JSON.stringify({
        bookingId: booking.id,
        spaceId: booking.spaceId,
        timestamp: Date.now(),
        type: 'space_access'
      })
      await generateQRCode(qrData)
      toast.success('QR code regenerated')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Access QR Code
        </CardTitle>
        <CardDescription>
          Scan this QR code to check in/out of the space
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {isGenerating ? (
            <Skeleton className="rounded-lg" style={{ width: size, height: size }} />
          ) : qrCodeDataURL ? (
            <div className="border rounded-lg p-4 bg-white">
              <img
                src={qrCodeDataURL}
                alt="Booking QR Code"
                className="block"
                style={{ width: size, height: size }}
              />
            </div>
          ) : (
            <div
              className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center"
              style={{ width: size, height: size }}
            >
              <div className="text-center text-muted-foreground">
                <QrCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Failed to generate QR code</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrCodeDataURL}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!qrCodeDataURL}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>

        {/* Booking Details */}
        {showBookingDetails && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Booking Details</h4>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{booking.title}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.spaceName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(booking.startDateTime), 'MMM dd, HH:mm')} - {format(new Date(booking.endDateTime), 'HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{booking.attendeeCount} attendees</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <h5 className="font-medium mb-2">How to use:</h5>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Show this QR code to the space access scanner</li>
            <li>Or use the mobile app to scan for check-in</li>
            <li>The system will automatically log your entry/exit</li>
            <li>Keep this QR code accessible during your booking</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}