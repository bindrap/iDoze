const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const studentNames = [
  { firstName: 'Alex', lastName: 'Chen' },
  { firstName: 'Maria', lastName: 'Rodriguez' },
  { firstName: 'James', lastName: 'Wilson' },
  { firstName: 'Sarah', lastName: 'Johnson' },
  { firstName: 'Michael', lastName: 'Brown' },
  { firstName: 'Emily', lastName: 'Davis' },
  { firstName: 'David', lastName: 'Miller' },
  { firstName: 'Lisa', lastName: 'Garcia' },
  { firstName: 'Robert', lastName: 'Taylor' },
  { firstName: 'Jessica', lastName: 'Anderson' },
  { firstName: 'Chris', lastName: 'Martinez' },
  { firstName: 'Amanda', lastName: 'Moore' },
  { firstName: 'Daniel', lastName: 'Jackson' },
  { firstName: 'Ashley', lastName: 'White' },
  { firstName: 'Kevin', lastName: 'Harris' },
  { firstName: 'Rachel', lastName: 'Clark' },
  { firstName: 'Brian', lastName: 'Lewis' },
  { firstName: 'Nicole', lastName: 'Walker' },
  { firstName: 'Tyler', lastName: 'Hall' },
  { firstName: 'Stephanie', lastName: 'Young' }
]

const beltRanks = ['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK']
const skillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

// Helper function to get random date in the past
function getRandomPastDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date
}

// Helper function to get random attendance pattern
function generateAttendancePattern(studentId, joinDate, consistency) {
  const attendanceRecords = []
  const now = new Date()
  const daysSinceJoin = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24))

  // Generate attendance based on consistency level
  // High consistency: 4-5 classes per week
  // Medium consistency: 2-3 classes per week
  // Low consistency: 1-2 classes per week
  const classesPerWeek = consistency === 'high' ? 4.5 : consistency === 'medium' ? 2.5 : 1.5
  const totalExpectedClasses = Math.floor((daysSinceJoin / 7) * classesPerWeek)

  return Math.floor(totalExpectedClasses * (0.7 + Math.random() * 0.3)) // 70-100% of expected
}

async function main() {
  console.log('🏗️ Starting test data population...')

  try {
    // Create test students
    console.log('👥 Creating 20 test students...')

    const students = []

    for (let i = 0; i < studentNames.length; i++) {
      const student = studentNames[i]
      const joinDate = getRandomPastDate(365) // Joined within last year

      // Assign belt rank based on join date (older members tend to have higher ranks)
      const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24))
      let beltRank = 'WHITE'
      let stripes = Math.floor(Math.random() * 5)

      if (daysSinceJoin > 300) {
        beltRank = Math.random() > 0.7 ? 'BLUE' : 'WHITE'
        if (beltRank === 'BLUE') stripes = Math.floor(Math.random() * 4)
      }
      if (daysSinceJoin > 600) {
        beltRank = Math.random() > 0.8 ? 'PURPLE' : beltRank
        if (beltRank === 'PURPLE') stripes = Math.floor(Math.random() * 4)
      }
      if (daysSinceJoin > 900) {
        beltRank = Math.random() > 0.9 ? 'BROWN' : beltRank
        if (beltRank === 'BROWN') stripes = Math.floor(Math.random() * 4)
      }

      // Determine consistency level
      const consistency = Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'

      const hashedPassword = await bcrypt.hash('password123', 12)

      const createdStudent = await prisma.user.create({
        data: {
          email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@example.com`,
          passwordHash: hashedPassword,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          role: 'MEMBER',
          membershipStatus: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE', // 90% active
          membershipStartDate: joinDate,
          emergencyContactName: `Emergency Contact ${i + 1}`,
          emergencyContactPhone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          medicalConditions: Math.random() > 0.7 ? `Medical condition ${i + 1}` : null,
          createdAt: joinDate,
          isOnBench: Math.random() > 0.9 // 10% on bench
        }
      })

      // Create member progress
      await prisma.memberProgress.create({
        data: {
          userId: createdStudent.id,
          beltRank,
          stripes,
          totalClassesAttended: generateAttendancePattern(createdStudent.id, joinDate, consistency),
          promotionDate: daysSinceJoin > 100 ? getRandomPastDate(daysSinceJoin - 50) : null,
          lastAttendanceDate: consistency !== 'low' ? getRandomPastDate(7) : getRandomPastDate(30),
          notes: `${consistency} consistency member. Joined ${Math.floor(daysSinceJoin)} days ago.`
        }
      })

      students.push({ ...createdStudent, consistency, joinDate, beltRank })
      console.log(`✅ Created ${student.firstName} ${student.lastName} (${beltRank} belt, ${consistency} consistency)`)
    }

    // Get existing classes and sessions
    console.log('📚 Getting existing classes and sessions...')
    const classes = await prisma.class.findMany({
      where: { isActive: true },
      include: {
        sessions: {
          where: {
            sessionDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)   // Next 7 days
            }
          }
        }
      }
    })

    if (classes.length === 0) {
      console.log('⚠️ No classes found. Creating a sample class...')

      // Create a sample class if none exist
      const sampleClass = await prisma.class.create({
        data: {
          name: 'Brazilian Jiu-Jitsu Fundamentals',
          description: 'Learn the basics of BJJ in a friendly environment',
          skillLevel: 'BEGINNER',
          maxCapacity: 20,
          durationMinutes: 60,
          isActive: true,
          isRecurring: true,
          dayOfWeek: 1, // Monday
          startTime: '18:00',
          endTime: '19:00',
          instructorId: students[0].id // Use first student as temp instructor
        }
      })

      // Create sessions for the next week
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() + i)
        if (sessionDate.getDay() === 1) { // Monday
          await prisma.classSession.create({
            data: {
              classId: sampleClass.id,
              sessionDate,
              startTime: '18:00',
              endTime: '19:00',
              instructorId: students[0].id
            }
          })
        }
      }

      classes.push({
        ...sampleClass,
        sessions: await prisma.classSession.findMany({
          where: { classId: sampleClass.id }
        })
      })
    }

    // Create bookings and attendance for realistic simulation
    console.log('📝 Creating bookings and attendance records...')

    let totalBookings = 0
    let totalAttendance = 0

    for (const classItem of classes) {
      for (const session of classItem.sessions) {
        // Determine how many students will book this session (50-90% of capacity)
        const bookingCount = Math.floor(classItem.maxCapacity * (0.5 + Math.random() * 0.4))

        // Select random students for booking (favor active, high-consistency students)
        const availableStudents = students.filter(s => s.membershipStatus === 'ACTIVE' && !s.isOnBench)
        const selectedStudents = availableStudents
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(bookingCount, availableStudents.length))

        for (const student of selectedStudents) {
          // Create booking
          const booking = await prisma.booking.create({
            data: {
              userId: student.id,
              classSessionId: session.id,
              bookingStatus: 'BOOKED',
              bookingDate: new Date(session.sessionDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Booked 0-7 days before
            }
          })
          totalBookings++

          // Create attendance based on student consistency and if session is in the past
          const sessionDateTime = new Date(`${session.sessionDate.toISOString().split('T')[0]} ${session.startTime}`)
          const isSessionInPast = sessionDateTime < new Date()

          if (isSessionInPast) {
            const attendanceChance = student.consistency === 'high' ? 0.9 :
                                   student.consistency === 'medium' ? 0.75 : 0.6

            if (Math.random() < attendanceChance) {
              // Update booking to checked in
              await prisma.booking.update({
                where: { id: booking.id },
                data: {
                  bookingStatus: 'CHECKED_IN',
                  checkInTime: sessionDateTime
                }
              })

              // Create attendance record
              await prisma.attendance.create({
                data: {
                  userId: student.id,
                  classSessionId: session.id,
                  checkInTime: sessionDateTime,
                  notes: `Auto-generated attendance for ${student.firstName} ${student.lastName}`
                }
              })
              totalAttendance++
            }
          }
        }
      }
    }

    // Update member progress with accurate attendance counts
    console.log('📊 Updating member progress with attendance counts...')
    for (const student of students) {
      const attendanceCount = await prisma.attendance.count({
        where: { userId: student.id }
      })

      await prisma.memberProgress.updateMany({
        where: { userId: student.id },
        data: { totalClassesAttended: attendanceCount }
      })
    }

    console.log('✅ Test data population completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Created ${students.length} students`)
    console.log(`   - Generated ${totalBookings} bookings`)
    console.log(`   - Generated ${totalAttendance} attendance records`)
    console.log(`   - Simulated realistic attendance patterns`)
    console.log('')
    console.log('🔐 All test students have password: password123')
    console.log('📧 Student emails follow pattern: firstname.lastname@example.com')

  } catch (error) {
    console.error('❌ Error populating test data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })