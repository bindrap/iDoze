import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const checkInSchema = z.object({
  classSessionId: z.string(),
  userId: z.string().optional(), // For coaches/admins checking in members
})

const updateAttendanceSchema = z.object({
  attendanceStatus: z.enum(['PRESENT', 'LATE', 'LEFT_EARLY']).optional(),
  checkOutTime: z.string().optional(),
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
    const userId = searchParams.get('userId')
    const classSessionId = searchParams.get('classSessionId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    const where: any = {}

    // If regular member, only show their own attendance
    if (session.user.role === 'MEMBER' && !userId) {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
    }

    if (classSessionId) {
      where.classSessionId = classSessionId
    }

    if (dateFrom && dateTo) {
      where.classSession = {
        sessionDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      }
    } else if (dateFrom) {
      where.classSession = {
        sessionDate: {
          gte: new Date(dateFrom)
        }
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          checkInTime: 'desc'
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
      prisma.attendance.count({ where })
    ])

    return NextResponse.json({
      attendance,
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
    const { classSessionId, userId } = checkInSchema.parse(body)

    // Determine which user to check in
    const targetUserId = userId || session.user.id

    // If checking in someone else, must be coach or admin
    if (userId && userId !== session.user.id && session.user.role === 'MEMBER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get class session details
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: {
        class: true
      }
    })

    if (!classSession) {
      return NextResponse.json(
        { error: 'Class session not found' },
        { status: 404 }
      )
    }

    // Check if class session is ongoing or scheduled
    if (classSession.status !== 'SCHEDULED' && classSession.status !== 'ONGOING') {
      return NextResponse.json(
        { error: 'Cannot check in to this class session' },
        { status: 400 }
      )
    }

    // Check if user has a booking for this session
    const booking = await prisma.booking.findUnique({
      where: {
        userId_classSessionId: {
          userId: targetUserId,
          classSessionId
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'No booking found for this session' },
        { status: 400 }
      )
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_classSessionId: {
          userId: targetUserId,
          classSessionId
        }
      }
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already checked in' },
        { status: 400 }
      )
    }

    // Determine if late check-in
    const now = new Date()
    const sessionStart = new Date(`${classSession.sessionDate.toISOString().split('T')[0]}T${classSession.startTime}`)
    const isLate = now > sessionStart

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: targetUserId,
        classSessionId,
        checkInTime: now,
        attendanceStatus: isLate ? 'LATE' : 'PRESENT',
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

    // Update booking status to checked in
    await prisma.booking.update({
      where: {
        userId_classSessionId: {
          userId: targetUserId,
          classSessionId
        }
      },
      data: {
        bookingStatus: 'CHECKED_IN',
        checkInTime: now,
      }
    })

    // Update class session status to ongoing if first check-in
    if (classSession.status === 'SCHEDULED') {
      await prisma.classSession.update({
        where: { id: classSessionId },
        data: {
          status: 'ONGOING'
        }
      })
    }

    // Update member progress
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (user) {
      const existingProgress = await prisma.memberProgress.findFirst({
        where: { userId: targetUserId }
      })

      if (existingProgress) {
        await prisma.memberProgress.update({
          where: { id: existingProgress.id },
          data: {
            totalClassesAttended: {
              increment: 1
            },
            lastAttendanceDate: now,
          }
        })
      } else {
        await prisma.memberProgress.create({
          data: {
            userId: targetUserId,
            totalClassesAttended: 1,
            lastAttendanceDate: now,
          }
        })
      }
    }

    return NextResponse.json(
      { attendance },
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
    const attendanceId = searchParams.get('id')

    if (!attendanceId) {
      return NextResponse.json(
        { error: 'Attendance ID required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = updateAttendanceSchema.parse(body)

    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Check if user can update this attendance
    if (attendance.userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update attendance
    const updateData: any = { ...data }

    if (data.checkOutTime) {
      updateData.checkOutTime = new Date(data.checkOutTime)
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: updateData,
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

    return NextResponse.json({ attendance: updatedAttendance })
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