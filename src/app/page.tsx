import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-6 mb-6">
            <Image
              src="/images/djj.png"
              alt="Detroit Jiu Jitsu"
              width={80}
              height={80}
              className="rounded"
            />
            <Image
              src="/images/tjj.png"
              alt="Tecumseh Jiu Jitsu"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Detroit & Tecumseh Jiu Jitsu
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Professional Academy Management System
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Streamline your academy operations with our comprehensive booking, attendance tracking,
            and member management platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-xl transition-shadow bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-blue-400">Class Management</CardTitle>
              <CardDescription className="text-gray-400">
                Schedule and manage classes with capacity tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Real-time attendance tracking</li>
                <li>• Capacity utilization monitoring</li>
                <li>• Automated class scheduling</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-green-400">Member Portal</CardTitle>
              <CardDescription className="text-gray-400">
                Complete member experience with booking and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Class booking and check-in</li>
                <li>• Personal analytics dashboard</li>
                <li>• Belt rank progression tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-purple-400">Coach Dashboard</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive insights for instructors and owners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Student progress tracking</li>
                <li>• Promotion management</li>
                <li>• Academy analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-x-4">
          <Link href="/auth/signin">
            <Button size="lg" className="px-8 py-3 bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg" className="px-8 py-3 border-gray-600 text-gray-300 hover:bg-gray-800">
              Join Academy
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}