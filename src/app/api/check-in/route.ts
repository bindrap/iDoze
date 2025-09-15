import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return redirect('/auth/signin')
    }

    // Only coaches and admins can check in students
    if (session.user.role !== 'COACH' && session.user.role !== 'ADMIN') {
      return redirect('/dashboard')
    }

    const formData = await req.formData()
    const userId = formData.get('userId') as string
    const classSessionId = formData.get('classSessionId') as string
    const bookingId = formData.get('bookingId') as string

    if (!userId || !classSessionId || !bookingId) {
      return redirect('/dashboard/check-in?error=missing-data')
    }

    // Verify the booking exists and is valid
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        classSession: true
      }
    })

    if (!booking || booking.userId !== userId || booking.classSessionId !== classSessionId) {
      return redirect('/dashboard/check-in?error=invalid-booking')
    }

    if (booking.bookingStatus === 'CHECKED_IN') {
      return redirect('/dashboard/check-in?error=already-checked-in')
    }

    const now = new Date()

    // Update booking status to checked in
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'CHECKED_IN',
        checkInTime: now
      }
    })

    // Create attendance record
    await prisma.attendance.create({
      data: {
        userId,
        classSessionId,
        checkInTime: now,
        notes: `Checked in by ${session.user.firstName} ${session.user.lastName}`
      }
    })

    // Update member progress
    const memberProgress = await prisma.memberProgress.findFirst({
      where: { userId }
    })

    if (memberProgress) {
      await prisma.memberProgress.update({
        where: { id: memberProgress.id },
        data: {
          totalClassesAttended: memberProgress.totalClassesAttended + 1,
          lastAttendanceDate: now
        }
      })
    } else {
      // Create member progress if it doesn't exist
      await prisma.memberProgress.create({
        data: {
          userId,
          beltRank: 'WHITE',
          stripes: 0,
          totalClassesAttended: 1,
          lastAttendanceDate: now
        }
      })
    }

    return redirect('/dashboard/check-in?success=checked-in')
  } catch (error) {
    console.error('Check-in error:', error)
    return redirect('/dashboard/check-in?error=check-in-failed')
  }
}