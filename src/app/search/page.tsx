'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, Clock, MapPin, Star, Phone } from 'lucide-react'
import { CreditBalance } from '@/components/credits/CreditBalance'
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface SearchResult {
  place_id: string
  place_name: string
  place_url: string
  rank: number
  review_count: number
  visitor_review_count: number
  blog_review_count: number
  category?: string
  address?: string
  rating?: number
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [placeUrl, setPlaceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchCompleted, setSearchCompleted] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({
        title: '검색어 입력 필요',
        description: '검색할 키워드를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setSearchCompleted(false)

    try {
      const response = await fetch('/api/crawler/check-rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: keyword.trim(),
          placeUrl: placeUrl.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.')
      }

      const data = await response.json()
      
      // Mock data for demonstration
      const mockResults: SearchResult[] = [
        {
          place_id: '1',
          place_name: '맛있는 김치찌개 전문점',
          place_url: 'https://map.naver.com/v5/entry/place/123456',
          rank: 3,
          review_count: 245,
          visitor_review_count: 180,
          blog_review_count: 65,
          category: '한식',
          address: '서울시 강남구 테헤란로',
          rating: 4.3
        },
        {
          place_id: '2',
          place_name: '홍대 맛집 김치찌개',
          place_url: 'https://map.naver.com/v5/entry/place/234567',
          rank: 7,
          review_count: 156,
          visitor_review_count: 120,
          blog_review_count: 36,
          category: '한식',
          address: '서울시 마포구 홍대거리',
          rating: 4.1
        },
        {
          place_id: '3',
          place_name: '전통 김치찌개 맛집',
          place_url: 'https://map.naver.com/v5/entry/place/345678',
          rank: 12,
          review_count: 89,
          visitor_review_count: 65,
          blog_review_count: 24,
          category: '한식',
          address: '서울시 종로구 인사동',
          rating: 4.5
        }
      ]

      setResults(mockResults)
      setSearchCompleted(true)

      toast({
        title: '검색 완료',
        description: `"${keyword}" 키워드로 ${mockResults.length}개의 결과를 찾았습니다.`,
      })

    } catch (error: any) {
      toast({
        title: '검색 실패',
        description: error.message || '검색 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addToPortfolio = (result: SearchResult) => {
    toast({
      title: '포트폴리오 추가 예정',
      description: `${result.place_name}이(가) 추가될 예정입니다.`,
    })
  }

  return (
    <div className="min-h-screen bg-dark-base">
      {/* Header */}
      <div className="border-b border-gray-800 bg-dark-elevated">
        <div className="container-content py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-gradient">
              Place Log
            </Link>
            <CreditBalance 
              onRechargeClick={() => setShowRechargeModal(true)}
            />
          </div>
        </div>
      </div>

      <div className="container-content py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-display-medium text-white mb-2">
            키워드 순위 검색
          </h1>
          <p className="text-gray-400 text-lg">
            네이버 플레이스에서 키워드별 순위를 무료로 확인하세요
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              실시간 순위 검색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="keyword" className="text-gray-300">
                  검색 키워드 *
                </Label>
                <Input
                  id="keyword"
                  placeholder="예: 강남 맛집, 홍대 카페"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="bg-dark-elevated2 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  네이버 플레이스에서 검색할 키워드를 입력하세요
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeUrl" className="text-gray-300">
                  특정 플레이스 URL (선택사항)
                </Label>
                <Input
                  id="placeUrl"
                  placeholder="https://map.naver.com/v5/entry/place/..."
                  value={placeUrl}
                  onChange={(e) => setPlaceUrl(e.target.value)}
                  className="bg-dark-elevated2 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  특정 플레이스만 확인하려면 URL을 입력하세요
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                순위 검색은 무료입니다
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                size="lg"
                className="px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    검색 중...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    순위 검색하기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchCompleted && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                "{keyword}" 검색 결과
              </h2>
              <Badge variant="secondary" className="bg-dark-elevated3 text-gray-300">
                {results.length}개 결과
              </Badge>
            </div>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={result.place_id} className="border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-white font-bold text-sm">
                              {result.rank}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {result.place_name}
                              </h3>
                              {result.category && (
                                <Badge variant="outline" className="mt-1 border-gray-700 text-gray-400">
                                  {result.category}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-400">
                            {result.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{result.address}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4">
                              {result.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span>{result.rating}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <span>방문자 리뷰: {result.visitor_review_count}</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span>블로그 리뷰: {result.blog_review_count}</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 truncate max-w-2xl">
                              {result.place_url}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-6">
                          <Button
                            size="sm"
                            onClick={() => addToPortfolio(result)}
                            className="whitespace-nowrap"
                          >
                            포트폴리오 추가
                          </Button>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {result.rank}위
                            </div>
                            <div className="text-xs text-gray-500">
                              현재 순위
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gray-800">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-gray-400">
                      다른 키워드로 다시 검색해보세요
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Information Cards */}
        {!searchCompleted && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  무료 분석 (0 크레딧)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    현재 순위 확인
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    리뷰 수 정보
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    경쟁사 순위 비교
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    포트폴리오 추가 가능
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                  상세 분석 (무료)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                    순위 변화 추이 그래프
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                    경쟁사 분석 리포트
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                    키워드별 순위 비교
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                    실시간 알림 설정
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Credit Recharge Modal */}
      <CreditRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onSuccess={() => {
          toast({
            title: '충전 요청 완료',
            description: '입금 확인 후 크레딧이 자동으로 충전됩니다.',
          })
        }}
      />
    </div>
  )
}