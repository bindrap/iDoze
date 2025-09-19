const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateGymSchedule() {
  console.log('🏫 Updating gym schedule to match actual classes...')

  try {
    // Get instructors
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tecumseh-jujutsu.com' }
    })
    const coach = await prisma.user.findUnique({
      where: { email: 'coach@tecumseh-jujutsu.com' }
    })

    if (!admin || !coach) {
      throw new Error('Admin and coach users must exist first')
    }

    // Clean up existing classes and sessions
    console.log('🧹 Cleaning existing classes and sessions...')
    await prisma.attendance.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.classSession.deleteMany()
    await prisma.class.deleteMany()

    // Create actual gym classes according to your schedule
    const actualClasses = [
      // Kids classes - Monday to Friday 6-7 PM
      {
        name: 'Kids Jiu-Jitsu - Monday',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: coach.id,
        skillLevel: 'KIDS',
        dayOfWeek: 1, // Monday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 12
      },
      {
        name: 'Kids Jiu-Jitsu - Tuesday',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: coach.id,
        skillLevel: 'KIDS',
        dayOfWeek: 2, // Tuesday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 12
      },
      {
        name: 'Kids Jiu-Jitsu - Wednesday',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: admin.id,
        skillLevel: 'KIDS',
        dayOfWeek: 3, // Wednesday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 12
      },
      {
        name: 'Kids Jiu-Jitsu - Thursday',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: coach.id,
        skillLevel: 'KIDS',
        dayOfWeek: 4, // Thursday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 12
      },
      {
        name: 'Kids Jiu-Jitsu - Friday',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: admin.id,
        skillLevel: 'KIDS',
        dayOfWeek: 5, // Friday
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 12
      },

      // Adult Gi classes - Monday, Tuesday, Wednesday 7-8 PM
      {
        name: 'Adult Gi Training - Monday',
        description: 'Traditional Brazilian Jiu-Jitsu training in the gi',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 1, // Monday
        startTime: '19:00',
        endTime: '20:00',
        maxCapacity: 20
      },
      {
        name: 'Adult Gi Training - Tuesday',
        description: 'Traditional Brazilian Jiu-Jitsu training in the gi',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 2, // Tuesday
        startTime: '19:00',
        endTime: '20:00',
        maxCapacity: 20
      },
      {
        name: 'Adult Gi Training - Wednesday',
        description: 'Traditional Brazilian Jiu-Jitsu training in the gi',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 3, // Wednesday
        startTime: '19:00',
        endTime: '20:00',
        maxCapacity: 20
      },

      // Adult No-Gi classes - Thursday 7-8 PM and Saturday 11-12 PM
      {
        name: 'Adult No-Gi Training - Thursday',
        description: 'Modern submission wrestling without the gi',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 4, // Thursday
        startTime: '19:00',
        endTime: '20:00',
        maxCapacity: 20
      },
      {
        name: 'Adult No-Gi Training - Saturday',
        description: 'Modern submission wrestling without the gi',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 6, // Saturday
        startTime: '11:00',
        endTime: '12:00',
        maxCapacity: 20
      },

      // Morning Adult classes - Monday, Wednesday, Friday 9:30-10:30 AM
      {
        name: 'Morning Adult Training - Monday',
        description: 'Early morning BJJ for working professionals',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 1, // Monday
        startTime: '09:30',
        endTime: '10:30',
        maxCapacity: 15
      },
      {
        name: 'Morning Adult Training - Wednesday',
        description: 'Early morning BJJ for working professionals',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 3, // Wednesday
        startTime: '09:30',
        endTime: '10:30',
        maxCapacity: 15
      },
      {
        name: 'Morning Adult Training - Friday',
        description: 'Early morning BJJ for working professionals',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 5, // Friday
        startTime: '09:30',
        endTime: '10:30',
        maxCapacity: 15
      },

      // Sunday Open Mat - 11 AM to 12 PM
      {
        name: 'Sunday Open Mat',
        description: 'Open training and free rolling session',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 0, // Sunday
        startTime: '11:00',
        endTime: '12:00',
        maxCapacity: 25
      }
    ]

    console.log('📚 Creating actual gym classes...')
    const createdClasses = []

    for (const classData of actualClasses) {
      const newClass = await prisma.class.create({
        data: {
          name: classData.name,
          description: classData.description,
          instructorId: classData.instructor,
          maxCapacity: classData.maxCapacity,
          durationMinutes: 60, // All classes are 1 hour
          skillLevel: classData.skillLevel,
          isRecurring: true,
          dayOfWeek: classData.dayOfWeek,
          startTime: classData.startTime,
          endTime: classData.endTime,
          isActive: true
        }
      })
      createdClasses.push(newClass)
    }

    console.log(`✓ Created ${createdClasses.length} classes`)

    // Create sessions for the past 4 weeks and next 2 weeks
    console.log('📅 Creating class sessions with actual schedule...')
    const sessionsCreated = []

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28) // 4 weeks ago

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 14) // 2 weeks from now

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay()

      // Find classes for this day of week
      const dayClasses = createdClasses.filter(c => c.dayOfWeek === dayOfWeek)

      for (const classInfo of dayClasses) {
        const sessionDate = new Date(currentDate)
        const isPast = sessionDate < new Date()

        const session = await prisma.classSession.create({
          data: {
            classId: classInfo.id,
            sessionDate,
            startTime: classInfo.startTime,
            endTime: classInfo.endTime,
            instructorId: classInfo.instructorId,
            maxCapacity: classInfo.maxCapacity,
            currentBookings: 0,
            status: isPast ? 'COMPLETED' : 'SCHEDULED',
            techniquesCovered: isPast ? getRandomTechniques(classInfo.skillLevel, classInfo.name) : null,
            notes: isPast && Math.random() > 0.7 ? getRandomClassNotes() : null
          }
        })
        sessionsCreated.push(session)
      }
    }

    console.log(`✓ Created ${sessionsCreated.length} class sessions`)

    // Display the schedule summary
    console.log('\n🎉 Actual gym schedule created successfully!')
    console.log('\n📅 Weekly Schedule:')
    console.log('Monday:')
    console.log('  • 9:30-10:30 AM: Morning Adult Training')
    console.log('  • 6:00-7:00 PM: Kids Jiu-Jitsu')
    console.log('  • 7:00-8:00 PM: Adult Gi Training')
    console.log('')
    console.log('Tuesday:')
    console.log('  • 6:00-7:00 PM: Kids Jiu-Jitsu')
    console.log('  • 7:00-8:00 PM: Adult Gi Training')
    console.log('')
    console.log('Wednesday:')
    console.log('  • 9:30-10:30 AM: Morning Adult Training')
    console.log('  • 6:00-7:00 PM: Kids Jiu-Jitsu')
    console.log('  • 7:00-8:00 PM: Adult Gi Training')
    console.log('')
    console.log('Thursday:')
    console.log('  • 6:00-7:00 PM: Kids Jiu-Jitsu')
    console.log('  • 7:00-8:00 PM: Adult No-Gi Training')
    console.log('')
    console.log('Friday:')
    console.log('  • 9:30-10:30 AM: Morning Adult Training')
    console.log('  • 6:00-7:00 PM: Kids Jiu-Jitsu')
    console.log('')
    console.log('Saturday:')
    console.log('  • 11:00 AM-12:00 PM: Adult No-Gi Training')
    console.log('')
    console.log('Sunday:')
    console.log('  • 11:00 AM-12:00 PM: Open Mat')

    console.log(`\n📊 Summary:`)
    console.log(`   - ${createdClasses.length} weekly classes`)
    console.log(`   - ${sessionsCreated.length} total sessions (past and future)`)
    console.log(`   - Kids classes: 5 per week`)
    console.log(`   - Adult Gi classes: 3 per week`)
    console.log(`   - Adult No-Gi classes: 2 per week`)
    console.log(`   - Morning classes: 3 per week`)
    console.log(`   - Open Mat: 1 per week`)

  } catch (error) {
    console.error('❌ Error updating gym schedule:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getRandomTechniques(skillLevel, className) {
  const giTechniques = [
    'Collar chokes from guard',
    'Lapel control techniques',
    'Cross collar choke variations',
    'Sleeve and collar grips',
    'Gi chokes from mount',
    'Sleeve grip breaks',
    'Lapel guard concepts',
    'Spider guard with gi grips'
  ]

  const noGiTechniques = [
    'Underhooks and overhooks',
    'Guillotine choke setups',
    'Arm drag techniques',
    'Sprawl defense',
    'Hand fighting',
    'Hip toss variations',
    'Darce choke mechanics',
    'Leg entanglement basics'
  ]

  const kidsTechniques = [
    'Basic positions and control',
    'Self-defense concepts',
    'Respect and discipline',
    'Animal movements warmup',
    'Simple escapes',
    'Breakfall practice',
    'Basic grappling games',
    'Character building discussions'
  ]

  const morningTechniques = [
    'Fundamental movements',
    'Basic guard work',
    'Essential escapes',
    'Core strength building',
    'Flexibility and mobility',
    'Light technical drilling',
    'Stress-relief rolling',
    'Professional-friendly training'
  ]

  const openMatTechniques = [
    'Free rolling and sparring',
    'Open mat drilling',
    'Competition preparation',
    'Individual technique work',
    'Position sparring',
    'Flow rolling',
    'Advanced technique exploration',
    'Peer learning and coaching'
  ]

  let techniques
  if (skillLevel === 'KIDS') {
    techniques = kidsTechniques
  } else if (className.includes('No-Gi')) {
    techniques = noGiTechniques
  } else if (className.includes('Morning')) {
    techniques = morningTechniques
  } else if (className.includes('Open Mat')) {
    techniques = openMatTechniques
  } else {
    techniques = giTechniques
  }

  const numTechniques = Math.floor(Math.random() * 3) + 2 // 2-4 techniques
  return techniques
    .sort(() => Math.random() - 0.5)
    .slice(0, numTechniques)
    .join(', ')
}

function getRandomClassNotes() {
  const notes = [
    'Great energy and focus from all students today',
    'Excellent technique execution, students are improving',
    'Good attendance, everyone was engaged and learning',
    'Focused on fundamentals with excellent retention',
    'Students showed great respect and sportsmanship',
    'Technical class with detailed explanations',
    'High energy training with lots of drilling',
    'New students integrated well with the group',
    'Advanced students helped mentor newcomers',
    'Productive training session with good questions'
  ]

  return notes[Math.floor(Math.random() * notes.length)]
}

updateGymSchedule()