import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  instructorId: z.string(),
  maxCapacity: z.number().min(1).max(50).default(40),
  durationMinutes: z.number().min(15).default(60),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL']).default('ALL'),
  isRecurring: z.boolean().default(true),
  dayOfWeek: z.number().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Classes API session:', session)

    if (!session?.user) {
      console.log('No session found in classes API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skillLevel = searchParams.get('skillLevel') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (skillLevel) {
      where.skillLevel = skillLevel
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          sessions: {
            where: {
              sessionDate: {
                gte: new Date()
              }
            },
            orderBy: {
              sessionDate: 'asc'
            },
            take: 3,
            include: {
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
          }
        }
      }),
      prisma.class.count({ where })
    ])

    return NextResponse.json({
      classes,
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
    const data = createClassSchema.parse(body)

    // Verify instructor exists and has appropriate role
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId }
    })

    if (!instructor || (instructor.role !== 'COACH' && instructor.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Invalid instructor' },
        { status: 400 }
      )
    }

    const newClass = await prisma.class.create({
      data,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json(
      { class: newClass },
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