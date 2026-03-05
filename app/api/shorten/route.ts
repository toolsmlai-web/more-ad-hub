import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { destination_url, custom_slug, title, description } = body

    // Validate URL
    if (!destination_url || !isValidUrl(destination_url)) {
      return NextResponse.json(
        { error: 'Invalid destination URL. Must start with http:// or https://' },
        { status: 400 }
      )
    }

    // Generate or validate slug
    let slug = custom_slug
    if (custom_slug) {
      // Validate custom slug format
      if (!/^[a-z0-9-]+$/.test(custom_slug)) {
        return NextResponse.json(
          { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }

      if (custom_slug.length < 3 || custom_slug.length > 50) {
        return NextResponse.json(
          { error: 'Slug must be between 3 and 50 characters' },
          { status: 400 }
        )
      }

      // Check if custom slug is available
      const { data: existing } = await supabase
        .from('links')
        .select('slug')
        .eq('slug', custom_slug)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'This slug is already taken. Please choose another.' },
          { status: 409 }
        )
      }
    } else {
      // Generate random slug (7 characters)
      slug = nanoid(7).toLowerCase()
      
      // Ensure slug doesn't exist (very rare collision)
      let attempts = 0
      while (attempts < 5) {
        const { data: existing } = await supabase
          .from('links')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle()
        
        if (!existing) break
        slug = nanoid(7).toLowerCase()
        attempts++
      }
    }

    // Check user's link limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('link_limit')
      .eq('id', user.id)
      .single()

    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (count !== null && profile && count >= profile.link_limit) {
      return NextResponse.json(
        { 
          error: 'Link limit reached. Please upgrade your plan or delete old links.',
          limit: profile.link_limit,
          current: count
        },
        { status: 403 }
      )
    }

    // Create link
    const { data: link, error } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        slug,
        destination_url,
        title: title || null,
        description: description || null,
        is_custom_slug: !!custom_slug,
      })
      .select()
      .single()

    if (error) {
      console.error('Link creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create link. Please try again.' },
        { status: 500 }
      )
    }

    // Return short URL
    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        short_url: shortUrl,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Allow OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}