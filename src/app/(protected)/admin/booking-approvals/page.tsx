import { Suspense } from 'react'
import { listBookingsAction } from '@/lib/actions/booking'
import { listSpacesAction } from '@/lib/actions/space'
import { BookingApprovalList } from '@/components/admin/booking-approvals/booking-approval-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, CheckCircle, XCircle, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function BookingApprovalsContent() {
  // Fetch bookings that require approval
  const [bookingsResult, spacesResult] = await Promise.all([
    listBookingsAction({
      page: 1,
      limit: 100,
      status: 'PENDING',
      requiresApproval: true,
      sortBy: 'startTime',
      sortOrder: 'asc',
    }),
    listSpacesAction({
      page: 1,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  ])

  const bookings = bookingsResult.success ? (bookingsResult.data?.bookings || []) : []
  const spaces = spacesResult.success ? (spacesResult.data?.spaces || []) : []

  // Fetch all approved/rejected bookings for stats
  const approvedBookingsResult = await listBookingsAction({
    page: 1,
    limit: 1000,
    requiresApproval: true,
    sortBy: 'approvedAt',
    sortOrder: 'desc',
  })

  const allApprovalBookings = approvedBookingsResult.success ? (approvedBookingsResult.data?.bookings || []) : []

  const stats = {
    pendingApprovals: bookings.length,
    approvedToday: allApprovalBookings.filter(b =>
      b.status === 'CONFIRMED' &&
      b.approvedAt &&
      new Date(b.approvedAt).toDateString() === new Date().toDateString()
    ).length,
    rejectedToday: allApprovalBookings.filter(b =>
      b.status === 'CANCELLED' &&
      b.cancellationReason === 'ADMIN_REJECTED' &&
      b.approvedAt &&
      new Date(b.approvedAt).toDateString() === new Date().toDateString()
    ).length,
    totalProcessed: allApprovalBookings.filter(b =>
      b.status === 'CONFIRMED' || (b.status === 'CANCELLED' && b.cancellationReason === 'ADMIN_REJECTED')
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Confirmadas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas Hoy</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejectedToday}</div>
            <p className="text-xs text-muted-foreground">
              Rechazadas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              En total histórico
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approval List */}
      <BookingApprovalList
        bookings={bookings}
        spaces={spaces.filter(s => s.isActive !== false)}
      />
    </div>
  )
}

function BookingApprovalsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingApprovalsPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver a Reservas
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Aprobaciones de Reservas
            </h1>
            <p className="text-muted-foreground">
              Gestiona las reservas que requieren aprobación administrativa
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<BookingApprovalsLoading />}>
        <BookingApprovalsContent />
      </Suspense>
    </div>
  )
}