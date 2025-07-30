import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CRAWLER_API_URL = Deno.env.get('CRAWLER_API_URL') || 'https://your-domain.com/api/crawler/run'
const CRAWLER_API_KEY = Deno.env.get('CRAWLER_API_KEY') || ''

serve(async (req) => {
  try {
    // This function will be called by Supabase cron scheduler
    console.log('Starting scheduled crawl...')

    const response = await fetch(CRAWLER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CRAWLER_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Crawler API returned ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    console.log('Crawl completed:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Scheduled crawl completed',
        result,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scheduler error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})