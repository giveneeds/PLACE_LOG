import puppeteer, { Browser, Page } from 'puppeteer'
import * as cheerio from 'cheerio'

export interface NaverPlaceResult {
  keyword: string
  placeId: string
  placeName: string
  placeUrl: string
  rank: number
  reviewCount: number
  visitorReviewCount: number
  blogReviewCount: number
  rating: number
  category: string
  address: string
}

export class NaverPlaceCrawler {
  private browser: Browser | null = null
  private page: Page | null = null

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true, // 프로덕션에서는 true
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--deterministic-fetch',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      })
      
      this.page = await this.browser.newPage()
      
      // 뷰포트 설정
      await this.page.setViewport({
        width: 1920,
        height: 1080
      })

      // 추가 헤더 설정
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      })

    } catch (error) {
      console.error('Crawler initialization failed:', error)
      throw error
    }
  }

  async searchPlacesByKeyword(keyword: string): Promise<NaverPlaceResult[]> {
    if (!this.page || !this.browser) {
      throw new Error('Crawler not initialized')
    }

    try {
      // 네이버 지도 검색 페이지로 이동
      const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(keyword)}`
      console.log(`Searching for keyword: ${keyword}`)
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // 검색 결과 로딩 대기
      await this.page.waitForSelector('.place_bluelink', { timeout: 10000 })
      
      // 약간의 추가 대기 (동적 콘텐츠 로딩)
      await this.page.waitForTimeout(2000)

      // 페이지 HTML 가져오기
      const html = await this.page.content()
      const $ = cheerio.load(html)

      const results: NaverPlaceResult[] = []
      let rank = 1

      // 검색 결과 파싱
      $('.place_bluelink').each((index, element) => {
        try {
          const $element = $(element)
          const $parent = $element.closest('.item_info')
          
          // 플레이스 이름
          const placeName = $element.text().trim()
          if (!placeName) return

          // 플레이스 URL에서 ID 추출
          const href = $element.attr('href') || ''
          const placeIdMatch = href.match(/\/place\/(\d+)/)
          const placeId = placeIdMatch ? placeIdMatch[1] : `unknown-${index}`

          // 리뷰 수 파싱
          const reviewText = $parent.find('.place_review').text()
          const reviewCountMatch = reviewText.match(/리뷰\s*(\d+)/)
          const blogCountMatch = reviewText.match(/블로그리뷰\s*(\d+)/)
          const visitorCountMatch = reviewText.match(/방문자리뷰\s*(\d+)/)

          const reviewCount = reviewCountMatch ? parseInt(reviewCountMatch[1]) : 0
          const blogReviewCount = blogCountMatch ? parseInt(blogCountMatch[1]) : 0
          const visitorReviewCount = visitorCountMatch ? parseInt(visitorCountMatch[1]) : 0

          // 평점 파싱
          const ratingText = $parent.find('.place_star').text()
          const ratingMatch = ratingText.match(/([\d.]+)/)
          const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0

          // 카테고리 및 주소
          const category = $parent.find('.place_category').text().trim()
          const address = $parent.find('.place_addr').text().trim()

          results.push({
            keyword,
            placeId,
            placeName,
            placeUrl: `https://map.naver.com/v5/entry/place/${placeId}`,
            rank,
            reviewCount: reviewCount || (blogReviewCount + visitorReviewCount),
            visitorReviewCount,
            blogReviewCount,
            rating,
            category,
            address
          })

          rank++
        } catch (error) {
          console.error(`Error parsing place ${index}:`, error)
        }
      })

      console.log(`Found ${results.length} places for keyword: ${keyword}`)
      return results

    } catch (error) {
      console.error(`Search failed for keyword ${keyword}:`, error)
      return []
    }
  }

  async getPlaceDetails(placeUrl: string): Promise<Partial<NaverPlaceResult> | null> {
    if (!this.page) {
      throw new Error('Crawler not initialized')
    }

    try {
      await this.page.goto(placeUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      })

      // 상세 정보 로딩 대기
      await this.page.waitForTimeout(3000)

      const html = await this.page.content()
      const $ = cheerio.load(html)

      // 상세 정보 파싱 (필요시 구현)
      const placeName = $('.place_title').text().trim()
      
      return {
        placeName,
        // 추가 상세 정보...
      }

    } catch (error) {
      console.error(`Failed to get place details for ${placeUrl}:`, error)
      return null
    }
  }

  async close() {
    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }
      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }
    } catch (error) {
      console.error('Error closing crawler:', error)
    }
  }

  // 랜덤 지연 (봇 감지 회피)
  private async randomDelay(min: number = 1000, max: number = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}