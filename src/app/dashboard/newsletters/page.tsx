'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Newspaper, User, Calendar, Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

type Newsletter = {
  id: string
  title: string
  content: string
  publishDate: string
  priority: string
  targetAudience: string
  author: {
    firstName: string
    lastName: string
  }
}

export default function NewslettersPage({ searchParams }: { searchParams: { success?: string, error?: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchNewsletters()
    }
  }, [status, router])

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletters?published=true', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch newsletters')
      const data = await response.json()
      setNewsletters(data.newsletters || [])
    } catch (error) {
      setError('Failed to load newsletters')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (newsletterId: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return

    try {
      const response = await fetch(`/api/newsletters/${newsletterId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete newsletter')

      fetchNewsletters() // Refresh the list
    } catch (error) {
      setError('Failed to delete newsletter')
    }
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading...</div>
  if (error) return <div className="container mx-auto py-8 px-4 text-red-600">{error}</div>
  if (!session?.user) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'MEMBERS':
        return 'bg-green-100 text-green-800'
      case 'COACHES':
        return 'bg-purple-100 text-purple-800'
      case 'ALL':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletters</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest gym news and announcements
          </p>
        </div>
        {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') && (
          <Link href="/dashboard/newsletters/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Newsletter
            </Button>
          </Link>
        )}

        {/* Error/Success Messages */}
        {searchParams.error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {searchParams.error === 'delete-failed' && 'Failed to delete newsletter'}
            {searchParams.error === 'not-found' && 'Newsletter not found'}
            {searchParams.error === 'unauthorized' && 'You are not authorized to perform this action'}
          </div>
        )}

        {searchParams.success && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
            {searchParams.success === 'created' && 'Newsletter created successfully!'}
            {searchParams.success === 'updated' && 'Newsletter updated successfully!'}
            {searchParams.success === 'deleted' && 'Newsletter deleted successfully!'}
          </div>
        )}
      </div>

      {newsletters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No newsletters yet</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for gym updates and announcements
            </p>
            {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') && (
              <Link href="/dashboard/newsletters/new">
                <Button>Add First Newsletter</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {newsletters.map((newsletter) => (
            <Card key={newsletter.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Newspaper className="w-5 h-5" />
                      {newsletter.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        By {newsletter.author.firstName} {newsletter.author.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(newsletter.publishDate)}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant="secondary"
                      className={getPriorityColor(newsletter.priority)}
                    >
                      {newsletter.priority} Priority
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={getAudienceColor(newsletter.targetAudience)}
                    >
                      For {newsletter.targetAudience === 'ALL' ? 'Everyone' : newsletter.targetAudience}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {newsletter.content.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>

                {(session?.user?.role === 'COACH' || session?.user?.role === 'ADMIN') && (
                  <div className="mt-6 pt-4 border-t flex gap-2 justify-end">
                    <Link href={`/dashboard/newsletters/${newsletter.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(newsletter.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}