import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { keyword, placeUrl, analysisType = 'basic' } = await request.json();

    if (!keyword || !placeUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Python 크롤러 호출
    try {
      const crawlerUrl = process.env.PYTHON_CRAWLER_URL || 'http://localhost:8000';
      const response = await fetch(`${crawlerUrl}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, place_url: placeUrl })
      });

      if (!response.ok) {
        throw new Error('Crawler request failed');
      }

      const crawlResult = await response.json();

      // 결과 저장
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('crawler_results')
          .insert({
            user_id: user.id,
            keyword,
            place_url: placeUrl,
            rank: crawlResult.rank,
            review_count: crawlResult.review_count,
            visitor_review_count: crawlResult.visitor_review_count,
            blog_review_count: crawlResult.blog_review_count,
            metadata: crawlResult,
            analysis_type: analysisType
          });
      }

      return NextResponse.json({
        success: true,
        result: crawlResult,
        analysisType
      });

    } catch (crawlError: any) {
      return NextResponse.json({ 
        error: 'Crawling failed',
        details: crawlError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}