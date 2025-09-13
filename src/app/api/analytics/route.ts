import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { addDays } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || session.user.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const now = new Date()
    const defaultDateFrom = addDays(now, -30).toISOString().split('T')[0]
    const defaultDateTo = now.toISOString().split('T')[0]

    const startDate = new Date(dateFrom || defaultDateFrom)
    const endDate = new Date(dateTo || defaultDateTo)

    switch (type) {
      case 'overview':
        return await getOverviewAnalytics(startDate, endDate)

      case 'attendance':
        return await getAttendanceAnalytics(startDate, endDate)

      case 'utilization':
        return await getUtilizationAnalytics(startDate, endDate)

      case 'members':
        return await getMemberAnalytics(startDate, endDate)

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getOverviewAnalytics(startDate: Date, endDate: Date) {
  const [
    totalMembers,
    activeMembers,
    totalClasses,
    totalSessions,
    totalAttendance,
    averageUtilization
  ] = await Promise.all([
    // Total members
    prisma.user.count({
      where: { role: 'MEMBER' }
    }),

    // Active members (attended at least once in period)
    prisma.user.count({
      where: {
        role: 'MEMBER',
        attendance: {
          some: {
            checkInTime: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    }),

    // Total classes
    prisma.class.count({
      where: { isActive: true }
    }),

    // Total sessions in period
    prisma.classSession.count({
      where: {
        sessionDate: {
          gte: startDate,
          lte: endDate
        }
      }
    }),

    // Total attendance in period
    prisma.attendance.count({
      where: {
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      }
    }),

    // Average utilization
    prisma.$queryRaw`
      SELECT AVG(CAST(current_bookings AS FLOAT) / max_capacity * 100) as avg_utilization
      FROM class_sessions
      WHERE session_date >= ${startDate} AND session_date <= ${endDate}
      AND status = 'COMPLETED'
    `
  ])

  const avgUtil = Array.isArray(averageUtilization) && averageUtilization[0]
    ? Math.round(averageUtilization[0].avg_utilization || 0)
    : 0

  return NextResponse.json({
    overview: {
      totalMembers,
      activeMembers,
      totalClasses,
      totalSessions,
      totalAttendance,
      averageUtilization: avgUtil,
      memberRetentionRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0
    }
  })
}

async function getAttendanceAnalytics(startDate: Date, endDate: Date) {
  const dailyAttendance = await prisma.$queryRaw`
    SELECT
      DATE(cs.session_date) as date,
      COUNT(a.id) as attendance_count,
      COUNT(DISTINCT cs.id) as session_count
    FROM class_sessions cs
    LEFT JOIN attendance a ON cs.id = a.class_session_id
    WHERE cs.session_date >= ${startDate} AND cs.session_date <= ${endDate}
    GROUP BY DATE(cs.session_date)
    ORDER BY date
  `

  const classAttendance = await prisma.$queryRaw`
    SELECT
      c.name as class_name,
      c.id as class_id,
      COUNT(a.id) as total_attendance,
      COUNT(DISTINCT cs.id) as session_count,
      AVG(CAST(cs.current_bookings AS FLOAT) / cs.max_capacity * 100) as avg_utilization
    FROM classes c
    LEFT JOIN class_sessions cs ON c.id = cs.class_id
    LEFT JOIN attendance a ON cs.id = a.class_session_id
    WHERE cs.session_date >= ${startDate} AND cs.session_date <= ${endDate}
    GROUP BY c.id, c.name
    ORDER BY total_attendance DESC
  `

  const attendanceByStatus = await prisma.attendance.groupBy({
    by: ['attendanceStatus'],
    where: {
      checkInTime: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    }
  })

  return NextResponse.json({
    dailyAttendance,
    classAttendance,
    attendanceByStatus
  })
}

async function getUtilizationAnalytics(startDate: Date, endDate: Date) {
  const utilizationTrend = await prisma.$queryRaw`
    SELECT
      DATE(session_date) as date,
      AVG(CAST(current_bookings AS FLOAT) / max_capacity * 100) as avg_utilization,
      COUNT(*) as session_count
    FROM class_sessions
    WHERE session_date >= ${startDate} AND session_date <= ${endDate}
    AND status IN ('COMPLETED', 'ONGOING')
    GROUP BY DATE(session_date)
    ORDER BY date
  `

  const classUtilization = await prisma.$queryRaw`
    SELECT
      c.name as class_name,
      c.id as class_id,
      AVG(CAST(cs.current_bookings AS FLOAT) / cs.max_capacity * 100) as avg_utilization,
      COUNT(cs.id) as session_count,
      SUM(cs.current_bookings) as total_bookings,
      SUM(cs.max_capacity) as total_capacity
    FROM classes c
    LEFT JOIN class_sessions cs ON c.id = cs.class_id
    WHERE cs.session_date >= ${startDate} AND cs.session_date <= ${endDate}
    AND cs.status IN ('COMPLETED', 'ONGOING')
    GROUP BY c.id, c.name
    ORDER BY avg_utilization DESC
  `

  const peakHours = await prisma.$queryRaw`
    SELECT
      start_time,
      AVG(CAST(current_bookings AS FLOAT) / max_capacity * 100) as avg_utilization,
      COUNT(*) as session_count
    FROM class_sessions
    WHERE session_date >= ${startDate} AND session_date <= ${endDate}
    AND status IN ('COMPLETED', 'ONGOING')
    GROUP BY start_time
    ORDER BY avg_utilization DESC
  `

  return NextResponse.json({
    utilizationTrend,
    classUtilization,
    peakHours
  })
}

async function getMemberAnalytics(startDate: Date, endDate: Date) {
  const memberStats = await prisma.$queryRaw`
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.membership_status,
      COUNT(a.id) as attendance_count,
      COUNT(DISTINCT a.class_session_id) as unique_sessions,
      MIN(a.check_in_time) as first_attendance,
      MAX(a.check_in_time) as last_attendance
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
      AND a.check_in_time >= ${startDate}
      AND a.check_in_time <= ${endDate}
    WHERE u.role = 'MEMBER'
    GROUP BY u.id, u.first_name, u.last_name, u.membership_status
    ORDER BY attendance_count DESC
    LIMIT 20
  `

  const membershipStatus = await prisma.user.groupBy({
    by: ['membershipStatus'],
    where: {
      role: 'MEMBER'
    },
    _count: {
      id: true
    }
  })

  const newMembers = await prisma.user.count({
    where: {
      role: 'MEMBER',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const membersOnBench = await prisma.user.count({
    where: {
      role: 'MEMBER',
      isOnBench: true
    }
  })

  return NextResponse.json({
    topMembers: memberStats,
    membershipStatus,
    newMembers,
    membersOnBench
  })
}