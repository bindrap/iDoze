import { requireAuth } from '@/lib/auth'
import { ClassesCalendar } from '@/components/dashboard/ClassesCalendar'

export default async function ClassesPage({ searchParams }: { searchParams: { error?: string, success?: string } }) {
  const user = await requireAuth()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Classes</h1>
        <p className="text-muted-foreground">
          Click on any day to view and book classes
        </p>

        {/* Error/Success Messages */}
        {searchParams.error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {searchParams.error === 'class-full' && 'Class is full'}
            {searchParams.error === 'already-booked' && 'You are already booked for this class'}
            {searchParams.error === 'booking-failed' && 'Booking failed. Please try again.'}
            {searchParams.error === 'missing-session' && 'Invalid session'}
            {searchParams.error === 'session-not-found' && 'Session not found'}
          </div>
        )}

        {searchParams.success && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
            {searchParams.success === 'booked' && 'Class booked successfully!'}
          </div>
        )}
      </div>

      <ClassesCalendar />
    </div>
  )
}