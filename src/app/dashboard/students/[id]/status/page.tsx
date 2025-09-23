'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowLeft, AlertTriangle, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  membershipStatus: string
  isOnBench: boolean
  benchReason?: string
  benchStartDate?: string
  benchEndDate?: string
  createdAt: string
  memberProgress?: {
    beltRank?: string
    stripes: number
    notes?: string
  }[]
}

export default function StudentStatusPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<Student | null>(null)

  const [formData, setFormData] = useState({
    isOnBench: false,
    benchReason: '',
    benchStartDate: '',
    benchEndDate: '',
    notes: ''
  })

  // Check authorization
  if (session?.user?.role !== 'COACH' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard/students')
    return null
  }

  useEffect(() => {
    if (params.id) {
      fetchStudent()
    }
  }, [params.id])

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${params.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch student')

      const data = await response.json()
      setStudent(data)
      setFormData({
        isOnBench: data.isOnBench || false,
        benchReason: data.benchReason || '',
        benchStartDate: data.benchStartDate ? new Date(data.benchStartDate).toISOString().split('T')[0] : '',
        benchEndDate: data.benchEndDate ? new Date(data.benchEndDate).toISOString().split('T')[0] : '',
        notes: data.memberProgress?.[0]?.notes || ''
      })
    } catch (error) {
      setError('Failed to load student')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/students/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update student status')
      }

      router.push('/dashboard/students?success=status-updated')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update student status')
    } finally {
      setLoading(false)
    }
  }

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

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <p>Loading student...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <p className="text-red-600">Student not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Update Student Status</h1>
          <p className="text-muted-foreground">
            Manage attendance status and notes for {student.firstName} {student.lastName}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Student Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h3 className="text-xl font-semibold">{student.firstName} {student.lastName}</h3>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
            {student.memberProgress?.[0] && (
              <Badge className={getBeltColor(student.memberProgress[0].beltRank)}>
                {student.memberProgress[0].beltRank}
                {student.memberProgress[0].stripes > 0 && (
                  <span className="ml-1">({student.memberProgress[0].stripes} stripe{student.memberProgress[0].stripes > 1 ? 's' : ''})</span>
                )}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Member since {new Date(student.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${student.membershipStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {student.membershipStatus}
              </span>
            </div>
          </div>

          {student.isOnBench && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Currently on Bench</span>
              </div>
              <p className="text-sm text-yellow-700">
                <strong>Reason:</strong> {student.benchReason}
              </p>
              {student.benchStartDate && (
                <p className="text-sm text-yellow-700">
                  <strong>Since:</strong> {new Date(student.benchStartDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Status Management
          </CardTitle>
          <CardDescription>
            Update student attendance status and manage training breaks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isOnBench"
                checked={formData.isOnBench}
                onCheckedChange={(checked) => handleSwitchChange('isOnBench', checked)}
              />
              <Label htmlFor="isOnBench">Place student on bench (temporary break from training)</Label>
            </div>

            {formData.isOnBench && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="benchReason">Reason for Break</Label>
                  <Select
                    value={formData.benchReason}
                    onValueChange={(value) => handleSelectChange('benchReason', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason for training break" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work commitments</SelectItem>
                      <SelectItem value="family">Family obligations</SelectItem>
                      <SelectItem value="injury">Injury recovery</SelectItem>
                      <SelectItem value="personal">Personal reasons</SelectItem>
                      <SelectItem value="travel">Travel / vacation</SelectItem>
                      <SelectItem value="financial">Financial constraints</SelectItem>
                      <SelectItem value="medical">Medical reasons</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="benchStartDate">Start Date</Label>
                    <Input
                      id="benchStartDate"
                      name="benchStartDate"
                      type="date"
                      value={formData.benchStartDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="benchEndDate">Expected Return Date (Optional)</Label>
                    <Input
                      id="benchEndDate"
                      name="benchEndDate"
                      type="date"
                      value={formData.benchEndDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes about the student's situation or progress..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include any relevant information about their attendance, progress, or special considerations
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Link href="/dashboard/students">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating Status...' : 'Update Status'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}