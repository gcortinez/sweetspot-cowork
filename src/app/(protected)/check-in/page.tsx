import { Suspense } from 'react'
import { QRScanner } from '@/components/bookings/qr-scanner'
import { QRCodeGenerator } from '@/components/bookings/qr-code-generator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QrCode, Calendar, Clock, Users, TrendingUp, LogIn, LogOut } from 'lucide-react'
import { format } from 'date-fns'

// Mock data - in real implementation, this would come from server actions
const mockActiveBookings = [
  {
    id: 'booking-1',
    title: 'Team Meeting',
    spaceId: 'space-1',
    spaceName: 'Conference Room A',
    startDateTime: '2024-01-15T09:00:00',
    endDateTime: '2024-01-15T11:00:00',
    attendeeCount: 8,
    status: 'CONFIRMED' as const,
    qrCodeData: JSON.stringify({
      bookingId: 'booking-1',
      spaceId: 'space-1',
      timestamp: Date.now(),
      type: 'space_access'
    })
  },
  {
    id: 'booking-2',
    title: 'Client Presentation',
    spaceId: 'space-2',
    spaceName: 'Meeting Room B',
    startDateTime: '2024-01-15T14:00:00',
    endDateTime: '2024-01-15T16:00:00',
    attendeeCount: 12,
    status: 'CONFIRMED' as const,
    qrCodeData: JSON.stringify({
      bookingId: 'booking-2',
      spaceId: 'space-2',
      timestamp: Date.now(),
      type: 'space_access'
    })
  }
]

const mockCheckInActivity = [
  {
    id: '1',
    bookingId: 'booking-1',
    bookingTitle: 'Team Meeting',
    spaceName: 'Conference Room A',
    action: 'CHECK_IN' as const,
    timestamp: '2024-01-15T09:05:00',
    userName: 'John Doe'
  },
  {
    id: '2',
    bookingId: 'booking-1',
    bookingTitle: 'Team Meeting',
    spaceName: 'Conference Room A',
    action: 'CHECK_OUT' as const,
    timestamp: '2024-01-15T10:58:00',
    userName: 'John Doe'
  },
  {
    id: '3',
    bookingId: 'booking-2',
    bookingTitle: 'Client Presentation',
    spaceName: 'Meeting Room B',
    action: 'CHECK_IN' as const,
    timestamp: '2024-01-15T14:02:00',
    userName: 'Jane Smith'
  }
]

async function CheckInContent() {
  // In real implementation, fetch data from server actions
  const activeBookings = mockActiveBookings
  const checkInActivity = mockCheckInActivity

  const stats = {
    activeBookings: activeBookings.length,
    checkedInToday: checkInActivity.filter(a => a.action === 'CHECK_IN').length,
    checkedOutToday: checkInActivity.filter(a => a.action === 'CHECK_OUT').length,
    currentlyInSpaces: checkInActivity.filter(a => a.action === 'CHECK_IN').length -
                      checkInActivity.filter(a => a.action === 'CHECK_OUT').length
  }

  const handleScanSuccess = (result: any) => {
    console.log('QR Scan successful:', result)
  }

  const handleCheckInOut = (result: any) => {
    console.log('Check-in/out result:', result)
    // In real implementation, this would trigger a refresh of the page data
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.checkedInToday}</div>
            <p className="text-xs text-muted-foreground">
              Space entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-outs Today</CardTitle>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.checkedOutToday}</div>
            <p className="text-xs text-muted-foreground">
              Space exits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently In Spaces</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentlyInSpaces}</div>
            <p className="text-xs text-muted-foreground">
              Active occupancy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="my-bookings">My QR Codes</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* QR Scanner Tab */}
        <TabsContent value="scanner">
          <div className="grid gap-6 lg:grid-cols-2">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onCheckInOut={handleCheckInOut}
            />

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>
                  How to use the QR code system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Get Your QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Find your booking in the "My QR Codes" tab to display the access QR code
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Scan for Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Use this scanner to scan your QR code when entering or leaving the space
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Automatic Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        The system automatically tracks your check-in and check-out times
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Keep your QR code easily accessible on your phone for quick scanning
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My QR Codes Tab */}
        <TabsContent value="my-bookings">
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <div key={booking.id} className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{booking.title}</CardTitle>
                      <Badge variant="outline">{booking.status}</Badge>
                    </div>
                    <CardDescription>
                      {booking.spaceName} • {format(new Date(booking.startDateTime), 'MMM dd, HH:mm')} - {format(new Date(booking.endDateTime), 'HH:mm')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {booking.attendeeCount} attendees
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.round((new Date(booking.endDateTime).getTime() - new Date(booking.startDateTime).getTime()) / (1000 * 60))} minutes
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <QRCodeGenerator
                  booking={booking}
                  showBookingDetails={false}
                  size={180}
                />
              </div>
            ))}

            {activeBookings.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Active Bookings</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any confirmed bookings at this time.
                  </p>
                  <Button asChild>
                    <a href="/bookings/new">Create New Booking</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Check-in Activity</CardTitle>
              <CardDescription>
                Latest space access logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkInActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.action === 'CHECK_IN'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.action === 'CHECK_IN' ? (
                          <LogIn className="h-4 w-4" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{activity.bookingTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.spaceName} • {activity.userName}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                ))}

                {checkInActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No check-in activity yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CheckInLoading() {
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

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="w-full h-96" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckInPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            Space Access
          </h1>
          <p className="text-muted-foreground">
            QR code check-in and check-out system
          </p>
        </div>
      </div>

      <Suspense fallback={<CheckInLoading />}>
        <CheckInContent />
      </Suspense>
    </div>
  )
}