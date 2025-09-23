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
import { Newspaper, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Newsletter = {
  id: string
  title: string
  content: string
  targetAudience: string
  priority: string
  isPublished: boolean
}

export default function EditNewsletterPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    priority: 'NORMAL',
    isPublished: true
  })

  // Check authorization
  if (session?.user?.role !== 'COACH' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard/newsletters')
    return null
  }

  useEffect(() => {
    if (params.id) {
      fetchNewsletter()
    }
  }, [params.id])

  const fetchNewsletter = async () => {
    try {
      const response = await fetch(`/api/newsletters/${params.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch newsletter')

      const data = await response.json()
      setNewsletter(data)
      setFormData({
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        priority: data.priority,
        isPublished: data.isPublished
      })
    } catch (error) {
      setError('Failed to load newsletter')
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
      const response = await fetch(`/api/newsletters/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update newsletter')
      }

      router.push('/dashboard/newsletters?success=updated')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update newsletter')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <p>Loading newsletter...</p>
        </div>
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <p className="text-red-600">Newsletter not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard/newsletters">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Newsletters
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Newsletter</h1>
          <p className="text-muted-foreground">
            Update newsletter information
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
            <Newspaper className="w-5 h-5" />
            Newsletter Details
          </CardTitle>
          <CardDescription>
            Update the newsletter information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Newsletter Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Monthly Update - December 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => handleSelectChange('targetAudience', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Everyone</SelectItem>
                      <SelectItem value="MEMBERS">Members Only</SelectItem>
                      <SelectItem value="COACHES">Coaches Only</SelectItem>
                      <SelectItem value="ADMINS">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Priority</SelectItem>
                      <SelectItem value="NORMAL">Normal Priority</SelectItem>
                      <SelectItem value="HIGH">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => handleSwitchChange('isPublished', checked)}
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Newsletter Content *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    required
                    placeholder="Write your newsletter content here..."
                    rows={15}
                    className="min-h-[300px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Use line breaks to separate paragraphs
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/newsletters">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Newsletter'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}