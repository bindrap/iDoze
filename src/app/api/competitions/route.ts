import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const createCompetitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  competitionDate: z.string(),
  registrationDeadline: z.string().optional(),
  entryFee: z.number().optional(),
  website: z.string().url().optional().or(z.literal('')),
  contactInfo: z.string().optional(),
  divisions: z.string().optional(),
  rules: z.string().optional()
})

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only coaches and admins can create competitions
    if (session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = createCompetitionSchema.parse(body)

    // Prepare competition data
    const competitionData: any = {
      name: data.name,
      description: data.description || null,
      location: data.location,
      competitionDate: new Date(data.competitionDate),
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      entryFee: data.entryFee || null,
      website: data.website || null,
      contactInfo: data.contactInfo || null,
      divisions: data.divisions || null,
      rules: data.rules || null,
      isActive: true,
      createdById: session.user.id
    }

    const competition = await prisma.competition.create({
      data: competitionData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    })

    return NextResponse.json(competition)
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