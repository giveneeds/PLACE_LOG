import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Node.js 런타임 사용 (Puppeteer 때문에 필요)
export const runtime = 'nodejs'
export const maxDuration = 60 // 60초 타임아웃

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

    // 동적 import로 크롤러 로드 (서버사이드에서만)
    const { NaverPlaceCrawler } = await import('@/lib/crawler/naver-place-crawler')
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