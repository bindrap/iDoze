const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // Clear existing data (except existing users)
  await prisma.attendance.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.class.deleteMany()
  await prisma.memberProgress.deleteMany()
  await prisma.competitionParticipant.deleteMany()
  await prisma.competition.deleteMany()
  await prisma.newsletter.deleteMany()
  await prisma.setting.deleteMany()

  console.log('✅ Cleared existing data')

  // Get existing users
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@tecumseh-jujutsu.com' }})
  const coachUser = await prisma.user.findUnique({ where: { email: 'coach@tecumseh-jujutsu.com' }})

  if (!adminUser || !coachUser) {
    throw new Error('Admin and Coach users must exist before running this seed')
  }

  // Create realistic student population
  const studentData = [
    // White Belts (Beginners)
    { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@email.com', beltRank: 'White Belt', stripes: 0, totalClasses: 8, phone: '519-555-0101' },
    { firstName: 'David', lastName: 'Brown', email: 'david.brown@email.com', beltRank: 'White Belt', stripes: 1, totalClasses: 15, phone: '519-555-0102' },
    { firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@email.com', beltRank: 'White Belt', stripes: 2, totalClasses: 25, phone: '519-555-0103' },
    { firstName: 'James', lastName: 'Miller', email: 'james.miller@email.com', beltRank: 'White Belt', stripes: 3, totalClasses: 42, phone: '519-555-0104' },
    { firstName: 'Olivia', lastName: 'Garcia', email: 'olivia.garcia@email.com', beltRank: 'White Belt', stripes: 4, totalClasses: 58, phone: '519-555-0105' },

    // Blue Belts (Intermediate)
    { firstName: 'Michael', lastName: 'Anderson', email: 'michael.anderson@email.com', beltRank: 'Blue Belt', stripes: 0, totalClasses: 89, phone: '519-555-0106' },
    { firstName: 'Ashley', lastName: 'Martinez', email: 'ashley.martinez@email.com', beltRank: 'Blue Belt', stripes: 1, totalClasses: 127, phone: '519-555-0107' },
    { firstName: 'Ryan', lastName: 'Taylor', email: 'ryan.taylor@email.com', beltRank: 'Blue Belt', stripes: 2, totalClasses: 156, phone: '519-555-0108' },
    { firstName: 'Jessica', lastName: 'Thomas', email: 'jessica.thomas@email.com', beltRank: 'Blue Belt', stripes: 3, totalClasses: 189, phone: '519-555-0109' },

    // Purple Belts (Advanced)
    { firstName: 'Christopher', lastName: 'Jackson', email: 'chris.jackson@email.com', beltRank: 'Purple Belt', stripes: 0, totalClasses: 245, phone: '519-555-0110' },
    { firstName: 'Amanda', lastName: 'White', email: 'amanda.white@email.com', beltRank: 'Purple Belt', stripes: 2, totalClasses: 298, phone: '519-555-0111' },
    { firstName: 'Kevin', lastName: 'Harris', email: 'kevin.harris@email.com', beltRank: 'Purple Belt', stripes: 4, totalClasses: 367, phone: '519-555-0112' },

    // Brown Belts (Expert)
    { firstName: 'Lauren', lastName: 'Clark', email: 'lauren.clark@email.com', beltRank: 'Brown Belt', stripes: 1, totalClasses: 456, phone: '519-555-0113' },
    { firstName: 'Daniel', lastName: 'Lewis', email: 'daniel.lewis@email.com', beltRank: 'Brown Belt', stripes: 3, totalClasses: 523, phone: '519-555-0114' },

    // Black Belts (Masters)
    { firstName: 'Samantha', lastName: 'Walker', email: 'sam.walker@email.com', beltRank: 'Black Belt', stripes: 0, totalClasses: 678, phone: '519-555-0115' },

    // Kids (White and Yellow belts)
    { firstName: 'Ethan', lastName: 'Young', email: 'ethan.young.parent@email.com', beltRank: 'White Belt', stripes: 1, totalClasses: 12, phone: '519-555-0116' },
    { firstName: 'Sophia', lastName: 'King', email: 'sophia.king.parent@email.com', beltRank: 'Yellow Belt', stripes: 2, totalClasses: 34, phone: '519-555-0117' },
    { firstName: 'Mason', lastName: 'Wright', email: 'mason.wright.parent@email.com', beltRank: 'Orange Belt', stripes: 0, totalClasses: 45, phone: '519-555-0118' },
    { firstName: 'Isabella', lastName: 'Lopez', email: 'isabella.lopez.parent@email.com', beltRank: 'Green Belt', stripes: 1, totalClasses: 67, phone: '519-555-0119' },

    // Additional variety
    { firstName: 'Alex', lastName: 'Hill', email: 'alex.hill@email.com', beltRank: 'Blue Belt', stripes: 4, totalClasses: 167, phone: '519-555-0120' },
    { firstName: 'Victoria', lastName: 'Green', email: 'victoria.green@email.com', beltRank: 'White Belt', stripes: 2, totalClasses: 28, phone: '519-555-0121' },
    { firstName: 'Brandon', lastName: 'Adams', email: 'brandon.adams@email.com', beltRank: 'Purple Belt', stripes: 1, totalClasses: 267, phone: '519-555-0122' },
  ]

  const students = []
  console.log('👥 Creating student accounts...')

  for (const student of studentData) {
    const passwordHash = await bcrypt.hash('student123', 12)
    const id = 'cm1k' + Math.random().toString(36).substr(2, 20)

    const user = await prisma.user.create({
      data: {
        id,
        email: student.email,
        passwordHash,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        role: 'MEMBER',
        membershipStatus: 'ACTIVE',
        membershipStartDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
      }
    })

    students.push({ ...student, user })
  }

  console.log(`✅ Created ${students.length} student accounts`)

  // Create member progress for all students
  console.log('📈 Creating member progress records...')
  for (const student of students) {
    await prisma.memberProgress.create({
      data: {
        userId: student.user.id,
        beltRank: student.beltRank,
        stripes: student.stripes,
        totalClassesAttended: student.totalClasses,
        lastAttendanceDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
        promotedById: coachUser.id,
        promotionDate: student.stripes > 0 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
      }
    })
  }

  console.log('✅ Created member progress records')

  // Create realistic class schedule
  console.log('🥋 Creating class schedule...')

  const classesData = [
    {
      name: 'Morning Adults Brazilian Jiu-Jitsu',
      description: 'Morning BJJ training for adults - Perfect for early birds and working professionals',
      instructorId: coachUser.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      dayOfWeek: 1, // Monday
      startTime: '09:30',
      endTime: '10:30'
    },
    {
      name: 'Kids Brazilian Jiu-Jitsu',
      description: 'Fun and engaging BJJ classes for children ages 6-12',
      instructorId: coachUser.id,
      maxCapacity: 25,
      durationMinutes: 45,
      skillLevel: 'BEGINNER',
      dayOfWeek: 1, // Monday
      startTime: '18:00',
      endTime: '18:45'
    },
    {
      name: 'Evening Adults Brazilian Jiu-Jitsu',
      description: 'Evening BJJ training for adults - Our most popular class',
      instructorId: coachUser.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      dayOfWeek: 1, // Monday
      startTime: '19:00',
      endTime: '20:00'
    },
    {
      name: 'Competition Training',
      description: 'Advanced training for competition preparation',
      instructorId: coachUser.id,
      maxCapacity: 20,
      durationMinutes: 90,
      skillLevel: 'ADVANCED',
      dayOfWeek: 3, // Wednesday
      startTime: '20:00',
      endTime: '21:30'
    },
    {
      name: 'Saturday Adults Brazilian Jiu-Jitsu',
      description: 'Weekend training session for all skill levels',
      instructorId: coachUser.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      dayOfWeek: 6, // Saturday
      startTime: '11:00',
      endTime: '12:00'
    },
    {
      name: 'Sunday Open Mat',
      description: 'Open training for all skill levels - Practice what you\'ve learned',
      instructorId: coachUser.id,
      maxCapacity: 40,
      durationMinutes: 90,
      skillLevel: 'ALL',
      dayOfWeek: 0, // Sunday
      startTime: '11:00',
      endTime: '12:30'
    }
  ]

  const createdClasses = []
  for (const classData of classesData) {
    const classRecord = await prisma.class.create({
      data: classData
    })
    createdClasses.push(classRecord)
  }

  console.log(`✅ Created ${createdClasses.length} classes`)

  // Create class sessions for the next 4 weeks
  console.log('📅 Creating class sessions...')
  const today = new Date()
  const sessions = []

  for (let week = 0; week < 4; week++) {
    for (const classRecord of createdClasses) {
      const sessionDate = new Date(today)
      const daysToAdd = (week * 7) + (classRecord.dayOfWeek - today.getDay() + 7) % 7
      sessionDate.setDate(today.getDate() + daysToAdd)

      const session = await prisma.classSession.create({
        data: {
          classId: classRecord.id,
          sessionDate,
          startTime: classRecord.startTime,
          endTime: classRecord.endTime,
          instructorId: classRecord.instructorId,
          maxCapacity: classRecord.maxCapacity,
          status: 'SCHEDULED',
          currentBookings: 0,
        }
      })
      sessions.push(session)
    }
  }

  console.log(`✅ Created ${sessions.length} class sessions`)

  // Create bookings and attendance for past sessions (last 2 weeks)
  console.log('📋 Creating realistic bookings and attendance...')
  const pastSessions = []

  for (let week = -2; week < 0; week++) {
    for (const classRecord of createdClasses) {
      const sessionDate = new Date(today)
      const daysToAdd = (week * 7) + (classRecord.dayOfWeek - today.getDay() + 7) % 7
      sessionDate.setDate(today.getDate() + daysToAdd)

      const session = await prisma.classSession.create({
        data: {
          classId: classRecord.id,
          sessionDate,
          startTime: classRecord.startTime,
          endTime: classRecord.endTime,
          instructorId: classRecord.instructorId,
          maxCapacity: classRecord.maxCapacity,
          status: 'COMPLETED',
          currentBookings: 0,
        }
      })
      pastSessions.push(session)
    }
  }

  // Create realistic bookings and attendance
  let totalBookings = 0
  let totalAttendance = 0

  for (const session of pastSessions) {
    // Determine attendance based on class type
    let attendanceRate = 0.7 // Default 70%
    if (session.startTime === '19:00') attendanceRate = 0.85 // Evening classes more popular
    if (session.startTime === '18:00') attendanceRate = 0.6  // Kids classes
    if (session.startTime === '11:00') attendanceRate = 0.75 // Weekend classes

    const expectedAttendees = Math.floor(session.maxCapacity * attendanceRate)

    // Select random students for this session
    const shuffledStudents = students.sort(() => 0.5 - Math.random())
    const sessionStudents = shuffledStudents.slice(0, expectedAttendees)

    for (const student of sessionStudents) {
      // Create booking
      const booking = await prisma.booking.create({
        data: {
          userId: student.user.id,
          classSessionId: session.id,
          bookingStatus: 'BOOKED',
          bookingDate: new Date(session.sessionDate.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
          checkInTime: Math.random() > 0.1 ? new Date(session.sessionDate.getTime() + Math.random() * 30 * 60 * 1000) : null,
        }
      })
      totalBookings++

      // 90% chance of attendance if booked
      if (Math.random() > 0.1) {
        await prisma.attendance.create({
          data: {
            userId: student.user.id,
            classSessionId: session.id,
            checkInTime: new Date(session.sessionDate.getTime() + Math.random() * 30 * 60 * 1000),
            checkOutTime: new Date(session.sessionDate.getTime() + 60 * 60 * 1000 + Math.random() * 15 * 60 * 1000),
            attendanceStatus: 'PRESENT',
          }
        })
        totalAttendance++
      }
    }

    // Update session booking count
    await prisma.classSession.update({
      where: { id: session.id },
      data: { currentBookings: sessionStudents.length }
    })
  }

  console.log(`✅ Created ${totalBookings} bookings and ${totalAttendance} attendance records`)

  // Create competitions
  console.log('🏆 Creating competitions...')
  const competitions = [
    {
      name: 'Ontario BJJ Championship 2025',
      description: 'Annual provincial Brazilian Jiu-Jitsu championship featuring gi and no-gi divisions',
      location: 'Toronto Convention Centre, Toronto, ON',
      competitionDate: new Date(2025, 10, 15), // November 15, 2025
      registrationDeadline: new Date(2025, 9, 15), // October 15, 2025
      entryFee: 85.00,
      website: 'https://ontariobjj.com/championship',
      contactInfo: 'info@ontariobjj.com | (416) 555-0123',
      divisions: 'Adult: White, Blue, Purple, Brown, Black | Masters: 30+, 40+, 50+ | Weight classes from Rooster to Ultra Heavy',
      rules: 'IBJJF rules apply. Gi and No-Gi divisions available. Weigh-ins day of competition.',
      createdById: adminUser.id,
    },
    {
      name: 'Grappling Industries - Windsor',
      description: 'Expert level no-gi tournament with beginner friendly divisions',
      location: 'WFCU Centre, Windsor, ON',
      competitionDate: new Date(2025, 11, 8), // December 8, 2025
      registrationDeadline: new Date(2025, 10, 22), // November 22, 2025
      entryFee: 70.00,
      website: 'https://grapplingindustries.com/windsor',
      contactInfo: 'events@grapplingindustries.com',
      divisions: 'Beginner, Intermediate, Advanced | No-Gi only | All weight classes',
      rules: 'Modified ADCC rules. Submission only format for advanced divisions.',
      createdById: coachUser.id,
    }
  ]

  for (const comp of competitions) {
    await prisma.competition.create({ data: comp })
  }

  console.log('✅ Created competitions')

  // Create system settings
  console.log('⚙️ Creating system settings...')
  const settings = [
    {
      settingKey: 'max_class_capacity',
      settingValue: '40',
      description: 'Maximum number of students per class',
      updatedById: adminUser.id,
    },
    {
      settingKey: 'utilization_target',
      settingValue: '50',
      description: 'Target utilization rate percentage',
      updatedById: adminUser.id,
    },
    {
      settingKey: 'missed_class_notification_days',
      settingValue: '14',
      description: 'Days after which to send missed class notifications',
      updatedById: adminUser.id,
    },
    {
      settingKey: 'booking_deadline_hours',
      settingValue: '2',
      description: 'Hours before class when booking closes',
      updatedById: adminUser.id,
    },
    {
      settingKey: 'cancellation_deadline_hours',
      settingValue: '4',
      description: 'Hours before class when cancellation is allowed',
      updatedById: adminUser.id,
    },
  ]

  for (const setting of settings) {
    await prisma.setting.create({ data: setting })
  }

  console.log('✅ Created system settings')

  // Create sample newsletter
  await prisma.newsletter.create({
    data: {
      title: 'Welcome to Tecumseh Jujutsu - December 2024',
      content: `
Dear Tecumseh Jujutsu Family,

We're excited to share some updates from our thriving academy!

## December Highlights:
- **New Student Promotions**: Congratulations to our recent belt promotions!
- **Holiday Schedule**: Please note our modified schedule during the holidays
- **Competition Team**: Great results at the recent Ontario BJJ Championship
- **New Equipment**: We've added new mats and training equipment

## Upcoming Events:
- **Dec 15**: Holiday potluck after evening class
- **Jan 8**: New student orientation session
- **Feb 12**: Seminar with visiting black belt instructor

## Training Tips:
Remember to focus on the fundamentals - they are the foundation of all advanced techniques. Consistency in training is more valuable than intensity.

## Class Reminders:
- Maximum 40 spots per class
- Cancellations must be made at least 4 hours before class
- Keep your emergency contact information current
- Maintain good hygiene for the safety of all students

Thank you for being part of our academy community!

OSS!
The Tecumseh Jujutsu Team
      `,
      authorId: adminUser.id,
      publishDate: new Date(),
      isPublished: true,
      targetAudience: 'ALL',
      priority: 'NORMAL',
    },
  })

  console.log('✅ Created sample newsletter')

  console.log('🎉 Comprehensive database seed completed successfully!')
  console.log('')
  console.log('Database now contains:')
  const userCount = await prisma.user.count()
  const classCount = await prisma.class.count()
  const sessionCount = await prisma.classSession.count()
  const bookingCount = await prisma.booking.count()
  const attendanceCount = await prisma.attendance.count()

  console.log(`- ${userCount} users (including ${students.length} students)`)
  console.log(`- ${classCount} class types`)
  console.log(`- ${sessionCount} class sessions`)
  console.log(`- ${bookingCount} bookings`)
  console.log(`- ${attendanceCount} attendance records`)
  console.log('')
  console.log('Login credentials:')
  console.log('Admin: admin@tecumseh-jujutsu.com / admin123')
  console.log('Coach: coach@tecumseh-jujutsu.com / coach123')
  console.log('Students: Any student email / student123')
  console.log('')
  console.log('Visit http://localhost:3000 to explore the populated system!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })