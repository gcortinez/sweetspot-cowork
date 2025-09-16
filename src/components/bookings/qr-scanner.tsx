'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Camera, CameraOff, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface ScanResult {
  bookingId: string
  spaceId: string
  timestamp: number
  type: string
}

interface CheckInOutResult {
  success: boolean
  action: 'CHECK_IN' | 'CHECK_OUT'
  booking?: {
    id: string
    title: string
    spaceName: string
    status: string
  }
  error?: string
}

interface QRScannerProps {
  onScanSuccess?: (result: ScanResult) => void
  onCheckInOut?: (result: CheckInOutResult) => void
  className?: string
}

export function QRScanner({ onScanSuccess, onCheckInOut, className }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [lastScanResult, setLastScanResult] = useState<CheckInOutResult | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [codeReader, setCodeReader] = useState<any>(null)

  useEffect(() => {
    let reader: any = null

    const initializeScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        reader = new BrowserMultiFormatReader()
        setCodeReader(reader)
      } catch (error) {
        console.error('Error initializing QR scanner:', error)
        setError('Failed to initialize camera scanner')
      }
    }

    initializeScanner()

    return () => {
      if (reader) {
        reader.reset()
      }
    }
  }, [])

  const startScanning = async () => {
    if (!codeReader || !videoRef.current) return

    try {
      setIsScanning(true)
      setError('')

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      })

      setHasPermission(true)

      // Start decoding
      codeReader.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result: any, error: any) => {
          if (result) {
            handleScanResult(result.getText())
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.warn('QR scan error:', error)
          }
        }
      )
    } catch (error: any) {
      console.error('Error starting camera:', error)
      setHasPermission(false)

      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan QR codes.')
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset()
    }
    setIsScanning(false)
  }

  const handleScanResult = async (qrText: string) => {
    try {
      const scanData: ScanResult = JSON.parse(qrText)

      // Validate QR code structure
      if (!scanData.bookingId || !scanData.spaceId || !scanData.type) {
        throw new Error('Invalid QR code format')
      }

      // Stop scanning temporarily to prevent multiple scans
      stopScanning()

      // Trigger scan success callback
      if (onScanSuccess) {
        onScanSuccess(scanData)
      }

      // Simulate check-in/check-out API call
      const checkInOutResult = await performCheckInOut(scanData)
      setLastScanResult(checkInOutResult)

      if (onCheckInOut) {
        onCheckInOut(checkInOutResult)
      }

      if (checkInOutResult.success) {
        toast.success(`${checkInOutResult.action === 'CHECK_IN' ? 'Checked in' : 'Checked out'} successfully`)
      } else {
        toast.error(checkInOutResult.error || 'Check-in/out failed')
      }

    } catch (error) {
      console.error('Error processing QR code:', error)
      toast.error('Invalid QR code or processing failed')

      // Resume scanning after a brief delay
      setTimeout(() => {
        if (!isScanning) {
          startScanning()
        }
      }, 2000)
    }
  }

  const performCheckInOut = async (scanData: ScanResult): Promise<CheckInOutResult> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock check-in/out logic
    // In real implementation, this would call a server action
    const isCurrentlyCheckedIn = Math.random() > 0.5 // Random for demo
    const action = isCurrentlyCheckedIn ? 'CHECK_OUT' : 'CHECK_IN'

    return {
      success: true,
      action,
      booking: {
        id: scanData.bookingId,
        title: 'Team Meeting',
        spaceName: 'Conference Room A',
        status: 'CONFIRMED'
      }
    }
  }

  const resetScanner = () => {
    setLastScanResult(null)
    setError('')
    if (!isScanning) {
      startScanning()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Scan booking QR codes for space check-in and check-out
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative">
          <div className="aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <Badge variant="secondary" className="bg-black bg-opacity-50 text-white">
                    Scanning for QR codes...
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} disabled={!codeReader}>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button variant="outline" onClick={stopScanning}>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}

          {lastScanResult && (
            <Button variant="outline" onClick={resetScanner}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Scan Again
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        {hasPermission === false && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera permission is required to scan QR codes. Please enable camera access in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Last Scan Result */}
        {lastScanResult && (
          <Alert className={lastScanResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {lastScanResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {lastScanResult.success ? (
                <div className="space-y-1">
                  <div className="font-medium text-green-800">
                    {lastScanResult.action === 'CHECK_IN' ? 'Checked In Successfully' : 'Checked Out Successfully'}
                  </div>
                  {lastScanResult.booking && (
                    <div className="text-sm text-green-700">
                      {lastScanResult.booking.title} - {lastScanResult.booking.spaceName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="font-medium text-red-800">
                  {lastScanResult.error || 'Check-in/out failed'}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <h5 className="font-medium mb-2">How to scan:</h5>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Allow camera access when prompted</li>
            <li>Position the QR code within the scanning area</li>
            <li>Hold steady until the code is recognized</li>
            <li>The system will automatically process check-in/out</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}