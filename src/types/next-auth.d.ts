import NextAuth from 'next-auth'
import { Role, MembershipStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      membershipStatus: MembershipStatus
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: Role
    membershipStatus: MembershipStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    membershipStatus: MembershipStatus
  }
}