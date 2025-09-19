// Simple authentication test script
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🔍 Testing authentication flow...')

  try {
    // Test database connection
    console.log('📊 Testing database connection...')
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected. Total users: ${userCount}`)

    // Test user lookup
    console.log('👤 Looking up admin user...')
    const user = await prisma.user.findUnique({
      where: {
        email: 'admin@tecumseh-jujutsu.com'
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    })

    // Test password verification
    console.log('🔑 Testing password verification...')
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, user.passwordHash)

    console.log(`Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`)

    if (isValid) {
      console.log('🎉 Authentication should work!')
      console.log('📝 User object that would be returned:')
      console.log({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        membershipStatus: user.membershipStatus,
      })
    }

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()