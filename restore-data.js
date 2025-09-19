const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function restoreData() {
  console.log('Restoring gym data...')

  try {
    // Get instructor IDs
    const coach = await prisma.user.findUnique({
      where: { email: 'coach@tecumseh-jujutsu.com' }
    })

    if (!coach) {
      throw new Error('Coach not found')
    }

    // Create classes
    const adultGiClass = await prisma.class.create({
      data: {
        name: 'Adult Gi Classes',
        description: 'Traditional Brazilian Jiu-Jitsu training with gi',
        instructorId: coach.id,
        maxCapacity: 40,
        durationMinutes: 60,
        skillLevel: 'ALL',
        isRecurring: true,
        dayOfWeek: 1, // Monday
        startTime: '19:00',
        endTime: '20:00',
        isActive: true
      }
    })

    const adultNoGiClass = await prisma.class.create({
      data: {
        name: 'Adult No-Gi Classes',
        description: 'No-gi Brazilian Jiu-Jitsu and submission grappling',
        instructorId: coach.id,
        maxCapacity: 40,
        durationMinutes: 60,
        skillLevel: 'ALL',
        isRecurring: true,
        dayOfWeek: 4, // Thursday
        startTime: '19:00',
        endTime: '20:00',
        isActive: true
      }
    })

    const kidsClass = await prisma.class.create({
      data: {
        name: 'Kids Classes',
        description: 'Brazilian Jiu-Jitsu for children and teens',
        instructorId: coach.id,
        maxCapacity: 20,
        durationMinutes: 60,
        skillLevel: 'BEGINNER',
        isRecurring: true,
        dayOfWeek: 1, // Monday
        startTime: '18:00',
        endTime: '19:00',
        isActive: true
      }
    })

    const openMatClass = await prisma.class.create({
      data: {
        name: 'Open Mat',
        description: 'Open training and sparring session',
        instructorId: coach.id,
        maxCapacity: 40,
        durationMinutes: 90,
        skillLevel: 'ALL',
        isRecurring: true,
        dayOfWeek: 0, // Sunday
        startTime: '11:00',
        endTime: '12:30',
        isActive: true
      }
    })

    console.log('✓ Classes created')

    // Create some upcoming class sessions
    const today = new Date()
    const sessions = []

    // Create sessions for the next 2 weeks
    for (let i = 0; i < 14; i++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + i)

      const dayOfWeek = sessionDate.getDay()

      // Monday: Kids + Adult Gi
      if (dayOfWeek === 1) {
        sessions.push({
          classId: kidsClass.id,
          sessionDate,
          startTime: '18:00',
          endTime: '19:00',
          instructorId: coach.id,
          maxCapacity: 20,
          status: 'SCHEDULED'
        })
        sessions.push({
          classId: adultGiClass.id,
          sessionDate,
          startTime: '19:00',
          endTime: '20:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Tuesday: Adult Gi
      if (dayOfWeek === 2) {
        sessions.push({
          classId: adultGiClass.id,
          sessionDate,
          startTime: '19:00',
          endTime: '20:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Wednesday: Kids + Adult Gi
      if (dayOfWeek === 3) {
        sessions.push({
          classId: kidsClass.id,
          sessionDate,
          startTime: '18:00',
          endTime: '19:00',
          instructorId: coach.id,
          maxCapacity: 20,
          status: 'SCHEDULED'
        })
        sessions.push({
          classId: adultGiClass.id,
          sessionDate,
          startTime: '19:00',
          endTime: '20:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Thursday: Kids + Adult No-Gi
      if (dayOfWeek === 4) {
        sessions.push({
          classId: kidsClass.id,
          sessionDate,
          startTime: '18:00',
          endTime: '19:00',
          instructorId: coach.id,
          maxCapacity: 20,
          status: 'SCHEDULED'
        })
        sessions.push({
          classId: adultNoGiClass.id,
          sessionDate,
          startTime: '19:00',
          endTime: '20:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Friday: Kids + Adult Gi
      if (dayOfWeek === 5) {
        sessions.push({
          classId: kidsClass.id,
          sessionDate,
          startTime: '18:00',
          endTime: '19:00',
          instructorId: coach.id,
          maxCapacity: 20,
          status: 'SCHEDULED'
        })
        sessions.push({
          classId: adultGiClass.id,
          sessionDate,
          startTime: '19:00',
          endTime: '20:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Saturday: Adult No-Gi
      if (dayOfWeek === 6) {
        sessions.push({
          classId: adultNoGiClass.id,
          sessionDate,
          startTime: '11:00',
          endTime: '12:00',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }

      // Sunday: Open Mat
      if (dayOfWeek === 0) {
        sessions.push({
          classId: openMatClass.id,
          sessionDate,
          startTime: '11:00',
          endTime: '12:30',
          instructorId: coach.id,
          maxCapacity: 40,
          status: 'SCHEDULED'
        })
      }
    }

    // Create all sessions
    for (const session of sessions) {
      await prisma.classSession.create({ data: session })
    }

    console.log(`✓ Created ${sessions.length} class sessions`)

    // Create some demo students
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 12)

    const students = [
      { firstName: 'Alex', lastName: 'White', email: 'alex.white@example.com', belt: 'White', stripes: 0 },
      { firstName: 'Sam', lastName: 'Blue', email: 'sam.blue@example.com', belt: 'Blue', stripes: 2 },
      { firstName: 'Jordan', lastName: 'Purple', email: 'jordan.purple@example.com', belt: 'Purple', stripes: 1 },
      { firstName: 'Casey', lastName: 'Brown', email: 'casey.brown@example.com', belt: 'Brown', stripes: 0 },
      { firstName: 'Taylor', lastName: 'Black', email: 'taylor.black@example.com', belt: 'Black', stripes: 1 }
    ]

    for (const student of students) {
      const user = await prisma.user.create({
        data: {
          email: student.email,
          passwordHash: hashedPassword,
          firstName: student.firstName,
          lastName: student.lastName,
          role: 'MEMBER',
          membershipStatus: 'ACTIVE',
          paymentStatus: 'CURRENT'
        }
      })

      // Create member progress
      await prisma.memberProgress.create({
        data: {
          userId: user.id,
          beltRank: student.belt,
          stripes: student.stripes,
          totalClassesAttended: Math.floor(Math.random() * 50) + 10,
          lastAttendanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      })
    }

    console.log(`✓ Created ${students.length} demo students`)

    console.log('\n🎉 Gym data restored successfully!')
    console.log('\n📋 Created:')
    console.log('- 4 class types (Adult Gi, Adult No-Gi, Kids, Open Mat)')
    console.log(`- ${sessions.length} upcoming class sessions`)
    console.log(`- ${students.length} demo students with belt ranks`)
    console.log('\n🔐 All accounts use password: password123')

  } catch (error) {
    console.error('Error restoring data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData()