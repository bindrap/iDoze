import { requireAuth } from '@/lib/auth'
import Navigation from '@/components/dashboard/Navigation'
import { BackgroundSelector } from '@/components/ui/background-selector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen safe-top safe-bottom" data-dashboard-container>
      <Navigation user={user} />
      <main className="flex-1">
        <div className="backdrop-blur-sm min-h-screen bg-white/40 pb-safe-bottom">
          {children}
        </div>
      </main>
      <BackgroundSelector />
    </div>
  )
}