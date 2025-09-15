import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'
import { isWithinDeadline, addHours } from '@/lib/utils'

const createBookingSchema = z.object({
  classSessionId: z.string(),
})

const updateBookingSchema = z.object({
  bookingStatus: z.enum(['BOOKED', 'CHECKED_IN', 'NO_SHOW', 'CANCELLED']).optional(),
  cancellationReason: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId') || session.user.id
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Check if user can access bookings
    if (userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const skip = (page - 1) * limit

    const where: any = {
      userId
    }

    if (status) {
      where.bookingStatus = status
    }

    if (upcoming) {
      where.classSession = {
        sessionDate: {
          gte: new Date()
        }
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          classSession: {
            sessionDate: 'desc'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          classSession: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  skillLevel: true,
                }
              },
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }
        }
      }),
      prisma.booking.count({ where })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { classSessionId } = createBookingSchema.parse(body)

    // Check if user has active membership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 400 }
      )
    }

    if (user.isOnBench) {
      return NextResponse.json(
        { error: 'Cannot book classes while on bench' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Class session not found' },
        { status: 404 }
      )
    }

    if (classSession.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Cannot book this class session' },
        { status: 400 }
      )
    }

    // Check if class is full
    if (classSession._count.bookings >= classSession.maxCapacity) {
      return NextResponse.json(
        { error: 'Class is full' },
        { status: 400 }
      )
    }

    // Check booking deadline
    const sessionDateTime = new Date(`${classSession.sessionDate.toISOString().split('T')[0]}T${classSession.startTime}`)
    const deadlineHours = parseInt(process.env.BOOKING_DEADLINE_HOURS || '2')

    if (!isWithinDeadline(sessionDateTime, deadlineHours)) {
      return NextResponse.json(
        { error: 'Booking deadline has passed' },
        { status: 400 }
      )
    }

    // Check if user already has a booking for this session
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classSessionId: {
          userId: session.user.id,
          classSessionId
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Already booked for this session' },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        classSessionId,
      },
      include: {
        classSession: {
          include: {
            class: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    })

    // Update current bookings count
    await prisma.classSession.update({
      where: { id: classSessionId },
      data: {
        currentBookings: {
          increment: 1
        }
      }
    })

    return NextResponse.json(
      { booking },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = updateBookingSchema.parse(body)

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classSession: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user can update this booking
    if (booking.userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check cancellation deadline for user cancellations
    if (data.bookingStatus === 'CANCELLED' && booking.userId === session.user.id) {
      const sessionDateTime = new Date(`${booking.classSession.sessionDate.toISOString().split('T')[0]}T${booking.classSession.startTime}`)
      const deadlineHours = parseInt(process.env.CANCELLATION_DEADLINE_HOURS || '4')

      if (!isWithinDeadline(sessionDateTime, deadlineHours)) {
        return NextResponse.json(
          { error: 'Cancellation deadline has passed' },
          { status: 400 }
        )
      }
    }

    // Update booking
    const updateData: any = { ...data }

    if (data.bookingStatus === 'CANCELLED') {
      updateData.cancellationTime = new Date()
    }

    if (data.bookingStatus === 'CHECKED_IN') {
      updateData.checkInTime = new Date()
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        classSession: {
          include: {
            class: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    })

    // Update current bookings count if status changed to/from cancelled
    if (data.bookingStatus === 'CANCELLED' && booking.bookingStatus !== 'CANCELLED') {
      await prisma.classSession.update({
        where: { id: booking.classSessionId },
        data: {
          currentBookings: {
            decrement: 1
          }
        }
      })
    } else if (booking.bookingStatus === 'CANCELLED' && data.bookingStatus !== 'CANCELLED') {
      await prisma.classSession.update({
        where: { id: booking.classSessionId },
        data: {
          currentBookings: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}