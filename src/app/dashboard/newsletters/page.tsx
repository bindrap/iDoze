import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Newspaper, User, Calendar } from 'lucide-react'

async function getNewsletters() {
  return prisma.newsletter.findMany({
    where: {
      isPublished: true
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    },
    orderBy: {
      publishDate: 'desc'
    }
  })
}

export default async function NewslettersPage() {
  const user = await requireAuth()
  const newsletters = await getNewsletters()

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Newsletters</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest gym news and announcements
        </p>
      </div>

      {newsletters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No newsletters yet</h3>
            <p className="text-muted-foreground">
              Check back later for gym updates and announcements
            </p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}