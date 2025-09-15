import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const competitionId = formData.get('competitionId') as string

    console.log('📝 Competition registration attempt for:', competitionId, 'by user:', user.id)

    if (!competitionId) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=missing-competition', request.url))
    }

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        participants: {
          where: { userId: user.id }
        }
      }
    })

    if (!competition) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=competition-not-found', request.url))
    }

    // Check if user already registered
    if (competition.participants.length > 0) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=already-registered', request.url))
    }

    // Check if registration is still open
    if (competition.registrationDeadline && new Date() > new Date(competition.registrationDeadline)) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=registration-closed', request.url))
    }

    // Create registration
    await prisma.competitionParticipant.create({
      data: {
        userId: user.id,
        competitionId,
        status: 'REGISTERED'
      }
    })

    console.log('✅ Competition registration created successfully')

    // Redirect back to competitions with success message
    return NextResponse.redirect(new URL('/dashboard/competitions?success=registered', request.url))

  } catch (error) {
    console.error('❌ Competition registration error:', error)
    return NextResponse.redirect(new URL('/dashboard/competitions?error=registration-failed', request.url))
  }
}