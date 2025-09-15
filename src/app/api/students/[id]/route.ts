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