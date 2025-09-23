import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, User, Plus, Settings, CheckCircle } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'

async function getSessions() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  return prisma.classSession.findMany({
    where: {
      sessionDate: {
        gte: thirtyDaysAgo,
        lte: thirtyDaysFromNow
      }
    },
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
      },
      _count: {
        select: {
          bookings: {
            where: {
              bookingStatus: {
                in: ['BOOKED', 'CHECKED_IN']
              }
            }
          },
          attendance: true
        }
      }
    },
    orderBy: {
      sessionDate: 'asc'
    }
  })
}

export default async function ClassSessionsPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const sessions = await getSessions()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingSessions = sessions.filter(s => new Date(s.sessionDate) >= today)
  const pastSessions = sessions.filter(s => new Date(s.sessionDate) < today)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Class Sessions</h1>
            <p className="text-muted-foreground">
              Manage individual class sessions and track attendance
            </p>
          </div>
          <Link href="/dashboard/admin/sessions/generate">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Sessions
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">Last 60 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">Finished sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.length > 0
                ? Math.round(sessions.reduce((sum, s) => sum + s._count.attendance, 0) / sessions.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Students per session</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No upcoming sessions scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingSessions.slice(0, 10).map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{session.class.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.class.instructor
                            ? `${session.class.instructor.firstName} ${session.class.instructor.lastName}`
                            : 'No instructor assigned'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.sessionDate)}
                        <Clock className="w-4 h-4 ml-2" />
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session._count.bookings}/{session.maxCapacity}
                        </p>
                        <p className="text-xs text-muted-foreground">booked</p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Link href={`/dashboard/admin/sessions/${session.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/admin/sessions/${session.id}/attendance`}>
                          <Button size="sm" variant="outline">
                            <Users className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Past Sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        {pastSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recent sessions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pastSessions.slice(-5).reverse().map((session) => (
              <Card key={session.id} className="opacity-75">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{session.class.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.class.instructor
                            ? `${session.class.instructor.firstName} ${session.class.instructor.lastName}`
                            : 'No instructor assigned'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.sessionDate)}
                        <Clock className="w-4 h-4 ml-2" />
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {session._count.attendance}/{session.maxCapacity}
                        </p>
                        <p className="text-xs text-muted-foreground">attended</p>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status}
                      </Badge>
                      <Link href={`/dashboard/admin/sessions/${session.id}/report`}>
                        <Button size="sm" variant="outline">
                          View Report
                        </Button>
                      </Link>
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