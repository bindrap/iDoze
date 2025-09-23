import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'
import { Users, Calendar, TrendingUp, AlertCircle, CreditCard } from 'lucide-react'

async function getBusinessMetrics() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalMembers,
    activeMembers,
    totalClasses,
    upcomingClasses,
    totalAttendance,
    recentAttendance,
    utilizationData,
    benchMembers
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE'
      }
    }),

    prisma.user.count({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE'
      }
    }),

    prisma.class.count(),

    prisma.classSession.count({
      where: {
        sessionDate: {
          gte: now
        },
        status: 'SCHEDULED'
      }
    }),

    prisma.attendance.count(),

    prisma.attendance.count({
      where: {
        checkInTime: {
          gte: thirtyDaysAgo
        }
      }
    }),

    prisma.classSession.findMany({
      where: {
        sessionDate: {
          gte: thirtyDaysAgo,
          lte: now
        },
        status: {
          in: ['COMPLETED', 'IN_PROGRESS']
        }
      },
      include: {
        _count: {
          select: {
            attendance: true,
            bookings: true
          }
        }
      }
    }),

    prisma.user.count({
      where: {
        role: 'MEMBER',
        isOnBench: true
      }
    })
  ])

  // Calculate utilization rate
  let totalCapacity = 0
  let totalAttended = 0

  utilizationData.forEach(session => {
    totalCapacity += session.maxCapacity
    totalAttended += session._count.attendance
  })

  const utilizationRate = totalCapacity > 0 ? (totalAttended / totalCapacity) * 100 : 0

  return {
    totalMembers,
    activeMembers,
    totalClasses,
    upcomingClasses,
    totalAttendance,
    recentAttendance,
    utilizationRate: Math.round(utilizationRate),
    benchMembers
  }
}

async function getRecentBookings() {
  return prisma.booking.findMany({
    take: 10,
    orderBy: {
      bookingDate: 'desc'
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      classSession: {
        include: {
          class: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })
}

async function getClassUtilization() {
  const classes = await prisma.class.findMany({
    include: {
      sessions: {
        where: {
          sessionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          _count: {
            select: {
              attendance: true
            }
          }
        }
      }
    }
  })

  return classes.map(cls => {
    const totalCapacity = cls.sessions.reduce((sum, session) => sum + session.maxCapacity, 0)
    const totalAttendance = cls.sessions.reduce((sum, session) => sum + session._count.attendance, 0)
    const utilization = totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0

    return {
      id: cls.id,
      name: cls.name,
      skillLevel: cls.skillLevel,
      sessionsCount: cls.sessions.length,
      totalCapacity,
      totalAttendance,
      utilization
    }
  })
}

export default async function AdminDashboard() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const metrics = await getBusinessMetrics()
  const recentBookings = await getRecentBookings()
  const classUtilization = await getClassUtilization()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Business Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of gym operations and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeMembers} active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 50% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalClasses} total class types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members on Bench</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.benchMembers}</div>
            <p className="text-xs text-muted-foreground">
              Unavailable members
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Class Utilization Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Class Utilization (Last 30 Days)</CardTitle>
            <CardDescription>Performance by class type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classUtilization.map((cls) => (
                <div key={cls.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.sessionsCount} sessions • {cls.skillLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{cls.utilization}%</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.totalAttendance}/{cls.totalCapacity}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        cls.utilization >= 50 ? 'bg-green-600' :
                        cls.utilization >= 30 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(cls.utilization, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest member activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.slice(0, 8).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {booking.user.firstName} {booking.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.classSession.class.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      booking.bookingStatus === 'BOOKED' ? 'bg-blue-100 text-blue-800' :
                      booking.bookingStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                      booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/admin/bookings">
                <Button variant="outline" className="w-full">View All Bookings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Admin */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
            <CardDescription>Manage gym members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/members">
              <Button className="w-full">View All Members</Button>
            </Link>
            <Link href="/dashboard/admin/members/new">
              <Button variant="outline" className="w-full">Add New Member</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
            <CardDescription>Track and manage payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/payments">
              <Button className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Payments
              </Button>
            </Link>
            <Link href="/dashboard/admin/payments/overdue">
              <Button variant="outline" className="w-full">View Overdue</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>Manage classes and sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/classes">
              <Button className="w-full">Manage Classes</Button>
            </Link>
            <Link href="/dashboard/admin/sessions">
              <Button variant="outline" className="w-full">Class Sessions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>Analytics and newsletters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/analytics">
              <Button className="w-full">Analytics</Button>
            </Link>
            <Link href="/dashboard/admin/newsletters">
              <Button variant="outline" className="w-full">Newsletters</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}