import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const newsletterSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  targetAudience: z.enum(['ALL', 'MEMBERS', 'COACHES', 'ADMINS']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']),
  isPublished: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const published = searchParams.get('published')

    let whereClause: any = {}

    if (published === 'true') {
      whereClause.isPublished = true
    } else if (published === 'false') {
      whereClause.isPublished = false
    }

    const newsletters = await prisma.newsletter.findMany({
      where: whereClause,
      orderBy: {
        publishDate: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const total = await prisma.newsletter.count({
      where: whereClause
    })

    return NextResponse.json({
      newsletters,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching newsletters:', error)
    return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (user.role !== 'ADMIN' && user.role !== 'COACH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = newsletterSchema.parse(body)

    const newsletter = await prisma.newsletter.create({
      data: {
        ...validatedData,
        publishDate: validatedData.isPublished ? new Date() : new Date(),
        authorId: user.id
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(newsletter, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating newsletter:', error)
    return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 })
  }
}