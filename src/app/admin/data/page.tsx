'use client'

import { useEffect, useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Database, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface DataStats {
  totalPlaces: number
  activePlaces: number
  totalRankings: number
  recentRankings: number
  avgRanking: number
  crawlSuccess: number
}

interface PlaceData {
  id: string
  place_name: string
  search_keyword: string
  is_active: boolean
  user_email: string
  latest_rank: number | null
  latest_crawl: string | null
  total_rankings: number
  created_at: string
}

export default function AdminDataPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DataStats | null>(null)
  const [places, setPlaces] = useState<PlaceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsResponse, placesResponse] = await Promise.all([
        fetch('/api/admin/data/stats'),
        fetch('/api/admin/data/places')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        setPlaces(placesData.places)
      }
    } catch (error: any) {
      toast({
        title: '데이터 로드 실패',
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (isActive: boolean, latestCrawl: string | null) => {
    if (!isActive) return 'bg-gray-500'
    if (!latestCrawl) return 'bg-yellow-500'
    
    const daysSinceUpdate = (Date.now() - new Date(latestCrawl).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > 7) return 'bg-red-500'
    if (daysSinceUpdate > 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (isActive: boolean, latestCrawl: string | null) => {
    if (!isActive) return '비활성'
    if (!latestCrawl) return '대기중'
    
    const daysSinceUpdate = (Date.now() - new Date(latestCrawl).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > 7) return '오래됨'
    if (daysSinceUpdate > 3) return '지연'
    return '최신'
  }

  return (
    <AdminOnly fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
              <Link href="/dashboard">
                <Button>대시보드로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-dark-base">
        <div className="container-content py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                관리자 대시보드
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">데이터 관리</h1>
              <p className="text-gray-400">플레이스 데이터 및 크롤링 현황</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">총 플레이스</p>
                    <p className="text-lg font-bold text-white">{stats?.totalPlaces || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">활성 플레이스</p>
                    <p className="text-lg font-bold text-white">{stats?.activePlaces || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">총 순위기록</p>
                    <p className="text-lg font-bold text-white">{stats?.totalRankings || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">최근 7일</p>
                    <p className="text-lg font-bold text-white">{stats?.recentRankings || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">평균 순위</p>
                    <p className="text-lg font-bold text-white">
                      {stats?.avgRanking ? `${stats.avgRanking.toFixed(1)}위` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">성공률</p>
                    <p className="text-lg font-bold text-white">
                      {stats?.crawlSuccess ? `${stats.crawlSuccess.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Places Table */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">플레이스 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">로딩 중...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">상태</TableHead>
                      <TableHead className="text-gray-300">플레이스명</TableHead>
                      <TableHead className="text-gray-300">키워드</TableHead>
                      <TableHead className="text-gray-300">소유자</TableHead>
                      <TableHead className="text-gray-300">최신 순위</TableHead>
                      <TableHead className="text-gray-300">마지막 크롤링</TableHead>
                      <TableHead className="text-gray-300">총 기록</TableHead>
                      <TableHead className="text-gray-300">등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {places.map((place) => (
                      <TableRow key={place.id} className="border-gray-800">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getStatusColor(place.is_active, place.latest_crawl)}`}
                            />
                            <span className="text-xs text-gray-400">
                              {getStatusText(place.is_active, place.latest_crawl)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{place.place_name}</TableCell>
                        <TableCell className="text-gray-300">{place.search_keyword}</TableCell>
                        <TableCell className="text-gray-300">{place.user_email}</TableCell>
                        <TableCell>
                          {place.latest_rank ? (
                            <Badge variant="secondary">{place.latest_rank}위</Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(place.latest_crawl)}
                        </TableCell>
                        <TableCell className="text-gray-300">{place.total_rankings}</TableCell>
                        <TableCell className="text-gray-300">
                          {formatDate(place.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminOnly>
  )
}