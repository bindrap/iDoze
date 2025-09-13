import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Edit, Eye, Trash2, Plus } from 'lucide-react'

async function getNewsletters() {
  return prisma.newsletter.findMany({
    orderBy: {
      publishDate: 'desc'
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  })
}

export default async function NewslettersPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const newsletters = await getNewsletters()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Newsletter Management</h1>
          <p className="text-muted-foreground">
            Create and manage gym newsletters and announcements
          </p>
        </div>
        <Link href="/dashboard/admin/newsletters/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Newsletter
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {newsletters.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No newsletters yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first newsletter to keep members informed
                </p>
                <Link href="/dashboard/admin/newsletters/new">
                  <Button>Create Newsletter</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          newsletters.map((newsletter) => (
            <Card key={newsletter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{newsletter.title}</CardTitle>
                    <CardDescription>
                      By {newsletter.author.firstName} {newsletter.author.lastName} •
                      {formatDate(newsletter.publishDate)} •
                      {newsletter.targetAudience} •
                      <span className={`font-semibold ${
                        newsletter.priority === 'HIGH' ? 'text-red-600' :
                        newsletter.priority === 'NORMAL' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {newsletter.priority} Priority
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      newsletter.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {newsletter.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-muted-foreground line-clamp-3">
                    {newsletter.content.substring(0, 200)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/admin/newsletters/${newsletter.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/admin/newsletters/${newsletter.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}