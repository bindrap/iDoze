'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function MembersRedirect() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Redirect based on user role
    if (session.user?.role === 'ADMIN') {
      router.push('/dashboard/admin/members')
    } else {
      // For non-admin users, redirect to dashboard
      router.push('/dashboard')
    }
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Redirecting...</h2>
        <p className="text-gray-600 mt-2">Taking you to the right page</p>
      </div>
    </div>
  )
}