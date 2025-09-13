'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  isOnBench: boolean
  benchReason?: string
  benchStartDate?: string
  benchEndDate?: string
}

export default function MemberBenchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    isOnBench: false,
    benchReason: '',
    benchStartDate: '',
    benchEndDate: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMember()
  }, [params.id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (response.ok) {
        const memberData = await response.json()
        setMember(memberData)
        setFormData({
          isOnBench: memberData.isOnBench || false,
          benchReason: memberData.benchReason || '',
          benchStartDate: memberData.benchStartDate ? new Date(memberData.benchStartDate).toISOString().split('T')[0] : '',
          benchEndDate: memberData.benchEndDate ? new Date(memberData.benchEndDate).toISOString().split('T')[0] : ''
        })
      }
    } catch (error) {
      console.error('Error fetching member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData = {
        isOnBench: formData.isOnBench,
        benchReason: formData.isOnBench ? formData.benchReason : null,
        benchStartDate: formData.isOnBench && formData.benchStartDate ? new Date(formData.benchStartDate) : null,
        benchEndDate: formData.isOnBench && formData.benchEndDate ? new Date(formData.benchEndDate) : null
      }

      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.push(`/dashboard/admin/members/${params.id}`)
        router.refresh()
      } else {
        console.error('Failed to update member bench status')
      }
    } catch (error) {
      console.error('Error updating member bench status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const commonReasons = [
    'Injury - Upper body',
    'Injury - Lower body',
    'Injury - Back/Spine',
    'Surgery recovery',
    'Medical treatment',
    'Personal/Family emergency',
    'Extended vacation',
    'Work commitment',
    'Financial reasons',
    'Other'
  ]

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  if (!member) {
    return <div className="container mx-auto py-8 px-4">Member not found</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href={`/dashboard/admin/members/${params.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Member Profile
        </Link>
        <h1 className="text-3xl font-bold">Bench Status Management</h1>
        <p className="text-muted-foreground">
          Manage availability status for {member.firstName} {member.lastName}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bench Status</CardTitle>
              <CardDescription>
                Mark member as unavailable for classes due to injury, vacation, or other reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isOnBench"
                    checked={formData.isOnBench}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnBench: checked }))}
                  />
                  <Label htmlFor="isOnBench" className="text-base font-medium">
                    Member is currently on bench (unavailable for classes)
                  </Label>
                </div>

                {formData.isOnBench && (
                  <div className="space-y-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Member will be marked as unavailable</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="benchReason">Reason for bench status</Label>
                      <Select
                        value={formData.benchReason}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, benchReason: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {commonReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.benchReason === 'Other' && (
                      <div className="space-y-2">
                        <Label htmlFor="customReason">Custom reason</Label>
                        <Textarea
                          id="customReason"
                          placeholder="Please specify the reason..."
                          value={formData.benchReason === 'Other' ? '' : formData.benchReason}
                          onChange={(e) => setFormData(prev => ({ ...prev, benchReason: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="benchStartDate">Start date (optional)</Label>
                        <Input
                          id="benchStartDate"
                          type="date"
                          value={formData.benchStartDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, benchStartDate: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="benchEndDate">Expected return date (optional)</Label>
                        <Input
                          id="benchEndDate"
                          type="date"
                          value={formData.benchEndDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, benchEndDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Updating...' : 'Update Status'}
                  </Button>

                  <Link href={`/dashboard/admin/members/${params.id}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What is Bench Status?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Purpose</h4>
                <p className="text-sm text-muted-foreground">
                  The bench mark system helps track members who are temporarily unavailable
                  for classes due to various reasons.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Effects</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Member cannot book new classes</li>
                  <li>• Existing bookings may be cancelled</li>
                  <li>• Excluded from attendance notifications</li>
                  <li>• Visible in admin dashboard metrics</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Common Reasons</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Injury or medical treatment</li>
                  <li>• Extended vacation or travel</li>
                  <li>• Work or personal commitments</li>
                  <li>• Financial or scheduling issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {member.isOnBench && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> On Bench</p>
                  {member.benchReason && (
                    <p><strong>Reason:</strong> {member.benchReason}</p>
                  )}
                  {member.benchStartDate && (
                    <p><strong>Start Date:</strong> {new Date(member.benchStartDate).toLocaleDateString()}</p>
                  )}
                  {member.benchEndDate && (
                    <p><strong>Expected Return:</strong> {new Date(member.benchEndDate).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}