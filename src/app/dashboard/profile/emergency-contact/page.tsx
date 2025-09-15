'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type UserProfile = {
  id: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export default function EmergencyContactPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    emergencyContactName: '',
    emergencyContactPhone: ''
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
        emergencyContactName: data.user.emergencyContactName || '',
        emergencyContactPhone: data.user.emergencyContactPhone || ''
      })
    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        throw new Error(errorData.message || 'Failed to update emergency contact')
      }

      setSuccess('Emergency contact updated successfully!')
      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update emergency contact')
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
        <h1 className="text-3xl font-bold">Emergency Contact</h1>
        <p className="text-muted-foreground">
          Add or update your emergency contact information
        </p>
      </div>

      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact Information</CardTitle>
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

              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact full name"
                  required
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
                  placeholder="Enter emergency contact phone number"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Important:</strong> This person will be contacted in case of medical emergencies
                  or if you're unable to be reached. Please ensure the information is accurate and up-to-date.
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
                      Save Emergency Contact
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