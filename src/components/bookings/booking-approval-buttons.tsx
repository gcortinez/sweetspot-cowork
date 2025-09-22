'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle, XCircle } from 'lucide-react'
import { approveBookingAction } from '@/lib/actions/booking'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BookingApprovalButtonsProps {
  booking: any
}

export function BookingApprovalButtons({ booking }: BookingApprovalButtonsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')

  const handleApproval = async (approved: boolean, notes?: string) => {
    setIsProcessing(true)

    try {
      const result = await approveBookingAction({
        id: booking.id,
        approved,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success(
          approved
            ? '✅ Reserva aprobada exitosamente'
            : '❌ Reserva rechazada'
        )

        // Refresh the page to show updated status
        router.refresh()

        // If we're in the rejection dialog, close it
        if (!approved) {
          setShowRejectDialog(false)
          setRejectionNotes('')
        }
      } else {
        toast.error(result.error || 'Error al procesar la aprobación')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Error al procesar la solicitud')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isProcessing}
          onClick={() => handleApproval(true)}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isProcessing ? 'Procesando...' : 'Aprobar Reserva'}
        </Button>

        <Button
          variant="destructive"
          className="flex-1"
          disabled={isProcessing}
          onClick={() => setShowRejectDialog(true)}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rechazar Reserva
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Reserva</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres rechazar esta reserva?
              Puedes agregar una nota explicando el motivo del rechazo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rejection-notes" className="text-sm font-medium">
                Motivo del rechazo (opcional)
              </label>
              <Textarea
                id="rejection-notes"
                placeholder="Explica el motivo del rechazo..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionNotes('')
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isProcessing}
              onClick={() => handleApproval(false, rejectionNotes)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              {isProcessing ? 'Procesando...' : 'Rechazar Reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}