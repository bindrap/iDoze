# Production Setup Guide - iDoze Jujutsu Management System

This guide will walk you through setting up the iDoze system for production use at your gym.

## Overview - What You Need

| Component | Cost | Time to Setup |
|-----------|------|---------------|
| Domain Name | $10-15/year | 5 minutes |
| Vercel Hosting | Free | 10 minutes |
| Database | Free (Vercel Postgres) | 5 minutes |
| Email Service | Free (Gmail) | 5 minutes |
| **Total** | **$10-15/year** | **25 minutes** |

---

## Step 1: Get a Domain Name

### Where to Buy
- **Namecheap** (recommended) - Easy, cheap
- **Google Domains** - Simple interface
- **GoDaddy** - Most popular

### What to Buy
- Something like: `tecumsehjujitsu.com`, `your-gym-name.com`
- **.com** is best, but `.net` or `.org` work too
- **Cost**: $10-15/year

### Instructions
1. Go to [namecheap.com](https://namecheap.com)
2. Search for your desired domain name
3. Add to cart and checkout
4. **Don't buy extra services** - just the domain
5. You'll get an email with login details

---

## Step 2: Create Vercel Account (Free Hosting)

### Why Vercel?
- **Free tier** - No monthly costs
- **Global CDN** - Fast worldwide
- **Optimized for Next.js** - Your app will be blazing fast
- **Auto-deploys** - Just push code to update

### Instructions
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. If no GitHub account, create one first at [github.com](https://github.com)

### Connect Your Domain
1. In Vercel dashboard → Go to your project
2. Click "Settings" → "Domains"
3. Add your domain name
4. Follow DNS setup instructions (Vercel will guide you)

---

## Step 3: Create Production Database

### Option A: Neon (Recommended - Best Free Tier)

**Cost**: Free up to 512MB storage (enough for years of gym data)

**Why Neon?**
- **8x more storage** than Vercel Postgres
- **Database branching** for dev/staging environments
- **Automatic backups**
- **Never worry about running out of space**

**Instructions:**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project → Name it "iDoze Production"
4. Select region closest to your gym
5. Copy the connection string - it looks like:
   ```
   postgresql://username:password@hostname/database?sslmode=require
   ```

### Option B: Vercel Postgres (Alternative)

**Cost**: Free up to 60MB storage (sufficient for small gym)

**Instructions:**
1. In Vercel dashboard → Click "Storage"
2. Click "Create Database" → "Postgres"
3. Choose a name like `idoze-prod`
4. Select region closest to your gym
5. Click "Create"
6. Copy the connection string

### Option C: PlanetScale (MySQL Alternative)

**Cost**: Free up to 1GB storage

**Instructions:**
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub
3. Create database → Name it "idoze-prod"
4. Get connection string from dashboard

---

## Step 4: Set Up Email Notifications

### Option A: Use Gmail (Easiest)

**Cost**: Free

**Instructions:**
1. Use your gym's Gmail account (or create new one)
2. **Enable 2-Factor Authentication**:
   - Gmail → Settings → Security → 2-Step Verification → Turn On
3. **Generate App Password**:
   - Gmail → Settings → Security → App passwords
   - Choose "Mail" → Generate password
   - Save this password - you'll need it

**Email Settings:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gym@gmail.com
SMTP_PASS=the-app-password-you-generated
```

### Option B: Business Email Provider

If your gym has business email (like through your website host):

**Instructions:**
1. Contact your email provider for SMTP settings
2. Usually looks like:
   ```
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587 or 465
   SMTP_USER=noreply@yourgym.com
   SMTP_PASS=your-email-password
   ```

---

## Step 5: Generate Security Key

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use online generator: [generate-secret.vercel.app](https://generate-secret.vercel.app)

Save this key - you'll need it for environment variables.

---

## Step 6: Deploy to Production

### Method 1: Using Vercel CLI (Recommended)

**Instructions:**
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy your app**:
   ```bash
   # In your iDoze project folder
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add DATABASE_URL
   vercel env add SMTP_HOST
   vercel env add SMTP_PORT
   vercel env add SMTP_USER
   vercel env add SMTP_PASS
   ```

### Method 2: GitHub + Vercel (Alternative)

**Instructions:**
1. Push your code to GitHub
2. In Vercel dashboard → "Import Project"
3. Connect your GitHub repo
4. Add environment variables in Vercel dashboard

---

## Step 7: Environment Variables Setup

In Vercel dashboard → Your Project → Settings → Environment Variables

Add these variables:

| Variable Name | Example Value | Where to Get It |
|---------------|---------------|-----------------|
| `NEXTAUTH_SECRET` | `E5LuzVbfQMJB...` | Generated in Step 5 |
| `NEXTAUTH_URL` | `https://yourgym.com` | Your domain from Step 1 |
| `DATABASE_URL` | `postgres://user:pass@...` | Database from Step 3 |
| `SMTP_HOST` | `smtp.gmail.com` | Email setup from Step 4 |
| `SMTP_PORT` | `587` | Email setup from Step 4 |
| `SMTP_USER` | `gym@gmail.com` | Your gym email |
| `SMTP_PASS` | `app-password` | App password from Step 4 |

---

## Step 8: Initialize Production Database

After deployment, you need to set up the database schema:

**Instructions:**
1. In your local project, update the `DATABASE_URL` in `.env` to your production database
2. Run these commands:
   ```bash
   npm run db:generate
   npm run db:push
   node scripts/seed.js
   ```
3. This creates all tables and adds sample data

**Important**: Change the `DATABASE_URL` back to your local database after this step.

---

## Step 9: Test Your Production Site

1. **Visit your domain** - should see the login page
2. **Test login** with seeded accounts:
   - Admin: `admin@tecumseh-jujutsu.com` / `admin123`
   - Coach: `coach@tecumseh-jujutsu.com` / `coach123`
   - Member: `member@tecumseh-jujutsu.com` / `member123`
3. **Test email** - try booking a class to see if notifications work
4. **Test on mobile** - make sure it's responsive

---

## Step 10: Customize for Your Gym

### Update Branding
1. Replace logo files in `/public/`
2. Update gym name in code
3. Add your gym's photos
4. Update color scheme if desired

### Add Real Data
1. **Delete test users** from admin panel
2. **Add real members** one by one or import
3. **Create real classes** matching your schedule
4. **Set up real newsletters**

### Configure Settings
1. **Update gym hours** in settings
2. **Set booking deadlines** (default: 2 hours before class)
3. **Configure notification timing** (default: after 14 days missed)

---

## Maintenance & Updates

### Regular Tasks
- **Monitor usage** - Check Vercel analytics
- **Backup data** - Export member data monthly
- **Update content** - Add new newsletters, photos

### When You Need Updates
- **Push to GitHub** → Auto-deploys to production
- **Or use**: `vercel --prod` to deploy manually

### Support
- **Vercel issues**: [vercel.com/help](https://vercel.com/help)
- **Domain issues**: Contact your domain provider
- **Database issues**: Check your database provider's docs

---

## Cost Breakdown

| Service | Free Tier | Paid Tier Starts At |
|---------|-----------|---------------------|
| Domain Name | N/A | $10-15/year |
| Vercel Hosting | Free (hobby) | $20/month (pro) |
| Vercel Postgres | 60MB free | $20/month |
| Email (Gmail) | Free | N/A |
| **Total for small gym** | **$10-15/year** | **Upgrade when needed** |

### When to Upgrade
- **Vercel Pro**: When you get >100 members or need analytics
- **Database upgrade**: When you hit storage limits (unlikely for small gym)

---

## Troubleshooting

### Common Issues

**"Site not loading"**
- Check domain DNS settings
- Verify deployment succeeded in Vercel

**"Database connection failed"**
- Check `DATABASE_URL` format
- Ensure database is running

**"Emails not sending"**
- Verify SMTP settings
- Check Gmail app password is correct

**"Build failed"**
- Check for code errors in Vercel deployment logs
- Ensure all environment variables are set

### Getting Help
1. Check Vercel deployment logs first
2. Test locally with production environment variables
3. Contact your domain/database provider for their specific issues

---

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database has restricted access (not public)
- [ ] Email credentials are secure
- [ ] Domain has SSL certificate (Vercel provides this automatically)
- [ ] Regular backups are configured
- [ ] Test user accounts are removed before going live

---

## Success! 🎉

Your jujutsu management system is now live and ready for your gym to use!

**Next steps:**
1. Train your staff on the system
2. Add real member data
3. Start using for class bookings and attendance
4. Monitor usage and member feedback

The system will automatically handle:
- ✅ Class booking with capacity limits
- ✅ Attendance tracking
- ✅ Email notifications for missed classes
- ✅ Member progress tracking
- ✅ Analytics and reporting

Your gym is now running on a professional, fast, and reliable management system!