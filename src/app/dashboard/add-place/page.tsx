'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'

export default function AddPlacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    place_url: '',
    place_name: '',
    search_keyword: '',
  })

  // 네이버 플레이스 URL에서 플레이스명 추출 (간단한 예시)
  const extractPlaceName = (url: string) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('naver')) {
        // 실제로는 더 정교한 추출 로직이 필요
        return '네이버 플레이스' // 임시
      }
    } catch (error) {
      // URL 파싱 실패
    }
    return ''
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      place_url: url,
      place_name: url ? extractPlaceName(url) : ''
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
      const { error } = await supabase
        .from('tracked_places')
        .insert({
          user_id: user.id,
          place_url: formData.place_url,
          place_name: formData.place_name || '플레이스명 미설정',
          search_keyword: formData.search_keyword,
        })

      if (error) throw error

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

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              플레이스를 등록하려면 로그인해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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
                placeholder="https://map.naver.com/v5/entry/place/..."
                value={formData.place_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                네이버 지도에서 플레이스 URL을 복사해서 붙여넣으세요.
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
  )
}