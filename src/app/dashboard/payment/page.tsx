'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Mail, Calendar, CheckCircle, Users, AlertCircle, Clock, DollarSign } from 'lucide-react'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  paymentStatus: string
  lastPaymentDate: string | null
  nextPaymentDue: string | null
  membershipStatus: string
}

export default function PaymentPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    if (session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') {
      fetchMembers()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/users?role=MEMBER&limit=100')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentUpdate = async (memberId: string, status: 'CURRENT' | 'OVERDUE') => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberId,
          status: status,
          action: status === 'CURRENT' ? 'mark_paid' : 'mark_overdue'
        }),
      })

      if (response.ok) {
        await fetchMembers() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Monthly Membership Payment')
    const currentDate = new Date()
    const monthYear = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
    const body = encodeURIComponent(`Hi,

I am sending my monthly membership payment for Tecumseh Jiu Jitsu.

Amount: $125.00 CAD
Month: ${monthYear}

Please confirm receipt of payment.

Thank you!`)
    window.open(`mailto:tecumseh-jiujitsu@gmail.com?subject=${subject}&body=${body}`)
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('tecumseh-jiujitsu@gmail.com')
      setCopyStatus('Email address copied!')
      setTimeout(() => setCopyStatus(''), 3000)
    } catch (err) {
      setCopyStatus('Failed to copy email')
      setTimeout(() => setCopyStatus(''), 3000)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Coach/Admin view - Payment Management
  if (session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Manage member payment statuses and track payments
          </p>
        </div>

        <div className="grid gap-6">
          {/* Payment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Current</p>
                    <p className="text-2xl font-bold text-green-600">
                      {members.filter(m => m.paymentStatus === 'CURRENT').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {members.filter(m => m.paymentStatus === 'OVERDUE').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold text-blue-600">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Payment List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Member Payment Status
              </CardTitle>
              <CardDescription>
                View and update member payment statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No members found</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Status: {member.membershipStatus}</span>
                          {member.lastPaymentDate && (
                            <span>Last Payment: {new Date(member.lastPaymentDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          member.paymentStatus === 'CURRENT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {member.paymentStatus}
                        </div>

                        <div className="flex gap-2">
                          {member.paymentStatus !== 'CURRENT' && (
                            <Button
                              size="sm"
                              onClick={() => handlePaymentUpdate(member.id, 'CURRENT')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Mark Paid
                            </Button>
                          )}
                          {member.paymentStatus !== 'OVERDUE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePaymentUpdate(member.id, 'OVERDUE')}
                              className="border-orange-600 text-orange-600 hover:bg-orange-50"
                            >
                              Mark Overdue
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Member view - Payment Information (original content)
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment</h1>
        <p className="text-muted-foreground">
          Manage your membership payments
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Monthly Membership Payment
            </CardTitle>
            <CardDescription>
              Pay your monthly membership fee to continue accessing classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">E-Transfer Payment</h3>
                  <div className="space-y-2 text-blue-800">
                    <p><strong>Email:</strong> tecumseh-jiujitsu@gmail.com</p>
                    <p><strong>Amount:</strong> $125.00 CAD</p>
                    <p><strong>Due:</strong> Monthly (by the 1st of each month)</p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                    <p className="text-sm text-blue-900">
                      <strong>Payment Instructions:</strong><br />
                      1. Send an Interac e-Transfer to tecumseh-jiujitsu@gmail.com<br />
                      2. Use your full name and &quot;Monthly Membership&quot; in the message<br />
                      3. Payment will be processed within 24 hours<br />
                      4. You&apos;ll receive email confirmation once processed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick E-Transfer Link */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSendEmail}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Payment Email
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyEmail}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Copy Email Address
              </Button>
            </div>

            {copyStatus && (
              <p className="text-sm text-green-600">{copyStatus}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Payment Status
            </CardTitle>
            <CardDescription>
              Current membership payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Membership Active</p>
                  <p className="text-sm text-green-700">Your membership is up to date</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Payment due date: 1st of each month</p>
                <p>Late payment grace period: 7 days</p>
                <p>For questions about payments, contact tecumseh-jiujitsu@gmail.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View your recent payment records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Payment history will be available once automated tracking is implemented.</p>
              <p className="text-sm mt-2">Currently, all payments are manually verified.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}