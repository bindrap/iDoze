import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Trophy, MapPin, Calendar, Users, DollarSign, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'

async function getCompetitions() {
  return prisma.competition.findMany({
    where: {
      isActive: true,
      competitionDate: {
        gte: new Date()
      }
    },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        }
      },
      participants: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      _count: {
        select: {
          participants: true
        }
      }
    },
    orderBy: {
      competitionDate: 'asc'
    }
  })
}

export default async function CompetitionsPage() {
  const user = await requireAuth()
  const competitions = await getCompetitions()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'REGISTERED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isRegistrationOpen = (deadline: Date | null) => {
    if (!deadline) return true
    return new Date() < deadline
  }

  const getUserParticipation = (competitionId: string) => {
    const competition = competitions.find(c => c.id === competitionId)
    return competition?.participants.find(p => p.userId === user.id)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitions</h1>
          <p className="text-muted-foreground">
            Upcoming BJJ competitions and tournaments
          </p>
        </div>
        {(user.role === 'COACH' || user.role === 'ADMIN') && (
          <Link href="/dashboard/competitions/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Competition
            </Button>
          </Link>
        )}
      </div>

      {competitions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming competitions</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for upcoming tournaments and competitions
            </p>
            {(user.role === 'COACH' || user.role === 'ADMIN') && (
              <Link href="/dashboard/competitions/new">
                <Button>Add First Competition</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {competitions.map((competition) => {
            const userParticipation = getUserParticipation(competition.id)
            const registrationOpen = isRegistrationOpen(competition.registrationDeadline)
            const daysUntil = Math.ceil((new Date(competition.competitionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={competition.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5" />
                        {competition.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(competition.competitionDate)} ({daysUntil} days away)
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {competition.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {competition._count.participants} participants
                        </span>
                      </CardDescription>
                      {competition.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {competition.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {userParticipation && (
                        <Badge className={getStatusColor(userParticipation.status)}>
                          {userParticipation.status}
                        </Badge>
                      )}
                      {daysUntil <= 7 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                          This Week!
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Competition Details</h4>

                      {competition.registrationDeadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Registration Deadline:</span>
                          <span className={registrationOpen ? 'text-green-600' : 'text-red-600'}>
                            {formatDate(competition.registrationDeadline)}
                          </span>
                        </div>
                      )}

                      {competition.entryFee && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${competition.entryFee}
                          </span>
                        </div>
                      )}

                      {competition.divisions && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Divisions:</span>
                          <p className="mt-1">{competition.divisions}</p>
                        </div>
                      )}

                      {competition.website && (
                        <a
                          href={competition.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Competition Website
                        </a>
                      )}

                      {competition.contactInfo && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Contact:</span>
                          <p className="mt-1">{competition.contactInfo}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Team Participants ({competition._count.participants})</h4>

                      {competition.participants.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No one registered yet</p>
                      ) : (
                        <div className="space-y-2">
                          {competition.participants.slice(0, 5).map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between text-sm">
                              <span>
                                {participant.user.firstName} {participant.user.lastName}
                              </span>
                              <div className="flex items-center gap-2">
                                {participant.division && (
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {participant.division}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getStatusColor(participant.status)}`}
                                >
                                  {participant.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {competition.participants.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{competition.participants.length - 5} more participants
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t">
                        {userParticipation ? (
                          <div className="space-y-2">
                            <p className="text-sm text-green-600 font-medium">
                              ✓ You're registered for this competition
                            </p>
                            {userParticipation.division && (
                              <p className="text-sm text-muted-foreground">
                                Division: {userParticipation.division}
                              </p>
                            )}
                            <Button variant="outline" size="sm" className="w-full">
                              Update Registration
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {registrationOpen ? (
                              <Button size="sm" className="w-full">
                                Register for Competition
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled className="w-full">
                                Registration Closed
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {competition.rules && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium mb-2">Rules & Information</h4>
                      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                        {competition.rules}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}