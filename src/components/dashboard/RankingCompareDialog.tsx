'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Download } from 'lucide-react'
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
  Legend
} from 'recharts'

interface RankingCompareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword: string
}

interface PlaceInfo {
  id: string
  place_name: string
  place_url: string
}

interface PlaceStats {
  currentRank: number | null
  previousRank: number | null
  bestRank: number | null
  worstRank: number | null
  averageRank: number | null
  totalRecords: number
  validRecords: number
}

const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

export function RankingCompareDialog({ open, onOpenChange, keyword }: RankingCompareDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState('30d')
  const [places, setPlaces] = useState<PlaceInfo[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, PlaceStats & PlaceInfo>>({})

  useEffect(() => {
    if (open && keyword) {
      fetchCompareData()
    }
  }, [open, keyword, range])

  const fetchCompareData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rankings/compare?keyword=${encodeURIComponent(keyword)}&range=${range}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch compare data')
      }

      const data = await response.json()
      setPlaces(data.places)
      setChartData(data.chartData)
      setStats(data.stats)
    } catch (error: any) {
      toast({
        title: '데이터 로드 실패',
        description: error.message || '비교 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatChartData = () => {
    return chartData.map(item => ({
      ...item,
      displayDate: format(new Date(item.date), 'MM/dd', { locale: ko })
    }))
  }

  const getRankChange = (stats: PlaceStats) => {
    if (!stats.currentRank || !stats.previousRank) return null
    return stats.previousRank - stats.currentRank
  }

  const getRankChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-gray-500" />
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-dark-elevated border-gray-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                순위 비교 분석
              </DialogTitle>
              <p className="text-gray-400 mt-1">
                "{keyword}" 키워드의 플레이스별 순위 변화 비교
              </p>
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">로딩 중...</div>
          </div>
        ) : (
          <>
            {/* Chart Section */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  순위 변화 추이
                </h3>
                
                {chartData.length > 0 ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#E5E7EB' }}
                          formatter={(value: any) => value ? `${value}위` : '측정 실패'}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#E5E7EB' }}
                          iconType="line"
                        />
                        
                        {places.map((place, index) => (
                          <Line
                            key={place.id}
                            type="monotone"
                            dataKey={place.id}
                            name={place.place_name}
                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                            strokeWidth={2}
                            dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                            connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    비교할 데이터가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Table */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  플레이스별 상세 비교
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400">플레이스</th>
                        <th className="text-center py-3 px-4 text-gray-400">현재 순위</th>
                        <th className="text-center py-3 px-4 text-gray-400">변화</th>
                        <th className="text-center py-3 px-4 text-gray-400">평균 순위</th>
                        <th className="text-center py-3 px-4 text-gray-400">최고 순위</th>
                        <th className="text-center py-3 px-4 text-gray-400">최저 순위</th>
                        <th className="text-center py-3 px-4 text-gray-400">측정 횟수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(stats).map((placeStats) => {
                        const change = getRankChange(placeStats)
                        
                        return (
                          <tr key={placeStats.id} className="border-b border-gray-800">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-white">{placeStats.place_name}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {placeStats.place_url}
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              {placeStats.currentRank ? (
                                <Badge variant="secondary" className="bg-dark-elevated3">
                                  {placeStats.currentRank}위
                                </Badge>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {change !== null && (
                                <div className="flex items-center justify-center gap-1">
                                  {getRankChangeIcon(change)}
                                  <span className={`text-sm font-medium ${
                                    change > 0 ? 'text-green-500' : 
                                    change < 0 ? 'text-red-500' : 'text-gray-500'
                                  }`}>
                                    {change > 0 ? `+${Math.abs(change)}` : Math.abs(change)}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="text-center py-3 px-4 text-white">
                              {placeStats.averageRank || '-'}위
                            </td>
                            <td className="text-center py-3 px-4 text-green-500">
                              {placeStats.bestRank || '-'}위
                            </td>
                            <td className="text-center py-3 px-4 text-red-500">
                              {placeStats.worstRank || '-'}위
                            </td>
                            <td className="text-center py-3 px-4 text-gray-400">
                              {placeStats.validRecords}/{placeStats.totalRecords}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}