import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  Award,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Target,
  Users
} from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getStudentProgress(studentId: string) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      memberProgress: true,
      attendance: {
        include: {
          classSession: {
            include: {
              class: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { checkInTime: 'desc' },
        take: 20
      },
      _count: {
        select: {
          attendance: true
        }
      }
    }
  })

  if (!student || student.role !== 'MEMBER') {
    return null
  }

  // Calculate attendance stats
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthAttendance = student.attendance.filter(a => new Date(a.checkInTime) >= thisMonth).length
  const lastMonthAttendance = student.attendance.filter(a => {
    const date = new Date(a.checkInTime)
    return date >= lastMonth && date < thisMonth
  }).length

  // Calculate favorite classes
  const classCount = student.attendance.reduce((acc, attendance) => {
    const className = attendance.classSession.class.name
    acc[className] = (acc[className] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const favoriteClasses = Object.entries(classCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calculate weekly average
  const daysSinceJoining = Math.max(1, Math.floor((now.getTime() - student.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
  const weeksSinceJoining = daysSinceJoining / 7
  const averageClassesPerWeek = student._count.attendance / weeksSinceJoining

  return {
    student,
    stats: {
      thisMonthAttendance,
      lastMonthAttendance,
      favoriteClasses,
      averageClassesPerWeek: Math.round(averageClassesPerWeek * 10) / 10,
      daysSinceJoining
    }
  }
}

export default async function StudentProgressPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()

  // Only coaches and admins can access this page
  if (user.role !== 'COACH' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const data = await getStudentProgress(params.id)

  if (!data) {
    redirect('/dashboard/students')
  }

  const { student, stats } = data
  const progress = student.memberProgress?.[0]

  const getBeltColor = (beltRank?: string | null) => {
    switch (beltRank?.toLowerCase()) {
      case 'white':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'brown':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'black':
        return 'bg-gray-900 text-white border-gray-900'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const attendanceChange = stats.lastMonthAttendance > 0
    ? ((stats.thisMonthAttendance - stats.lastMonthAttendance) / stats.lastMonthAttendance) * 100
    : 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/dashboard/students">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {student.firstName} {student.lastName} - Progress
        </h1>
        <p className="text-muted-foreground">
          Detailed training progress and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              Current Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getBeltColor(progress?.beltRank)}>
              {progress?.beltRank || 'WHITE'} BELT
              {progress?.stripes && progress.stripes > 0 && (
                <span className="ml-1">({progress.stripes}★)</span>
              )}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student._count.attendance}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthAttendance}</div>
            <div className="flex items-center gap-1 text-xs">
              {attendanceChange > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : attendanceChange < 0 ? (
                <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
              ) : null}
              <span className={attendanceChange > 0 ? 'text-green-600' : attendanceChange < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                {attendanceChange > 0 ? '+' : ''}{attendanceChange.toFixed(0)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Weekly Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageClassesPerWeek}</div>
            <p className="text-xs text-muted-foreground">classes per week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="font-medium">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="font-medium">{formatDate(student.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Membership Status</label>
              <Badge variant={student.membershipStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                {student.membershipStatus}
              </Badge>
            </div>
            {progress?.promotionDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Promotion</label>
                <p className="font-medium">{formatDate(progress.promotionDate)}</p>
              </div>
            )}
            {progress?.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm bg-gray-50 p-3 rounded">{progress.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Classes</CardTitle>
            <CardDescription>Most attended class types</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.favoriteClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No class data available</p>
            ) : (
              <div className="space-y-3">
                {stats.favoriteClasses.map((classType, index) => {
                  const maxCount = stats.favoriteClasses[0]?.count || 1
                  const percentage = (classType.count / maxCount) * 100

                  return (
                    <div key={classType.name} className="flex items-center gap-3">
                      <div className="w-6 text-sm text-muted-foreground">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{classType.name}</span>
                          <span className="text-sm text-muted-foreground">{classType.count}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Last 20 training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {student.attendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendance records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.attendance.map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.classSession.class.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.checkInTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(session.checkInTime)}</p>
                    <Badge variant="outline" className="text-xs">
                      Attended
                    </Badge>
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