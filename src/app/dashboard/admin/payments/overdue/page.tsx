import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Calendar, CreditCard } from 'lucide-react'
import { formatDate } from '@/lib/utils'

async function getOverduePayments() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return prisma.user.findMany({
    where: {
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      OR: [
        {
          lastPaymentDate: {
            lt: thirtyDaysAgo
          }
        },
        {
          lastPaymentDate: null
        }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      membershipType: true,
      lastPaymentDate: true,
      createdAt: true
    },
    orderBy: [
      { lastPaymentDate: 'asc' },
      { createdAt: 'asc' }
    ]
  })
}

export default async function OverduePaymentsPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    redirect('/dashboard')
  }

  const overdueMembers = await getOverduePayments()

  const calculateDaysOverdue = (lastPaymentDate: Date | null, createdAt: Date) => {
    const referenceDate = lastPaymentDate || createdAt
    const now = new Date()
    const diffTime = now.getTime() - referenceDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays - 30) // Assuming 30-day payment cycle
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/admin/payments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h1 className="text-3xl font-bold">Overdue Payments</h1>
        </div>
        <p className="text-muted-foreground">
          Members with payments overdue by more than 30 days
        </p>
      </div>

      {overdueMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Payments Up to Date!</h3>
            <p className="text-muted-foreground">
              No members have overdue payments at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">
                {overdueMembers.length} member{overdueMembers.length > 1 ? 's' : ''} with overdue payments
              </span>
            </div>
          </div>

          {overdueMembers.map((member) => {
            const daysOverdue = calculateDaysOverdue(member.lastPaymentDate, member.createdAt)

            return (
              <Card key={member.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {member.firstName} {member.lastName}
                      </CardTitle>
                      <CardDescription>
                        {member.email} • {member.phone}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-2">
                        {daysOverdue} days overdue
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {member.membershipType} membership
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {member.lastPaymentDate
                          ? formatDate(member.lastPaymentDate)
                          : 'Never paid'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(member.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Membership Type</p>
                      <p>{member.membershipType}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/admin/payments/${member.id}/record`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Record Payment
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/payments/${member.id}/reminder`}>
                      <Button size="sm" variant="outline">
                        Send Reminder
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/members/${member.id}`}>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}