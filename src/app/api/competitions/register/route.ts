import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const registerSchema = z.object({
  competitionId: z.string(),
  division: z.string().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
})

const updateRegistrationSchema = z.object({
  division: z.string().optional(),
  weight: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['REGISTERED', 'CONFIRMED', 'CANCELLED']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { competitionId, division, weight, notes } = registerSchema.parse(body)

    // Check if user has active membership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 400 }
      )
    }

    if (user.isOnBench) {
      return NextResponse.json(
        { error: 'Cannot register for competitions while on bench' },
        { status: 400 }
      )
    }

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId }
    })

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    if (!competition.isActive) {
      return NextResponse.json(
        { error: 'Competition is not active' },
        { status: 400 }
      )
    }

    // Check registration deadline
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Check if user already registered
    const existingRegistration = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: session.user.id,
          competitionId
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this competition' },
        { status: 400 }
      )
    }

    // Create registration
    const registration = await prisma.competitionParticipant.create({
      data: {
        userId: session.user.id,
        competitionId,
        division,
        weight,
        notes,
      },
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            competitionDate: true,
          }
        }
      }
    })

    return NextResponse.json(
      { registration },
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
    const competitionId = searchParams.get('competitionId')

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data = updateRegistrationSchema.parse(body)

    // Get existing registration
    const registration = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: session.user.id,
          competitionId
        }
      },
      include: {
        competition: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Check if registration can still be updated
    if (registration.competition.registrationDeadline && new Date() > registration.competition.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Update registration
    const updatedRegistration = await prisma.competitionParticipant.update({
      where: {
        userId_competitionId: {
          userId: session.user.id,
          competitionId
        }
      },
      data,
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            competitionDate: true,
          }
        }
      }
    })

    return NextResponse.json({ registration: updatedRegistration })
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