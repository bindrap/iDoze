import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()

    // Only coaches and admins can access this data
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const recentPromotions = await prisma.memberProgress.findMany({
      where: {
        promotionDate: {
          not: null
        }
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
      },
      orderBy: {
        promotionDate: 'desc'
      },
      take: 5
    })

    return NextResponse.json(recentPromotions)
  } catch (error) {
    console.error('Error fetching recent promotions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}