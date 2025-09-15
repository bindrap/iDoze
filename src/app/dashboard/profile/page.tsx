'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { User, Mail, Phone, Calendar, Shield, AlertTriangle } from 'lucide-react'

type UserProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  membershipStatus: string
  membershipStartDate?: string
  membershipEndDate?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalConditions?: string
  isOnBench: boolean
  benchReason?: string
  benchStartDate?: string
  benchEndDate?: string
  createdAt: string
}

type MemberProgress = {
  beltRank?: string
  stripes: number
  totalClassesAttended: number
  promotionDate?: string
  lastAttendanceDate?: string
  notes?: string
  promotedBy?: {
    firstName: string
    lastName: string
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [memberProgress, setMemberProgress] = useState<MemberProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      setMemberProgress(data.memberProgress)
    } catch (error) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = () => {
    // For now, just show a simple alert - in a real app you'd open a modal or navigate to edit page
    alert('Edit profile functionality would open a form here')
  }

  const handleAddEmergencyContact = () => {
    // For now, just show a simple alert - in a real app you'd open a modal
    alert('Add emergency contact functionality would open a form here')
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading...</div>
  if (error) return <div className="container mx-auto py-8 px-4 text-red-600">{error}</div>
  if (!user) return <div className="container mx-auto py-8 px-4">User not found</div>

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'COACH':
        return 'bg-blue-100 text-blue-800'
      case 'MEMBER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-lg font-semibold">{user.firstName} {user.lastName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>

            {user.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <div className="mt-1">
                <Badge className={getRoleColor(user.role)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="pt-4">
              <a href="/dashboard/profile/edit">
                <Button className="w-full">Edit Profile</Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Membership Information */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge className={getStatusColor(user.membershipStatus)}>
                  {user.membershipStatus}
                </Badge>
              </div>
            </div>

            {user.membershipStartDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership Start</label>
                <p>{formatDate(user.membershipStartDate)}</p>
              </div>
            )}

            {user.membershipEndDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Membership End</label>
                <p>{formatDate(user.membershipEndDate)}</p>
              </div>
            )}

            {user.isOnBench && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Currently On Bench
                </div>
                {user.benchReason && (
                  <p className="text-sm text-yellow-700 mb-2">
                    <strong>Reason:</strong> {user.benchReason}
                  </p>
                )}
                {user.benchStartDate && (
                  <p className="text-sm text-yellow-700 mb-1">
                    <strong>Start Date:</strong> {formatDate(user.benchStartDate)}
                  </p>
                )}
                {user.benchEndDate && (
                  <p className="text-sm text-yellow-700">
                    <strong>Expected Return:</strong> {formatDate(user.benchEndDate)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Progress (for members) */}
        {user.role === 'MEMBER' && (
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Belt Rank</label>
                <p className="text-lg font-semibold text-blue-600">
                  {memberProgress?.beltRank || 'White Belt'}
                </p>
                {memberProgress?.stripes > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {memberProgress.stripes} stripe{memberProgress.stripes > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Classes Attended</label>
                <p className="text-lg font-semibold text-green-600">
                  {memberProgress?.totalClassesAttended || 0}
                </p>
              </div>

              {memberProgress?.promotionDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Promotion</label>
                  <p>{formatDate(memberProgress.promotionDate)}</p>
                  {memberProgress.promotedBy && (
                    <p className="text-sm text-muted-foreground">
                      Promoted by: {memberProgress.promotedBy.firstName} {memberProgress.promotedBy.lastName}
                    </p>
                  )}
                </div>
              )}

              {memberProgress?.lastAttendanceDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Attendance</label>
                  <p>{formatDate(memberProgress.lastAttendanceDate)}</p>
                </div>
              )}

              {memberProgress?.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{memberProgress.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.emergencyContactName || user.emergencyContactPhone ? (
              <>
                {user.emergencyContactName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p>{user.emergencyContactName}</p>
                  </div>
                )}
                {user.emergencyContactPhone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {user.emergencyContactPhone}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No emergency contact information</p>
                <a href="/dashboard/profile/emergency-contact">
                  <Button variant="outline" size="sm">Add Emergency Contact</Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        {user.medicalConditions && (
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Medical Conditions</label>
                <p className="mt-2 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {user.medicalConditions}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}