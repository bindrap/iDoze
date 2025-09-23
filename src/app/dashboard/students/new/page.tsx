'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewStudentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    beltRank: 'White Belt',
    beltSize: '',
    membershipStartDate: new Date().toISOString().split('T')[0]
  })

  // Check authorization
  if (session?.user?.role !== 'COACH' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard/students')
    return null
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create student')
      }

      router.push('/dashboard/students?success=created')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create student')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Add New Student</h1>
          <p className="text-muted-foreground">
            Create a new student account
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Student Information
          </CardTitle>
          <CardDescription>
            Fill in the student details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Personal Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>

                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Initial Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Temporary password"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Student can change this after first login
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="membershipStartDate">Membership Start Date</Label>
                  <Input
                    id="membershipStartDate"
                    name="membershipStartDate"
                    type="date"
                    value={formData.membershipStartDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Right Column - Emergency & Training Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact & Training</h3>

                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="(555) 987-6543"
                  />
                </div>

                <div>
                  <Label htmlFor="beltRank">Initial Belt Rank</Label>
                  <Select
                    value={formData.beltRank}
                    onValueChange={(value) => handleSelectChange('beltRank', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="White Belt">White Belt</SelectItem>
                      <SelectItem value="Grey Belt">Grey Belt</SelectItem>
                      <SelectItem value="Yellow Belt">Yellow Belt</SelectItem>
                      <SelectItem value="Orange Belt">Orange Belt</SelectItem>
                      <SelectItem value="Green Belt">Green Belt</SelectItem>
                      <SelectItem value="Blue Belt">Blue Belt</SelectItem>
                      <SelectItem value="Purple Belt">Purple Belt</SelectItem>
                      <SelectItem value="Brown Belt">Brown Belt</SelectItem>
                      <SelectItem value="Black Belt">Black Belt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="beltSize">Gi Belt Size</Label>
                  <Select
                    value={formData.beltSize}
                    onValueChange={(value) => handleSelectChange('beltSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select belt size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="A3">A3</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="A5">A5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="medicalConditions">Medical Conditions / Notes</Label>
                  <Textarea
                    id="medicalConditions"
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                    placeholder="Any medical conditions, allergies, or special considerations..."
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Include any medical conditions, injuries, or special considerations
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Link href="/dashboard/students">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Student...' : 'Create Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}