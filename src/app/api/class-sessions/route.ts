import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'
import { addDays, isWithinDeadline } from '@/lib/utils'

const createSessionSchema = z.object({
  classId: z.string(),
  sessionDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  instructorId: z.string().optional(),
  maxCapacity: z.number().min(1).max(50).optional(),
  techniquesCovered: z.string().optional(),
  notes: z.string().optional(),
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
    const classId = searchParams.get('classId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where: any = {}

    if (classId) {
      where.classId = classId
    }

    if (dateFrom && dateTo) {
      where.sessionDate = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    } else if (dateFrom) {
      where.sessionDate = {
        gte: new Date(dateFrom)
      }
    } else {
      // Default to upcoming sessions
      where.sessionDate = {
        gte: new Date()
      }
    }

    if (status) {
      where.status = status
    }

    const [sessions, total] = await Promise.all([
      prisma.classSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { sessionDate: 'asc' },
          { startTime: 'asc' }
        ],
        include: {
          class: {
            select: {
              id: true,
              name: true,
              description: true,
              skillLevel: true,
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          bookings: {
            where: {
              bookingStatus: {
                in: ['BOOKED', 'CHECKED_IN']
              }
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
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
      }),
      prisma.classSession.count({ where })
    ])

    // Calculate utilization for each session
    const sessionsWithUtilization = sessions.map(session => ({
      ...session,
      utilization: Math.round((session._count.bookings / session.maxCapacity) * 100),
      availableSpots: session.maxCapacity - session._count.bookings,
    }))

    return NextResponse.json({
      sessions: sessionsWithUtilization,
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
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createSessionSchema.parse(body)

    // Verify class exists
    const classInfo = await prisma.class.findUnique({
      where: { id: data.classId },
      include: {
        instructor: {
          select: { id: true }
        }
      }
    })

    if (!classInfo) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Use class instructor if no instructor provided
    const instructorId = data.instructorId || classInfo.instructorId
    const maxCapacity = data.maxCapacity || classInfo.maxCapacity

    // Create session
    const newSession = await prisma.classSession.create({
      data: {
        ...data,
        sessionDate: new Date(data.sessionDate),
        instructorId,
        maxCapacity,
        currentBookings: 0,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
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
    })

    return NextResponse.json(
      { session: newSession },
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