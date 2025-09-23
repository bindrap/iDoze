import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Only coaches and admins can access student data
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const student = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'MEMBER'
      },
      include: {
        memberProgress: {
          include: {
            promotedBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            attendance: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Only coaches and admins can delete students
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const studentId = params.id

    // Check if student exists and is a member
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        membershipStatus: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (student.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Cannot delete non-member users' }, { status: 400 })
    }

    // Instead of hard deletion, mark as inactive (soft delete)
    await prisma.user.update({
      where: { id: studentId },
      data: {
        membershipStatus: 'INACTIVE',
        benchReason: 'Removed by admin/coach',
        isOnBench: true,
        benchStartDate: new Date()
      }
    })

    return NextResponse.json({
      message: `Student ${student.firstName} ${student.lastName} has been removed successfully`
    })

  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}