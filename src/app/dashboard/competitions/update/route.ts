import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const competitionId = formData.get('competitionId') as string
    const division = formData.get('division') as string

    console.log('📝 Competition update attempt for:', competitionId, 'by user:', user.id)

    if (!competitionId) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=missing-competition', request.url))
    }

    // Get existing registration
    const existingRegistration = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId
        }
      }
    })

    if (!existingRegistration) {
      return NextResponse.redirect(new URL('/dashboard/competitions?error=not-registered', request.url))
    }

    // Update registration with division if provided
    await prisma.competitionParticipant.update({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId
        }
      },
      data: {
        division: division || undefined
      }
    })

    console.log('✅ Competition registration updated successfully')

    // Redirect back to competitions with success message
    return NextResponse.redirect(new URL('/dashboard/competitions?success=updated', request.url))

  } catch (error) {
    console.error('❌ Competition update error:', error)
    return NextResponse.redirect(new URL('/dashboard/competitions?error=update-failed', request.url))
  }
}