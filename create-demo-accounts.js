const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDemoAccounts() {
  console.log('Creating demo accounts...')

  const password = 'password123'
  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    // Create admin user
    await prisma.user.upsert({
      where: { email: 'admin@tecumseh-jujutsu.com' },
      update: {},
      create: {
        email: 'admin@tecumseh-jujutsu.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        membershipStatus: 'ACTIVE',
        paymentStatus: 'CURRENT'
      }
    })
    console.log('✓ Admin account created')

    // Create coach user
    await prisma.user.upsert({
      where: { email: 'coach@tecumseh-jujutsu.com' },
      update: {},
      create: {
        email: 'coach@tecumseh-jujutsu.com',
        passwordHash: hashedPassword,
        firstName: 'Coach',
        lastName: 'User',
        role: 'COACH',
        membershipStatus: 'ACTIVE',
        paymentStatus: 'CURRENT'
      }
    })
    console.log('✓ Coach account created')

    // Create member user
    await prisma.user.upsert({
      where: { email: 'member@tecumseh-jujutsu.com' },
      update: {},
      create: {
        email: 'member@tecumseh-jujutsu.com',
        passwordHash: hashedPassword,
        firstName: 'Member',
        lastName: 'User',
        role: 'MEMBER',
        membershipStatus: 'ACTIVE',
        paymentStatus: 'CURRENT'
      }
    })
    console.log('✓ Member account created')

    console.log('\n🎉 Demo accounts created successfully!')
    console.log('\n📧 Login credentials:')
    console.log('Admin: admin@tecumseh-jujutsu.com / password123')
    console.log('Coach: coach@tecumseh-jujutsu.com / password123')
    console.log('Member: member@tecumseh-jujutsu.com / password123')
  } catch (error) {
    console.error('Error creating demo accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoAccounts();