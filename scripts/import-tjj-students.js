const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// TJJ Student data from the PDF
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

async function importStudents() {
  console.log('Starting TJJ student import...');

  // Clear existing test students first
  console.log('Clearing existing students...');
  await prisma.memberProgress.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@tjj.com'
      }
    }
  });

  console.log(`Importing ${tjjStudents.length} students...`);

  for (const studentData of tjjStudents) {
    const { firstName, lastName } = parseName(studentData.name);
    const email = generateEmail(studentData.name);
    const passwordHash = await bcrypt.hash('TJJ2024!', 12); // Default password

    console.log(`Creating student: ${firstName} ${lastName}`);

    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: getRoleFromNotes(studentData.notes),
          membershipStatus: getMembershipStatus(studentData.notes),
          membershipStartDate: new Date('2024-01-01'), // Default start date
          medicalConditions: studentData.notes || null,
        }
      });

      // Create member progress
      await prisma.memberProgress.create({
        data: {
          userId: user.id,
          beltRank: getBeltRank(studentData.belt),
          stripes: studentData.stripes,
          totalClassesAttended: 0,
          notes: `${studentData.notes || ''} | Belt Size: ${studentData.beltSize || 'Not specified'}`
        }
      });

    } catch (error) {
      console.error(`Failed to create student ${firstName} ${lastName}:`, error.message);
    }
  }

  console.log('Import completed!');
}

async function main() {
  try {
    await importStudents();
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();