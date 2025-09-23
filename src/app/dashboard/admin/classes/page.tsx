import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Users, User, Plus, Settings } from 'lucide-react'
import { formatTime } from '@/lib/utils'

async function getClasses() {
  return prisma.class.findMany({
    include: {
      instructor: {
        select: {
          firstName: true,
          lastName: true
        }
      },
      sessions: {
        where: {
          sessionDate: {
            gte: new Date()
          }
        },
        orderBy: {
          sessionDate: 'asc'
        },
        take: 5
      },
      _count: {
        select: {
          sessions: true
        }
      }
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })
}

export default async function ManageClassesPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const classes = await getClasses()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
            <h1 className="text-3xl font-bold">Manage Classes</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage gym classes
            </p>
          </div>
          <Link href="/dashboard/admin/classes/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Class
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{classItem.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {classItem.description || 'No description provided'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={classItem.isActive ? 'default' : 'secondary'}>
                    {classItem.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      classItem.skillLevel === 'BEGINNER' ? 'border-green-500 text-green-700' :
                      classItem.skillLevel === 'INTERMEDIATE' ? 'border-yellow-500 text-yellow-700' :
                      classItem.skillLevel === 'ADVANCED' ? 'border-red-500 text-red-700' :
                      'border-blue-500 text-blue-700'
                    }
                  >
                    {classItem.skillLevel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {classItem.dayOfWeek !== null
                      ? dayNames[classItem.dayOfWeek]
                      : 'No fixed day'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {classItem.startTime && classItem.endTime
                      ? `${formatTime(classItem.startTime)} - ${formatTime(classItem.endTime)}`
                      : 'Time not set'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Max {classItem.maxCapacity} students
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {classItem.instructor
                      ? `${classItem.instructor.firstName} ${classItem.instructor.lastName}`
                      : 'No instructor assigned'
                    }
                  </span>
                </div>
              </div>

              {classItem.sessions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Upcoming Sessions:</h4>
                  <div className="grid gap-2">
                    {classItem.sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="text-sm bg-gray-50 p-2 rounded">
                        {new Date(session.sessionDate).toLocaleDateString()} - {formatTime(session.startTime)}
                        <Badge variant="outline" className="ml-2">
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                    {classItem._count.sessions > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{classItem._count.sessions - 3} more sessions
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link href={`/dashboard/admin/classes/${classItem.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Class
                  </Button>
                </Link>
                <Link href={`/dashboard/admin/classes/${classItem.id}/sessions`}>
                  <Button size="sm" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Sessions
                  </Button>
                </Link>
                <Link href={`/dashboard/admin/classes/${classItem.id}/analytics`}>
                  <Button size="sm" variant="outline">
                    View Analytics
                  </Button>
                </Link>
                {classItem.isActive ? (
                  <Button size="sm" variant="destructive">
                    Deactivate
                  </Button>
                ) : (
                  <Button size="sm" variant="default">
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {classes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first class.
              </p>
              <Link href="/dashboard/admin/classes/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Class
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}