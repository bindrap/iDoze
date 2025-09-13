import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            iDoze
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Tecumseh Jujutsu Management System
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Streamline your gym operations with our comprehensive booking, attendance tracking,
            and member management platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-blue-600">Class Management</CardTitle>
              <CardDescription>
                Schedule and manage classes with 40-spot capacity tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Real-time attendance tracking</li>
                <li>• 50% utilization monitoring</li>
                <li>• Automated class scheduling</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-green-600">Member Portal</CardTitle>
              <CardDescription>
                Complete member experience with booking and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Class booking and check-in</li>
                <li>• Newsletter access</li>
                <li>• Vacation/sickness updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-purple-600">Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive insights for business owners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Class utilization rates</li>
                <li>• Member progress tracking</li>
                <li>• Automated notifications</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-x-4">
          <Link href="/auth/signin">
            <Button size="lg" className="px-8 py-3">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg" className="px-8 py-3">
              Join Today
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}