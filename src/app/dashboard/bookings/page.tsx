'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, User, Clock } from 'lucide-react'

type Booking = {
  id: string
  bookingStatus: string
  bookingDate: string
  checkInTime?: string
  classSession: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    class: {
      name: string
      skillLevel: string
    }
    instructor: {
      firstName: string
      lastName: string
    }
  }
}

export default function BookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchBookings()
    }
  }, [status, router])

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch bookings')
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingStatus: 'CANCELLED' })
      })
      if (!response.ok) throw new Error('Failed to cancel booking')
      fetchBookings()
    } catch (error) {
      setError('Failed to cancel booking')
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingStatus: 'CHECKED_IN' })
      })
      if (!response.ok) throw new Error('Failed to check in')
      fetchBookings()
    } catch (error) {
      setError('Failed to check in')
    }
  }

  const handleCheckOut = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingStatus: 'BOOKED' })
      })
      if (!response.ok) throw new Error('Failed to check out')
      fetchBookings()
    } catch (error) {
      setError('Failed to check out')
    }
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading...</div>
  if (error) return <div className="container mx-auto py-8 px-4 text-red-600">{error}</div>

  const upcomingBookings = bookings.filter(booking =>
    new Date(booking.classSession.sessionDate) >= new Date() &&
    booking.bookingStatus !== 'CANCELLED'
  )

  const pastBookings = bookings.filter(booking =>
    new Date(booking.classSession.sessionDate) < new Date() ||
    booking.bookingStatus === 'CANCELLED'
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your class bookings
        </p>
      </div>

      {/* Upcoming Bookings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No upcoming bookings</p>
              <a href="/dashboard/classes">
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Class
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {booking.classSession.class.name}
                    </CardTitle>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      booking.bookingStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                      booking.bookingStatus === 'BOOKED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.bookingStatus === 'CHECKED_IN' ? 'Checked In' :
                       booking.bookingStatus === 'BOOKED' ? 'Confirmed' : booking.bookingStatus}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(booking.classSession.sessionDate)} at {formatTime(booking.classSession.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {booking.classSession.instructor.firstName} {booking.classSession.instructor.lastName}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Skill Level: {booking.classSession.class.skillLevel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Booked on: {formatDate(booking.bookingDate)}
                      </p>
                      {booking.checkInTime && (
                        <p className="text-sm text-green-600">
                          Checked in at: {formatTime(booking.checkInTime)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {booking.bookingStatus === 'BOOKED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(booking.id)}
                          >
                            Check In
                          </Button>
                        </>
                      )}
                      {booking.bookingStatus === 'CHECKED_IN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(booking.id)}
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Bookings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past Classes</h2>
        {pastBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No past bookings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pastBookings.slice(0, 10).map((booking) => (
              <Card key={booking.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {booking.classSession.class.name}
                    </CardTitle>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      booking.bookingStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                      booking.bookingStatus === 'NO_SHOW' ? 'bg-red-100 text-red-800' :
                      booking.bookingStatus === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.bookingStatus === 'CHECKED_IN' ? 'Attended' :
                       booking.bookingStatus === 'NO_SHOW' ? 'No Show' :
                       booking.bookingStatus === 'CANCELLED' ? 'Cancelled' : booking.bookingStatus}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(booking.classSession.sessionDate)} at {formatTime(booking.classSession.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {booking.classSession.instructor.firstName} {booking.classSession.instructor.lastName}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}