'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { CreditCard, Search, Filter, CheckCircle, AlertCircle, Mail } from 'lucide-react'

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  paymentStatus: string
  lastPaymentDate: string | null
  nextPaymentDue: string | null
  membershipStatus: string
}

type Payment = {
  id: string
  userId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  forMonth: string
  status: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function AdminPaymentsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [markPaymentOpen, setMarkPaymentOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // For now, we'll create mock data since the API endpoints don't exist yet
      // In a real implementation, you would fetch from /api/users and /api/payments

      const mockUsers: User[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          paymentStatus: 'CURRENT',
          lastPaymentDate: '2024-12-01',
          nextPaymentDue: '2025-01-01',
          membershipStatus: 'ACTIVE'
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          paymentStatus: 'OVERDUE',
          lastPaymentDate: '2024-11-01',
          nextPaymentDue: '2024-12-01',
          membershipStatus: 'ACTIVE'
        },
        {
          id: '3',
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          paymentStatus: 'CURRENT',
          lastPaymentDate: '2024-12-15',
          nextPaymentDue: '2025-01-15',
          membershipStatus: 'ACTIVE'
        }
      ]

      const mockPayments: Payment[] = [
        {
          id: '1',
          userId: '1',
          amount: 125.00,
          paymentDate: '2024-12-01',
          paymentMethod: 'E_TRANSFER',
          forMonth: '2024-12-01',
          status: 'CONFIRMED',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        },
        {
          id: '2',
          userId: '3',
          amount: 125.00,
          paymentDate: '2024-12-15',
          paymentMethod: 'E_TRANSFER',
          forMonth: '2024-12-01',
          status: 'CONFIRMED',
          user: { firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com' }
        }
      ]

      setUsers(mockUsers)
      setPayments(mockPayments)
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaymentReceived = async (user: User) => {
    try {
      // In a real implementation, you would call an API to record the payment
      const newPayment = {
        userId: user.id,
        amount: 125.00,
        paymentMethod: 'E_TRANSFER',
        forMonth: new Date().toISOString().split('T')[0],
        transactionId: `REF-${Date.now()}`
      }

      // Mock API call
      console.log('Recording payment:', newPayment)

      // Update the user's payment status
      setUsers(users.map(u =>
        u.id === user.id
          ? {
              ...u,
              paymentStatus: 'CURRENT',
              lastPaymentDate: new Date().toISOString().split('T')[0],
              nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          : u
      ))

      setMarkPaymentOpen(false)
      setSelectedUser(null)
      alert('Payment recorded successfully!')
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Error recording payment. Please try again.')
    }
  }

  const sendPaymentReminder = async (user: User) => {
    try {
      // In a real implementation, you would call an API to send the email
      console.log('Sending payment reminder to:', user.email)
      alert(`Payment reminder sent to ${user.firstName} ${user.lastName}`)
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Error sending reminder. Please try again.')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const overdueCount = users.filter(u => u.paymentStatus === 'OVERDUE').length
  const currentCount = users.filter(u => u.paymentStatus === 'CURRENT').length
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Loading payment data...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">
          Track and manage member payments
        </p>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentCount}</div>
            <p className="text-xs text-muted-foreground">Members up to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(users.length * 125).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Full collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="CURRENT">Current</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Member Payment Status</CardTitle>
          <CardDescription>
            Click "Mark Paid" when you receive e-transfer payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      user.paymentStatus === 'CURRENT' ? 'bg-green-100 text-green-800' :
                      user.paymentStatus === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.paymentStatus}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {user.lastPaymentDate && (
                      <span>Last payment: {formatDate(user.lastPaymentDate)} • </span>
                    )}
                    {user.nextPaymentDue && (
                      <span>Next due: {formatDate(user.nextPaymentDue)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.paymentStatus === 'OVERDUE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendPaymentReminder(user)}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Remind
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setMarkPaymentOpen(true)
                    }}
                  >
                    Mark Paid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mark Payment Dialog */}
      <Dialog open={markPaymentOpen} onOpenChange={setMarkPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payment as Received</DialogTitle>
            <DialogDescription>
              Record that you have received payment from {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" value="$125.00" disabled />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <Select defaultValue="E_TRANSFER">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E_TRANSFER">E-Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Payment Date</Label>
              <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedUser && handleMarkPaymentReceived(selectedUser)}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}