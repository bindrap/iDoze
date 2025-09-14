import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, calculateUtilization } from '@/lib/utils'
import Link from 'next/link'

async function getUserDashboardData(userId: string) {
  const [user, upcomingBookings, recentAttendance, memberProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        membershipStatus: true,
        isOnBench: true,
        benchReason: true,
        benchEndDate: true,
      }
    }),

    prisma.booking.findMany({
      where: {
        userId,
        bookingStatus: {
          in: ['BOOKED', 'CHECKED_IN']
        },
        classSession: {
          sessionDate: {
            gte: new Date()
          }
        }
      },
      take: 5,
      orderBy: {
        classSession: {
          sessionDate: 'asc'
        }
      },
      include: {
        classSession: {
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
            }
          }
        }
      }
    }),

    prisma.attendance.findMany({
      where: { userId },
      take: 5,
      orderBy: {
        checkInTime: 'desc'
      },
      include: {
        classSession: {
          include: {
            class: {
              select: {
                name: true,
                skillLevel: true,
              }
            }
          }
        }
      }
    }),

    prisma.memberProgress.findFirst({
      where: { userId }
    })
  ])

  return { user, upcomingBookings, recentAttendance, memberProgress }
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const { user: profile, upcomingBookings, recentAttendance, memberProgress } = await getUserDashboardData(user.id)

  if (!profile) {
    return <div>User not found</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {profile.firstName}!</h1>
        <p className="text-muted-foreground">
          Membership Status: <span className={`font-semibold ${
            profile.membershipStatus === 'ACTIVE' ? 'text-green-600' :
            profile.membershipStatus === 'SUSPENDED' ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {profile.membershipStatus}
          </span>
        </p>
      </div>

      {profile.isOnBench && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">On Bench</CardTitle>
            <CardDescription className="text-yellow-700">
              You are currently marked as unavailable for classes.
              {profile.benchEndDate && ` Expected return: ${formatDate(profile.benchEndDate)}`}
            </CardDescription>
          </CardHeader>
          {profile.benchReason && (
            <CardContent>
              <p className="text-yellow-800">Reason: {profile.benchReason}</p>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {memberProgress?.totalClassesAttended || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {memberProgress?.beltRank || 'White Belt'}
                </p>
                <p className="text-sm text-muted-foreground">Current Rank</p>
              </div>
            </div>
            {memberProgress?.lastAttendanceDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Last attended: {formatDate(memberProgress.lastAttendanceDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/classes">
              <Button className="w-full">Browse Classes</Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="outline" className="w-full">My Bookings</Button>
            </Link>
            <Link href="/dashboard/attendance">
              <Button variant="outline" className="w-full">Attendance History</Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full">Update Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
            <CardDescription>Your next booked sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No upcoming classes booked</p>
                <Link href="/dashboard/classes">
                  <Button>Book a Class</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{booking.classSession.class.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.classSession.sessionDate)} at {formatTime(booking.classSession.startTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Instructor: {booking.classSession.instructor.firstName} {booking.classSession.instructor.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.bookingStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.bookingStatus === 'CHECKED_IN' ? 'Checked In' : 'Booked'}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.classSession.class.skillLevel}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/bookings">
                  <Button variant="outline" className="w-full">View All Bookings</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your latest class attendances</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent attendance</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAttendance.map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{attendance.classSession.class.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(attendance.checkInTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        attendance.attendanceStatus === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        attendance.attendanceStatus === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {attendance.attendanceStatus}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {attendance.classSession.class.skillLevel}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/attendance">
                  <Button variant="outline" className="w-full">View All Attendance</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}