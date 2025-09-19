import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import { authOptions } from './auth-config'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

export async function requireRole(role: 'ADMIN' | 'COACH') {
  const user = await requireAuth()
  if (user.role !== role && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return user
}

export async function getUserProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      membershipStatus: true,
      membershipStartDate: true,
      membershipEndDate: true,
      lastPaymentDate: true,
      nextPaymentDue: true,
      paymentStatus: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      medicalConditions: true,
      isOnBench: true,
      benchReason: true,
      benchStartDate: true,
      benchEndDate: true,
      createdAt: true,
    }
  })
}