import { requireAuth } from '@/lib/auth'
import Navigation from '@/components/dashboard/Navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}