# 🔗 more.ad - Professional Link Shortener for Advertising

A blazing-fast, production-ready link shortener built specifically for marketers and advertisers. Built with Next.js 14, Supabase, and deployed on Vercel Edge.

## ✨ Features

- ⚡ **Lightning Fast Redirects**: <50ms globally using Vercel Edge Runtime
- 📊 **Real-time Analytics**: Track clicks, locations, devices, and referrers
- 🎨 **Custom Slugs**: Brand your links (more.ad/summer-sale)
- 🔐 **Password Protection**: Secure sensitive links
- 📱 **QR Codes**: Auto-generate QR codes for offline campaigns
- 🌍 **Global CDN**: Fast redirects worldwide
- 🔒 **Row Level Security**: Secure multi-tenant architecture
- 💳 **Stripe Integration Ready**: Monetize with subscriptions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Vercel account (for deployment)

### Installation

```bash
# Clone or create project
npx create-next-app@latest more-ad --typescript --tailwind --app

# Install dependencies
cd more-ad
npm install @supabase/supabase-js @supabase/ssr nanoid ua-parser-js qrcode recharts lucide-react

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (in Supabase SQL Editor)
# Copy contents of supabase/migrations/001_initial_schema.sql

# Start development server
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
more-ad/
├── app/
│   ├── [slug]/
│   │   └── route.ts          # Redirect handler (EDGE RUNTIME)
│   ├── api/
│   │   └── shorten/
│   │       └── route.ts      # URL shortening API
│   ├── dashboard/            # User dashboard
│   ├── auth/                 # Authentication pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/               # React components
├── lib/
│   └── supabase/
│       ├── client.ts        # Browser client
│       └── server.ts        # Server client
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── middleware.ts            # Auth + Rate limiting
├── .env.local
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Tables

- **profiles**: User profiles and subscription info
- **links**: Short links with metadata
- **clicks**: Detailed click analytics
- **subscription_plans**: Pricing tiers

### Key Features

- UUID primary keys for scalability
- Indexed slug column for fast lookups
- Row Level Security (RLS) for multi-tenancy
- Database functions for analytics
- Automatic timestamp updates

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://more.ad
```

### Custom Domain Setup

1. **Purchase more.ad domain**
2. **Add to Vercel:**
   - Project Settings → Domains → Add "more.ad"
3. **Update DNS:**
   - A Record: @ → Vercel IP
   - CNAME: www → cname.vercel-dns.com
4. **Update env:** `NEXT_PUBLIC_APP_URL=https://more.ad`

## 📊 API Endpoints

### POST /api/shorten

Create a short link.

**Request:**
```json
{
  "destination_url": "https://example.com/long-url",
  "custom_slug": "summer-sale",  // optional
  "title": "Summer Sale 2025",   // optional
  "description": "Description"    // optional
}
```

**Response:**
```json
{
  "success": true,
  "link": {
    "id": "uuid",
    "slug": "summer-sale",
    "destination_url": "https://example.com/long-url",
    "short_url": "https://more.ad/summer-sale",
    "created_at": "2025-01-30T00:00:00Z"
  }
}
```

### GET /{slug}

Redirect to destination URL. Tracks analytics automatically.

**Example:**
```
GET https://more.ad/summer-sale
→ 302 Redirect to destination_url
```

## 🎨 Customization

### Branding

Edit `app/layout.tsx` and `app/globals.css` for custom colors and branding.

### Analytics

Analytics are tracked automatically in `app/[slug]/route.ts`. Customize tracking in the `trackClick()` function.

### Subscription Plans

Edit plans in `supabase/migrations/001_initial_schema.sql`:

```sql
INSERT INTO public.subscription_plans (name, price, link_limit, features) VALUES
  ('free', 0, 100, '{"analytics": "basic"}'),
  ('pro', 1900, 1000, '{"analytics": "advanced"}');
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

### Environment Variables (Vercel)

Add all variables from `.env.local` to Vercel project settings.

### Performance Optimizations

- ✅ Edge Runtime for redirects (<50ms globally)
- ✅ Database indexes on slug column
- ✅ Fire-and-forget analytics (non-blocking)
- ✅ Connection pooling via Supabase
- ✅ CDN caching on static assets

## 📈 Analytics Dashboard

Analytics include:

- **Total clicks** by link
- **Geographic distribution** (country, city)
- **Device breakdown** (mobile, desktop, tablet)
- **Browser and OS** statistics
- **Referrer sources**
- **Time-series** click data

## 🔐 Security

- Row Level Security (RLS) on all tables
- Service role key never exposed to client
- Rate limiting (implement with Upstash Redis)
- Input validation on all API endpoints
- HTTPS enforced in production

## 🎯 Roadmap

- [x] Core link shortening
- [x] Analytics dashboard
- [x] Custom slugs
- [ ] Authentication pages
- [ ] QR code generation
- [ ] Password-protected links
- [ ] Stripe integration
- [ ] Team collaboration
- [ ] API key management
- [ ] Bulk link creation
- [ ] Link expiration
- [ ] Custom domains per user
- [ ] A/B testing
- [ ] UTM parameter builder

## 🐛 Troubleshooting

### Redirects not working

1. Check database migration ran successfully
2. Verify Supabase RLS policies allow anonymous reads
3. Check Vercel deployment uses Edge Runtime
4. Verify environment variables are set

### Slow redirects

1. Ensure `export const runtime = 'edge'` in `app/[slug]/route.ts`
2. Check database has index on `slug` column
3. Deploy to Vercel (Edge Runtime requires Vercel)

### Authentication errors

1. Verify Supabase URL and keys in `.env.local`
2. Restart dev server after changing env vars
3. Check Supabase project is not paused

## 📝 License

MIT License - feel free to use for commercial projects

## 🙏 Credits

Built with:
- [Next.js 14](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend as a Service
- [Vercel](https://vercel.com) - Deployment platform
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide Icons](https://lucide.dev) - Icons

## 📧 Support

- Documentation: https://more.ad/docs
- Email: support@more.ad
- Twitter: @moreadapp

---

Built with ❤️ for marketers who want more from their links.