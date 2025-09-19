import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  userId: z.string(),
  amount: z.number().default(125.00),
  paymentMethod: z.enum(['E_TRANSFER', 'CASH', 'CARD']).default('E_TRANSFER'),
  paymentDate: z.string().optional(),
  transactionId: z.string().optional(),
  forMonth: z.string().optional(),
  action: z.enum(['record_payment', 'mark_paid', 'mark_overdue']).optional(),
  status: z.enum(['CURRENT', 'OVERDUE']).optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get payments for specific user
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { paymentDate: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      return NextResponse.json({ payments })
    } else {
      // Get all payments
      const payments = await prisma.payment.findMany({
        orderBy: { paymentDate: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      return NextResponse.json({ payments })
    }
  } catch (error) {
    console.error('Payment GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = recordPaymentSchema.parse(body)

    // Handle different actions
    if (data.action === 'mark_paid' || data.action === 'mark_overdue') {
      // Simple status update without creating payment record
      const updateData: any = {
        paymentStatus: data.status || (data.action === 'mark_paid' ? 'CURRENT' : 'OVERDUE')
      }

      if (data.action === 'mark_paid') {
        const now = new Date()
        const nextPaymentDue = new Date(now)
        nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1)

        updateData.lastPaymentDate = now
        updateData.nextPaymentDue = nextPaymentDue
      }

      const updatedUser = await prisma.user.update({
        where: { id: data.userId },
        data: updateData
      })

      return NextResponse.json({
        message: `Payment status updated to ${updateData.paymentStatus}`,
        user: updatedUser
      }, { status: 200 })
    }

    // Original payment recording logic
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
    const forMonth = data.forMonth ? new Date(data.forMonth) : new Date()

    // Record the payment
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        paymentDate,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        forMonth,
        processedById: session.user.id
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Update user's payment status
    const nextPaymentDue = new Date(paymentDate)
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1)

    await prisma.user.update({
      where: { id: data.userId },
      data: {
        lastPaymentDate: paymentDate,
        nextPaymentDue,
        paymentStatus: 'CURRENT'
      }
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Payment POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}