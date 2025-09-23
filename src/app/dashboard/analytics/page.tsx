import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { BarChart3, Users, Calendar, TrendingUp, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'

async function getAnalyticsData() {
  const [
    totalActiveMembers,
    recentlyActiveMembers,
    totalClasses,
    thisMonthAttendance,
    todaysSessions,
    classesByDay,
    attendanceByMonth
  ] = await Promise.all([
    // Total active members
    prisma.user.count({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE'
      }
    }),

    // Recently active members (attended class in last 30 days)
    prisma.user.count({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE',
        attendance: {
          some: {
            checkInTime: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }),

    // Total classes
    prisma.class.count({
      where: { isActive: true }
    }),

    // This month's attendance
    prisma.attendance.count({
      where: {
        checkInTime: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),

    // Today's sessions
    (() => {
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
              maxCapacity: true
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  bookingStatus: { in: ['BOOKED', 'CHECKED_IN'] }
                }
              },
              attendance: true
            }
          }
        }
      })
    })(),

    // Classes by day of week
    prisma.class.groupBy({
      by: ['dayOfWeek'],
      where: { isActive: true, dayOfWeek: { not: null } },
      _count: { id: true }
    }),

    // Attendance by month (last 6 months)
    (() => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      return prisma.attendance.findMany({
        where: {
          checkInTime: { gte: sixMonthsAgo }
        },
        select: {
          checkInTime: true
        }
      })
    })()
  ])

  // Process attendance by month
  const attendanceByMonthProcessed = attendanceByMonth.reduce((acc, record) => {
    const month = new Date(record.checkInTime).toLocaleString('default', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalActiveMembers,
    recentlyActiveMembers,
    totalClasses,
    thisMonthAttendance,
    todaysSessions,
    classesByDay,
    attendanceByMonthProcessed
  }
}

export default async function AnalyticsPage() {
  const user = await requireAuth()

  // Only coaches and admins can access this page
  if (user.role !== 'COACH' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const analytics = await getAnalyticsData()

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Insights and statistics for gym management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalActiveMembers}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentlyActiveMembers}</div>
            <p className="text-xs text-muted-foreground">Attended in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonthAttendance}</div>
            <p className="text-xs text-muted-foreground">Total attendances</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Sessions
          </CardTitle>
          <CardDescription>
            Current status of today's classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.todaysSessions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {analytics.todaysSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{session.class.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {session._count.attendance}/{session.maxCapacity || session.class.maxCapacity}
                    </p>
                    <p className="text-sm text-muted-foreground">attended/capacity</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes by Day of Week */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Classes by Day</CardTitle>
            <CardDescription>Distribution of classes throughout the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayNames.map((day, index) => {
                const classCount = analytics.classesByDay.find(c => c.dayOfWeek === index)?._count.id || 0
                const maxCount = Math.max(...analytics.classesByDay.map(c => c._count.id))
                const percentage = maxCount > 0 ? (classCount / maxCount) * 100 : 0

                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-right">{day}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm text-left">{classCount}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Attendance</CardTitle>
            <CardDescription>Attendance trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.attendanceByMonthProcessed)
                .sort(([a], [b]) => new Date(a + ' 1').getTime() - new Date(b + ' 1').getTime())
                .slice(-6)
                .map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.attendanceByMonthProcessed))
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

                  return (
                    <div key={month} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-right">{month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-left">{count}</div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Member Activity Overview</CardTitle>
          <CardDescription>Key insights about member engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics.totalActiveMembers > 0 ? Math.round((analytics.recentlyActiveMembers / analytics.totalActiveMembers) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Active Member Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.recentlyActiveMembers > 0 ? Math.round(analytics.thisMonthAttendance / analytics.recentlyActiveMembers) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Avg Classes per Active Member</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.todaysSessions.reduce((sum, s) => sum + s._count.attendance, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Today's Attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}