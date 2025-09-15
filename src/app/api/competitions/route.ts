import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const competitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        competitionDate: {
          gte: new Date()
        }
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        competitionDate: 'asc'
      }
    })

    return NextResponse.json(competitions)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}