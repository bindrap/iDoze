const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create default users
  const adminPassword = await bcrypt.hash('admin123', 12)
  const coachPassword = await bcrypt.hash('coach123', 12)
  const memberPassword = await bcrypt.hash('member123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tecumseh-jujutsu.com' },
    update: {},
    create: {
      email: 'admin@tecumseh-jujutsu.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '519-555-0001',
      role: 'ADMIN',
      membershipStatus: 'ACTIVE',
      membershipStartDate: new Date(),
    },
  })

  const coach = await prisma.user.upsert({
    where: { email: 'coach@tecumseh-jujutsu.com' },
    update: {},
    create: {
      email: 'coach@tecumseh-jujutsu.com',
      passwordHash: coachPassword,
      firstName: 'John',
      lastName: 'Coach',
      phone: '519-555-0002',
      role: 'COACH',
      membershipStatus: 'ACTIVE',
      membershipStartDate: new Date(),
    },
  })

  const member = await prisma.user.upsert({
    where: { email: 'member@tecumseh-jujutsu.com' },
    update: {},
    create: {
      email: 'member@tecumseh-jujutsu.com',
      passwordHash: memberPassword,
      firstName: 'Jane',
      lastName: 'Member',
      phone: '519-555-0003',
      role: 'MEMBER',
      membershipStatus: 'ACTIVE',
      membershipStartDate: new Date(),
    },
  })

  console.log('✅ Created default users')

  // Create sample classes based on actual schedule (using upsert to prevent duplicates)
  const morningAdultsClass = await prisma.class.upsert({
    where: {
      // Use a unique combination of name and instructor
      name: 'Morning Adults Brazilian Jiu-Jitsu'
    },
    update: {},
    create: {
      name: 'Morning Adults Brazilian Jiu-Jitsu',
      description: 'Morning BJJ training for adults',
      instructorId: coach.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      isRecurring: true,
      dayOfWeek: 1, // Monday (will create for Mon-Fri)
      startTime: '09:30',
      endTime: '10:30',
    },
  })

  const eveningAdultsClass = await prisma.class.upsert({
    where: { name: 'Evening Adults Brazilian Jiu-Jitsu' },
    update: {},
    create: {
      name: 'Evening Adults Brazilian Jiu-Jitsu',
      description: 'Evening BJJ training for adults',
      instructorId: coach.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      isRecurring: true,
      dayOfWeek: 1, // Monday (will create for Mon-Thu)
      startTime: '19:00',
      endTime: '20:00',
    },
  })

  const kidsClass = await prisma.class.upsert({
    where: { name: 'Kids Brazilian Jiu-Jitsu' },
    update: {},
    create: {
      name: 'Kids Brazilian Jiu-Jitsu',
      description: 'Fun and engaging BJJ classes for children',
      instructorId: coach.id,
      maxCapacity: 40,
      durationMinutes: 45,
      skillLevel: 'BEGINNER',
      isRecurring: true,
      dayOfWeek: 1, // Monday (will create for Mon-Fri)
      startTime: '18:00',
      endTime: '18:45',
    },
  })

  const saturdayAdultsClass = await prisma.class.upsert({
    where: { name: 'Saturday Adults Brazilian Jiu-Jitsu' },
    update: {},
    create: {
      name: 'Saturday Adults Brazilian Jiu-Jitsu',
      description: 'Weekend BJJ training for adults',
      instructorId: coach.id,
      maxCapacity: 40,
      durationMinutes: 60,
      skillLevel: 'ALL',
      isRecurring: true,
      dayOfWeek: 6, // Saturday
      startTime: '11:00',
      endTime: '12:00',
    },
  })

  const sundayOpenMat = await prisma.class.upsert({
    where: { name: 'Sunday Open Mat' },
    update: {},
    create: {
      name: 'Sunday Open Mat',
      description: 'Open training for all skill levels',
      instructorId: coach.id,
      maxCapacity: 40,
      durationMinutes: 90,
      skillLevel: 'ALL',
      isRecurring: true,
      dayOfWeek: 0, // Sunday
      startTime: '11:00',
      endTime: '12:30',
    },
  })

  console.log('✅ Created sample classes')

  // Create upcoming class sessions for the next 4 weeks
  const today = new Date()
  const sessions = []

  for (let week = 0; week < 4; week++) {
    // Monday to Friday - Morning Adults (9:30 AM)
    for (let day = 1; day <= 5; day++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + (week * 7) + (day - today.getDay() + 7) % 7)

      sessions.push({
        classId: morningAdultsClass.id,
        sessionDate: sessionDate,
        startTime: '09:30',
        endTime: '10:30',
        instructorId: coach.id,
        maxCapacity: 40,
        status: 'SCHEDULED',
      })
    }

    // Monday to Friday - Kids (6:00 PM)
    for (let day = 1; day <= 5; day++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + (week * 7) + (day - today.getDay() + 7) % 7)

      sessions.push({
        classId: kidsClass.id,
        sessionDate: sessionDate,
        startTime: '18:00',
        endTime: '18:45',
        instructorId: coach.id,
        maxCapacity: 40,
        status: 'SCHEDULED',
      })
    }

    // Monday to Thursday - Evening Adults (7:00 PM)
    for (let day = 1; day <= 4; day++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + (week * 7) + (day - today.getDay() + 7) % 7)

      sessions.push({
        classId: eveningAdultsClass.id,
        sessionDate: sessionDate,
        startTime: '19:00',
        endTime: '20:00',
        instructorId: coach.id,
        maxCapacity: 40,
        status: 'SCHEDULED',
      })
    }

    // Saturday - Adults (11:00 AM)
    const saturdayDate = new Date(today)
    saturdayDate.setDate(today.getDate() + (week * 7) + (6 - today.getDay() + 7) % 7)

    sessions.push({
      classId: saturdayAdultsClass.id,
      sessionDate: saturdayDate,
      startTime: '11:00',
      endTime: '12:00',
      instructorId: coach.id,
      maxCapacity: 40,
      status: 'SCHEDULED',
    })

    // Sunday - Open Mat (11:00 AM)
    const sundayDate = new Date(today)
    sundayDate.setDate(today.getDate() + (week * 7) + (0 - today.getDay() + 7) % 7)

    sessions.push({
      classId: sundayOpenMat.id,
      sessionDate: sundayDate,
      startTime: '11:00',
      endTime: '12:30',
      instructorId: coach.id,
      maxCapacity: 40,
      status: 'SCHEDULED',
    })
  }

  // Check for existing sessions to prevent duplicates
  for (const sessionData of sessions) {
    const existingSession = await prisma.classSession.findFirst({
      where: {
        classId: sessionData.classId,
        sessionDate: sessionData.sessionDate,
        startTime: sessionData.startTime,
      }
    })

    if (!existingSession) {
      await prisma.classSession.create({
        data: sessionData,
      })
    }
  }

  console.log('✅ Created upcoming class sessions')

  // Create member progress for sample member only (not coach)
  await prisma.memberProgress.create({
    data: {
      userId: member.id,
      beltRank: 'White Belt',
      stripes: 1,
      totalClassesAttended: 15,
      lastAttendanceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  })

  console.log('✅ Created member progress')

  // Create system settings
  const defaultSettings = [
    {
      settingKey: 'max_class_capacity',
      settingValue: '40',
      description: 'Maximum number of students per class',
      updatedById: admin.id,
    },
    {
      settingKey: 'utilization_target',
      settingValue: '50',
      description: 'Target utilization rate percentage',
      updatedById: admin.id,
    },
    {
      settingKey: 'missed_class_notification_days',
      settingValue: '14',
      description: 'Days after which to send missed class notifications',
      updatedById: admin.id,
    },
    {
      settingKey: 'booking_deadline_hours',
      settingValue: '2',
      description: 'Hours before class when booking closes',
      updatedById: admin.id,
    },
    {
      settingKey: 'cancellation_deadline_hours',
      settingValue: '4',
      description: 'Hours before class when cancellation is allowed',
      updatedById: admin.id,
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Created system settings')

  // Create a sample newsletter
  await prisma.newsletter.create({
    data: {
      title: 'Welcome to iDoze Gym Management System',
      content: `
Dear Tecumseh Jujutsu Community,

We're excited to introduce our new gym management system! This platform will help streamline our operations and enhance your training experience.

## Key Features:
- **Easy Class Booking**: Reserve your spot in classes up to 2 hours before start time
- **Attendance Tracking**: Automatic progress tracking and belt rank management
- **Real-time Updates**: Get notified about schedule changes and important announcements
- **Personal Dashboard**: View your training history and upcoming sessions

## Getting Started:
1. Log in with your email and temporary password
2. Update your profile information
3. Browse upcoming classes and make your first booking
4. Check in at the gym using our digital system

## Important Reminders:
- Maximum 40 spots per class
- Cancellations must be made at least 4 hours before class
- Please keep your emergency contact information current

We're targeting 50% class utilization to ensure quality instruction while maintaining a sustainable program.

Thank you for being part of the Tecumseh Jujutsu family!

Best regards,
The Management Team
      `,
      authorId: admin.id,
      publishDate: new Date(),
      isPublished: true,
      targetAudience: 'ALL',
      priority: 'NORMAL',
    },
  })

  console.log('✅ Created sample newsletter')

  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('Default login credentials:')
  console.log('Admin: admin@tecumseh-jujutsu.com / admin123')
  console.log('Coach: coach@tecumseh-jujutsu.com / coach123')
  console.log('Member: member@tecumseh-jujutsu.com / member123')
  console.log('')
  console.log('Visit http://localhost:3000 to get started!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })