import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateStatusSchema = z.object({
  isOnBench: z.boolean(),
  benchReason: z.string().optional(),
  benchStartDate: z.string().optional(),
  benchEndDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Only coaches and admins can update student status
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateStatusSchema.parse(body)
    const studentId = params.id

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'MEMBER' },
      select: { id: true, firstName: true, lastName: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Update student status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user bench status
      const updatedUser = await tx.user.update({
        where: { id: studentId },
        data: {
          isOnBench: data.isOnBench,
          benchReason: data.isOnBench ? data.benchReason : null,
          benchStartDate: data.isOnBench && data.benchStartDate ? new Date(data.benchStartDate) : null,
          benchEndDate: data.isOnBench && data.benchEndDate ? new Date(data.benchEndDate) : null,
        }
      })

      // Update member progress notes if provided
      if (data.notes) {
        const existingProgress = await tx.memberProgress.findFirst({
          where: { userId: studentId },
          orderBy: { createdAt: 'desc' }
        })

        if (existingProgress) {
          await tx.memberProgress.update({
            where: { id: existingProgress.id },
            data: { notes: data.notes }
          })
        } else {
          // Create initial progress record if none exists
          await tx.memberProgress.create({
            data: {
              userId: studentId,
              beltRank: 'White Belt',
              stripes: 0,
              totalClassesAttended: 0,
              notes: data.notes
            }
          })
        }
      }

      return updatedUser
    })

    return NextResponse.json({
      message: `Status updated for ${student.firstName} ${student.lastName}`,
      student: result
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating student status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}