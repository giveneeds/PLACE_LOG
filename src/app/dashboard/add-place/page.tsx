'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import { AdminOnly } from '@/components/auth/role-guard'

export default function AddPlacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    place_url: '',
    place_name: '',
    search_keyword: '',
  })

  // 네이버 플레이스 URL에서 플레이스명 추출 및 ID 추출
  const extractPlaceInfo = (url: string) => {
    try {
      const urlObj = new URL(url)
      let placeId = ''
      
      if (urlObj.hostname.includes('naver')) {
        // 모바일 버전: https://m.place.naver.com/restaurant/38758389
        // 데스크톱 버전: https://map.naver.com/v5/entry/place/38758389
        
        if (urlObj.hostname === 'm.place.naver.com') {
          // 모바일 버전에서 ID 추출
          const pathParts = urlObj.pathname.split('/')
          placeId = pathParts[pathParts.length - 1]
        } else if (urlObj.hostname === 'map.naver.com') {
          // 데스크톱 버전에서 ID 추출
          const match = urlObj.pathname.match(/\/place\/(\d+)/)
          if (match) placeId = match[1]
        }
        
        return {
          placeName: `네이버 플레이스 (ID: ${placeId})`,
          placeId: placeId
        }
      }
    } catch (error) {
      console.error('URL 파싱 실패:', error)
    }
    return { placeName: '', placeId: '' }
  }

  const handleUrlChange = (url: string) => {
    const { placeName } = extractPlaceInfo(url)
    setFormData(prev => ({
      ...prev,
      place_url: url,
      place_name: url ? placeName : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '플레이스를 등록하려면 로그인해주세요.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    try {
      // Use the advanced keywords API for consistency
      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: formData.search_keyword,
          placeUrl: formData.place_url,
          placeName: formData.place_name || '플레이스명 미설정',
          tags: [], // Empty tags for simple registration
          periodStart: null,
          periodEnd: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register place')
      }

      toast({
        title: '플레이스 등록 완료',
        description: '플레이스가 성공적으로 등록되었습니다.',
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: '등록 실패',
        description: error.message || '플레이스 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminOnly fallback={
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">관리자 권한 필요</h2>
              <p className="text-gray-600 mb-4">플레이스 등록은 관리자만 가능합니다.</p>
              <Button onClick={() => router.push('/dashboard')}>
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
        <CardHeader>
          <CardTitle>새 플레이스 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="place_url">네이버 플레이스 URL *</Label>
              <Input
                id="place_url"
                type="url"
                placeholder="https://m.place.naver.com/restaurant/38758389"
                value={formData.place_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                네이버 플레이스 앱이나 모바일 웹에서 플레이스 URL을 복사해서 붙여넣으세요. (모바일/데스크톱 모두 지원)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_name">플레이스명</Label>
              <Input
                id="place_name"
                type="text"
                placeholder="예: 홍길동 카페"
                value={formData.place_name}
                onChange={(e) => setFormData(prev => ({ ...prev, place_name: e.target.value }))}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                비워두면 자동으로 추출됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search_keyword">검색 키워드 *</Label>
              <Input
                id="search_keyword"
                type="text"
                placeholder="예: 강남 맛집, 부산 카페"
                value={formData.search_keyword}
                onChange={(e) => setFormData(prev => ({ ...prev, search_keyword: e.target.value }))}
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                이 키워드로 네이버에서 검색했을 때의 순위를 추적합니다.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? '등록 중...' : '등록하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </AdminOnly>
  )
}