import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Only coaches and admins can promote students
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { beltRank, stripes, notes } = await request.json()

    // Validate input
    if (!beltRank || typeof stripes !== 'number') {
      return NextResponse.json({ error: 'Invalid promotion data' }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'MEMBER'
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if student already has progress record
    const existingProgress = await prisma.memberProgress.findFirst({
      where: { userId: params.id }
    })

    let memberProgress

    if (existingProgress) {
      // Update existing progress
      memberProgress = await prisma.memberProgress.update({
        where: { id: existingProgress.id },
        data: {
          beltRank,
          stripes,
          promotionDate: new Date(),
          promotedById: user.id,
          notes,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          promotedBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    } else {
      // Create new progress record
      memberProgress = await prisma.memberProgress.create({
        data: {
          userId: params.id,
          beltRank,
          stripes,
          promotionDate: new Date(),
          promotedById: user.id,
          totalClassesAttended: 0, // Will be updated by attendance tracking
          notes
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          promotedBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      memberProgress
    })
  } catch (error) {
    console.error('Error promoting student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}