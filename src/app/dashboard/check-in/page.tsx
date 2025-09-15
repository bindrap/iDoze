import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Users, Clock, UserCheck, Search } from 'lucide-react'
import { redirect } from 'next/navigation'

async function getTodaysSessions() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return prisma.classSession.findMany({
    where: {
      sessionDate: {
        gte: startOfDay,
        lt: endOfDay
      }
    },
    include: {
      class: {
        select: {
          name: true,
          skillLevel: true,
        }
      },
      instructor: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      bookings: {
        where: {
          bookingStatus: {
            in: ['BOOKED', 'CHECKED_IN']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      attendance: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  })
}

export default async function CheckInPage() {
  const user = await requireAuth()

  // Only coaches and admins can access this page
  if (user.role !== 'COACH' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const sessions = await getTodaysSessions()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Class Check-In</h1>
        <p className="text-muted-foreground">
          Manage student check-ins for today's classes
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No classes today</h3>
            <p className="text-muted-foreground">
              There are no scheduled classes for today
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => {
            const checkedInCount = session.attendance.length
            const bookedCount = session.bookings.length
            const isOngoing = new Date() >= new Date(`${formatDate(session.sessionDate)} ${session.startTime}`) &&
                             new Date() <= new Date(`${formatDate(session.sessionDate)} ${session.endTime}`)
            const isUpcoming = new Date() < new Date(`${formatDate(session.sessionDate)} ${session.startTime}`)
            const isPast = new Date() > new Date(`${formatDate(session.sessionDate)} ${session.endTime}`)

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {session.class.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </span>
                        <span>
                          Instructor: {session.instructor.firstName} {session.instructor.lastName}
                        </span>
                        <span>{session.class.skillLevel}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-3 py-1 text-sm rounded-full ${
                        isOngoing ? 'bg-green-100 text-green-800' :
                        isUpcoming ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isOngoing ? 'Ongoing' : isUpcoming ? 'Upcoming' : 'Completed'}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          {checkedInCount}/{bookedCount} checked in
                        </span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {session.bookings.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No bookings for this class</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-medium">Booked Students:</h4>
                      <div className="grid gap-2">
                        {session.bookings.map((booking) => {
                          const isCheckedIn = session.attendance.some(a => a.userId === booking.userId)
                          return (
                            <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {booking.user.firstName} {booking.user.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.user.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isCheckedIn ? (
                                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Checked In
                                  </span>
                                ) : (
                                  <Button size="sm" disabled={isPast}>
                                    Check In
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {!isPast && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Walk-in Check-in:</h4>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <Button variant="outline">
                              <Search className="w-4 h-4 mr-2" />
                              Search
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}