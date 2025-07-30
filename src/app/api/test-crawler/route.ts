import { NextRequest, NextResponse } from 'next/server'
import { NaverPlaceCrawler } from '@/lib/crawler/naver-place-crawler'
import { createClient } from '@/lib/supabase/server'

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

    const { keyword } = await request.json()
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      )
    }

    console.log(`Testing crawler for keyword: ${keyword}`)

    const crawler = new NaverPlaceCrawler()
    
    try {
      await crawler.init()
      const results = await crawler.searchPlacesByKeyword(keyword)
      
      return NextResponse.json({
        success: true,
        keyword,
        results,
        count: results.length,
        timestamp: new Date().toISOString()
      })
      
    } finally {
      await crawler.close()
    }

  } catch (error: any) {
    console.error('Test crawler error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}