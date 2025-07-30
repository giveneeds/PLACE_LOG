import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { keyword, placeUrl, placeName, tags, periodStart, periodEnd } = body

    // Validate required fields
    if (!keyword || !placeUrl) {
      return NextResponse.json(
        { error: 'Keyword and place URL are required' },
        { status: 400 }
      )
    }

    // Start transaction
    const { data: keywordData, error: keywordError } = await supabase
      .from('keywords')
      .upsert({ keyword, created_by: user.id }, { onConflict: 'keyword' })
      .select()
      .single()

    if (keywordError) {
      return NextResponse.json(
        { error: 'Failed to create keyword' },
        { status: 500 }
      )
    }

    // Create tracked place
    const { data: placeData, error: placeError } = await supabase
      .from('tracked_places')
      .insert({
        user_id: user.id,
        place_url: placeUrl,
        place_name: placeName,
        search_keyword: keyword,
        keyword_id: keywordData.id,
        period_start: periodStart,
        period_end: periodEnd,
        is_active: true
      })
      .select()
      .single()

    if (placeError) {
      return NextResponse.json(
        { error: 'Failed to create place' },
        { status: 500 }
      )
    }

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Insert tags (upsert to handle existing tags)
      const tagPromises = tags.map(tagName =>
        supabase
          .from('tags')
          .upsert({ name: tagName }, { onConflict: 'name' })
          .select()
          .single()
      )

      const tagResults = await Promise.all(tagPromises)
      const tagIds = tagResults
        .filter(result => !result.error && result.data)
        .map(result => result.data!.id)

      // Link tags to place
      if (tagIds.length > 0) {
        const placeTagsData = tagIds.map(tagId => ({
          tracked_place_id: placeData.id,
          tag_id: tagId
        }))

        await supabase.from('place_tags').insert(placeTagsData)
      }
    }

    // Trigger real-time update event
    await supabase.channel('admin-updates').send({
      type: 'broadcast',
      event: 'keyword-added',
      payload: {
        keyword: keywordData,
        place: placeData,
        tags: tags || []
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        keyword: keywordData,
        place: placeData,
        tags: tags || []
      }
    })
  } catch (error) {
    console.error('Error in POST /api/admin/keywords:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get all keywords with related data
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select(`
        *,
        tracked_places (
          *,
          place_tags (
            tags (*)
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: keywords })
  } catch (error) {
    console.error('Error in GET /api/admin/keywords:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}