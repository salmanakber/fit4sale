# Fit4Sale – Sales-Check (Umfragesystem)

Ein vollständiges System zur Durchführung eines Online-Sales-Checks (Umfrage), automatischer Auswertung auf Basis von Benchmarks und Versand von vorläufigen/vollständigen Auswertungen per E‑Mail.

## Features

### Öffentliche Umfrage
- Sales-Check Fragebogen (Quiz)
- E-Mail ist Pflicht (für Versand der Auswertung)
- Benchmarks pro Frage/Teilbereich
- Form validation and error handling
- Responsive design optimized for mobile and desktop

### Admin Dashboard (Adminbereich)
- Secure authentication system with password protection
- Verwaltung der Eingaben (Suche/Filter)
- Detailansicht inkl. Antworten
- Automatische vorläufige Auswertung nach Eingabe
- Vollständige Auswertung nur nach manueller Freigabe
- E-Mail Versand inkl. Audit-Log
- Admin activity logging

### Auswertungssystem
- Punktesystem (0–100) anhand Benchmarks
- Teilbereiche/Kategorien möglich (Benchmarks `category`)
- Vorläufige Auswertung automatisch per E‑Mail
- Vollständige Auswertung nach Freigabe

### Database
- Secure PostgreSQL database via Supabase
- Normalized schema for submissions, evaluations, and admin users
- Row Level Security (RLS) policies for data protection
- Proper indexing for performance
- Admin activity audit logging

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with design tokens
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based admin auth
- **API**: Next.js Route Handlers with server actions

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Environment variables configured

### Installation

1. **Install dependencies**:
\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

3. **Initialize the database (quiz-based flow)**:
   - Execute `/scripts/03_create_quiz_tables.sql` in Supabase SQL editor
   - Execute `/scripts/06_create_benchmarks_and_audit.sql` (benchmarks + email audit + evaluation cache + approval fields)
   - Execute `/scripts/07_align_quiz_submission_schema.sql` (aligns quiz submissions with the current API payload)
   - Execute `/scripts/08_align_admin_logs_and_evaluation_results_fks.sql` (fixes foreign keys to use `quiz_submissions`)
   - Execute `/scripts/02_create_admin_user.sql` to create the first admin user

4. **Run the development server**:
\`\`\`bash
npm run dev
\`\`\`

5. **Access the application**:
   - Public survey: `http://localhost:3000`
   - Admin login: `http://localhost:3000/admin/login`
   - Default credentials: `admin@fit4sale.com` / `fit4sale123`

## File Structure

\`\`\`
├── app/
│   ├── page.tsx                          # Public survey page
│   ├── admin/
│   │   ├── layout.tsx                    # Admin layout with sidebar
│   │   ├── login/page.tsx                # Admin login page
│   │   ├── dashboard/page.tsx            # Admin dashboard
│   │   ├── submissions/
│   │   │   ├── page.tsx                  # Submissions list
│   │   │   └── [id]/page.tsx             # Submission details
│   │   └── evaluations/
│   │       ├── page.tsx                  # Evaluations list
│   │       ├── create/page.tsx           # Create evaluation
│   │       └── [id]/page.tsx             # Evaluation details
│   └── api/
│       ├── submit-survey/route.ts        # Submit survey responses
│       ├── send-confirmation-email/route.ts
│       └── admin/
│           ├── login/route.ts
│           ├── logout/route.ts
│           ├── check-auth/route.ts
│           ├── submissions/route.ts
│           ├── evaluations/route.ts
│           └── send-evaluation-email/route.ts
├── components/
│   └── survey-form.tsx                   # Survey form component
├── lib/
│   ├── evaluation-logic.ts               # Scoring algorithm
│   └── email-service.ts                  # Email templates
└── scripts/
    ├── 01_create_tables.sql              # Database schema
    └── 02_create_admin_user.sql          # Admin user setup

\`\`\`

## Database Schema

### survey_submissions
Stores all patient survey responses with demographic and fitness background information.

### evaluation_results
Stores fitness assessments with scores, recommendations, and personalized advice.

### admin_users
Stores admin credentials and authentication data.

### admin_logs
Tracks all admin actions for audit purposes.

## Evaluation Scoring Algorithm

The system uses a multi-factor scoring approach:

1. **Fitness Level Score** (0-100):
   - Based on current activity level and fitness experience
   - Ranges from 20 (sedentary, beginner) to 95 (very active, advanced)

2. **Readiness Score** (0-100):
   - Combines fitness level with time availability
   - Indicates how prepared the patient is for exercise

3. **Program Recommendations** based on:
   - Age group and associated risk level
   - Current activity level and experience
   - Available time and equipment
   - Existing injuries or health conditions

4. **Safety Considerations**:
   - Age-appropriate modifications
   - Injury-specific program adjustments
   - Medical clearance recommendations when needed

## Email System

The system includes placeholder email endpoints that can be integrated with services like:
- SendGrid
- Resend
- Postmark
- Mailgun

Update `/app/api/send-confirmation-email/route.ts` and `/app/api/admin/send-evaluation-email/route.ts` with your email service credentials.

## Security Features

- Secure password hashing with bcrypt
- Session-based authentication with HTTP-only cookies
- Row Level Security (RLS) in database
- Admin activity logging
- Input validation and sanitization
- CSRF protection via Next.js built-in features

## Admin Credentials

**Default Login:**
- Email: `admin@fit4sale.com`
- Password: `fit4sale123`

⚠️ **Important**: Change this password immediately in production!

## Next Steps

1. **Connect Email Service**: Update email endpoints to use your email provider
2. **Customize Evaluation Logic**: Modify `/lib/evaluation-logic.ts` for your scoring model
3. **Admin User Management**: Add UI for creating additional admin accounts
4. **Patient Portal**: Create a patient-facing page to view their evaluation results
5. **Reports & Analytics**: Add dashboard analytics and export functionality

## Contributing

This is a Fit4Sale project. For questions or modifications, please contact the team.

## License

Proprietary - All rights reserved to Fit4Sale.
