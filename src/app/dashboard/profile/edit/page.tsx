'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type UserProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalConditions?: string
}

export default function EditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session.user?.id) {
      fetchUserProfile()
    }
  }, [status, router, session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setUser(data.user)
      setFormData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        phone: data.user.phone || '',
        emergencyContactName: data.user.emergencyContactName || '',
        emergencyContactPhone: data.user.emergencyContactPhone || '',
        medicalConditions: data.user.medicalConditions || ''
      })
    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading...</div>
  if (error && !user) return <div className="container mx-auto py-8 px-4 text-red-600">{error}</div>
  if (!user) return <div className="container mx-auto py-8 px-4">User not found</div>

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/dashboard/profile">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Edit your personal information
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  {success}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email cannot be changed. Contact an administrator if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <Textarea
                  id="medicalConditions"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  placeholder="Enter any medical conditions or allergies (optional)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This information helps us provide better care in case of emergencies.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Link href="/dashboard/profile">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}