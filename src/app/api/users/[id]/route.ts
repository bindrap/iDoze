import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['MEMBER', 'COACH', 'ADMIN']).optional(),
  membershipStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  membershipStartDate: z.string().optional(),
  membershipEndDate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalConditions: z.string().optional(),
  isOnBench: z.boolean().optional(),
  benchReason: z.string().optional(),
  benchStartDate: z.string().optional(),
  benchEndDate: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user, memberProgress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: params.id },
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
          emergencyContactName: true,
          emergencyContactPhone: true,
          medicalConditions: true,
          isOnBench: true,
          benchReason: true,
          benchStartDate: true,
          benchEndDate: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.memberProgress.findFirst({
        where: { userId: params.id },
        include: {
          promotedBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user can access this profile
    if (session.user.id !== params.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ user, memberProgress })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can update this profile
    if (session.user.id !== params.id && session.user.role !== 'ADMIN' && session.user.role !== 'COACH') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If updating email, check if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = { ...data }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12)
      delete updateData.password
    }

    if (data.membershipStartDate) {
      updateData.membershipStartDate = new Date(data.membershipStartDate)
    }

    if (data.membershipEndDate) {
      updateData.membershipEndDate = new Date(data.membershipEndDate)
    }

    if (data.benchStartDate) {
      updateData.benchStartDate = new Date(data.benchStartDate)
    }

    if (data.benchEndDate) {
      updateData.benchEndDate = new Date(data.benchEndDate)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
        emergencyContactName: true,
        emergencyContactPhone: true,
        medicalConditions: true,
        isOnBench: true,
        benchReason: true,
        benchStartDate: true,
        benchEndDate: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}