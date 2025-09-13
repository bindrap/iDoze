import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail, generateMissedClassEmail, generateClassReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Verify request is from cron job (basic auth check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      missedClassNotifications: 0,
      classReminders: 0,
      errors: [] as string[]
    }

    // Process missed class notifications
    await processMissedClassNotifications(results)

    // Process class reminders for tomorrow
    await processClassReminders(results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 })
  }
}

async function processMissedClassNotifications(results: any) {
  try {
    const notificationDays = await prisma.settings.findUnique({
      where: { key: 'missed_class_notification_days' }
    })

    const daysThreshold = parseInt(notificationDays?.value || '14')
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold)

    // Find members who haven't attended in the threshold days and haven't received notifications recently
    const membersToNotify = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
        membershipStatus: 'ACTIVE',
        isOnBench: false,
        memberProgress: {
          lastAttendanceDate: {
            lt: cutoffDate
          }
        }
      },
      include: {
        memberProgress: true,
        notifications: {
          where: {
            notificationType: 'MISSED_CLASS',
            sentAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          take: 1
        }
      }
    })

    for (const member of membersToNotify) {
      // Skip if already notified in the last 7 days
      if (member.notifications.length > 0) {
        continue
      }

      // Find their last missed session
      const lastMissedSession = await prisma.classSession.findFirst({
        where: {
          sessionDate: {
            gte: member.memberProgress?.lastAttendanceDate || cutoffDate,
            lte: new Date()
          },
          status: 'COMPLETED',
          bookings: {
            some: {
              userId: member.id,
              bookingStatus: 'BOOKED'
            }
          },
          attendance: {
            none: {
              userId: member.id
            }
          }
        },
        include: {
          class: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          sessionDate: 'desc'
        }
      })

      if (lastMissedSession) {
        const emailContent = generateMissedClassEmail(
          `${member.firstName} ${member.lastName}`,
          lastMissedSession.class.name,
          lastMissedSession.sessionDate
        )

        const emailResult = await sendEmail({
          to: member.email,
          ...emailContent
        })

        if (emailResult.success) {
          // Record the notification
          await prisma.notification.create({
            data: {
              userId: member.id,
              notificationType: 'MISSED_CLASS',
              subject: emailContent.subject,
              content: emailContent.text || '',
              sentAt: new Date(),
              status: 'SENT'
            }
          })

          results.missedClassNotifications++
        } else {
          results.errors.push(`Failed to send missed class notification to ${member.email}`)
        }
      }
    }
  } catch (error) {
    results.errors.push(`Error processing missed class notifications: ${error}`)
  }
}

async function processClassReminders(results: any) {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Find all sessions scheduled for tomorrow with active bookings
    const tomorrowSessions = await prisma.classSession.findMany({
      where: {
        sessionDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        status: 'SCHEDULED',
        bookings: {
          some: {
            bookingStatus: 'BOOKED',
            user: {
              membershipStatus: 'ACTIVE',
              isOnBench: false
            }
          }
        }
      },
      include: {
        class: {
          select: {
            name: true
          }
        },
        bookings: {
          where: {
            bookingStatus: 'BOOKED',
            user: {
              membershipStatus: 'ACTIVE',
              isOnBench: false
            }
          },
          include: {
            user: true
          }
        }
      }
    })

    for (const session of tomorrowSessions) {
      for (const booking of session.bookings) {
        // Check if reminder already sent
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: booking.user.id,
            notificationType: 'CLASS_REMINDER',
            sentAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            },
            content: {
              contains: session.id
            }
          }
        })

        if (existingNotification) {
          continue
        }

        const emailContent = generateClassReminderEmail(
          `${booking.user.firstName} ${booking.user.lastName}`,
          session.class.name,
          session.sessionDate,
          session.startTime
        )

        const emailResult = await sendEmail({
          to: booking.user.email,
          ...emailContent
        })

        if (emailResult.success) {
          // Record the notification
          await prisma.notification.create({
            data: {
              userId: booking.user.id,
              notificationType: 'CLASS_REMINDER',
              subject: emailContent.subject,
              content: `${emailContent.text} | SessionId: ${session.id}`,
              sentAt: new Date(),
              status: 'SENT'
            }
          })

          results.classReminders++
        } else {
          results.errors.push(`Failed to send class reminder to ${booking.user.email}`)
        }
      }
    }
  } catch (error) {
    results.errors.push(`Error processing class reminders: ${error}`)
  }
}

// Allow manual trigger during development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Manual trigger only available in development' }, { status: 403 })
  }

  // Create a mock request with proper authorization for testing
  const mockRequest = {
    headers: {
      get: (name: string) => name === 'authorization' ? `Bearer ${process.env.CRON_SECRET}` : null
    }
  } as NextRequest

  return POST(mockRequest)
}