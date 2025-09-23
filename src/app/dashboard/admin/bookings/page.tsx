import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, User, Filter, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

async function getBookings() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  return prisma.booking.findMany({
    where: {
      classSession: {
        sessionDate: {
          gte: sevenDaysAgo,
          lte: sevenDaysFromNow
        }
      }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      classSession: {
        include: {
          class: {
            select: {
              name: true,
              skillLevel: true,
              instructor: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { classSession: { sessionDate: 'desc' } },
      { bookingDate: 'desc' }
    ]
  })
}

async function getBookingStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalBookings,
    todayBookings,
    upcomingBookings,
    cancelledBookings
  ] = await Promise.all([
    prisma.booking.count(),

    prisma.booking.count({
      where: {
        classSession: {
          sessionDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      }
    }),

    prisma.booking.count({
      where: {
        bookingStatus: {
          in: ['BOOKED', 'CHECKED_IN']
        },
        classSession: {
          sessionDate: {
            gte: today
          }
        }
      }
    }),

    prisma.booking.count({
      where: {
        bookingStatus: 'CANCELLED'
      }
    })
  ])

  return {
    totalBookings,
    todayBookings,
    upcomingBookings,
    cancelledBookings
  }
}

export default async function AdminBookingsPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const bookings = await getBookings()
  const stats = await getBookingStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'bg-blue-100 text-blue-800'
      case 'CHECKED_IN': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const today = new Date()
  const upcomingBookings = bookings.filter(booking =>
    new Date(booking.classSession.sessionDate) >= today
  )
  const pastBookings = bookings.filter(booking =>
    new Date(booking.classSession.sessionDate) < today
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <p className="text-muted-foreground">
          View and manage all class bookings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">Classes today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">Future bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelledBookings}</div>
            <p className="text-xs text-muted-foreground">Total cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Bookings</h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming bookings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.slice(0, 10).map((booking) => (
              <Card key={booking.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {booking.user.firstName} {booking.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{booking.classSession.class.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.classSession.class.instructor
                            ? `${booking.classSession.class.instructor.firstName} ${booking.classSession.class.instructor.lastName}`
                            : 'No instructor assigned'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.classSession.sessionDate)}
                        <Clock className="w-4 h-4 ml-2" />
                        {formatTime(booking.classSession.startTime)} - {formatTime(booking.classSession.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(booking.bookingStatus)}>
                        {booking.bookingStatus}
                      </Badge>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Booked on</p>
                        <p>{formatDate(booking.bookingDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Past Bookings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        {pastBookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recent bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pastBookings.slice(0, 5).map((booking) => (
              <Card key={booking.id} className="opacity-75">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {booking.user.firstName} {booking.user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.user.email}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{booking.classSession.class.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.classSession.class.instructor
                            ? `${booking.classSession.class.instructor.firstName} ${booking.classSession.class.instructor.lastName}`
                            : 'No instructor assigned'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(booking.classSession.sessionDate)}
                        <Clock className="w-4 h-4 ml-2" />
                        {formatTime(booking.classSession.startTime)} - {formatTime(booking.classSession.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(booking.bookingStatus)}>
                        {booking.bookingStatus}
                      </Badge>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Booked on</p>
                        <p>{formatDate(booking.bookingDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}