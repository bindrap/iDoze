const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addCompetitionsAndNewsletters() {
  console.log('Adding competitions and newsletters...')

  try {
    // Get admin for creating content
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tecumseh-jujutsu.com' }
    })

    if (!admin) {
      throw new Error('Admin not found - run create-demo-accounts.js first')
    }

    // Create competitions
    const competitions = [
      {
        name: 'Detroit BJJ Spring Championship',
        description: 'Annual spring Brazilian Jiu-Jitsu championship featuring gi and no-gi divisions for all skill levels.',
        competitionDate: new Date('2025-04-15'),
        registrationDeadline: new Date('2025-04-01'),
        location: 'Detroit Sports Arena, Detroit, MI',
        entryFee: 75.00,
        website: 'https://detroitbjj.com/spring-championship',
        contactInfo: 'competitions@tecumseh-jujutsu.com',
        divisions: JSON.stringify({
          ageGroups: ['Kids (6-12)', 'Teens (13-17)', 'Adults (18+)', 'Masters (35+)'],
          weightClasses: 'Standard IBJJF weight classes',
          categories: ['Gi', 'No-Gi']
        }),
        rules: 'IBJJF rules apply. Gi and No-Gi divisions available. Medals for 1st, 2nd, 3rd place.',
        isActive: true
      },
      {
        name: 'Tecumseh Grappling Tournament',
        description: 'Local grappling tournament for our gym members and nearby academies.',
        competitionDate: new Date('2025-05-20'),
        registrationDeadline: new Date('2025-05-10'),
        location: 'Tecumseh Community Center, Tecumseh, ON',
        entryFee: 50.00,
        contactInfo: 'tournaments@tecumseh-jujutsu.com',
        divisions: JSON.stringify({
          ageGroups: ['All ages welcome'],
          weightClasses: 'Modified weight classes for local competition',
          categories: ['Submission Only']
        }),
        rules: 'Submission only, no points. 6-minute rounds. Medals and team trophy.',
        isActive: true
      },
      {
        name: 'Winter Submission Series',
        description: 'Three-part winter tournament series culminating in championship finals.',
        competitionDate: new Date('2025-02-28'),
        registrationDeadline: new Date('2025-02-15'),
        location: 'Multiple locations across Ontario',
        entryFee: 100.00,
        contactInfo: 'series@tecumseh-jujutsu.com',
        divisions: JSON.stringify({
          ageGroups: ['Adults only (18+)'],
          weightClasses: 'Open weight and standard divisions',
          categories: ['Submission Series']
        }),
        rules: 'Submission only format with special ruleset. Cash prizes for series winners.',
        isActive: true
      }
    ]

    for (const comp of competitions) {
      await prisma.competition.create({
        data: {
          ...comp,
          createdById: admin.id
        }
      })
    }

    console.log(`✓ Created ${competitions.length} competitions`)

    // Create newsletters
    const newsletters = [
      {
        title: 'December 2024 - Winter Training Schedule',
        content: `Dear Tecumseh BJJ Family,

As we head into the winter months, we're excited to announce some updates to our training schedule and upcoming events.

**Schedule Updates:**
- Winter schedule begins January 2nd
- Additional no-gi classes on Saturday mornings
- Holiday break: December 23rd - January 1st

**Upcoming Events:**
- Winter Submission Series registration opens January 15th
- Promotion ceremony scheduled for February 1st
- Open mat sessions every Sunday

**Member Spotlight:**
Congratulations to Sarah Johnson on her blue belt promotion! Sarah has shown incredible dedication and improvement over the past year.

**Gym Updates:**
- New mats have been installed in the training area
- Updated changing rooms with improved ventilation
- New training equipment arriving next month

Stay warm and keep training!

Coach Mike`,
        authorId: admin.id,
        publishDate: new Date('2024-12-01'),
        isPublished: true,
        targetAudience: 'ALL',
        priority: 'NORMAL'
      },
      {
        title: 'Competition Preparation Workshop',
        content: `Training Warriors,

We're hosting a special competition preparation workshop for all members interested in competing.

**Workshop Details:**
- Date: January 20th, 2025
- Time: 10:00 AM - 2:00 PM
- Cost: Free for members
- Topics covered:
  * Competition rules and regulations
  * Mental preparation strategies
  * Nutrition and weight cutting basics
  * Match strategy and game planning

**What to Bring:**
- Gi and no-gi gear
- Water bottle and snacks
- Notebook for taking notes

This workshop is perfect for first-time competitors and veterans looking to sharpen their skills. Space is limited to 30 participants.

Register by replying to this newsletter or speaking with Coach Mike.

See you on the mats!`,
        authorId: admin.id,
        publishDate: new Date('2025-01-10'),
        isPublished: true,
        targetAudience: 'ALL',
        priority: 'HIGH'
      },
      {
        title: 'New Year, New Goals - Training Motivation',
        content: `BJJ Athletes,

The new year is here, and it's time to set new goals for your jiu-jitsu journey!

**Setting Effective Training Goals:**
1. Be specific about what you want to achieve
2. Set both short-term and long-term objectives
3. Track your progress regularly
4. Celebrate small victories along the way

**Popular Goals for 2025:**
- Earn next belt rank
- Compete in first tournament
- Improve guard retention
- Develop submission chains
- Increase training frequency

**Goal-Setting Workshop:**
Join us for a goal-setting session on January 15th after the evening class. We'll help you create a personalized training plan for 2025.

**Reminder:**
Monthly membership dues are due by the 1st of each month. Please ensure payments are up to date.

Train hard, stay consistent!

The Tecumseh BJJ Team`,
        authorId: admin.id,
        publishDate: new Date('2025-01-01'),
        isPublished: true,
        targetAudience: 'ALL',
        priority: 'NORMAL'
      },
      {
        title: 'Kids Program Expansion',
        content: `Parents and Guardians,

We're excited to announce the expansion of our kids Brazilian Jiu-Jitsu program!

**New Features:**
- Additional kids classes on Tuesday and Thursday
- Specialized curriculum for different age groups
- Anti-bullying workshops included in curriculum
- Parent observation area improvements

**Age Groups:**
- Little Grapplers (4-6 years): Focus on basic movements and discipline
- Young Warriors (7-10 years): Introduction to BJJ fundamentals
- Teen Competitors (11-16 years): Advanced techniques and competition prep

**Benefits for Your Child:**
- Improved confidence and self-esteem
- Better physical fitness and coordination
- Discipline and respect values
- Anti-bullying skills and awareness
- New friendships in a safe environment

**Free Trial Week:**
Bring your child for a free trial week starting February 1st. No experience necessary!

Contact us to reserve your child's spot in our growing program.

Building future champions!`,
        authorId: admin.id,
        publishDate: new Date('2025-01-20'),
        isPublished: true,
        targetAudience: 'ALL',
        priority: 'NORMAL'
      }
    ]

    for (const newsletter of newsletters) {
      await prisma.newsletter.create({
        data: newsletter
      })
    }

    console.log(`✓ Created ${newsletters.length} newsletters`)

    // Create some competition participants from existing members
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      take: 8
    })

    const competitionRecords = await prisma.competition.findMany()

    if (members.length > 0 && competitionRecords.length > 0) {
      let participantCount = 0

      // Register some members for competitions
      for (const member of members.slice(0, 6)) {
        for (const competition of competitionRecords.slice(0, 2)) {
          if (Math.random() > 0.5) { // 50% chance to register
            await prisma.competitionParticipant.create({
              data: {
                userId: member.id,
                competitionId: competition.id,
                division: ['Lightweight', 'Middleweight', 'Heavyweight'][Math.floor(Math.random() * 3)],
                weight: Math.floor(Math.random() * 50) + 60, // Random weight between 60-110kg
                status: 'REGISTERED'
              }
            })
            participantCount++
          }
        }
      }

      console.log(`✓ Created ${participantCount} competition participants`)
    }

    console.log('\n🎉 Competitions and newsletters restored successfully!')
    console.log('\n📋 Created:')
    console.log(`- ${competitions.length} competitions`)
    console.log(`- ${newsletters.length} newsletters`)
    console.log('- Competition participants from existing members')

  } catch (error) {
    console.error('Error adding competitions and newsletters:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addCompetitionsAndNewsletters()