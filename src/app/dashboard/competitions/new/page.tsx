'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewCompetitionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    competitionDate: '',
    registrationDeadline: '',
    entryFee: '',
    website: '',
    contactInfo: '',
    divisions: '',
    rules: ''
  })

  // Check authorization
  if (session?.user?.role !== 'COACH' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard/competitions')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
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
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          entryFee: formData.entryFee ? parseFloat(formData.entryFee) : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create competition')
      }

      router.push('/dashboard/competitions?success=created')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create competition')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/competitions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competitions
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Competition</h1>
          <p className="text-muted-foreground">
            Create a new BJJ competition or tournament
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
            <Trophy className="w-5 h-5" />
            Competition Details
          </CardTitle>
          <CardDescription>
            Fill in the competition information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Competition Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Detroit BJJ Championship"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Detroit Sports Arena, Detroit, MI"
                  />
                </div>

                <div>
                  <Label htmlFor="competitionDate">Competition Date *</Label>
                  <Input
                    id="competitionDate"
                    name="competitionDate"
                    type="datetime-local"
                    value={formData.competitionDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="entryFee">Entry Fee ($)</Label>
                  <Input
                    id="entryFee"
                    name="entryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.entryFee}
                    onChange={handleChange}
                    placeholder="75.00"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="contactInfo">Contact Information</Label>
                  <Input
                    id="contactInfo"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleChange}
                    placeholder="competitions@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="divisions">Divisions</Label>
                  <Textarea
                    id="divisions"
                    name="divisions"
                    value={formData.divisions}
                    onChange={handleChange}
                    placeholder="Age Groups: Kids (6-12), Teens (13-17), Adults (18+)
Weight Classes: Standard IBJJF weight classes
Categories: Gi, No-Gi"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the competition..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="rules">Rules & Information</Label>
                <Textarea
                  id="rules"
                  name="rules"
                  value={formData.rules}
                  onChange={handleChange}
                  placeholder="Competition rules, regulations, and additional information..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/competitions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Competition'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}