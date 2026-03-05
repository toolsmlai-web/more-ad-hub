import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UAParser } from 'ua-parser-js'

// CRITICAL: Use edge runtime for fastest redirects
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const supabase = await createClient()

  try {
    // Lookup link (indexed query for performance)
    const { data: link, error } = await supabase
      .from('links')
      .select('id, destination_url, is_active, password_hash')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !link) {
      console.error('Link not found:', slug, error)
      return NextResponse.redirect(
        new URL('/?error=not-found', request.url),
        { status: 302 }
      )
    }

    // Password protection check
    if (link.password_hash) {
      const password = request.nextUrl.searchParams.get('password')
      if (!password) {
        return NextResponse.redirect(
          new URL(`/unlock/${slug}`, request.url),
          { status: 302 }
        )
      }
      // TODO: Implement bcrypt password verification
    }

    // Fire-and-forget analytics (DON'T AWAIT - critical for speed)
    trackClick(link.id, request).catch((err) => {
      console.error('Analytics tracking error:', err)
    })

    // Perform 302 redirect (temporary - allows URL changes and tracking)
    return NextResponse.redirect(link.destination_url, { status: 302 })
  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect(
      new URL('/?error=server-error', request.url),
      { status: 302 }
    )
  }
}

// Analytics tracking (async, non-blocking)
async function trackClick(linkId: string, request: NextRequest) {
  const supabase = await createClient()
  const ua = new UAParser(request.headers.get('user-agent') || '')
  
  // Get IP (handle Vercel/Cloudflare headers)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
    request.headers.get('x-real-ip') || 
    'unknown'

  // Get geo data from Vercel Edge headers
  const country = request.headers.get('x-vercel-ip-country') || 'unknown'
  const city = request.headers.get('x-vercel-ip-city') || 'unknown'
  const region = request.headers.get('x-vercel-ip-country-region') || 'unknown'

  const device = ua.getDevice()
  const browser = ua.getBrowser()
  const os = ua.getOS()

  // Determine device type
  let deviceType = 'desktop'
  if (device.type === 'mobile') deviceType = 'mobile'
  else if (device.type === 'tablet') deviceType = 'tablet'
  else if (ua.getUA().toLowerCase().includes('bot')) deviceType = 'bot'

  // Insert click record
  const { error: insertError } = await supabase.from('clicks').insert({
    link_id: linkId,
    ip_address: ip,
    country: decodeURIComponent(country),
    city: decodeURIComponent(city),
    region: decodeURIComponent(region),
    device_type: deviceType,
    browser: browser.name || 'unknown',
    os: os.name || 'unknown',
    referrer: request.headers.get('referer') || 'direct',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })

  if (insertError) {
    console.error('Failed to insert click:', insertError)
  }

  // Increment click count using database function
  const { error: rpcError } = await supabase.rpc('increment_click_count', { 
    link_uuid: linkId 
  })

  if (rpcError) {
    console.error('Failed to increment count:', rpcError)
  }
}