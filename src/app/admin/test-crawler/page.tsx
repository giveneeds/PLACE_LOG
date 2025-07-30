'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminOnly } from '@/components/auth/role-guard'

interface CrawlResult {
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

export default function TestCrawlerPage() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CrawlResult[]>([])
  const [lastTest, setLastTest] = useState<string | null>(null)
  const { toast } = useToast()

  const handleTest = async () => {
    if (!keyword.trim()) {
      toast({
        title: '키워드를 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setResults([])

    try {
      const response = await fetch('/api/test-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test crawler')
      }

      if (data.success) {
        setResults(data.results || [])
        setLastTest(data.timestamp)
        toast({
          title: '크롤링 테스트 완료',
          description: `${data.count}개의 결과를 찾았습니다.`,
        })
      } else {
        throw new Error(data.error || 'Crawler test failed')
      }

    } catch (error: any) {
      console.error('Test failed:', error)
      toast({
        title: '크롤링 테스트 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">네이버 플레이스 크롤러 테스트</h1>
          <p className="text-muted-foreground mt-1">
            실제 네이버 플레이스 검색 결과를 크롤링해서 확인해보세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>크롤링 테스트</CardTitle>
            <CardDescription>
              키워드를 입력하고 네이버 플레이스 검색 결과를 가져옵니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="keyword">검색 키워드</Label>
                <Input
                  id="keyword"
                  placeholder="예: 강남 맛집, 홍대 카페"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleTest()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleTest} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  테스트 실행
                </Button>
              </div>
            </div>

            {lastTest && (
              <p className="text-sm text-muted-foreground">
                마지막 테스트: {new Date(lastTest).toLocaleString('ko-KR')}
              </p>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>크롤링 결과</CardTitle>
              <CardDescription>
                "{keyword}" 검색 결과 - 총 {results.length}개
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result.placeId}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">#{result.rank}</Badge>
                        <h3 className="font-semibold">{result.placeName}</h3>
                        {result.rating > 0 && (
                          <Badge variant="outline">⭐ {result.rating}</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{result.category}</p>
                        <p>{result.address}</p>
                        <div className="flex gap-4">
                          <span>총 리뷰: {result.reviewCount}</span>
                          <span>방문자: {result.visitorReviewCount}</span>
                          <span>블로그: {result.blogReviewCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={result.placeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">크롤링 중...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  네이버 플레이스에서 데이터를 가져오고 있습니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminOnly>
  )
}