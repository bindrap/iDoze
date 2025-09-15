'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils'
import { Award, ArrowLeft, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  memberProgress?: {
    id: string
    beltRank: string | null
    stripes: number
    promotionDate: string | null
    totalClassesAttended: number
    lastAttendanceDate: string | null
    notes: string | null
    promotedBy?: {
      firstName: string
      lastName: string
    }
  }[]
  _count: {
    attendance: number
  }
}

const BELT_RANKS = [
  'White Belt',
  'Blue Belt',
  'Purple Belt',
  'Brown Belt',
  'Black Belt'
]

const getBeltColor = (beltRank: string) => {
  switch (beltRank?.toLowerCase()) {
    case 'white belt':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case 'blue belt':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'purple belt':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'brown belt':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'black belt':
      return 'bg-gray-900 text-white border-gray-900'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function PromoteStudentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [selectedBelt, setSelectedBelt] = useState('')
  const [selectedStripes, setSelectedStripes] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchStudent()
  }, [params.id])

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setStudent(data)
        const currentProgress = data.memberProgress?.[0]
        setSelectedBelt(currentProgress?.beltRank || 'White Belt')
        setSelectedStripes(currentProgress?.stripes || 0)
        setNotes(currentProgress?.notes || '')
      }
    } catch (error) {
      console.error('Failed to fetch student:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromotion = async () => {
    if (!student) return

    setPromoting(true)
    try {
      const response = await fetch(`/api/students/${student.id}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beltRank: selectedBelt,
          stripes: selectedStripes,
          notes: notes.trim() || null,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/students?promoted=true')
      } else {
        alert('Failed to promote student')
      }
    } catch (error) {
      console.error('Promotion failed:', error)
      alert('Failed to promote student')
    } finally {
      setPromoting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Student not found</h3>
            <Link href="/dashboard/students">
              <Button>Back to Students</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentProgress = student.memberProgress?.[0]
  const isPromoting = selectedBelt !== (currentProgress?.beltRank || 'White Belt') ||
                     selectedStripes !== (currentProgress?.stripes || 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Link>
        <h1 className="text-3xl font-bold">Promote Student</h1>
        <p className="text-muted-foreground">
          Update belt rank and progress for {student.firstName} {student.lastName}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <p className="text-lg font-semibold">{student.firstName} {student.lastName}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p>{student.email}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Current Rank</Label>
              <div className="mt-1">
                <Badge className={getBeltColor(currentProgress?.beltRank || 'White Belt')}>
                  {currentProgress?.beltRank || 'White Belt'}
                  {currentProgress?.stripes && currentProgress.stripes > 0 && (
                    <span className="ml-1">({currentProgress.stripes} stripe{currentProgress.stripes > 1 ? 's' : ''})</span>
                  )}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Classes</Label>
                <p className="flex items-center gap-1 text-lg font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {student._count.attendance}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <p>{formatDate(student.createdAt)}</p>
              </div>
            </div>

            {currentProgress?.lastAttendanceDate && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Class</Label>
                <p>{formatDate(currentProgress.lastAttendanceDate)}</p>
              </div>
            )}

            {currentProgress?.promotionDate && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Promotion</Label>
                <p>{formatDate(currentProgress.promotionDate)}</p>
                {currentProgress.promotedBy && (
                  <p className="text-sm text-muted-foreground">
                    by {currentProgress.promotedBy.firstName} {currentProgress.promotedBy.lastName}
                  </p>
                )}
              </div>
            )}

            {currentProgress?.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Notes</Label>
                <div className="mt-1 p-3 bg-gray-50 border rounded-lg text-sm">
                  {currentProgress.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Promotion Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Promotion Details
            </CardTitle>
            <CardDescription>
              Update the student's belt rank and add promotion notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Belt Rank</Label>
              <div className="mt-2 space-y-2">
                {BELT_RANKS.map((belt) => (
                  <label key={belt} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="belt"
                      value={belt}
                      checked={selectedBelt === belt}
                      onChange={(e) => setSelectedBelt(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Badge className={getBeltColor(belt)}>
                      {belt}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Stripes</Label>
              <div className="mt-2 flex gap-2">
                {[0, 1, 2, 3, 4].map((stripes) => (
                  <label key={stripes} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="stripes"
                      value={stripes}
                      checked={selectedStripes === stripes}
                      onChange={(e) => setSelectedStripes(parseInt(e.target.value))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{stripes}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Promotion Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this promotion, student progress, or goals..."
                className="mt-2"
                rows={4}
              />
            </div>

            {isPromoting && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Promotion Preview:</strong> {student.firstName} will be promoted to{' '}
                  <Badge className={getBeltColor(selectedBelt)}>
                    {selectedBelt}
                    {selectedStripes > 0 && ` (${selectedStripes} stripe${selectedStripes > 1 ? 's' : ''})`}
                  </Badge>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handlePromotion}
                disabled={promoting || !isPromoting}
                className="flex-1"
              >
                {promoting ? 'Promoting...' : isPromoting ? 'Confirm Promotion' : 'No Changes'}
              </Button>
              <Link href="/dashboard/students">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}