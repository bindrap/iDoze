'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface BookClassButtonProps {
  sessionId: string
  availableSpots: number
}

export function BookClassButton({ sessionId, availableSpots }: BookClassButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBookClass = async () => {
    console.log('🔥 BOOK BUTTON CLICKED - sessionId:', sessionId)
    setIsLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ classSessionId: sessionId })
      })

      console.log('📡 Booking response:', response.status, response.statusText)

      if (response.ok) {
        console.log('✅ Booking successful!')
        alert('Class booked successfully!')
        router.refresh() // Refresh the page to show updated data
        router.push('/dashboard/bookings')
      } else {
        const errorData = await response.json()
        console.error('❌ Booking error:', errorData)
        alert(`Booking failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('💥 Network error:', error)
      alert('Network error: Please check your connection')
    } finally {
      setIsLoading(false)
    }
  }

  if (availableSpots === 0) {
    return (
      <Button size="sm" disabled className="mt-1">
        Full
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      onClick={handleBookClass}
      disabled={isLoading}
      className="mt-1"
    >
      {isLoading ? 'Booking...' : 'Book'}
    </Button>
  )
}