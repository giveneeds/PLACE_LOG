'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  BarChart3,
  Calendar,
  Award,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface PlaceDetailProps {
  params: Promise<{ id: string }>
}

interface PlaceData {
  id: string
  place_name: string
  place_url: string
  search_keyword: string
  is_active: boolean
  created_at: string
}

interface RankingData {
  date: string
  rank: number | null
  id: string
}

interface Stats {
  totalRecords: number
  validRecords: number
  bestRank: number | null
  worstRank: number | null
  averageRank: number | null
  currentRank: number | null
  previousRank: number | null
}

export default function PlaceDetailPage({ params }: PlaceDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [place, setPlace] = useState<PlaceData | null>(null)
  const [rankings, setRankings] = useState<RankingData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [range, setRange] = useState('30d')

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params
      await fetchPlaceData(id)
    }
    fetchData()
  }, [params, range])

  const fetchPlaceData = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/places/${id}/rankings?range=${range}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: '플레이스를 찾을 수 없습니다',
            description: '해당 플레이스가 존재하지 않거나 권한이 없습니다.',
            variant: 'destructive',
          })
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch place data')
      }

      const data = await response.json()
      setPlace(data.place)
      setRankings(data.rankings)
      setStats(data.stats)
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

  const handleRefresh = async () => {
    if (!place) return
    
    try {
      setRefreshing(true)
      const response = await fetch('/api/rankings/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId: place.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh ranking')
      }

      toast({
        title: '순위 새로고침 완료',
        description: '최신 순위가 업데이트되었습니다.',
      })

      // 데이터 다시 로드
      await fetchPlaceData(place.id)
    } catch (error: any) {
      toast({
        title: '새로고침 실패',
        description: error.message || '순위를 새로고침하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getRankChange = () => {
    if (!stats || !stats.currentRank || !stats.previousRank) return null
    return stats.previousRank - stats.currentRank
  }

  const getRankChangeIcon = () => {
    const change = getRankChange()
    if (change === null) return <Minus className="w-5 h-5 text-gray-500" />
    if (change > 0) return <TrendingUp className="w-5 h-5 text-green-500" />
    if (change < 0) return <TrendingDown className="w-5 h-5 text-red-500" />
    return <Minus className="w-5 h-5 text-gray-500" />
  }

  const formatChartData = () => {
    return rankings.map(r => ({
      ...r,
      displayDate: format(new Date(r.date), 'MM/dd', { locale: ko }),
      fullDate: format(new Date(r.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }),
      rank: r.rank || null
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  if (!place) {
    return null
  }

  const chartData = formatChartData()

  return (
    <div className="min-h-screen bg-dark-base">
      <div className="container-content py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                대시보드로
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{place.place_name}</h1>
              <p className="text-gray-400">키워드: {place.search_keyword}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              순위 새로고침
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">현재 순위</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">
                      {stats?.currentRank || '-'}위
                    </p>
                    {getRankChange() !== null && (
                      <div className="flex items-center gap-1">
                        {getRankChangeIcon()}
                        <span className={`text-sm font-medium ${
                          getRankChange()! > 0 ? 'text-green-500' : 
                          getRankChange()! < 0 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {Math.abs(getRankChange()!)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">최고 순위</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.bestRank || '-'}위
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">최저 순위</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.worstRank || '-'}위
                  </p>
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
                  <p className="text-xs text-gray-400">평균 순위</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.averageRank || '-'}위
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">측정 횟수</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalRecords || 0}회
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">순위 변화 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      reversed
                      domain={[1, 'dataMax + 5']}
                      ticks={[1, 10, 20, 30, 40, 50]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#E5E7EB' }}
                      formatter={(value: any) => value ? `${value}위` : '측정 실패'}
                      labelFormatter={(label: any, payload: any) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullDate
                        }
                        return label
                      }}
                    />
                    {stats?.averageRank && (
                      <ReferenceLine 
                        y={stats.averageRank} 
                        stroke="#6B7280" 
                        strokeDasharray="8 8"
                        label={{ value: "평균", fill: "#9CA3AF", position: "right" }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="rank" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                아직 수집된 순위 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rankings Table */}
        <Card className="border-gray-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white">순위 기록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400">날짜</th>
                    <th className="text-left py-3 px-4 text-gray-400">순위</th>
                    <th className="text-left py-3 px-4 text-gray-400">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.slice().reverse().map((ranking, index) => {
                    const previousRank = rankings[rankings.length - index - 2]?.rank
                    const change = previousRank && ranking.rank ? previousRank - ranking.rank : null
                    
                    return (
                      <tr key={ranking.id} className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white">
                          {format(new Date(ranking.date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </td>
                        <td className="py-3 px-4">
                          {ranking.rank ? (
                            <Badge variant="secondary">{ranking.rank}위</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">측정 실패</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {change !== null && (
                            <div className="flex items-center gap-1">
                              {change > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                              {change < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                              {change === 0 && <Minus className="w-4 h-4 text-gray-500" />}
                              <span className={`text-sm font-medium ${
                                change > 0 ? 'text-green-500' : 
                                change < 0 ? 'text-red-500' : 'text-gray-500'
                              }`}>
                                {change > 0 ? `+${change}` : change}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}