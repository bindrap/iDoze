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

4. **Install missing dependencies**
   ```bash
   npm install tailwindcss-animate
   ```

5. **Initialize the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Seed initial data** (optional)
   ```bash
   node scripts/seed.js
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:3000`

## Quick Start (TL;DR)

```bash
# Clone and setup
git clone <your-repo-url>
cd iDoze

# Install dependencies
npm install
npm install tailwindcss-animate

# Setup environment
cp .env.example .env

# Initialize database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

Then open http://localhost:3000 in your browser.

## Default Users & Test Data

After seeding, you can log in with these accounts:

**Admin Account** (Full system access):
- Email: `admin@tecumseh-jujutsu.com`
- Password: `admin123`

**Coach Account** (Coach + Member features):
- Email: `coach@tecumseh-jujutsu.com`
- Password: `coach123`

**Member Account** (Basic member features):
- Email: `member@tecumseh-jujutsu.com`
- Password: `member123`

### Sample Classes Created:
- **Morning Adults BJJ** - Monday-Friday 9:30-10:30 AM (All skill levels)
- **Kids Brazilian Jiu-Jitsu** - Monday-Friday 6:00-6:45 PM (Ages 6-12)
- **Evening Adults BJJ** - Monday-Thursday 7:00-8:00 PM (All skill levels)
- **Saturday Adults BJJ** - Saturday 11:00 AM-12:00 PM (All skill levels)
- **Sunday Open Mat** - Sunday 11:00 AM-12:30 PM (Open training for all levels)

The seed script creates 4 weeks of upcoming class sessions, member progress data, system settings, and a sample newsletter.

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

## Troubleshooting

### Common Issues

1. **"Cannot find module 'tailwindcss-animate'" error**
   ```bash
   npm install tailwindcss-animate
   ```

2. **Prisma enum errors with SQLite**
   - The schema has been updated to use string fields instead of enums for SQLite compatibility
   - Run `npm run db:generate && npm run db:push` to update

3. **Database connection issues**
   - Ensure the `.env` file exists with proper configuration
   - The SQLite database will be created automatically in `prisma/dev.db`

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

**Note**: All enum fields have been converted to string fields for SQLite compatibility.

## Security Features

- Role-based access control (Member/Coach/Admin)
- Secure password hashing with bcrypt
- JWT-based session management
- API route protection with middleware
- Input validation with Zod schemas

## Production Deployment

### Quick Production Deploy (Recommended: Vercel)

1. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

2. **Deploy to Vercel (Fastest)**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

3. **Environment Variables**
   Set these in your production environment:
   ```bash
   NEXTAUTH_SECRET=your-super-secure-secret-here
   NEXTAUTH_URL=https://your-domain.com
   DATABASE_URL=your-production-database-url

   # Email settings (optional)
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-email
   SMTP_PASS=your-password
   ```

### Alternative Deployment Options

#### Vercel (Recommended - Zero Config)
- Push to GitHub → Connect to Vercel → Auto-deploys
- Global CDN, instant scaling, optimized for Next.js
- Free tier available

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway deploy
```

#### DigitalOcean App Platform
- Connect GitHub repo
- Set environment variables
- Auto-deploys on push

### Database Options for Production

1. **Vercel Postgres** (Easiest with Vercel)
2. **PlanetScale** (MySQL, generous free tier)
3. **Neon** (PostgreSQL, free tier)
4. **Railway Postgres** (if using Railway)

### Performance Notes

- **Build time**: ~2-3 minutes (includes optimization)
- **Cold start**: <500ms
- **Warm requests**: 50-200ms
- **Image optimization**: Automatic WebP/AVIF conversion
- **Caching**: 24hr image cache, CDN distribution

### Production Checklist

- [ ] Set `NEXTAUTH_SECRET` to secure random string
- [ ] Configure production database
- [ ] Set `NEXTAUTH_URL` to your domain
- [ ] Test all authentication flows
- [ ] Verify email notifications work
- [ ] Run `npm run build` locally to check for errors
- [ ] Enable analytics/monitoring (optional)


# Students

  ✅ Realistic Test Data Created

  - 20 diverse students with varying:
    - Belt ranks (White, Blue, Purple based on join date)
    - Attendance patterns (High/Medium/Low consistency)
    - Realistic join dates (up to 1 year ago)
    - Emergency contacts and medical info
  - 285+ bookings across existing classes
  - Realistic attendance records based on consistency patterns
  - All students use password: password123
  - Email format: firstname.lastname@example.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software developed for Tecumseh Jiu jutsu.

## Visual Documentation

📸 **[View Website Gallery](WEBSITE_GALLERY.md)** - Complete visual showcase of all features and interfaces

## Support

For technical support or questions, contact the development team.
