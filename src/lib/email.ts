import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@tecumseh-jujutsu.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log('Email sent: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export function generateMissedClassEmail(memberName: string, className: string, sessionDate: Date) {
  const subject = 'Missed Class Reminder - Tecumseh Jujutsu'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d; margin-bottom: 10px;">Tecumseh Jujutsu</h1>
        <p style="color: #666; margin: 0;">We Miss You on the Mats!</p>
      </div>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2d3748; margin-top: 0;">Hi ${memberName},</h2>
        <p style="color: #4a5568; line-height: 1.6;">
          We noticed you missed the <strong>${className}</strong> class on
          <strong>${sessionDate.toLocaleDateString()}</strong>. We hope everything is okay!
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #2d3748;">Getting Back on Track</h3>
        <p style="color: #4a5568; line-height: 1.6;">
          Regular training is key to progress in Brazilian Jiu-Jitsu. We'd love to see you back on the mats soon!
        </p>

        <ul style="color: #4a5568; line-height: 1.8;">
          <li>Check our class schedule for upcoming sessions</li>
          <li>Book your next class through our online system</li>
          <li>Reach out if you're dealing with an injury or need a break</li>
          <li>Contact us if you need help with your training schedule</li>
        </ul>
      </div>

      <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2d3748; margin-top: 0;">Need Help?</h3>
        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 0;">
          If you're facing challenges with your training schedule, dealing with an injury,
          or need to take a break, please let us know. We're here to support your jiu-jitsu journey!
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard/classes"
           style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Book Your Next Class
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0;">
          Tecumseh Jujutsu • Building Champions on and off the Mats<br>
          OSS! 🥋
        </p>
      </div>
    </div>
  `

  const text = `Hi ${memberName},

We noticed you missed the ${className} class on ${sessionDate.toLocaleDateString()}. We hope everything is okay!

Regular training is key to progress in Brazilian Jiu-Jitsu. We'd love to see you back on the mats soon!

If you're facing challenges with your training schedule or need help, please let us know. We're here to support your jiu-jitsu journey!

Book your next class: ${process.env.NEXTAUTH_URL}/dashboard/classes

OSS!
Tecumseh Jujutsu Team`

  return { subject, html, text }
}

export function generateWelcomeEmail(memberName: string, email: string, tempPassword: string) {
  const subject = 'Welcome to Tecumseh Jujutsu!'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d; margin-bottom: 10px;">Welcome to Tecumseh Jujutsu!</h1>
        <p style="color: #666; margin: 0;">Your Journey on the Mats Begins Here</p>
      </div>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2d3748; margin-top: 0;">Hi ${memberName},</h2>
        <p style="color: #4a5568; line-height: 1.6;">
          Welcome to our gym management system! Your account has been created and you can now book classes,
          track your progress, and stay connected with our community.
        </p>
      </div>

      <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #2d3748; margin-top: 0;">Your Login Details</h3>
        <p style="color: #4a5568; margin-bottom: 10px;"><strong>Email:</strong> ${email}</p>
        <p style="color: #4a5568; margin-bottom: 10px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p style="color: #e53e3e; font-size: 14px; margin: 0;">
          Please change your password after your first login for security.
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #2d3748;">Getting Started</h3>
        <ol style="color: #4a5568; line-height: 1.8;">
          <li>Log in to your account using the credentials above</li>
          <li>Update your profile information</li>
          <li>Browse our class schedule and book your first session</li>
          <li>Complete your emergency contact information</li>
          <li>Review our gym policies and guidelines</li>
        </ol>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}/auth/signin"
           style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Login to Your Account
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0;">
          Tecumseh Jujutsu • Building Champions on and off the Mats<br>
          OSS! 🥋
        </p>
      </div>
    </div>
  `

  const text = `Welcome to Tecumseh Jujutsu!

Hi ${memberName},

Welcome to our gym management system! Your account has been created and you can now book classes, track your progress, and stay connected with our community.

Your Login Details:
Email: ${email}
Temporary Password: ${tempPassword}

Please change your password after your first login for security.

Getting Started:
1. Log in to your account using the credentials above
2. Update your profile information
3. Browse our class schedule and book your first session
4. Complete your emergency contact information
5. Review our gym policies and guidelines

Login: ${process.env.NEXTAUTH_URL}/auth/signin

OSS!
Tecumseh Jujutsu Team`

  return { subject, html, text }
}

export function generateClassReminderEmail(memberName: string, className: string, sessionDate: Date, sessionTime: string) {
  const subject = 'Class Reminder - Tecumseh Jujutsu'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d; margin-bottom: 10px;">Class Reminder</h1>
        <p style="color: #666; margin: 0;">Don't Forget Your Upcoming Session!</p>
      </div>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2d3748; margin-top: 0;">Hi ${memberName},</h2>
        <p style="color: #4a5568; line-height: 1.6;">
          This is a friendly reminder that you have a class booked for tomorrow:
        </p>
      </div>

      <div style="background: #e6fffa; border-left: 4px solid #38b2ac; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #2c7a7b; margin-top: 0;">${className}</h3>
        <p style="color: #285e61; margin-bottom: 5px;">
          <strong>Date:</strong> ${sessionDate.toLocaleDateString()}
        </p>
        <p style="color: #285e61; margin: 0;">
          <strong>Time:</strong> ${sessionTime}
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #2d3748;">What to Bring</h3>
        <ul style="color: #4a5568; line-height: 1.8;">
          <li>Your gi or appropriate training attire</li>
          <li>Water bottle to stay hydrated</li>
          <li>Towel for after training</li>
          <li>Positive attitude and ready to learn!</li>
        </ul>
      </div>

      <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #744210; margin: 0; font-size: 14px;">
          <strong>Reminder:</strong> If you need to cancel, please do so at least 4 hours before class time.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 14px; margin: 0;">
          See you on the mats!<br>
          OSS! 🥋
        </p>
      </div>
    </div>
  `

  const text = `Class Reminder - Tecumseh Jujutsu

Hi ${memberName},

This is a friendly reminder that you have a class booked for tomorrow:

${className}
Date: ${sessionDate.toLocaleDateString()}
Time: ${sessionTime}

What to Bring:
- Your gi or appropriate training attire
- Water bottle to stay hydrated
- Towel for after training
- Positive attitude and ready to learn!

Reminder: If you need to cancel, please do so at least 4 hours before class time.

See you on the mats!
OSS!`

  return { subject, html, text }
}