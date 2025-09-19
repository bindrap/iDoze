import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime, calculateUtilization } from '@/lib/utils'
import Link from 'next/link'

async function getMemberDashboardData(userId: string) {
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

async function getCoachDashboardData(userId: string) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [user, todaysSessions, weeklyStats, monthlyStats, totalStudents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        membershipStatus: true,
      }
    }),

    // Today's sessions for this coach
    prisma.classSession.findMany({
      where: {
        instructorId: userId,
        sessionDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        maxCapacity: true,
        class: { select: { name: true } },
        _count: {
          select: {
            bookings: {
              where: { bookingStatus: { in: ['BOOKED', 'CHECKED_IN'] } }
            },
            attendance: true
          }
        }
      }
    }),

    // This week's attendance for coach's classes
    prisma.attendance.count({
      where: {
        classSession: {
          instructorId: userId,
          sessionDate: { gte: startOfWeek }
        }
      }
    }),

    // This month's attendance for coach's classes
    prisma.attendance.count({
      where: {
        classSession: {
          instructorId: userId,
          sessionDate: { gte: startOfMonth }
        }
      }
    }),

    // Total students who have attended coach's classes
    prisma.user.count({
      where: {
        attendance: {
          some: {
            classSession: {
              instructorId: userId
            }
          }
        }
      }
    })
  ])

  return { user, todaysSessions, weeklyStats, monthlyStats, totalStudents }
}

async function getAdminDashboardData(userId: string) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [user, totalMembers, activeMembers, monthlyAttendance, todaysSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        membershipStatus: true,
      }
    }),

    // Total members
    prisma.user.count(),

    // Active members (attended in last 30 days)
    prisma.user.count({
      where: {
        attendance: {
          some: {
            checkInTime: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }),

    // This month's total attendance
    prisma.attendance.count({
      where: {
        checkInTime: { gte: startOfMonth }
      }
    }),

    // Today's sessions across all classes
    prisma.classSession.findMany({
      where: {
        sessionDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        maxCapacity: true,
        class: { select: { name: true } },
        instructor: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            bookings: {
              where: { bookingStatus: { in: ['BOOKED', 'CHECKED_IN'] } }
            },
            attendance: true
          }
        }
      },
      take: 5
    })
  ])

  return { user, totalMembers, activeMembers, monthlyAttendance, todaysSessions }
}

// Member Dashboard Component
function MemberDashboard({ user: profile, upcomingBookings, recentAttendance, memberProgress }: any) {
  return (
    <>
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
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
                {upcomingBookings.map((booking: any) => (
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
                {recentAttendance.map((attendance: any) => (
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
    </>
  )
}

// Coach Dashboard Component
function CoachDashboard({ user: profile, todaysSessions, weeklyStats, monthlyStats, totalStudents }: any) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, Coach {profile.firstName}!</h1>
        <p className="text-muted-foreground">
          Your coaching dashboard with class insights and student progress
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students taught</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{weeklyStats}</div>
            <p className="text-xs text-muted-foreground">Class attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{monthlyStats}</div>
            <p className="text-xs text-muted-foreground">Class attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{todaysSessions.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your classes scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysSessions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{session.class.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{session._count.bookings}/{session.maxCapacity}</p>
                      <p className="text-xs text-muted-foreground">booked/capacity</p>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/check-in">
                  <Button variant="outline" className="w-full">Manage Check-ins</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/check-in">
              <Button className="w-full">Check-in Students</Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full">View Analytics</Button>
            </Link>
            <Link href="/dashboard/classes">
              <Button variant="outline" className="w-full">Manage Classes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Admin Dashboard Component
function AdminDashboard({ user: profile, totalMembers, activeMembers, monthlyAttendance, todaysSessions }: any) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {profile.firstName}!</h1>
        <p className="text-muted-foreground">
          Administrative dashboard with gym overview and management tools
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Active in 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{monthlyAttendance}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Member activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Sessions</CardTitle>
            <CardDescription>All classes scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysSessions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{session.class.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Coach: {session.instructor.firstName} {session.instructor.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{session._count.bookings}/{session.maxCapacity}</p>
                      <p className="text-xs text-muted-foreground">booked/capacity</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/members">
              <Button className="w-full">Manage Members</Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full">View Analytics</Button>
            </Link>
            <Link href="/dashboard/admin/newsletters">
              <Button variant="outline" className="w-full">Manage Newsletters</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default async function DashboardPage() {
  const user = await requireAuth()

  if (user.role === 'COACH') {
    const data = await getCoachDashboardData(user.id)
    if (!data.user) return <div>User not found</div>
    return (
      <div className="container mx-auto py-8 px-4">
        <CoachDashboard {...data} />
      </div>
    )
  }

  if (user.role === 'ADMIN') {
    const data = await getAdminDashboardData(user.id)
    if (!data.user) return <div>User not found</div>
    return (
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard {...data} />
      </div>
    )
  }

  // Default to member dashboard
  const data = await getMemberDashboardData(user.id)
  if (!data.user) return <div>User not found</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <MemberDashboard {...data} />
    </div>
  )
}