import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 바디에서 placeId 가져오기
    const { placeId } = await request.json()
    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
    }

    // 해당 플레이스 정보 가져오기 (권한 확인 포함)
    const { data: place, error: placeError } = await supabase
      .from('tracked_places')
      .select('*, keywords(*)')
      .eq('id', placeId)
      .eq('user_id', user.id) // 자신의 플레이스만 재검색 가능
      .single()

    if (placeError || !place) {
      return NextResponse.json({ error: 'Place not found or access denied' }, { status: 404 })
    }

    // 크롤러 실행
    const keyword = place.keywords?.keyword || place.search_keyword
    const placeUrl = place.place_url
    const placeName = place.place_name

    // Python 크롤러 호출 (개별 플레이스용)
    const crawlerResponse = await fetch(process.env.PYTHON_CRAWLER_URL || 'http://localhost:8000/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: keyword,
        shop_name: placeName,
        place_url: placeUrl,
      }),
    }).catch(() => null)

    let crawlResult = null

    if (crawlerResponse && crawlerResponse.ok) {
      crawlResult = await crawlerResponse.json()
    } else {
      // Python 크롤러 실패 시 Puppeteer 크롤러 사용
      const { NaverPlaceCrawler } = await import('@/lib/crawler/naver-place-crawler')
      const crawler = new NaverPlaceCrawler()
      
      try {
        await crawler.init()
        const searchResults = await crawler.searchPlacesByKeyword(keyword)
        
        // 특정 플레이스 찾기
        const targetPlace = searchResults.find(result => 
          result.placeUrl === placeUrl || result.placeUrl.includes(placeUrl) ||
          result.placeName === placeName
        )
        
        if (targetPlace) {
          crawlResult = {
            success: true,
            rank: targetPlace.rank,
            reviewCount: targetPlace.reviewCount,
            visitorReviewCount: targetPlace.visitorReviewCount,
            blogReviewCount: targetPlace.blogReviewCount,
          }
        } else {
          crawlResult = {
            success: false,
            rank: null,
            message: '순위권 밖',
          }
        }
      } finally {
        await crawler.close()
      }
    }

    // 오늘 날짜의 기존 순위 데이터 삭제
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    await supabase
      .from('rankings')
      .delete()
      .eq('tracked_place_id', placeId)
      .gte('checked_at', today.toISOString())
      .lt('checked_at', tomorrow.toISOString())

    // 새로운 순위 데이터 저장
    if (crawlResult && crawlResult.success) {
      const { error: insertError } = await supabase
        .from('rankings')
        .insert({
          tracked_place_id: placeId,
          rank: crawlResult.rank,
          checked_at: new Date().toISOString(),
        })

      if (insertError) {
        throw new Error('Failed to save ranking data')
      }

      // crawler_results 테이블에도 저장
      await supabase
        .from('crawler_results')
        .insert({
          tracked_place_id: placeId,
          keyword: keyword,
          place_name: placeName,
          rank: crawlResult.rank,
          review_count: crawlResult.reviewCount || 0,
          visitor_review_count: crawlResult.visitorReviewCount || 0,
          blog_review_count: crawlResult.blogReviewCount || 0,
          crawled_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      place: {
        id: placeId,
        name: placeName,
        keyword: keyword,
      },
      result: crawlResult,
      refreshedAt: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Ranking refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}