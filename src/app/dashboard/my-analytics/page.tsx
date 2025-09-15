'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Target,
  Activity,
  Users
} from 'lucide-react'

type MemberAnalytics = {
  totalClassesAttended: number
  thisMonthAttendance: number
  lastMonthAttendance: number
  averageClassesPerWeek: number
  favoriteClassTypes: Array<{ className: string; count: number }>
  attendanceStreak: number
  longestStreak: number
  recentAttendance: Array<{
    date: string
    className: string
    dayOfWeek: string
  }>
  monthlyTrend: Array<{ month: string; count: number }>
  attendanceByDayOfWeek: Array<{ day: string; count: number }>
  memberSince: string
  currentBelt?: string
  stripes: number
  nextGoal?: string
}

export default function MyAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<MemberAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session.user?.id) {
      fetchAnalytics()
    }
  }, [status, router, session])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/members/${session?.user?.id}/analytics`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="container mx-auto py-8 px-4">Loading your analytics...</div>
  if (error) return <div className="container mx-auto py-8 px-4 text-red-600">{error}</div>
  if (!analytics) return <div className="container mx-auto py-8 px-4">No analytics data available</div>

  const attendanceChange = analytics.lastMonthAttendance > 0
    ? ((analytics.thisMonthAttendance - analytics.lastMonthAttendance) / analytics.lastMonthAttendance) * 100
    : 0

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Training Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress, consistency, and achievements
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClassesAttended}</div>
            <p className="text-xs text-muted-foreground">Since joining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonthAttendance}</div>
            <div className="flex items-center gap-1 text-xs">
              {attendanceChange > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : attendanceChange < 0 ? (
                <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />
              ) : null}
              <span className={attendanceChange > 0 ? 'text-green-600' : attendanceChange < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                {attendanceChange > 0 ? '+' : ''}{attendanceChange.toFixed(0)}% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.attendanceStreak}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.attendanceStreak === 1 ? 'day' : 'days'} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Weekly Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageClassesPerWeek.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">classes per week</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Achievements */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Belt Rank</label>
              <p className="text-lg font-semibold text-blue-600">
                {analytics.currentBelt || 'White Belt'}
                {analytics.stripes > 0 && (
                  <span className="text-sm ml-2">
                    {analytics.stripes} stripe{analytics.stripes > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="font-medium">{formatDate(analytics.memberSince)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Longest Streak</label>
              <p className="font-medium">{analytics.longestStreak} days</p>
            </div>

            {analytics.nextGoal && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Next Goal</label>
                <p className="font-medium text-green-600">{analytics.nextGoal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Favorite Classes</CardTitle>
            <CardDescription>Classes you attend most often</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.favoriteClassTypes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No class data available yet
                </p>
              ) : (
                analytics.favoriteClassTypes.slice(0, 5).map((classType, index) => {
                  const maxCount = analytics.favoriteClassTypes[0]?.count || 1
                  const percentage = (classType.count / maxCount) * 100

                  return (
                    <div key={classType.className} className="flex items-center gap-3">
                      <div className="w-4 text-sm text-muted-foreground">#{index + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{classType.className}</span>
                          <span className="text-sm text-muted-foreground">{classType.count}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Patterns */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Pattern</CardTitle>
            <CardDescription>Which days you train most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayNames.map((day) => {
                const dayData = analytics.attendanceByDayOfWeek.find(d => d.day === day)
                const count = dayData?.count || 0
                const maxCount = Math.max(...analytics.attendanceByDayOfWeek.map(d => d.count), 1)
                const percentage = (count / maxCount) * 100

                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-right">{day}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm text-left">{count}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Your attendance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.monthlyTrend.slice(-6).map((month) => {
                const maxCount = Math.max(...analytics.monthlyTrend.map(m => m.count), 1)
                const percentage = (month.count / maxCount) * 100

                return (
                  <div key={month.month} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-right">{month.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-sm text-left">{month.count}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your last 10 training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentAttendance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentAttendance.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.className}</p>
                    <p className="text-sm text-muted-foreground">{session.dayOfWeek}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatDate(session.date)}</p>
                    <Badge variant="outline" className="text-xs">
                      Attended
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}