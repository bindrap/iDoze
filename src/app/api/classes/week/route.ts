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

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    console.log('API: Fetching classes from', startDate, 'to', endDate)

    // First check total classes in database
    const totalClasses = await prisma.class.count()
    const activeClasses = await prisma.class.count({ where: { isActive: true } })
    console.log('API: Total classes in DB:', totalClasses, 'Active classes:', activeClasses)

    // Get all active classes
    const classes = await prisma.class.findMany({
      where: {
        isActive: true
      },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        sessions: {
          where: {
            sessionDate: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            sessionDate: 'asc'
          },
          include: {
            _count: {
              select: {
                bookings: {
                  where: {
                    bookingStatus: {
                      in: ['BOOKED', 'CHECKED_IN']
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    console.log('API: Found', classes.length, 'active classes')

    // Generate sessions for classes that need them
    for (const classItem of classes) {
      console.log(`API: Processing class "${classItem.name}" (dayOfWeek: ${classItem.dayOfWeek})`)
      if (classItem.dayOfWeek !== null) {
        // Find days in the week that match this class's day
        const weekDays = []
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === classItem.dayOfWeek) {
            weekDays.push(new Date(d))
          }
        }
        console.log(`API: Found ${weekDays.length} matching days for "${classItem.name}":`, weekDays.map(d => d.toDateString()))

        // For each matching day, create session if it doesn't exist
        for (const sessionDate of weekDays) {
          const existingSession = classItem.sessions.find(s => {
            const sDate = new Date(s.sessionDate)
            return sDate.toDateString() === sessionDate.toDateString()
          })

          if (!existingSession) {
            try {
              const session = await prisma.classSession.create({
                data: {
                  classId: classItem.id,
                  sessionDate: sessionDate,
                  startTime: classItem.startTime || '00:00',
                  endTime: classItem.endTime || '01:00',
                  maxCapacity: classItem.maxCapacity,
                  status: 'SCHEDULED'
                },
                include: {
                  _count: {
                    select: {
                      bookings: {
                        where: {
                          bookingStatus: {
                            in: ['BOOKED', 'CHECKED_IN']
                          }
                        }
                      }
                    }
                  }
                }
              })
              classItem.sessions.push(session)
            } catch (error) {
              // Session might already exist, try to fetch it
              const existingSession = await prisma.classSession.findFirst({
                where: {
                  classId: classItem.id,
                  sessionDate: sessionDate
                },
                include: {
                  _count: {
                    select: {
                      bookings: {
                        where: {
                          bookingStatus: {
                            in: ['BOOKED', 'CHECKED_IN']
                          }
                        }
                      }
                    }
                  }
                }
              })
              if (existingSession) {
                classItem.sessions.push(existingSession)
              }
            }
          }
        }
      }
    }

    // Filter classes to return those that either have sessions OR should have sessions based on dayOfWeek
    const filteredClasses = classes.filter(classItem => {
      // If class has sessions in the requested week, include it
      const hasSessionsInWeek = classItem.sessions.some(session => {
        const sessionDate = new Date(session.sessionDate)
        return sessionDate >= startDate && sessionDate <= endDate
      })

      if (hasSessionsInWeek) {
        return true
      }

      // If class has a dayOfWeek and that day falls within the requested week, include it
      if (classItem.dayOfWeek !== null) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === classItem.dayOfWeek) {
            return true
          }
        }
      }

      return false
    })

    console.log('API: Returning', filteredClasses.length, 'classes')
    console.log('API: Classes:', filteredClasses.map(c => ({ name: c.name, sessionCount: c.sessions.length })))

    return NextResponse.json(filteredClasses)
  } catch (error) {
    console.error('Error fetching weekly classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}