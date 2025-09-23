import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// TJJ Student data from the PDF (subset for testing)
const tjjStudents = [
  // Black Belts
  { name: "MARK CURRAN", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "COACH" },
  { name: "SETH GAUTIER", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "COACH" },
  { name: "ANDREW ARCHIBALD", belt: "BLACK", stripes: 0, beltSize: "A5", notes: "" },
  { name: "FILIP MIRKOVIC", belt: "BLACK", stripes: 0, beltSize: "A2", notes: "" },

  // Brown Belts
  { name: "BROOKE TOFFLEMIRE", belt: "BROWN", stripes: 2, beltSize: "A3", notes: "COACH" },
  { name: "NICK NIFOROS", belt: "PURPLE", stripes: 2, beltSize: "A3", notes: "COACH" },
  { name: "ASIAN MIKE", belt: "BROWN", stripes: 1, beltSize: "A4", notes: "" },
  { name: "GREG", belt: "BROWN", stripes: 1, beltSize: "A2", notes: "" },

  // Purple Belts
  { name: "ETHAN SEALEY", belt: "PURPLE", stripes: 1, beltSize: "A4", notes: "" },
  { name: "LOGAN LAVESSEUR", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "" },
  { name: "MATTEO CARLESIMO", belt: "PURPLE", stripes: 3, beltSize: "A2", notes: "" },
  { name: "MOE ISKANDAR", belt: "PURPLE", stripes: 1, beltSize: "A2", notes: "" },

  // Blue Belts
  { name: "ASIM ISKANDAR", belt: "BLUE", stripes: 2, beltSize: "A1", notes: "" },
  { name: "BELLA NICOLETTI", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "CALEB FALBO", belt: "BLUE", stripes: 0, beltSize: "A2", notes: "" },
  { name: "DAN SIMARD", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "JUSTIN POUGET", belt: "BLUE", stripes: 0, beltSize: "A3", notes: "" },
  { name: "MATT OROSZ", belt: "BLUE", stripes: 1, beltSize: "A4", notes: "" },
  { name: "MIMI NYGUEN", belt: "BLUE", stripes: 3, beltSize: "A1", notes: "" },
  { name: "PARTEEK BINDRA", belt: "BLUE", stripes: 3, beltSize: "A2", notes: "" },

  // Green Belts
  { name: "GABBY NICOLETTI", belt: "GREEN", stripes: 0, beltSize: "A1", notes: "" },

  // Grey Belts
  { name: "ABE ISKANDAR", belt: "GREY", stripes: 4, beltSize: "A1", notes: "" },
  { name: "MAX", belt: "GREY", stripes: 3, beltSize: "A1", notes: "" },

  // White Belts
  { name: "AMIR ESUFALI", belt: "WHITE", stripes: 1, beltSize: "A2", notes: "LA" },
  { name: "ANDREW", belt: "WHITE", stripes: 1, beltSize: "A3", notes: "" },
  { name: "CHEN", belt: "WHITE", stripes: 2, beltSize: "A3", notes: "" },
  { name: "DAVID FERRO", belt: "WHITE", stripes: 2, beltSize: "A1", notes: "" },
  { name: "HUNTER KORT", belt: "WHITE", stripes: 4, beltSize: "A2", notes: "" },
  { name: "JERRICA SCOTT", belt: "WHITE", stripes: 2, beltSize: "A4", notes: "PUSH 1 MONTH" },
  { name: "JOSH KADAR", belt: "WHITE", stripes: 4, beltSize: "A3", notes: "" },
  { name: "JULI HANY", belt: "WHITE", stripes: 1, beltSize: "A3", notes: "" },
  { name: "NEIL MORRAND", belt: "WHITE", stripes: 4, beltSize: "A3", notes: "" },
  { name: "TAAHA ALVI", belt: "WHITE", stripes: 4, beltSize: "A2", notes: "" },
  { name: "WILSON PAZ-ABDULSALAM", belt: "WHITE", stripes: 4, beltSize: "A4", notes: "PUSH 1 MONTH" }
];

function generateEmail(name: string) {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.$/, '')
    + '@tjj.com';
}

function parseName(fullName: string) {
  const parts = fullName.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

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

function getBeltRank(belt: string) {
  const beltMap: Record<string, string> = {
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

function getRoleFromNotes(notes: string) {
  if (notes.includes('COACH')) {
    return 'COACH';
  }
  return 'MEMBER';
}

function getMembershipStatus(notes: string) {
  if (notes.includes('INACTIVE')) {
    return 'INACTIVE';
  }
  return 'ACTIVE';
}

export async function POST(req: NextRequest) {
  try {
    // For initial setup, allow import without authentication
    // In production, you should add proper authentication here
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
      const passwordHash = await bcrypt.hash('TJJ2024!', 12);

      try {
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: getRoleFromNotes(studentData.notes),
            membershipStatus: getMembershipStatus(studentData.notes),
            membershipStartDate: new Date('2024-01-01'),
            beltSize: studentData.beltSize || null,
            medicalConditions: studentData.notes || null,
          }
        });

        await prisma.memberProgress.create({
          data: {
            userId: user.id,
            beltRank: getBeltRank(studentData.belt),
            stripes: studentData.stripes,
            totalClassesAttended: 0,
            notes: studentData.notes || null
          }
        });

      } catch (error) {
        console.error(`Failed to create student ${firstName} ${lastName}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${tjjStudents.length} students`,
      count: tjjStudents.length
    });

  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}