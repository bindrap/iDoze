'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatTime } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, User } from 'lucide-react'
import { BookClassButton } from './BookClassButton'

interface Class {
  id: string
  name: string
  description: string
  startTime: string
  endTime: string
  maxCapacity: number
  skillLevel: string
  instructor: {
    firstName: string
    lastName: string
  }
  sessions: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    _count: {
      bookings: number
    }
  }[]
}

interface DayClasses {
  date: Date
  classes: Class[]
}

export function ClassesCalendar() {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [weekClasses, setWeekClasses] = useState<DayClasses[]>([])
  const [selectedDay, setSelectedDay] = useState<DayClasses | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    start.setHours(0, 0, 0, 0)
    return start
  }

  // Generate week dates
  const getWeekDates = (weekStart: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return date
    })
  }

  const fetchWeekClasses = async () => {
    setLoading(true)
    try {
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      console.log('Fetching classes for:', weekStart.toISOString(), 'to', weekEnd.toISOString())

      const response = await fetch(`/api/classes/week?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const classes = await response.json()
        console.log('API Response:', classes)

        // Group classes by day
        const weekDates = getWeekDates(weekStart)
        console.log('Week dates:', weekDates)

        const groupedClasses = weekDates.map(date => {
          const dayClasses = classes.filter((cls: Class) => {
            // Check if class has a session on this date
            const hasSessionOnDate = cls.sessions.some(session => {
              const sessionDate = new Date(session.sessionDate)
              return sessionDate.toDateString() === date.toDateString()
            })

            if (hasSessionOnDate) {
              console.log(`Session match: ${cls.name} on ${date.toDateString()}`)
              return true
            }

            // Check if class dayOfWeek matches this date (for classes without sessions yet)
            const dayOfWeek = date.getDay()
            if (cls.dayOfWeek === dayOfWeek && cls.sessions.length === 0) {
              console.log(`Day match: ${cls.name} on ${date.toDateString()} (dayOfWeek: ${dayOfWeek})`)
              return true
            }

            return false
          })
          console.log(`${date.toDateString()}: ${dayClasses.length} classes`)
          return {
            date,
            classes: dayClasses
          }
        })

        console.log('Grouped classes:', groupedClasses)
        setWeekClasses(groupedClasses)
      } else {
        console.error('API Error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeekClasses()
  }, [currentWeek])

  const handlePreviousWeek = () => {
    const prevWeek = new Date(currentWeek)
    prevWeek.setDate(currentWeek.getDate() - 7)
    setCurrentWeek(prevWeek)
  }

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeek)
    nextWeek.setDate(currentWeek.getDate() + 7)
    setCurrentWeek(nextWeek)
  }

  const handleDayClick = (dayData: DayClasses) => {
    if (dayData.classes.length > 0) {
      setSelectedDay(dayData)
      setIsModalOpen(true)
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handlePreviousWeek}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous Week
        </Button>

        <h2 className="text-xl font-semibold">
          {getWeekStart(currentWeek).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })} - {getWeekDates(getWeekStart(currentWeek))[6].toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </h2>

        <Button variant="outline" onClick={handleNextWeek}>
          Next Week
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekClasses.map((dayData, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              dayData.classes.length === 0 ? 'opacity-50' : 'hover:bg-gray-50'
            } ${
              isToday(dayData.date) ? 'ring-2 ring-blue-500' : ''
            } ${
              isPast(dayData.date) ? 'bg-gray-100' : ''
            }`}
            onClick={() => handleDayClick(dayData)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-center">
                {dayNames[dayData.date.getDay()]}
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                {dayData.date.getDate()}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {dayData.classes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No classes</p>
                ) : (
                  <>
                    <p className="text-xs font-medium text-center">
                      {dayData.classes.length} class{dayData.classes.length > 1 ? 'es' : ''}
                    </p>
                    <div className="space-y-1">
                      {dayData.classes.slice(0, 2).map((cls) => (
                        <div key={cls.id} className="text-xs p-1 bg-blue-50 rounded text-center">
                          {cls.name.replace(/Adult |Kids /, '').replace(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/, '').trim()}
                        </div>
                      ))}
                      {dayData.classes.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{dayData.classes.length - 2} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Day Classes Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDay && dayNames[selectedDay.date.getDay()]}, {selectedDay?.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </DialogTitle>
            <DialogDescription>
              Available classes for this day
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDay?.classes.map((classItem) => {
              // Find session for this day
              const session = classItem.sessions.find(s => {
                const sessionDate = new Date(s.sessionDate)
                return sessionDate.toDateString() === selectedDay.date.toDateString()
              })

              // For classes without sessions, use the class schedule info
              const startTime = session ? session.startTime : classItem.startTime || '00:00'
              const endTime = session ? session.endTime : classItem.endTime || '01:00'
              const availableSpots = session ? classItem.maxCapacity - session._count.bookings : classItem.maxCapacity

              return (
                <Card key={classItem.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{classItem.name}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {classItem.instructor.firstName} {classItem.instructor.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(startTime)} - {formatTime(endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {availableSpots} spots available
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          classItem.skillLevel === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                          classItem.skillLevel === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                          classItem.skillLevel === 'ADVANCED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {classItem.skillLevel}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {classItem.description && (
                      <p className="text-muted-foreground mb-4">{classItem.description}</p>
                    )}

                    <div className="flex justify-end">
                      {session ? (
                        <BookClassButton
                          sessionId={session.id}
                          availableSpots={availableSpots}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Session not yet scheduled
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}