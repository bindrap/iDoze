// Test coach authentication specifically
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testCoachAuth() {
  console.log('🔍 Testing COACH authentication specifically...')

  try {
    // Test user lookup for coach
    console.log('👤 Looking up coach user...')
    const user = await prisma.user.findUnique({
      where: {
        email: 'coach@tecumseh-jujutsu.com'
      }
    })

    if (!user) {
      console.log('❌ Coach user not found!')
      return
    }

    console.log('✅ Coach user found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      passwordHashLength: user.passwordHash.length
    })

    // Test password verification
    console.log('🔑 Testing password verification for coach...')
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, user.passwordHash)

    console.log(`Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    if (isValid) {
      console.log('🎉 Coach authentication should work!')
    } else {
      console.log('❌ Coach authentication will fail')
      console.log('Password hash:', user.passwordHash)
    }

  } catch (error) {
    console.error('❌ Error during coach auth test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCoachAuth()