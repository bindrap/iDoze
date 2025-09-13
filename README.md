# iDoze - Tecumseh Jujutsu Management System

A comprehensive web application for managing jiu jitsu gym operations including class booking, attendance tracking, member management, and analytics.

## Features

- **User Management**: Add, edit, and delete members with role-based access control
- **Class Management**: Create and manage classes with 40-spot capacity tracking
- **Booking System**: Members can book classes with real-time availability
- **Attendance Tracking**: Check-in system with automatic progress tracking
- **Analytics Dashboard**: Comprehensive insights for business owners
- **Newsletter System**: Publish updates and announcements
- **Bench Mark System**: Track member unavailability due to injury/vacation
- **Automated Notifications**: Email/SMS alerts for missed classes

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: Radix UI, Lucide React icons

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd iDoze
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration:
   - Update `NEXTAUTH_SECRET` with a secure random string
   - Configure SMTP settings for email notifications
   - Adjust app configuration values as needed

4. **Initialize the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Seed initial data**
   ```bash
   node scripts/seed.js
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Default Users

After seeding, you can log in with these accounts:

**Admin Account:**
- Email: admin@tecumseh-jujutsu.com
- Password: admin123

**Coach Account:**
- Email: coach@tecumseh-jujutsu.com
- Password: coach123

**Member Account:**
- Email: member@tecumseh-jujutsu.com
- Password: member123

## Key Features Breakdown

### 1. Member Dashboard
- View upcoming bookings and recent attendance
- Browse and book available classes
- Track personal progress and belt rank
- Update profile and emergency contacts

### 2. Coach Dashboard
- All member features plus:
- Check-in members to classes
- View class utilization analytics
- Manage class sessions

### 3. Admin Dashboard
- Full system access including:
- Member management (CRUD operations)
- Class and session management
- System analytics and reports
- Newsletter publishing

### 4. Analytics & Reporting
- Class utilization rates (targeting 50% average)
- Member attendance patterns
- Peak hours analysis
- Member progress tracking

### 5. Automated Systems
- Missed class notifications after 14 days
- Booking deadline enforcement (2 hours before class)
- Cancellation deadline management (4 hours before class)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Users
- `GET /api/users` - List users (with pagination/search)
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Classes & Sessions
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `GET /api/class-sessions` - List class sessions
- `POST /api/class-sessions` - Create class session

### Bookings & Attendance
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Book a class
- `PUT /api/bookings` - Update booking (cancel/check-in)
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Check-in to class

### Analytics
- `GET /api/analytics?type=overview` - System overview
- `GET /api/analytics?type=attendance` - Attendance analytics
- `GET /api/analytics?type=utilization` - Utilization metrics
- `GET /api/analytics?type=members` - Member analytics

## Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: Members, coaches, and administrators
- **Classes**: Recurring class definitions
- **ClassSessions**: Specific instances of classes
- **Bookings**: Member reservations for class sessions
- **Attendance**: Check-in records for completed classes
- **MemberProgress**: Belt ranks and attendance tracking
- **Newsletters**: System announcements
- **Notifications**: Automated alerts
- **Settings**: System configuration

## Security Features

- Role-based access control (Member/Coach/Admin)
- Secure password hashing with bcrypt
- JWT-based session management
- API route protection with middleware
- Input validation with Zod schemas

## Deployment

For production deployment:

1. Use a production database (PostgreSQL recommended)
2. Update the `DATABASE_URL` in your environment
3. Set `NEXTAUTH_SECRET` to a secure random string
4. Configure proper SMTP settings for notifications
5. Deploy to your preferred platform (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software developed for Tecumseh Jujutsu.

## Support

For technical support or questions, contact the development team.# iDoze
