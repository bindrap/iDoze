import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { User, UserPlus, AlertTriangle, Users } from 'lucide-react'

async function getMembers() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ['MEMBER', 'COACH']
      }
    },
    orderBy: [
      { isOnBench: 'desc' },
      { firstName: 'asc' }
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      membershipStatus: true,
      membershipStartDate: true,
      isOnBench: true,
      benchReason: true,
      benchStartDate: true,
      benchEndDate: true,
      createdAt: true,
      memberProgress: {
        select: {
          beltRank: true,
          totalClassesAttended: true,
          lastAttendanceDate: true
        }
      }
    }
  })
}

async function getMemberStats() {
  const [totalMembers, activeMembers, benchMembers, newMembers] = await Promise.all([
    prisma.user.count({
      where: { role: 'MEMBER' }
    }),
    prisma.user.count({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE',
        isOnBench: false
      }
    }),
    prisma.user.count({
      where: {
        role: 'MEMBER',
        isOnBench: true
      }
    }),
    prisma.user.count({
      where: {
        role: 'MEMBER',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  return { totalMembers, activeMembers, benchMembers, newMembers }
}

export default async function MembersPage() {
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

  const members = await getMembers()
  const stats = await getMemberStats()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Member Management</h1>
          <p className="text-muted-foreground">
            Manage gym members and their status
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <Link href="/dashboard/admin/members/new">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Bench</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.benchMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New (30 days)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            All gym members and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No members found</p>
                {user.role === 'ADMIN' && (
                  <Link href="/dashboard/admin/members/new">
                    <Button>Add First Member</Button>
                  </Link>
                )}
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {member.firstName} {member.lastName}
                      </h3>

                      <Badge variant={
                        member.membershipStatus === 'ACTIVE' ? 'default' :
                        member.membershipStatus === 'SUSPENDED' ? 'destructive' : 'secondary'
                      }>
                        {member.membershipStatus}
                      </Badge>

                      <Badge variant="outline">
                        {member.role}
                      </Badge>

                      {member.isOnBench && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          On Bench
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Email:</span> {member.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {member.phone || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Belt Rank:</span> {member.memberProgress?.beltRank || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Classes:</span> {member.memberProgress?.totalClassesAttended || 0}
                      </div>
                    </div>

                    {member.isOnBench && member.benchReason && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <span className="font-medium text-yellow-800">Bench Reason:</span>
                        <span className="text-yellow-700 ml-2">{member.benchReason}</span>
                        {member.benchEndDate && (
                          <span className="text-yellow-700 ml-2">
                            • Expected return: {formatDate(member.benchEndDate)}
                          </span>
                        )}
                      </div>
                    )}

                    {member.memberProgress?.lastAttendanceDate && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Last attendance: {formatDate(member.memberProgress.lastAttendanceDate)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/admin/members/${member.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link href={`/dashboard/admin/members/${member.id}/bench`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className={member.isOnBench ? "border-yellow-500 text-yellow-700" : ""}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Bench
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}