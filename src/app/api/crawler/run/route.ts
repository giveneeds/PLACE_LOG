import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_RETRIES = 3
const RETRY_DELAY = 5000 // 5 seconds

interface CrawlResult {
  keyword: string
  placeId: string
  placeName: string
  placeUrl: string
  rank: number
  reviewCount: number
  visitorReviewCount: number
  blogReviewCount: number
}

// Simulated crawler function - replace with actual implementation
async function crawlNaverPlace(keyword: string, placeUrl: string): Promise<CrawlResult[]> {
  // This is a placeholder for the actual Naver Place crawling logic
  // In production, this would make actual HTTP requests to Naver Place
  // and parse the HTML/API responses
  
  // For now, return mock data
  return [
    {
      keyword,
      placeId: 'mock-place-id',
      placeName: 'Mock Place Name',
      placeUrl,
      rank: Math.floor(Math.random() * 20) + 1,
      reviewCount: Math.floor(Math.random() * 1000),
      visitorReviewCount: Math.floor(Math.random() * 500),
      blogReviewCount: Math.floor(Math.random() * 500),
    }
  ]
}

async function sendWebhookNotification(message: string, isError: boolean = false) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.WEBHOOK_URL
  
  if (!webhookUrl) {
    console.warn('No webhook URL configured')
    return
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        channel: isError ? '#alerts' : '#crawler-logs',
        username: 'Place Log Crawler',
        icon_emoji: isError ? ':warning:' : ':robot_face:',
      }),
    })
  } catch (error) {
    console.error('Failed to send webhook notification:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify API key for scheduler authentication
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey !== process.env.CRAWLER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active tracked places
    const { data: trackedPlaces, error: fetchError } = await supabase
      .from('tracked_places')
      .select(`
        *,
        keywords (*)
      `)
      .eq('is_active', true)

    if (fetchError) {
      throw new Error(`Failed to fetch tracked places: ${fetchError.message}`)
    }

    if (!trackedPlaces || trackedPlaces.length === 0) {
      await sendWebhookNotification('No active places to crawl')
      return NextResponse.json({ 
        success: true, 
        message: 'No active places to crawl' 
      })
    }

    const crawlResults: any[] = []
    const errors: any[] = []

    // Process each tracked place
    for (const place of trackedPlaces) {
      let retryCount = 0
      let success = false

      while (retryCount < MAX_RETRIES && !success) {
        try {
          const results = await crawlNaverPlace(
            place.keywords?.keyword || place.search_keyword,
            place.place_url
          )

          // Save results to database
          for (const result of results) {
            const { data, error: insertError } = await supabase
              .from('crawler_results')
              .insert({
                tracked_place_id: place.id,
                keyword: result.keyword,
                place_name: result.placeName,
                rank: result.rank,
                review_count: result.reviewCount,
                visitor_review_count: result.visitorReviewCount,
                blog_review_count: result.blogReviewCount,
                crawled_at: new Date().toISOString(),
              })

            if (insertError) {
              throw new Error(`Failed to save result: ${insertError.message}`)
            }

            // Also update rankings table
            await supabase
              .from('rankings')
              .insert({
                tracked_place_id: place.id,
                rank: result.rank,
                checked_at: new Date().toISOString(),
              })

            crawlResults.push(result)
          }

          success = true
        } catch (error: any) {
          retryCount++
          
          if (retryCount >= MAX_RETRIES) {
            errors.push({
              place: place.place_name,
              error: error.message,
              retries: retryCount,
            })
            
            await sendWebhookNotification(
              `❌ Crawl failed for ${place.place_name} after ${retryCount} retries: ${error.message}`,
              true
            )
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
          }
        }
      }
    }

    // Send summary notification
    const summary = `
✅ Crawl completed
- Success: ${crawlResults.length} places
- Failed: ${errors.length} places
- Time: ${new Date().toISOString()}
    `
    
    await sendWebhookNotification(summary)

    return NextResponse.json({
      success: true,
      results: {
        crawled: crawlResults.length,
        failed: errors.length,
        errors: errors,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Crawler error:', error)
    
    await sendWebhookNotification(
      `❌ Critical crawler error: ${error.message}`,
      true
    )

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}