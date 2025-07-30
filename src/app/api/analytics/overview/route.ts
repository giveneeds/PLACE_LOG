import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('placeId')
    const period = searchParams.get('period') || '7d' // Default to 7 days
    
    // Calculate date range based on period
    const endDate = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    // Build query
    let query = supabase
      .from('crawler_results')
      .select(`
        id,
        tracked_place_id,
        keyword,
        place_name,
        rank,
        review_count,
        visitor_review_count,
        blog_review_count,
        crawled_at,
        tracked_places!inner (
          id,
          place_name,
          place_url,
          user_id
        )
      `)
      .gte('crawled_at', startDate.toISOString())
      .lte('crawled_at', endDate.toISOString())
      .order('crawled_at', { ascending: true })

    // Filter by specific place if provided
    if (placeId) {
      query = query.eq('tracked_place_id', placeId)
    }

    // Check user permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // If not admin, filter by user's places only
    if (profile?.role !== 'admin') {
      query = query.eq('tracked_places.user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Analytics query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Group data by place for easier consumption
    const groupedData = data?.reduce((acc: any, item) => {
      const placeId = item.tracked_place_id
      if (!acc[placeId]) {
        acc[placeId] = {
          placeId,
          placeName: item.place_name || (item.tracked_places as any)?.place_name,
          placeUrl: (item.tracked_places as any)?.place_url,
          keyword: item.keyword,
          data: []
        }
      }
      
      acc[placeId].data.push({
        date: item.crawled_at,
        rank: item.rank,
        reviewCount: item.review_count,
        visitorReviewCount: item.visitor_review_count,
        blogReviewCount: item.blog_review_count
      })
      
      return acc
    }, {})

    // Convert to array and calculate statistics
    const analyticsData = Object.values(groupedData || {}).map((place: any) => {
      const ranks = place.data.map((d: any) => d.rank).filter((r: any) => r !== null)
      const avgRank = ranks.length > 0 ? 
        Math.round(ranks.reduce((a: number, b: number) => a + b, 0) / ranks.length) : null
      
      const latestData = place.data[place.data.length - 1] || {}
      const firstData = place.data[0] || {}
      
      return {
        ...place,
        statistics: {
          averageRank: avgRank,
          bestRank: ranks.length > 0 ? Math.min(...ranks) : null,
          worstRank: ranks.length > 0 ? Math.max(...ranks) : null,
          rankChange: latestData.rank && firstData.rank ? 
            firstData.rank - latestData.rank : null,
          reviewGrowth: latestData.reviewCount && firstData.reviewCount ?
            latestData.reviewCount - firstData.reviewCount : null
        }
      }
    })

    // Cache for 5 minutes
    return NextResponse.json(
      { data: analyticsData },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}