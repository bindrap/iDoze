const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function populateDemoData() {
  console.log('Populating comprehensive demo data...')

  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    // Get coach for class assignments
    const coach = await prisma.user.findUnique({
      where: { email: 'coach@tecumseh-jujutsu.com' }
    })

    if (!coach) {
      throw new Error('Coach not found - run create-demo-accounts.js first')
    }

    // Create diverse students with realistic data
    const students = [
      // White belts (beginners)
      { firstName: 'Jake', lastName: 'Thompson', email: 'jake.thompson@email.com', belt: 'White', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 2 },
      { firstName: 'Emma', lastName: 'Rodriguez', email: 'emma.rodriguez@email.com', belt: 'White', stripes: 1, paymentStatus: 'OVERDUE', monthsTraining: 4 },
      { firstName: 'Noah', lastName: 'Kim', email: 'noah.kim@email.com', belt: 'White', stripes: 2, paymentStatus: 'CURRENT', monthsTraining: 6 },
      { firstName: 'Olivia', lastName: 'Chen', email: 'olivia.chen@email.com', belt: 'White', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 1 },
      { firstName: 'Liam', lastName: 'Johnson', email: 'liam.johnson@email.com', belt: 'White', stripes: 3, paymentStatus: 'OVERDUE', monthsTraining: 8 },

      // Blue belts (intermediate)
      { firstName: 'Sophia', lastName: 'Garcia', email: 'sophia.garcia@email.com', belt: 'Blue', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 12 },
      { firstName: 'Mason', lastName: 'Davis', email: 'mason.davis@email.com', belt: 'Blue', stripes: 2, paymentStatus: 'CURRENT', monthsTraining: 18 },
      { firstName: 'Ava', lastName: 'Wilson', email: 'ava.wilson@email.com', belt: 'Blue', stripes: 1, paymentStatus: 'OVERDUE', monthsTraining: 15 },
      { firstName: 'Ethan', lastName: 'Martinez', email: 'ethan.martinez@email.com', belt: 'Blue', stripes: 3, paymentStatus: 'CURRENT', monthsTraining: 22 },

      // Purple belts (advanced)
      { firstName: 'Isabella', lastName: 'Anderson', email: 'isabella.anderson@email.com', belt: 'Purple', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 30 },
      { firstName: 'Lucas', lastName: 'Taylor', email: 'lucas.taylor@email.com', belt: 'Purple', stripes: 2, paymentStatus: 'CURRENT', monthsTraining: 36 },
      { firstName: 'Mia', lastName: 'Brown', email: 'mia.brown@email.com', belt: 'Purple', stripes: 1, paymentStatus: 'OVERDUE', monthsTraining: 33 },

      // Brown belts (expert)
      { firstName: 'Alexander', lastName: 'Miller', email: 'alex.miller@email.com', belt: 'Brown', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 48 },
      { firstName: 'Charlotte', lastName: 'Wilson', email: 'charlotte.wilson@email.com', belt: 'Brown', stripes: 1, paymentStatus: 'CURRENT', monthsTraining: 52 },

      // Black belt (master)
      { firstName: 'James', lastName: 'Moore', email: 'james.moore@email.com', belt: 'Black', stripes: 1, paymentStatus: 'CURRENT', monthsTraining: 72 },

      // Kids (various levels)
      { firstName: 'Zoe', lastName: 'Lee', email: 'zoe.lee@parent.com', belt: 'White', stripes: 2, paymentStatus: 'CURRENT', monthsTraining: 5, isKid: true },
      { firstName: 'Ryan', lastName: 'Clark', email: 'ryan.clark@parent.com', belt: 'Yellow', stripes: 1, paymentStatus: 'OVERDUE', monthsTraining: 8, isKid: true },
      { firstName: 'Lily', lastName: 'Walker', email: 'lily.walker@parent.com', belt: 'Orange', stripes: 0, paymentStatus: 'CURRENT', monthsTraining: 12, isKid: true },
      { firstName: 'Max', lastName: 'Hall', email: 'max.hall@parent.com', belt: 'Green', stripes: 2, paymentStatus: 'CURRENT', monthsTraining: 18, isKid: true },
    ]

    console.log('Creating students...')
    const createdUsers = []

    for (const student of students) {
      // Calculate realistic dates
      const membershipStartDate = new Date()
      membershipStartDate.setMonth(membershipStartDate.getMonth() - student.monthsTraining)

      let lastPaymentDate = null
      let nextPaymentDue = null

      if (student.paymentStatus === 'CURRENT') {
        lastPaymentDate = new Date()
        lastPaymentDate.setDate(1) // Paid on 1st of current month
        nextPaymentDue = new Date(lastPaymentDate)
        nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1)
      } else {
        // Overdue - last payment was 2 months ago
        lastPaymentDate = new Date()
        lastPaymentDate.setMonth(lastPaymentDate.getMonth() - 2)
        nextPaymentDue = new Date()
        nextPaymentDue.setDate(1) // Was due on 1st of this month
      }

      const user = await prisma.user.upsert({
        where: { email: student.email },
        update: {
          paymentStatus: student.paymentStatus,
          lastPaymentDate,
          nextPaymentDue,
        },
        create: {
          email: student.email,
          passwordHash: hashedPassword,
          firstName: student.firstName,
          lastName: student.lastName,
          role: 'MEMBER',
          membershipStatus: 'ACTIVE',
          membershipStartDate,
          lastPaymentDate,
          nextPaymentDue,
          paymentStatus: student.paymentStatus,
          phone: `555-${Math.floor(Math.random() * 9000 + 1000)}`,
          emergencyContactName: `${student.firstName} Parent`,
          emergencyContactPhone: `555-${Math.floor(Math.random() * 9000 + 1000)}`
        }
      })

      // Delete existing member progress and create new one
      await prisma.memberProgress.deleteMany({
        where: { userId: user.id }
      })

      await prisma.memberProgress.create({
        data: {
          userId: user.id,
          beltRank: student.belt,
          stripes: student.stripes,
          totalClassesAttended: Math.floor(student.monthsTraining * 8 + Math.random() * 20), // ~8 classes per month + variation
          lastAttendanceDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Within last week
        }
      })

      createdUsers.push({ ...user, belt: student.belt, stripes: student.stripes })
    }

    console.log(`✓ Created ${students.length} diverse students`)

    // Get existing classes
    const classes = await prisma.class.findMany()
    const adultClasses = classes.filter(c => c.name.includes('Adult'))
    const kidsClasses = classes.filter(c => c.name.includes('Kids'))

    // Get class sessions from the last 2 weeks
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const recentSessions = await prisma.classSession.findMany({
      where: {
        sessionDate: {
          gte: twoWeeksAgo
        }
      }
    })

    console.log('Creating realistic attendance records...')
    let attendanceCount = 0

    // Clean up existing attendance for demo users
    const userIds = createdUsers.map(u => u.id)
    await prisma.attendance.deleteMany({
      where: { userId: { in: userIds } }
    })

    // Create attendance for each user
    for (const user of createdUsers) {
      const isKid = students.find(s => s.email === user.email)?.isKid || false
      const relevantSessions = isKid ?
        recentSessions.filter(s => kidsClasses.some(c => c.id === s.classId)) :
        recentSessions.filter(s => adultClasses.some(c => c.id === s.classId))

      // Attendance rate based on belt level and payment status
      let attendanceRate = 0.4 // Base 40%

      if (user.paymentStatus === 'CURRENT') attendanceRate += 0.3 // +30% if current

      // Higher belts tend to attend more
      const belt = students.find(s => s.email === user.email)?.belt
      switch (belt) {
        case 'Black': attendanceRate += 0.25; break
        case 'Brown': attendanceRate += 0.2; break
        case 'Purple': attendanceRate += 0.15; break
        case 'Blue': attendanceRate += 0.1; break
        case 'Green': attendanceRate += 0.1; break // Kids
        case 'Orange': attendanceRate += 0.05; break // Kids
        default: attendanceRate += 0; // White/Yellow
      }

      // Create attendance records
      for (const session of relevantSessions) {
        if (Math.random() < attendanceRate) {
          await prisma.attendance.create({
            data: {
              userId: user.id,
              classSessionId: session.id,
              attendanceStatus: 'PRESENT',
              checkInTime: new Date(session.sessionDate)
            }
          })
          attendanceCount++
        }
      }
    }

    console.log(`✓ Created ${attendanceCount} attendance records`)

    // Create some bookings for upcoming sessions
    const upcomingSessions = await prisma.classSession.findMany({
      where: {
        sessionDate: {
          gte: new Date()
        }
      },
      take: 10
    })

    console.log('Creating upcoming bookings...')
    let bookingCount = 0

    // Clean up existing bookings for demo users
    await prisma.booking.deleteMany({
      where: { userId: { in: userIds } }
    })

    for (const user of createdUsers.slice(0, 12)) { // First 12 users get bookings
      for (const session of upcomingSessions.slice(0, 3)) { // Book for next 3 sessions
        if (Math.random() < 0.6) { // 60% chance to book
          const isKid = students.find(s => s.email === user.email)?.isKid || false
          const sessionClass = classes.find(c => c.id === session.classId)
          const isKidsClass = sessionClass?.name.includes('Kids')

          // Kids book kids classes, adults book adult classes
          if (isKid === isKidsClass) {
            await prisma.booking.create({
              data: {
                userId: user.id,
                classSessionId: session.id,
                bookingStatus: 'BOOKED',
                bookingDate: new Date()
              }
            })
            bookingCount++
          }
        }
      }
    }

    console.log(`✓ Created ${bookingCount} upcoming bookings`)

    // Create some payment records for users who are current
    console.log('Creating payment history...')
    let paymentCount = 0

    // Clean up existing payments for demo users
    await prisma.payment.deleteMany({
      where: { userId: { in: userIds } }
    })

    for (const user of createdUsers) {
      if (user.paymentStatus === 'CURRENT') {
        // Create 1-3 recent payment records
        const numPayments = Math.floor(Math.random() * 3) + 1

        for (let i = 0; i < numPayments; i++) {
          const paymentDate = new Date()
          paymentDate.setMonth(paymentDate.getMonth() - i)
          paymentDate.setDate(1) // Always paid on 1st

          await prisma.payment.create({
            data: {
              userId: user.id,
              amount: 125.00,
              paymentDate,
              paymentMethod: Math.random() > 0.8 ? 'CASH' : 'E_TRANSFER',
              forMonth: new Date(paymentDate),
              processedById: coach.id,
              transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            }
          })
          paymentCount++
        }
      }
    }

    console.log(`✓ Created ${paymentCount} payment records`)

    // Summary
    const currentMembers = students.filter(s => s.paymentStatus === 'CURRENT').length
    const overdueMembers = students.filter(s => s.paymentStatus === 'OVERDUE').length
    const kidsCount = students.filter(s => s.isKid).length
    const adultCount = students.length - kidsCount

    console.log('\n🎉 Demo data populated successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${students.length} total students created`)
    console.log(`- ${adultCount} adults, ${kidsCount} kids`)
    console.log(`- ${currentMembers} current payments, ${overdueMembers} overdue`)
    console.log(`- Belt distribution:`)
    console.log(`  • White: ${students.filter(s => s.belt === 'White').length}`)
    console.log(`  • Blue: ${students.filter(s => s.belt === 'Blue').length}`)
    console.log(`  • Purple: ${students.filter(s => s.belt === 'Purple').length}`)
    console.log(`  • Brown: ${students.filter(s => s.belt === 'Brown').length}`)
    console.log(`  • Black: ${students.filter(s => s.belt === 'Black').length}`)
    console.log(`  • Kids belts: ${students.filter(s => ['Yellow', 'Orange', 'Green'].includes(s.belt)).length}`)
    console.log(`- ${attendanceCount} attendance records`)
    console.log(`- ${bookingCount} upcoming bookings`)
    console.log(`- ${paymentCount} payment history records`)

    console.log('\n🔐 All student accounts use password: password123')
    console.log('\n👥 Login as coach to see payment management:')
    console.log('Email: coach@tecumseh-jujutsu.com')
    console.log('Password: password123')

  } catch (error) {
    console.error('Error populating demo data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateDemoData()