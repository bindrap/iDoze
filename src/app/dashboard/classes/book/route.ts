import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(req: NextRequest) {
  console.log('📝 Form booking attempt via /dashboard/classes/book/route.ts')

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ No session, redirecting to signin')
      return NextResponse.redirect('http://localhost:3000/auth/signin')
    }

    const formData = await req.formData()
    const classSessionId = formData.get('classSessionId')?.toString()

    console.log('📝 Form booking attempt for session:', classSessionId, 'by user:', session.user.id)

    if (!classSessionId) {
      console.log('❌ No session ID provided')
      return NextResponse.redirect('http://localhost:3000/dashboard/classes?error=missing-session')
    }

    // Make the booking via API
    const bookingResponse = await fetch(`${req.nextUrl.origin}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({ classSessionId })
    })

    if (bookingResponse.ok) {
      console.log('✅ Booking created successfully')
      return NextResponse.redirect('http://localhost:3000/dashboard/classes?success=booked')
    } else {
      const errorData = await bookingResponse.json()
      console.log('❌ Booking failed:', errorData.error)

      if (errorData.error === 'Already booked for this session') {
        return NextResponse.redirect('http://localhost:3000/dashboard/classes?error=already-booked')
      } else if (errorData.error === 'Class is full') {
        return NextResponse.redirect('http://localhost:3000/dashboard/classes?error=class-full')
      } else {
        return NextResponse.redirect('http://localhost:3000/dashboard/classes?error=booking-failed')
      }
    }
  } catch (error) {
    console.error('💥 Form booking error:', error)
    return NextResponse.redirect('http://localhost:3000/dashboard/classes?error=booking-failed')
  }
}