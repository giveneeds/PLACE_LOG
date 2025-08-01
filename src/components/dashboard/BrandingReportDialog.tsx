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
import { TrendingUp, TrendingDown, Award, AlertTriangle, FileText, Download, Calendar, Activity, Target, Lightbulb } from 'lucide-react'
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

interface BrandingReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeId: string
}

interface ReportData {
  place: {
    id: string
    place_name: string
    search_keyword: string
    place_url: string
    created_at: string
  }
  stats: {
    currentRank: number | null
    previousRank: number | null
    bestRank: number | null
    worstRank: number | null
    averageRank: number | null
    totalRecords: number
    validRecords: number
  }
  trend: 'improving' | 'declining' | 'stable'
  analysis: {
    summary: string
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
  chartData: Array<{
    date: string
    rank: number | null
  }>
  generatedAt: string
}

export function BrandingReportDialog({ open, onOpenChange, placeId }: BrandingReportDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    if (open && placeId) {
      fetchReportData()
    }
  }, [open, placeId])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/places/${placeId}/report`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: '플레이스를 찾을 수 없습니다',
            description: '해당 플레이스가 존재하지 않거나 권한이 없습니다.',
            variant: 'destructive',
          })
          onOpenChange(false)
          return
        }
        throw new Error('Failed to fetch report data')
      }

      const data = await response.json()
      setReportData(data)
    } catch (error: any) {
      toast({
        title: '보고서 생성 실패',
        description: error.message || '보고서를 생성하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-blue-500" />
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '상승 추세'
      case 'declining':
        return '하락 추세'
      default:
        return '안정적'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-500'
      case 'declining':
        return 'text-red-500'
      default:
        return 'text-blue-500'
    }
  }

  const formatChartData = () => {
    if (!reportData) return []
    
    return reportData.chartData.map(item => ({
      ...item,
      displayDate: format(new Date(item.date), 'MM/dd', { locale: ko }),
      fullDate: format(new Date(item.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }),
      rank: item.rank || null
    }))
  }

  const handleDownloadPDF = () => {
    toast({
      title: 'PDF 다운로드',
      description: 'PDF 다운로드 기능은 준비 중입니다.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-dark-elevated border-gray-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                브랜딩 보고서
              </DialogTitle>
              {reportData && (
                <p className="text-gray-400 mt-1">
                  {reportData.place.place_name} • {reportData.place.search_keyword}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">보고서 생성 중...</div>
          </div>
        ) : reportData ? (
          <>
            {/* Header Info */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(reportData.trend)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        현재 상태: {getTrendText(reportData.trend)}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {format(new Date(reportData.generatedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })} 기준
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {reportData.stats.currentRank || '-'}위
                    </div>
                    <p className="text-gray-400 text-sm">현재 순위</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              <Card className="border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">최고 순위</p>
                      <p className="text-xl font-bold text-white">
                        {reportData.stats.bestRank || '-'}위
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
                      <p className="text-xl font-bold text-white">
                        {reportData.stats.worstRank || '-'}위
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
                      <p className="text-xl font-bold text-white">
                        {reportData.stats.averageRank || '-'}위
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
                      <p className="text-xl font-bold text-white">
                        {reportData.stats.totalRecords}회
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">순위 변화 추이 (최근 30일)</h3>
                
                {reportData.chartData.length > 0 ? (
                  <div className="h-64">
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
                          labelFormatter={(label: any, payload: any) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.fullDate
                            }
                            return label
                          }}
                        />
                        {reportData.stats.averageRank && (
                          <ReferenceLine 
                            y={reportData.stats.averageRank} 
                            stroke="#6B7280" 
                            strokeDasharray="8 8"
                            label={{ value: "평균", fill: "#9CA3AF", position: "right" }}
                          />
                        )}
                        <Line 
                          type="monotone" 
                          dataKey="rank" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    순위 데이터가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Summary */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  종합 분석
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {reportData.analysis.summary}
                </p>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card className="border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    강점
                  </h3>
                  <ul className="space-y-2">
                    {reportData.analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    개선점
                  </h3>
                  <ul className="space-y-2">
                    {reportData.analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="border-gray-800 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  개선 제안사항
                </h3>
                <ul className="space-y-3">
                  {reportData.analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-300">
                      <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-500 text-sm font-semibold">{index + 1}</span>
                      </div>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}