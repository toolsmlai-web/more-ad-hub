# More.ad - Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (for deployment)
- Git installed

## Step 1: Create Project Structure

```bash
# Create new Next.js project
npx create-next-app@latest more-ad --typescript --tailwind --app --eslint
cd more-ad

# Install all dependencies
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs
npm install qrcode @types/qrcode
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install ua-parser-js @types/ua-parser-js
npm install nanoid
npm install recharts lucide-react
npm install -D supabase

# Install Supabase CLI globally
npm install -g supabase
```

## Step 2: Copy All Files

Copy the following files from the artifacts I provided:

1. `package.json` - Dependencies
2. `.env.local` - Environment variables (rename from .env.local.example)
3. `tsconfig.json` - TypeScript config
4. `tailwind.config.ts` - Tailwind config
5. `next.config.js` - Next.js config
6. `middleware.ts` - Auth middleware
7. `lib/supabase/server.ts` - Supabase server client
8. `lib/supabase/client.ts` - Supabase browser client
9. `supabase/migrations/001_initial_schema.sql` - Database schema
10. `app/[slug]/route.ts` - Redirect handler
11. `app/api/shorten/route.ts` - URL shortening API

## Step 3: Set Up Supabase

1. **Create Supabase Project:**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name it "more-ad"
   - Set a strong database password
   - Wait for project creation (~2 minutes)

2. **Get Your Credentials:**
   - Go to Project Settings > API
   - Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Database Migrations:**

Option A - Via Supabase Dashboard:
   - Go to SQL Editor in Supabase Dashboard
   - Copy entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"

Option B - Via CLI:
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 4: Configure Environment Variables

Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Create Additional Required Files

### Create `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "more.ad - Link Shortener for Advertising",
  description: "Professional link shortener built for marketers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Create `app/page.tsx`:

```typescript
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">more.ad</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your link shortener is ready to launch!
        </p>
        <p className="text-gray-500">
          Sign up and authentication pages coming soon...
        </p>
      </div>
    </div>
  )
}
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 7: Test the Link Shortener

### Create a test user in Supabase:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Enter email and password
4. User will appear in auth.users table
5. A profile will be automatically created

### Test the API:

```bash
# Get auth token first (you'll need to implement sign-in page)
# For now, test with service role key

curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "destination_url": "https://google.com",
    "custom_slug": "test"
  }'
```

### Test redirect:

Visit http://localhost:3000/test (should redirect to Google)

## Step 8: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

## Step 9: Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Domains"
3. Add "more.ad"
4. Copy DNS records provided
5. Add to your domain registrar:
   - A record: @ → Vercel IP
   - CNAME: www → cname.vercel-dns.com
6. Wait for DNS propagation (5-30 minutes)

## Next Steps

After basic setup works:

1. ✅ Build authentication pages (`app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`)
2. ✅ Build dashboard (`app/dashboard/page.tsx`)
3. ✅ Build analytics components
4. ✅ Add QR code generation
5. ✅ Implement password-protected links
6. ✅ Add Stripe for payments
7. ✅ Build API documentation
8. ✅ Add rate limiting

## Troubleshooting

### Issue: "Error: Invalid Supabase URL"
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL`
- Restart dev server after changing env vars

### Issue: "Link not found" on all redirects
- Verify database migrations ran successfully
- Check Supabase Dashboard > SQL Editor for errors
- Verify RLS policies are created

### Issue: "Unauthorized" on API calls
- Implement authentication pages first
- Or use service role key for testing

### Issue: Slow redirects
- Deploy to Vercel (edge runtime requires Vercel)
- Check database has proper indexes
- Verify you're using `export const runtime = 'edge'`

## Support

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Open an issue if you need help

---

🎉 Your more.ad link shortener is ready! Start building your marketing empire.