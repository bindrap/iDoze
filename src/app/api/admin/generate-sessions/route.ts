import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    console.log('📅 Generating future class sessions...')

    // Get all active classes
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (classes.length === 0) {
      return NextResponse.json({ error: 'No active classes found' }, { status: 400 })
    }

    console.log(`📚 Found ${classes.length} active classes`)

    // Generate sessions for the next 4 weeks
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1) // Start tomorrow

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 28) // 4 weeks from now

    const sessionsCreated = []

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay()

      // Find classes for this day of week
      const dayClasses = classes.filter(c => c.dayOfWeek === dayOfWeek && c.isRecurring)

      for (const classInfo of dayClasses) {
        // Check if session already exists for this date and class
        const existingSession = await prisma.classSession.findFirst({
          where: {
            classId: classInfo.id,
            sessionDate: {
              gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
            }
          }
        })

        if (!existingSession) {
          const session = await prisma.classSession.create({
            data: {
              classId: classInfo.id,
              sessionDate: new Date(currentDate),
              startTime: classInfo.startTime,
              endTime: classInfo.endTime,
              instructorId: classInfo.instructorId,
              maxCapacity: classInfo.maxCapacity,
              currentBookings: 0,
              status: 'SCHEDULED',
              techniquesCovered: null,
              notes: null
            }
          })
          sessionsCreated.push(session)
          console.log(`✓ Created session for ${classInfo.name} on ${currentDate.toDateString()}`)
        }
      }
    }

    console.log(`\n🎉 Session generation complete!`)
    console.log(`📊 Summary:`)
    console.log(`   - ${classes.length} active classes`)
    console.log(`   - ${sessionsCreated.length} new sessions created`)

    // Show upcoming sessions by class
    const summary = []
    for (const classInfo of classes) {
      const classSessions = sessionsCreated.filter(s => s.classId === classInfo.id)
      summary.push(`${classInfo.name}: ${classSessions.length} sessions`)
    }

    return NextResponse.json({
      message: 'Sessions generated successfully',
      classes: classes.length,
      sessionsCreated: sessionsCreated.length,
      summary
    })

  } catch (error) {
    console.error('❌ Error generating sessions:', error)
    return NextResponse.json({ error: 'Session generation failed' }, { status: 500 })
  }
}