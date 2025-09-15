import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Test auth session:', session)

    return NextResponse.json({
      authenticated: !!session?.user,
      user: session?.user || null,
      debug: 'Test auth endpoint'
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error', debug: error },
      { status: 500 }
    )
  }
}