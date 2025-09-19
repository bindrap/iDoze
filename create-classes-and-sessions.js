const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createClassesAndSessions() {
  console.log('🏫 Creating classes and sessions...')

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

    // Create diverse classes
    const classesData = [
      {
        name: 'Fundamentals - Adult Beginners',
        description: 'Basic techniques and positions for adult beginners',
        instructor: coach.id,
        skillLevel: 'BEGINNER',
        dayOfWeek: 1, // Monday
        startTime: '18:00',
        endTime: '19:30',
        maxCapacity: 16
      },
      {
        name: 'Kids Jiu-Jitsu (Ages 6-12)',
        description: 'Fun and safe BJJ for children with character development',
        instructor: admin.id,
        skillLevel: 'KIDS',
        dayOfWeek: 2, // Tuesday
        startTime: '17:00',
        endTime: '18:00',
        maxCapacity: 12
      },
      {
        name: 'Intermediate Techniques',
        description: 'Advanced techniques for blue and purple belts',
        instructor: coach.id,
        skillLevel: 'INTERMEDIATE',
        dayOfWeek: 2, // Tuesday
        startTime: '19:00',
        endTime: '20:30',
        maxCapacity: 14
      },
      {
        name: 'Competition Training',
        description: 'High-intensity training for competitors',
        instructor: admin.id,
        skillLevel: 'ADVANCED',
        dayOfWeek: 3, // Wednesday
        startTime: '20:00',
        endTime: '21:30',
        maxCapacity: 10
      },
      {
        name: 'Open Mat - All Levels',
        description: 'Free rolling and technique practice',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 4, // Thursday
        startTime: '18:30',
        endTime: '20:00',
        maxCapacity: 20
      },
      {
        name: 'Morning Warriors',
        description: 'Early morning training for working professionals',
        instructor: admin.id,
        skillLevel: 'ALL',
        dayOfWeek: 5, // Friday
        startTime: '06:00',
        endTime: '07:30',
        maxCapacity: 12
      },
      {
        name: 'Weekend Fundamentals',
        description: 'Relaxed pace fundamentals class',
        instructor: coach.id,
        skillLevel: 'BEGINNER',
        dayOfWeek: 6, // Saturday
        startTime: '10:00',
        endTime: '11:30',
        maxCapacity: 18
      },
      {
        name: 'Advanced Sparring',
        description: 'High-level rolling for purple belts and above',
        instructor: admin.id,
        skillLevel: 'ADVANCED',
        dayOfWeek: 6, // Saturday
        startTime: '11:45',
        endTime: '13:00',
        maxCapacity: 8
      },
      {
        name: 'Sunday Open Training',
        description: 'Open gym with instructor supervision',
        instructor: coach.id,
        skillLevel: 'ALL',
        dayOfWeek: 0, // Sunday
        startTime: '14:00',
        endTime: '16:00',
        maxCapacity: 25
      }
    ]

    console.log('📚 Creating classes...')
    const createdClasses = []

    for (const classData of classesData) {
      const newClass = await prisma.class.create({
        data: {
          name: classData.name,
          description: classData.description,
          instructorId: classData.instructor,
          maxCapacity: classData.maxCapacity,
          durationMinutes: 90,
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
    console.log('📅 Creating class sessions...')
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
            techniquesCovered: isPast ? getRandomTechniques(classInfo.skillLevel) : null,
            notes: isPast && Math.random() > 0.6 ? getRandomClassNotes() : null
          }
        })
        sessionsCreated.push(session)
      }
    }

    console.log(`✓ Created ${sessionsCreated.length} class sessions`)

    console.log('\n🎉 Classes and sessions created successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - ${createdClasses.length} different classes`)
    console.log(`   - ${sessionsCreated.length} total sessions (past and future)`)
    console.log(`   - Classes for all skill levels: BEGINNER, INTERMEDIATE, ADVANCED, KIDS, ALL`)

  } catch (error) {
    console.error('❌ Error creating classes and sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getRandomTechniques(skillLevel) {
  const beginnerTechniques = [
    'Hip escapes and shrimping',
    'Bridge and roll escape',
    'Closed guard basics',
    'Mount escape fundamentals',
    'Side control escape',
    'Basic collar choke',
    'Armbar from mount',
    'Triangle choke introduction'
  ]

  const intermediateTechniques = [
    'Guard retention concepts',
    'Butterfly guard sweeps',
    'X-guard transitions',
    'Kimura from various positions',
    'Omoplata setup and finish',
    'Back take from side control',
    'Leg drag pass',
    'Deep half guard recovery'
  ]

  const advancedTechniques = [
    'Berimbolo system',
    'Lapel guard variations',
    'Heel hook mechanics',
    'Worm guard concepts',
    'Matrix system entries',
    '50/50 guard battles',
    'Crab ride back takes',
    'Complex submission chains'
  ]

  const kidsTechniques = [
    'Animal movements and warm-ups',
    'Basic self-defense escapes',
    'Simple takedowns',
    'Mount position control',
    'Gentle submission introductions',
    'Breakfall practice',
    'Guard position basics',
    'Respect and discipline lessons'
  ]

  let techniques
  switch (skillLevel) {
    case 'BEGINNER':
      techniques = beginnerTechniques
      break
    case 'INTERMEDIATE':
      techniques = intermediateTechniques
      break
    case 'ADVANCED':
      techniques = advancedTechniques
      break
    case 'KIDS':
      techniques = kidsTechniques
      break
    default:
      techniques = [...beginnerTechniques, ...intermediateTechniques]
  }

  const numTechniques = Math.floor(Math.random() * 3) + 2 // 2-4 techniques
  return techniques
    .sort(() => Math.random() - 0.5)
    .slice(0, numTechniques)
    .join(', ')
}

function getRandomClassNotes() {
  const notes = [
    'Great energy today! Students are progressing well.',
    'Focused on details and precision in techniques.',
    'Good attendance, everyone was engaged.',
    'Worked on competition-style drills.',
    'Students showed excellent sportsmanship.',
    'Reviewed fundamentals with good retention.',
    'High-energy class with lots of rolling.',
    'Technical focused session, less sparring.',
    'New students integrated well with the group.',
    'Advanced students helped mentor beginners.'
  ]

  return notes[Math.floor(Math.random() * notes.length)]
}

createClassesAndSessions()