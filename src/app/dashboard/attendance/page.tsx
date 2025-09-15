import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Clock, TrendingUp, User } from 'lucide-react'

async function getUserAttendance(userId: string) {
  const [attendance, stats] = await Promise.all([
    prisma.attendance.findMany({
      where: { userId },
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
            },
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      take: 50
    }),

    prisma.attendance.aggregate({
      where: { userId },
      _count: {
        id: true
      }
    })
  ])

  return { attendance, totalClasses: stats._count.id }
}

export default async function AttendancePage() {
  const user = await requireAuth()
  const { attendance, totalClasses } = await getUserAttendance(user.id)

  // Calculate stats
  const thisMonthAttendance = attendance.filter(a =>
    new Date(a.checkInTime).getMonth() === new Date().getMonth() &&
    new Date(a.checkInTime).getFullYear() === new Date().getFullYear()
  ).length

  const thisWeekAttendance = attendance.filter(a => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(a.checkInTime) >= weekAgo
  }).length

  const presentCount = attendance.filter(a => a.attendanceStatus === 'PRESENT').length
  const lateCount = attendance.filter(a => a.attendanceStatus === 'LATE').length
  const leftEarlyCount = attendance.filter(a => a.attendanceStatus === 'LEFT_EARLY').length

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Attendance History</h1>
        <p className="text-muted-foreground">
          Track your class attendance and progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthAttendance}</div>
            <p className="text-xs text-muted-foreground">Classes attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekAttendance}</div>
            <p className="text-xs text-muted-foreground">Classes attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">On time attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presentCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{lateCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalClasses > 0 ? Math.round((lateCount / totalClasses) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Left Early</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leftEarlyCount}</div>
            <p className="text-sm text-muted-foreground">
              {totalClasses > 0 ? Math.round((leftEarlyCount / totalClasses) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your latest class attendances</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {record.classSession.class.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(record.checkInTime)} at {formatTime(record.checkInTime.toISOString())}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.classSession.instructor.firstName} {record.classSession.instructor.lastName}
                      </span>
                      <span>{record.classSession.class.skillLevel}</span>
                    </div>
                    {record.checkOutTime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Left at: {formatTime(record.checkOutTime.toISOString())}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Notes: {record.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      record.attendanceStatus === 'PRESENT' ? 'bg-green-100 text-green-800' :
                      record.attendanceStatus === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.attendanceStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}