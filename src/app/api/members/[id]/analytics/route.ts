import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can access this analytics (own data or admin/coach)
    if (session.user.id !== params.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get member progress
    const memberProgress = await prisma.memberProgress.findFirst({
      where: { userId: params.id },
      select: {
        beltRank: true,
        stripes: true,
      }
    })

    // Get all attendance records for the user
    const allAttendance = await prisma.attendance.findMany({
      where: { userId: params.id },
      include: {
        classSession: {
          include: {
            class: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { checkInTime: 'desc' }
    })

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Calculate basic metrics
    const totalClassesAttended = allAttendance.length
    const thisMonthAttendance = allAttendance.filter(a => new Date(a.checkInTime) >= thisMonth).length
    const lastMonthAttendance = allAttendance.filter(a => {
      const date = new Date(a.checkInTime)
      return date >= lastMonth && date < thisMonth
    }).length

    // Calculate weekly average (based on all time)
    const daysSinceJoining = Math.max(1, Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
    const weeksSinceJoining = daysSinceJoining / 7
    const averageClassesPerWeek = totalClassesAttended / weeksSinceJoining

    // Calculate favorite class types
    const classTypeCount = allAttendance.reduce((acc, attendance) => {
      const className = attendance.classSession.class.name
      acc[className] = (acc[className] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const favoriteClassTypes = Object.entries(classTypeCount)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate attendance streak (consecutive days with at least one class)
    let attendanceStreak = 0
    let longestStreak = 0
    let currentStreak = 0

    // Group attendance by date
    const attendanceDates = allAttendance.map(a => {
      const date = new Date(a.checkInTime)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0]
    })

    const uniqueDates = Array.from(new Set(attendanceDates)).sort().reverse()

    // Calculate current streak
    const today = new Date()
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      if (uniqueDates.includes(dateStr)) {
        if (i === 0 || attendanceStreak > 0) { // Today or continuing streak
          attendanceStreak++
        }
      } else if (i === 0) {
        // No attendance today, check yesterday
        continue
      } else {
        break
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])
      currentStreak = 1

      for (let j = i + 1; j < uniqueDates.length; j++) {
        const nextDate = new Date(uniqueDates[j])
        const dayDiff = Math.abs((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dayDiff === j - i) {
          currentStreak++
        } else {
          break
        }
      }

      longestStreak = Math.max(longestStreak, currentStreak)
    }

    // Recent attendance (last 10)
    const recentAttendance = allAttendance.slice(0, 10).map(attendance => ({
      date: attendance.checkInTime.toISOString(),
      className: attendance.classSession.class.name,
      dayOfWeek: attendance.checkInTime.toLocaleDateString('en-US', { weekday: 'long' })
    }))

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const count = allAttendance.filter(a => {
        const date = new Date(a.checkInTime)
        return date >= monthDate && date < nextMonth
      }).length

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      })
    }

    // Attendance by day of week
    const dayOfWeekCount = allAttendance.reduce((acc, attendance) => {
      const dayName = attendance.checkInTime.toLocaleDateString('en-US', { weekday: 'long' })
      acc[dayName] = (acc[dayName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const attendanceByDayOfWeek = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ].map(day => ({
      day,
      count: dayOfWeekCount[day] || 0
    }))

    // Determine next goal (simplified logic)
    let nextGoal = undefined
    if (memberProgress?.beltRank === 'WHITE' && memberProgress.stripes < 4) {
      nextGoal = `${memberProgress.stripes + 1} stripe(s) on White Belt`
    } else if (memberProgress?.beltRank === 'WHITE' && memberProgress.stripes >= 4) {
      nextGoal = 'Blue Belt promotion'
    }

    const analytics = {
      totalClassesAttended,
      thisMonthAttendance,
      lastMonthAttendance,
      averageClassesPerWeek: Math.round(averageClassesPerWeek * 10) / 10,
      favoriteClassTypes,
      attendanceStreak,
      longestStreak,
      recentAttendance,
      monthlyTrend,
      attendanceByDayOfWeek,
      memberSince: user.createdAt.toISOString(),
      currentBelt: memberProgress?.beltRank || 'WHITE',
      stripes: memberProgress?.stripes || 0,
      nextGoal
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}