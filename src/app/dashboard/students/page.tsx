import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Users, TrendingUp, Award, Calendar, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function getStudentsWithProgress() {
  return prisma.user.findMany({
    where: {
      role: 'MEMBER',
      membershipStatus: 'ACTIVE'
    },
    include: {
      memberProgress: true,
      attendance: {
        take: 1,
        orderBy: {
          checkInTime: 'desc'
        }
      },
      _count: {
        select: {
          attendance: true
        }
      }
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' }
    ]
  })
}

async function getRecentPromotions() {
  return prisma.memberProgress.findMany({
    where: {
      promotionDate: {
        not: null
      }
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      promotedBy: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    },
    orderBy: {
      promotionDate: 'desc'
    },
    take: 5
  })
}

export default async function StudentsPage() {
  const user = await requireAuth()

  // Only coaches and admins can access this page
  if (user.role !== 'COACH' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [students, recentPromotions] = await Promise.all([
    getStudentsWithProgress(),
    getRecentPromotions()
  ])

  const getBeltColor = (beltRank?: string | null) => {
    const belt = beltRank?.toLowerCase()
    switch (belt) {
      case 'white':
      case 'white belt':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'yellow':
      case 'yellow belt':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'orange':
      case 'orange belt':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'green':
      case 'green belt':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'blue':
      case 'blue belt':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'purple':
      case 'purple belt':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'brown':
      case 'brown belt':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'black':
      case 'black belt':
        return 'bg-gray-900 text-white border-gray-900'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="text-muted-foreground">
          View student progress and manage promotions
        </p>
      </div>

      {/* Recent Promotions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Recent Promotions
          </CardTitle>
          <CardDescription>Latest belt promotions and progress updates</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPromotions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent promotions</p>
          ) : (
            <div className="space-y-3">
              {recentPromotions.map((promotion) => (
                <div key={promotion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {promotion.user.firstName} {promotion.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Promoted to {promotion.beltRank}
                      {promotion.stripes > 0 && ` (${promotion.stripes} stripe${promotion.stripes > 1 ? 's' : ''})`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getBeltColor(promotion.beltRank)}>
                      {promotion.beltRank}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {promotion.promotionDate && formatDate(promotion.promotionDate)}
                    </p>
                    {promotion.promotedBy && (
                      <p className="text-xs text-muted-foreground">
                        by {promotion.promotedBy.firstName} {promotion.promotedBy.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Students ({students.length})
          </CardTitle>
          <CardDescription>Manage student progress and promotions</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active students</h3>
              <p className="text-muted-foreground">No active students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const progress = student.memberProgress?.[0]
                const lastAttendance = student.attendance?.[0]
                const daysSinceLastClass = lastAttendance
                  ? Math.floor((new Date().getTime() - new Date(lastAttendance.checkInTime).getTime()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">
                          {student.firstName} {student.lastName}
                        </h4>
                        <Badge className={getBeltColor(progress?.beltRank)}>
                          {progress?.beltRank || 'White Belt'}
                          {progress?.stripes && progress.stripes > 0 && (
                            <span className="ml-1">({progress.stripes} stripe{progress.stripes > 1 ? 's' : ''})</span>
                          )}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{student._count.attendance} total classes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {lastAttendance
                              ? `Last class: ${daysSinceLastClass === 0 ? 'Today' : `${daysSinceLastClass} days ago`}`
                              : 'No classes attended'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Member since {formatDate(student.createdAt)}</span>
                        </div>
                      </div>

                      {progress?.notes && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Notes:</strong> {progress.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Link href={`/dashboard/students/${student.id}/promote`}>
                        <Button size="sm" className="w-full">
                          <Award className="w-4 h-4 mr-2" />
                          Promote
                        </Button>
                      </Link>
                      <Link href={`/dashboard/students/${student.id}/progress`}>
                        <Button size="sm" variant="outline" className="w-full">
                          View Progress
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}