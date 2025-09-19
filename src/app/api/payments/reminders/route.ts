import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'COACH')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        paymentStatus: true,
        nextPaymentDue: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send payment reminder email
    const subject = 'Payment Reminder - Tecumseh Jiu Jitsu'
    const emailBody = `
Dear ${user.firstName} ${user.lastName},

This is a friendly reminder that your monthly membership payment is ${user.paymentStatus === 'OVERDUE' ? 'overdue' : 'due soon'}.

Payment Details:
- Amount: $125.00 CAD
- Due Date: ${user.nextPaymentDue ? new Date(user.nextPaymentDue).toLocaleDateString() : 'N/A'}
- Payment Method: E-Transfer to tecumseh-jiujitsu@gmail.com

Please send your payment as soon as possible to continue enjoying your membership benefits.

If you have already sent your payment, please ignore this reminder.

For any questions, please reply to this email or contact us directly.

Thank you,
Tecumseh Jiu Jitsu Team
    `.trim()

    try {
      await sendEmail({
        to: user.email,
        subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>')
      })

      // Log the notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_REMINDER',
          title: 'Payment Reminder Sent',
          message: `Payment reminder email sent to ${user.email}`,
          deliveryMethod: 'EMAIL',
          sentTime: new Date(),
          status: 'SENT'
        }
      })

      return NextResponse.json({
        message: 'Payment reminder sent successfully',
        recipient: `${user.firstName} ${user.lastName} (${user.email})`
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)

      // Log the failed notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_REMINDER',
          title: 'Payment Reminder Failed',
          message: `Failed to send payment reminder to ${user.email}: ${emailError}`,
          deliveryMethod: 'EMAIL',
          status: 'FAILED'
        }
      })

      return NextResponse.json({
        error: 'Failed to send email reminder',
        details: 'Email service unavailable'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Payment reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Endpoint to send reminders to all overdue members
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'send-all-overdue') {
      // Get all overdue members
      const overdueUsers = await prisma.user.findMany({
        where: {
          role: 'MEMBER',
          paymentStatus: 'OVERDUE',
          membershipStatus: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          nextPaymentDue: true
        }
      })

      const results = []

      for (const user of overdueUsers) {
        try {
          const subject = 'Payment Overdue - Tecumseh Jiu Jitsu'
          const emailBody = `
Dear ${user.firstName} ${user.lastName},

Your monthly membership payment is now overdue.

Payment Details:
- Amount: $125.00 CAD
- Due Date: ${user.nextPaymentDue ? new Date(user.nextPaymentDue).toLocaleDateString() : 'N/A'}
- Payment Method: E-Transfer to tecumseh-jiujitsu@gmail.com

Please send your payment immediately to avoid suspension of your membership.

If you have already sent your payment, please ignore this reminder.

For any questions, please reply to this email or contact us directly.

Thank you,
Tecumseh Jiu Jitsu Team
          `.trim()

          await sendEmail({
            to: user.email,
            subject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>')
          })

          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'PAYMENT_OVERDUE',
              title: 'Overdue Payment Reminder Sent',
              message: `Overdue payment reminder sent to ${user.email}`,
              deliveryMethod: 'EMAIL',
              sentTime: new Date(),
              status: 'SENT'
            }
          })

          results.push({
            userId: user.id,
            email: user.email,
            status: 'sent'
          })
        } catch (error) {
          results.push({
            userId: user.id,
            email: user.email,
            status: 'failed',
            error: error.message
          })
        }
      }

      return NextResponse.json({
        message: `Sent overdue reminders to ${results.filter(r => r.status === 'sent').length} members`,
        results
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Bulk reminder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}