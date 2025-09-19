const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restructureClasses() {
  console.log('🏫 Restructuring classes into containers with tags...')

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

    // Create class containers with tags
    const classContainers = [
      {
        name: 'Adult Training',
        description: 'Brazilian Jiu-Jitsu training for adults - both gi and no-gi sessions',
        instructor: admin.id,
        skillLevel: 'ALL',
        maxCapacity: 20,
        // Will have multiple sessions per week with different tags
        schedule: [
          { day: 1, time: '19:00-20:00', tag: 'GI' },     // Monday Gi
          { day: 2, time: '19:00-20:00', tag: 'GI' },     // Tuesday Gi
          { day: 3, time: '19:00-20:00', tag: 'GI' },     // Wednesday Gi
          { day: 4, time: '19:00-20:00', tag: 'NO_GI' },  // Thursday No-Gi
          { day: 6, time: '11:00-12:00', tag: 'NO_GI' }   // Saturday No-Gi
        ]
      },
      {
        name: 'Morning Classes',
        description: 'Early morning Brazilian Jiu-Jitsu for working professionals',
        instructor: coach.id,
        skillLevel: 'ALL',
        maxCapacity: 15,
        schedule: [
          { day: 1, time: '09:30-10:30', tag: 'MORNING' }, // Monday Morning
          { day: 3, time: '09:30-10:30', tag: 'MORNING' }, // Wednesday Morning
          { day: 5, time: '09:30-10:30', tag: 'MORNING' }  // Friday Morning
        ]
      },
      {
        name: 'Kids Classes',
        description: 'Fun and educational Brazilian Jiu-Jitsu for children',
        instructor: coach.id,
        skillLevel: 'KIDS',
        maxCapacity: 12,
        schedule: [
          { day: 1, time: '18:00-19:00', tag: 'KIDS' }, // Monday Kids
          { day: 2, time: '18:00-19:00', tag: 'KIDS' }, // Tuesday Kids
          { day: 3, time: '18:00-19:00', tag: 'KIDS' }, // Wednesday Kids
          { day: 4, time: '18:00-19:00', tag: 'KIDS' }, // Thursday Kids
          { day: 5, time: '18:00-19:00', tag: 'KIDS' }  // Friday Kids
        ]
      },
      {
        name: 'Open Mat',
        description: 'Open training and free rolling session for all levels',
        instructor: admin.id,
        skillLevel: 'ALL',
        maxCapacity: 25,
        schedule: [
          { day: 0, time: '11:00-12:00', tag: 'OPEN_MAT' } // Sunday Open Mat
        ]
      }
    ]

    console.log('📚 Creating class containers...')
    const createdClasses = []

    for (const container of classContainers) {
      // Create the main class
      const newClass = await prisma.class.create({
        data: {
          name: container.name,
          description: container.description,
          instructorId: container.instructor,
          maxCapacity: container.maxCapacity,
          durationMinutes: 60,
          skillLevel: container.skillLevel,
          isRecurring: true,
          dayOfWeek: null, // Not tied to specific day since it has multiple sessions
          startTime: null, // Will be in sessions
          endTime: null,   // Will be in sessions
          isActive: true
        }
      })

      // Store with schedule for session creation
      createdClasses.push({
        ...newClass,
        schedule: container.schedule
      })
    }

    console.log(`✓ Created ${createdClasses.length} class containers`)

    // Create sessions for the past 4 weeks and next 2 weeks
    console.log('📅 Creating class sessions with tags...')
    const sessionsCreated = []

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28) // 4 weeks ago

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 14) // 2 weeks from now

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = currentDate.getDay()

      // Find all class schedules for this day of week
      for (const classInfo of createdClasses) {
        const daySchedules = classInfo.schedule.filter(s => s.day === dayOfWeek)

        for (const schedule of daySchedules) {
          const sessionDate = new Date(currentDate)
          const isPast = sessionDate < new Date()
          const [startTime, endTime] = schedule.time.split('-')

          const session = await prisma.classSession.create({
            data: {
              classId: classInfo.id,
              sessionDate,
              startTime,
              endTime,
              instructorId: classInfo.instructorId,
              maxCapacity: classInfo.maxCapacity,
              currentBookings: 0,
              status: isPast ? 'COMPLETED' : 'SCHEDULED',
              techniquesCovered: isPast ? getRandomTechniques(schedule.tag) : null,
              notes: isPast && Math.random() > 0.7 ? getRandomClassNotes(schedule.tag) : null
            }
          })
          sessionsCreated.push({
            ...session,
            tag: schedule.tag,
            className: classInfo.name
          })
        }
      }
    }

    console.log(`✓ Created ${sessionsCreated.length} class sessions`)

    // Display the schedule summary
    console.log('\n🎉 Class containers created successfully!')
    console.log('\n📅 Weekly Schedule by Container:')

    console.log('\n🥋 Adult Training:')
    console.log('  • Monday 7:00-8:00 PM (Gi)')
    console.log('  • Tuesday 7:00-8:00 PM (Gi)')
    console.log('  • Wednesday 7:00-8:00 PM (Gi)')
    console.log('  • Thursday 7:00-8:00 PM (No-Gi)')
    console.log('  • Saturday 11:00 AM-12:00 PM (No-Gi)')

    console.log('\n🌅 Morning Classes:')
    console.log('  • Monday 9:30-10:30 AM')
    console.log('  • Wednesday 9:30-10:30 AM')
    console.log('  • Friday 9:30-10:30 AM')

    console.log('\n👶 Kids Classes:')
    console.log('  • Monday 6:00-7:00 PM')
    console.log('  • Tuesday 6:00-7:00 PM')
    console.log('  • Wednesday 6:00-7:00 PM')
    console.log('  • Thursday 6:00-7:00 PM')
    console.log('  • Friday 6:00-7:00 PM')

    console.log('\n🤝 Open Mat:')
    console.log('  • Sunday 11:00 AM-12:00 PM')

    // Count sessions by tag
    const tagCounts = {}
    sessionsCreated.forEach(session => {
      tagCounts[session.tag] = (tagCounts[session.tag] || 0) + 1
    })

    console.log(`\n📊 Summary:`)
    console.log(`   - ${createdClasses.length} class containers`)
    console.log(`   - ${sessionsCreated.length} total sessions`)
    console.log(`   - Gi sessions: ${tagCounts.GI || 0}`)
    console.log(`   - No-Gi sessions: ${tagCounts.NO_GI || 0}`)
    console.log(`   - Morning sessions: ${tagCounts.MORNING || 0}`)
    console.log(`   - Kids sessions: ${tagCounts.KIDS || 0}`)
    console.log(`   - Open Mat sessions: ${tagCounts.OPEN_MAT || 0}`)

  } catch (error) {
    console.error('❌ Error restructuring classes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getRandomTechniques(tag) {
  const giTechniques = [
    'Collar chokes from closed guard',
    'Lapel control and grips',
    'Cross collar choke variations',
    'Sleeve grip fundamentals',
    'Spider guard with gi grips',
    'Gi chokes from mount',
    'Lapel guard concepts',
    'Collar and sleeve combinations'
  ]

  const noGiTechniques = [
    'Underhooks and overhooks',
    'Guillotine choke setups',
    'Arm drag techniques',
    'Wrestling takedowns',
    'Hand fighting concepts',
    'Darce choke mechanics',
    'Anaconda choke setup',
    'No-gi guard retention'
  ]

  const morningTechniques = [
    'Fundamental movements and mobility',
    'Basic guard work and transitions',
    'Essential escape techniques',
    'Core strengthening drills',
    'Light technical drilling',
    'Professional-friendly training',
    'Stress relief through movement',
    'Flexibility and flow work'
  ]

  const kidsTechniques = [
    'Character building and respect',
    'Basic self-defense concepts',
    'Animal movement warm-ups',
    'Simple grappling positions',
    'Breakfall practice and safety',
    'Basic escapes and movements',
    'Fun grappling games',
    'Discipline and focus exercises'
  ]

  const openMatTechniques = [
    'Free rolling and sparring',
    'Individual technique practice',
    'Competition preparation',
    'Position-specific sparring',
    'Flow rolling and movement',
    'Advanced technique exploration',
    'Peer coaching and learning',
    'Open mat drilling'
  ]

  let techniques
  switch (tag) {
    case 'GI':
      techniques = giTechniques
      break
    case 'NO_GI':
      techniques = noGiTechniques
      break
    case 'MORNING':
      techniques = morningTechniques
      break
    case 'KIDS':
      techniques = kidsTechniques
      break
    case 'OPEN_MAT':
      techniques = openMatTechniques
      break
    default:
      techniques = [...giTechniques, ...noGiTechniques]
  }

  const numTechniques = Math.floor(Math.random() * 3) + 2 // 2-4 techniques
  return techniques
    .sort(() => Math.random() - 0.5)
    .slice(0, numTechniques)
    .join(', ')
}

function getRandomClassNotes(tag) {
  const generalNotes = [
    'Great energy and focus from all students',
    'Excellent technique execution today',
    'Good attendance and engagement',
    'Students showing consistent improvement'
  ]

  const tagSpecificNotes = {
    GI: [
      'Focused on gi grips and collar control',
      'Great work on traditional gi techniques',
      'Students adapting well to gi training'
    ],
    NO_GI: [
      'High-energy no-gi session with good scrambles',
      'Excellent wrestling and takedown work',
      'Fast-paced training with great conditioning'
    ],
    MORNING: [
      'Perfect start to the day with focused training',
      'Professional crowd brought great energy',
      'Productive morning session before work'
    ],
    KIDS: [
      'Kids showed excellent respect and discipline',
      'Great character development alongside technique',
      'Fun and educational session for the children'
    ],
    OPEN_MAT: [
      'Productive open mat with lots of rolling',
      'Students worked on individual techniques',
      'Great peer learning and coaching happening'
    ]
  }

  const specificNotes = tagSpecificNotes[tag] || []
  const allNotes = [...generalNotes, ...specificNotes]

  return allNotes[Math.floor(Math.random() * allNotes.length)]
}

restructureClasses()