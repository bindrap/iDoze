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
    console.log('🔥 REACT BOOK BUTTON CLICKED - sessionId:', sessionId)
    console.log('🌐 Current URL:', window.location.href)
    setIsLoading(true)

    try {
      console.log('📤 Making AJAX request to /api/bookings')
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ classSessionId: sessionId })
      })

      console.log('📡 AJAX response:', response.status, response.statusText, response.url)

      if (response.ok) {
        console.log('✅ AJAX booking successful!')
        alert('Class booked successfully!')
        console.log('🔄 About to refresh page')
        // Simple page refresh that actually works
        window.location.href = window.location.href
      } else {
        const errorData = await response.json()
        console.error('❌ AJAX booking error:', errorData)
        alert(`Booking failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('💥 AJAX Network error:', error)
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