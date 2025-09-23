const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// TJJ Student data from the PDF (actual gym members)
const tjjStudents = [
  // Black Belts
  { name: "ANDREW ARCHIBALD", belt: "BLACK", stripes: 0, beltSize: "A5", notes: "" },
  { name: "ANDREW KUBIS", belt: "BLACK", stripes: 0, beltSize: "A5", notes: "" },
  { name: "FILIP MIRKOVIC", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "" },
  { name: "GUILLERMO CANO", belt: "BLACK", stripes: 1, beltSize: "A2", notes: "TRANSFERRED TO TJJ NOV 2023" },
  { name: "MARK CURRAN", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "COACH" },
  { name: "SETH GAUTIER", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "COACH" },
  { name: "SMITTY - ADAM BILLARGEON", belt: "BLACK", stripes: 1, beltSize: "A2", notes: "" },
  { name: "STEVE STRONG", belt: "BLACK", stripes: 0, beltSize: "A3", notes: "" },

  // Brown Belts
  { name: "ASIAN MIKE", belt: "BROWN", stripes: 1, beltSize: "A4", notes: "" },
  { name: "BROOKE TOFFLEMIRE", belt: "BROWN", stripes: 2, beltSize: "A3", notes: "COACH" },
  { name: "BRUISER - JOSH BONNEAU", belt: "BROWN", stripes: 4, beltSize: "A3", notes: "INJURED" },
  { name: "CHRIS ILIJANICH", belt: "BROWN", stripes: 0, beltSize: "A3", notes: "LA" },
  { name: "GREG", belt: "BROWN", stripes: 1, beltSize: "A2", notes: "" },
  { name: "JED WELLS", belt: "BROWN", stripes: 0, beltSize: "A3", notes: "CONCEPT BJJ" },
  { name: "JOEL WRITE", belt: "BROWN", stripes: 2, beltSize: "A3", notes: "" },
  { name: "MASSIMO CARLESIMO", belt: "BROWN", stripes: 0, beltSize: "A4", notes: "LA" },
  { name: "RAF BULGARSKI", belt: "BROWN", stripes: 0, beltSize: "A4", notes: "" },
  { name: "STAXX", belt: "BROWN", stripes: 2, beltSize: "A2", notes: "CONCEPT BJJ" },
  { name: "TED - CHIP WHIZ", belt: "BROWN", stripes: 0, beltSize: "A4", notes: "LA" },

  // Purple Belts
  { name: "BRANDO MACQUARRIE", belt: "PURPLE", stripes: 0, beltSize: "A3", notes: "LA" },
  { name: "CLIFF POULTON", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "" },
  { name: "DEAN PFAFF", belt: "PURPLE", stripes: 0, beltSize: "A3", notes: "LA" },
  { name: "ETHAN SEALEY", belt: "PURPLE", stripes: 1, beltSize: "A4", notes: "" },
  { name: "FRANK FAZEKAS", belt: "PURPLE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "GORDON MAXWELL", belt: "PURPLE", stripes: 1, beltSize: "A3", notes: "LA" },
  { name: "JEREMY BASTIEN", belt: "PURPLE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "LOGAN LAVESSEUR", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "" },
  { name: "MARTIN CROZIER", belt: "PURPLE", stripes: 0, beltSize: "A4", notes: "" },
  { name: "MATT CAVALLARO", belt: "PURPLE", stripes: 0, beltSize: "A3", notes: "LA" },
  { name: "MATTEO CARLESIMO", belt: "PURPLE", stripes: 3, beltSize: "A2", notes: "" },
  { name: "MITCHY DAME", belt: "PURPLE", stripes: 1, beltSize: "A1", notes: "" },
  { name: "MOE ISKANDAR", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "" },
  { name: "NICK NIFOROS", belt: "PURPLE", stripes: 2, beltSize: "A3", notes: "COACH" },
  { name: "NIKKO SABLONE", belt: "PURPLE", stripes: 0, beltSize: "A3", notes: "INJURED" },
  { name: "SHEA LAROSE", belt: "PURPLE", stripes: 0, beltSize: "A2", notes: "COACH" },
  { name: "PHIL RUSSO", belt: "PURPLE", stripes: 2, beltSize: "A3", notes: "" },
  { name: "TONY LARAMIE", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "MTC / TJJ" },

  // Blue Belts
  { name: "ANASTASIYA ZHELNAKOVA", belt: "BLUE", stripes: 0, beltSize: "A1", notes: "STARTED TJJ FEB 2024" },
  { name: "ASHLEY PATRICK", belt: "BLUE", stripes: 2, beltSize: "A2", notes: "INACTIVE" },
  { name: "ASIM ISKANDAR", belt: "BLUE", stripes: 2, beltSize: "A1", notes: "" },
  { name: "BELLA NICOLETTI", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "BRAIDEN GAILL", belt: "BLUE", stripes: 2, beltSize: "A3", notes: "" },
  { name: "BRANDON DIESBOURG", belt: "BLUE", stripes: 3, beltSize: "A3", notes: "" },
  { name: "CALEB FALBO", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "CHANTELLE POUGET", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "COLETON NACCARATO", belt: "BLUE", stripes: 0, beltSize: "A4", notes: "" },
  { name: "DAN SIMARD", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "DAN ZELENY", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "LA - DAYS ONLY" },
  { name: "DANE", belt: "BLUE", stripes: 1, beltSize: "A1", notes: "" },
  { name: "DOM FORGET", belt: "BLUE", stripes: 1, beltSize: "A4", notes: "" },
  { name: "DOM KALINOWSKI", belt: "BLUE", stripes: 0, beltSize: "A1", notes: "ACTIVE SEPT 2023" },
  { name: "DUNCAN RIVIERE", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "EDWARD KOSTRZEWA", belt: "BLUE", stripes: 4, beltSize: "A2", notes: "LA" },
  { name: "JACK MCLEOD", belt: "BLUE", stripes: 2, beltSize: "A2", notes: "" },
  { name: "JOEL KEARNS", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "JOSH KNOTT", belt: "BLUE", stripes: 1, beltSize: "A2", notes: "MOVED FROM TEENS" },
  { name: "JUSTIN POUGET", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "JUSTUS CESAR", belt: "BLUE", stripes: 2, beltSize: "A1", notes: "" },
  { name: "KEEVON", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "LOGAN HOWLETTE", belt: "BLUE", stripes: 1, beltSize: "A1", notes: "MOVED FROM TEENS" },
  { name: "MATT OROSZ", belt: "BLUE", stripes: 1, beltSize: "A4", notes: "" },
  { name: "MATTHEW L", belt: "BLUE", stripes: 0, beltSize: "A1", notes: "" },
  { name: "MATTHEW LANOUE", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "MIMI NYGUEN", belt: "BLUE", stripes: 3, beltSize: "A1", notes: "" },
  { name: "NANCY KLASSEN", belt: "BLUE", stripes: 0, beltSize: "A1", notes: "" },
  { name: "NICK QUINLAN (WELDER)", belt: "BLUE", stripes: 2, beltSize: "A2", notes: "" },
  { name: "PARTEEK BINDRA", belt: "BLUE", stripes: 3, beltSize: "A2", notes: "" },
  { name: "REGIS REKA", belt: "BLUE", stripes: 2, beltSize: "A1", notes: "LA" },
  { name: "ROBBY GILL", belt: "BLUE", stripes: 1, beltSize: "A2", notes: "LA" },
  { name: "SHAUMIK BAKI", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "LA" },
  { name: "TRENT GRAHAM", belt: "BLUE", stripes: 2, beltSize: "A2", notes: "" },

  // Green Belts
  { name: "GABBY NICOLETTI", belt: "GREEN", stripes: 0, beltSize: "A1", notes: "" },

  // Yellow Belts
  { name: "JACK KNOTT", belt: "YELLOW", stripes: 0, beltSize: "A2", notes: "" },

  // Grey Belts
  { name: "ABE ISKANDAR", belt: "GREY", stripes: 4, beltSize: "A1", notes: "" },
  { name: "MAX", belt: "GREY", stripes: 3, beltSize: "A1", notes: "" },

  // White Belts
  { name: "AMIR ESUFALI", belt: "WHITE", stripes: 1, beltSize: "A2", notes: "LA" },
  { name: "ANDREW", belt: "WHITE", stripes: 1, beltSize: "A3", notes: "" },
  { name: "BEN FARKAS", belt: "WHITE", stripes: 0, beltSize: "A2", notes: "LA" },
  { name: "BEN FERRATO", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "BRADEN MURPHY", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "CHEN", belt: "WHITE", stripes: 2, beltSize: "A3", notes: "" },
  { name: "CHRIS SCHULTZ", belt: "WHITE", stripes: 0, beltSize: "A2", notes: "LA" },
  { name: "DAVID FERRO", belt: "WHITE", stripes: 2, beltSize: "A1", notes: "" },
  { name: "DOM SBLONE", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "ERICK PALIZO", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "HUNTER KORT", belt: "WHITE", stripes: 4, beltSize: "A2", notes: "" },
  { name: "JACK FERRATO", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "JACK FITZPATRICK", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "JACK MCLEOD", belt: "WHITE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "JASON LEAVOY", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "JAMES KENNEDY", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "JAY KANG", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "JERRICA SCOTT", belt: "WHITE", stripes: 2, beltSize: "A4", notes: "PUSH 1 MONTH" },
  { name: "JOSH KADAR", belt: "WHITE", stripes: 4, beltSize: "A3", notes: "" },
  { name: "JULI HANY", belt: "WHITE", stripes: 1, beltSize: "A3", notes: "" },
  { name: "JUSTIN FOLKERINGA", belt: "WHITE", stripes: 2, beltSize: "A2", notes: "" },
  { name: "KELSEY TIMOTHY", belt: "WHITE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "LAURA MONTPETIT-WEEKS", belt: "WHITE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "LEX BULLER", belt: "WHITE", stripes: 1, beltSize: "A1", notes: "" },
  { name: "LI CHENG", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "MATT MILLS", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "NEIL MORRAND", belt: "WHITE", stripes: 4, beltSize: "A3", notes: "" },
  { name: "PAUL CUFFE", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "RYANNE", belt: "WHITE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "SHANE PENNANT", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "SHELDON TRAVY", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "TAAHA ALVI", belt: "WHITE", stripes: 4, beltSize: "A2", notes: "" },
  { name: "TYLER JOHNSON", belt: "WHITE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "TYLER FRISON", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "WILSON PAZ-ABDULSALAM", belt: "WHITE", stripes: 4, beltSize: "A4", notes: "PUSH 1 MONTH" },
  { name: "ZACK CANTY", belt: "WHITE", stripes: 0, beltSize: "", notes: "" },
  { name: "ZACHARY GILL", belt: "WHITE", stripes: 3, beltSize: "A3", notes: "" }
];

function generateEmail(name) {
  // Convert name to email format: "JOHN DOE" -> "john.doe@tjj.com"
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters except spaces
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/\.$/, '') // Remove trailing dot
    + '@tjj.com';
}

function parseName(fullName) {
  const parts = fullName.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Handle names like "SMITTY - ADAM BILLARGEON"
  if (fullName.includes(' - ')) {
    const nickname = parts[0];
    const realName = fullName.split(' - ')[1];
    const realParts = realName.split(' ');
    return {
      firstName: realParts[0] || nickname,
      lastName: realParts.slice(1).join(' ') || ''
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function getBeltRank(belt) {
  const beltMap = {
    'BLACK': 'Black Belt',
    'BROWN': 'Brown Belt',
    'PURPLE': 'Purple Belt',
    'BLUE': 'Blue Belt',
    'GREEN': 'Green Belt',
    'YELLOW': 'Yellow Belt',
    'GREY': 'Grey Belt',
    'WHITE': 'White Belt'
  };
  return beltMap[belt] || 'White Belt';
}

function getRoleFromNotes(notes) {
  if (notes.includes('COACH')) {
    return 'COACH';
  }
  return 'MEMBER';
}

function getMembershipStatus(notes) {
  if (notes.includes('INACTIVE')) {
    return 'INACTIVE';
  }
  return 'ACTIVE';
}

function generatePhoneNumber() {
  return `519-555-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateJoinDate(belt) {
  const today = new Date();
  let monthsAgo;

  switch(belt) {
    case 'BLACK': monthsAgo = Math.floor(Math.random() * 36) + 24; break; // 2-5 years
    case 'BROWN': monthsAgo = Math.floor(Math.random() * 24) + 18; break; // 1.5-3.5 years
    case 'PURPLE': monthsAgo = Math.floor(Math.random() * 18) + 12; break; // 1-2.5 years
    case 'BLUE': monthsAgo = Math.floor(Math.random() * 12) + 6; break; // 6 months - 1.5 years
    default: monthsAgo = Math.floor(Math.random() * 8); break; // 0-8 months
  }

  const joinDate = new Date(today);
  joinDate.setMonth(today.getMonth() - monthsAgo);
  return joinDate;
}

async function main() {
  console.log('🚀 Starting complete TJJ data setup...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.attendance.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.class.deleteMany()
  await prisma.memberProgress.deleteMany()
  await prisma.competitionParticipant.deleteMany()
  await prisma.competition.deleteMany()
  await prisma.newsletter.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Existing data cleared')

  // Create admin user
  console.log('👑 Creating admin user...')
  const adminPasswordHash = await bcrypt.hash('password123', 12)
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@tecumseh-jujutsu.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      membershipStatus: 'ACTIVE',
      phone: '519-555-0001',
      beltSize: 'A3'
    }
  })

  // Import all TJJ students
  console.log(`👥 Creating ${tjjStudents.length} TJJ students...`)
  const createdStudents = []

  for (const studentData of tjjStudents) {
    const { firstName, lastName } = parseName(studentData.name)
    const email = generateEmail(studentData.name)
    const role = getRoleFromNotes(studentData.notes)
    const membershipStatus = getMembershipStatus(studentData.notes)
    const joinDate = generateJoinDate(studentData.belt)
    const phoneNumber = generatePhoneNumber()

    console.log(`Creating student: ${firstName} ${lastName} (${studentData.belt} belt)`)

    try {
      const passwordHash = await bcrypt.hash('TJJ2024!', 12)
      const student = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          role,
          membershipStatus,
          phone: phoneNumber,
          emergencyContactName: `${firstName} Emergency Contact`,
          emergencyContactPhone: generatePhoneNumber(),
          membershipStartDate: joinDate,
          lastPaymentDate: membershipStatus === 'ACTIVE' ? new Date() : null,
          paymentStatus: membershipStatus === 'ACTIVE' ? 'CURRENT' : 'OVERDUE',
          medicalConditions: studentData.notes.includes('INJURED') ? 'Currently injured' : null,
          beltSize: studentData.beltSize || 'A2'
        }
      })

      // Create member progress record
      await prisma.memberProgress.create({
        data: {
          userId: student.id,
          beltRank: getBeltRank(studentData.belt),
          stripes: studentData.stripes,
          totalClassesAttended: Math.floor(Math.random() * 200) + 10,
          lastAttendanceDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          promotionDate: studentData.stripes > 0 ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
        }
      })

      createdStudents.push(student)
    } catch (error) {
      console.error(`Failed to create student ${firstName} ${lastName}:`, error.message)
    }
  }

  // Find or create a coach user for classes
  const coachUser = createdStudents.find(s => s.role === 'COACH') ||
    await prisma.user.create({
      data: {
        firstName: 'Head',
        lastName: 'Coach',
        email: 'coach@tecumseh-jujutsu.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'COACH',
        membershipStatus: 'ACTIVE',
        phone: '519-555-0003',
        emergencyContactName: 'Coach Emergency Contact',
        emergencyContactPhone: '519-555-0004',
        membershipStartDate: new Date('2020-06-01'),
        lastPaymentDate: new Date(),
        paymentStatus: 'CURRENT',
        beltSize: 'A3'
      }
    })

  // Create classes
  console.log('📚 Creating classes...')
  const classes = [
    {
      name: 'Adult Training',
      description: 'Brazilian Jiu-Jitsu training for adults',
      dayOfWeek: 1, // Monday
      startTime: '19:00',
      endTime: '20:00',
      maxCapacity: 40,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Adult Training',
      description: 'Brazilian Jiu-Jitsu training for adults',
      dayOfWeek: 2, // Tuesday
      startTime: '19:00',
      endTime: '20:00',
      maxCapacity: 40,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Adult Training',
      description: 'Brazilian Jiu-Jitsu training for adults',
      dayOfWeek: 3, // Wednesday
      startTime: '19:00',
      endTime: '20:00',
      maxCapacity: 40,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Adult Training',
      description: 'Brazilian Jiu-Jitsu training for adults',
      dayOfWeek: 4, // Thursday
      startTime: '19:00',
      endTime: '20:00',
      maxCapacity: 40,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Adult Training',
      description: 'Brazilian Jiu-Jitsu training for adults',
      dayOfWeek: 6, // Saturday
      startTime: '11:00',
      endTime: '12:00',
      maxCapacity: 40,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Morning Classes',
      description: 'Morning Brazilian Jiu-Jitsu training',
      dayOfWeek: 1, // Monday
      startTime: '09:30',
      endTime: '10:30',
      maxCapacity: 30,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Morning Classes',
      description: 'Morning Brazilian Jiu-Jitsu training',
      dayOfWeek: 3, // Wednesday
      startTime: '09:30',
      endTime: '10:30',
      maxCapacity: 30,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Morning Classes',
      description: 'Morning Brazilian Jiu-Jitsu training',
      dayOfWeek: 5, // Friday
      startTime: '09:30',
      endTime: '10:30',
      maxCapacity: 30,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Kids Classes',
      description: 'Brazilian Jiu-Jitsu for children',
      dayOfWeek: 1, // Monday
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 25,
      skillLevel: 'BEGINNER',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Kids Classes',
      description: 'Brazilian Jiu-Jitsu for children',
      dayOfWeek: 2, // Tuesday
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 25,
      skillLevel: 'BEGINNER',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Kids Classes',
      description: 'Brazilian Jiu-Jitsu for children',
      dayOfWeek: 3, // Wednesday
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 25,
      skillLevel: 'BEGINNER',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Kids Classes',
      description: 'Brazilian Jiu-Jitsu for children',
      dayOfWeek: 4, // Thursday
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 25,
      skillLevel: 'BEGINNER',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Kids Classes',
      description: 'Brazilian Jiu-Jitsu for children',
      dayOfWeek: 5, // Friday
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 25,
      skillLevel: 'BEGINNER',
      instructorId: coachUser.id,
      durationMinutes: 60
    },
    {
      name: 'Open Mat',
      description: 'Open training session',
      dayOfWeek: 0, // Sunday
      startTime: '11:00',
      endTime: '12:00',
      maxCapacity: 30,
      skillLevel: 'ALL',
      instructorId: coachUser.id,
      durationMinutes: 60
    }
  ]

  const createdClasses = []
  for (const classData of classes) {
    const createdClass = await prisma.class.create({
      data: classData
    })
    createdClasses.push(createdClass)
  }

  // Create class sessions for the next 4 weeks
  console.log('📅 Creating class sessions...')
  const today = new Date()
  const sessions = []

  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + (week * 7) + day)

      const dayOfWeek = sessionDate.getDay()
      const classesForDay = createdClasses.filter(c => c.dayOfWeek === dayOfWeek)

      for (const classItem of classesForDay) {
        const session = await prisma.classSession.create({
          data: {
            classId: classItem.id,
            sessionDate,
            startTime: classItem.startTime,
            endTime: classItem.endTime,
            instructorId: classItem.instructorId,
            maxCapacity: classItem.maxCapacity,
            status: sessionDate < today ? 'COMPLETED' : 'SCHEDULED',
            currentBookings: 0
          }
        })
        sessions.push(session)
      }
    }
  }

  // Create some bookings for upcoming sessions
  console.log('📝 Creating sample bookings...')
  const upcomingSessions = sessions.filter(s => new Date(s.sessionDate) >= today)
  const activeStudents = createdStudents.filter(s => s.membershipStatus === 'ACTIVE')

  for (const session of upcomingSessions.slice(0, 20)) {
    // Randomly select 8-25 students for each session based on capacity
    const maxBookings = Math.min(session.maxCapacity - 5, activeStudents.length)
    const numBookings = Math.floor(Math.random() * (maxBookings - 8)) + 8
    const selectedStudents = activeStudents
      .sort(() => 0.5 - Math.random())
      .slice(0, numBookings)

    for (const student of selectedStudents) {
      await prisma.booking.create({
        data: {
          userId: student.id,
          classSessionId: session.id,
          bookingStatus: 'BOOKED',
          bookingDate: new Date()
        }
      })
    }
  }

  // Create some attendance records for past sessions
  console.log('✅ Creating attendance records...')
  const pastSessions = sessions.filter(s => new Date(s.sessionDate) < today)

  for (const session of pastSessions.slice(-15)) {
    // Randomly select students who attended
    const maxAttendees = Math.min(session.maxCapacity - 3, activeStudents.length)
    const numAttendees = Math.floor(Math.random() * (maxAttendees - 10)) + 10
    const attendees = activeStudents
      .sort(() => 0.5 - Math.random())
      .slice(0, numAttendees)

    for (const student of attendees) {
      await prisma.attendance.create({
        data: {
          userId: student.id,
          classSessionId: session.id,
          checkInTime: new Date(session.sessionDate),
          attendanceStatus: 'PRESENT'
        }
      })
    }
  }

  console.log('🎉 Setup complete!')
  console.log('\n📊 Summary:')
  console.log(`✅ Created 1 admin user (admin@tecumseh-jujutsu.com)`)
  console.log(`✅ Created ${createdStudents.length} TJJ students from PDF data`)
  console.log(`✅ Created ${createdClasses.length} classes`)
  console.log(`✅ Created ${sessions.length} class sessions`)
  console.log(`✅ Created sample bookings and attendance records`)
  console.log('\n🔐 Login credentials:')
  console.log('Admin: admin@tecumseh-jujutsu.com / password123')
  console.log('Coach: coach@tecumseh-jujutsu.com / password123')
  console.log('TJJ Students: [generated.email]@tjj.com / TJJ2024!')
  console.log('\nExample student logins:')
  console.log('- andrew.archibald@tjj.com / TJJ2024! (Black Belt)')
  console.log('- parteek.bindra@tjj.com / TJJ2024! (Blue Belt)')
  console.log('- mark.curran@tjj.com / TJJ2024! (Coach)')
  console.log('\n🚀 Your iDoze system is ready with real TJJ data!')
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })