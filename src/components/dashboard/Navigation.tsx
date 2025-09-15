'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Clock,
  UserCheck,
  Newspaper,
  Shield,
  Trophy,
  GraduationCap
} from 'lucide-react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  role: string
  membershipStatus: string
}

interface NavigationProps {
  user: User
}

export default function Navigation({ user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const memberNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/classes', label: 'Classes', icon: Calendar },
    { href: '/dashboard/bookings', label: 'My Bookings', icon: BookOpen },
    { href: '/dashboard/attendance', label: 'Attendance', icon: UserCheck },
    { href: '/dashboard/competitions', label: 'Competitions', icon: Trophy },
    { href: '/dashboard/newsletters', label: 'Newsletters', icon: Newspaper },
    { href: '/dashboard/profile', label: 'Profile', icon: Settings },
  ]

  const coachNavItems = [
    ...memberNavItems.slice(0, -1), // Remove profile for coaches, they get it separately
    { href: '/dashboard/students', label: 'Students', icon: GraduationCap },
    { href: '/dashboard/check-in', label: 'Check-in', icon: Clock },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/profile', label: 'Profile', icon: Settings },
  ]

  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/classes', label: 'Classes', icon: Calendar },
    { href: '/dashboard/members', label: 'Members', icon: Users },
    { href: '/dashboard/students', label: 'Students', icon: GraduationCap },
    { href: '/dashboard/competitions', label: 'Competitions', icon: Trophy },
    { href: '/dashboard/check-in', label: 'Check-in', icon: Clock },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/newsletters', label: 'Newsletters', icon: Newspaper },
    { href: '/admin', label: 'Admin', icon: Shield },
    { href: '/dashboard/profile', label: 'Profile', icon: Settings },
  ]

  const getNavItems = () => {
    switch (user.role) {
      case 'ADMIN':
        return adminNavItems
      case 'COACH':
        return coachNavItems
      default:
        return memberNavItems
    }
  }

  const navItems = getNavItems()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              iDoze
            </Link>
            <div className="hidden md:flex ml-8 space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm text-gray-600">
              {user.name || user.email}
              <span className={cn(
                "ml-2 px-2 py-1 text-xs rounded-full",
                user.role === 'ADMIN' ? "bg-red-100 text-red-800" :
                user.role === 'COACH' ? "bg-blue-100 text-blue-800" :
                "bg-green-100 text-green-800"
              )}>
                {user.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-4 py-3 space-y-1">
            <div className="pb-3 mb-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
              <p className="text-xs text-gray-600">{user.role}</p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start mt-4"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </>
  )
}