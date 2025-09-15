import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const classSessionId = formData.get('classSessionId') as string

    console.log('📝 Form booking attempt for session:', classSessionId, 'by user:', user.id)

    if (!classSessionId) {
      return NextResponse.redirect(new URL('/dashboard/classes?error=missing-session', request.url))
    }

    // Get class session details
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        class: true,
        _count: {
          select: {
            bookings: {
              where: {
                bookingStatus: {
                  in: ['BOOKED', 'CHECKED_IN']
                }
              }
            }
          }
        }
      }
    })

    if (!classSession) {
      return NextResponse.redirect(new URL('/dashboard/classes?error=session-not-found', request.url))
    }

    // Check if class is full
    if (classSession._count.bookings >= classSession.maxCapacity) {
      return NextResponse.redirect(new URL('/dashboard/classes?error=class-full', request.url))
    }

    // Check if user already has a booking for this session
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classSessionId: {
          userId: user.id,
          classSessionId
        }
      }
    })

    if (existingBooking) {
      return NextResponse.redirect(new URL('/dashboard/classes?error=already-booked', request.url))
    }

    // Create booking
    await prisma.booking.create({
      data: {
        userId: user.id,
        classSessionId,
      }
    })

    console.log('✅ Booking created successfully')

    // Redirect to bookings page with success message
    return NextResponse.redirect(new URL('/dashboard/bookings?success=booked', request.url))

  } catch (error) {
    console.error('❌ Booking error:', error)
    return NextResponse.redirect(new URL('/dashboard/classes?error=booking-failed', request.url))
  }
}