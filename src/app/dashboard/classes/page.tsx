import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, Users, Clock, User } from 'lucide-react'

async function getClassesWithSessions() {
  return prisma.class.findMany({
    where: { isActive: true },
    include: {
      instructor: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      sessions: {
        where: {
          sessionDate: {
            gte: new Date()
          }
        },
        take: 3,
        orderBy: {
          sessionDate: 'asc'
        },
        include: {
          _count: {
            select: {
              bookings: {
                where: {
                  bookingStatus: {
                    in: ['BOOKED', 'CHECKED_IN']
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export default async function ClassesPage() {
  const user = await requireAuth()
  const classes = await getClassesWithSessions()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Classes</h1>
        <p className="text-muted-foreground">
          Browse and book available classes
        </p>
      </div>

      <div className="grid gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {classItem.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Instructor: {classItem.instructor.firstName} {classItem.instructor.lastName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {classItem.durationMinutes} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Max {classItem.maxCapacity} students
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    classItem.skillLevel === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                    classItem.skillLevel === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                    classItem.skillLevel === 'ADVANCED' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {classItem.skillLevel}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classItem.description && (
                <p className="text-muted-foreground mb-4">{classItem.description}</p>
              )}

              {classItem.isRecurring && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Recurring Schedule:</p>
                  <p className="text-sm text-muted-foreground">
                    {classItem.dayOfWeek !== null && (
                      <>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][classItem.dayOfWeek]}s
                        {classItem.startTime && classItem.endTime && (
                          <> from {formatTime(classItem.startTime)} to {formatTime(classItem.endTime)}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Upcoming Sessions:</h4>
                {classItem.sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {classItem.sessions.map((session) => {
                      const availableSpots = classItem.maxCapacity - session._count.bookings
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {formatDate(session.sessionDate)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {availableSpots} spots available
                            </p>
                            <Button
                              size="sm"
                              disabled={availableSpots === 0}
                              className="mt-1"
                            >
                              {availableSpots === 0 ? 'Full' : 'Book'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}