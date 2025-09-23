import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN' && user.role !== 'COACH') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed analytics and insights for gym management
        </p>
      </div>

      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboard Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          We're working on bringing you comprehensive analytics and reporting features.
          In the meantime, you can access basic analytics from the main dashboard.
        </p>
        <Link href="/dashboard/analytics">
          <Button>
            View Basic Analytics
          </Button>
        </Link>
      </div>
    </div>
  )
}