'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ReviewData {
  date: string
  reviewCount: number | null
  visitorReviewCount: number | null
  blogReviewCount: number | null
}

interface ReviewTrendChartProps {
  data: ReviewData[]
  title?: string
  description?: string
  height?: number
}

export function ReviewTrendChart({ 
  data, 
  title = '리뷰 증가 추이',
  description = '방문자 리뷰와 블로그 리뷰 변화량',
  height = 400 
}: ReviewTrendChartProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MM/dd', { locale: ko }),
    displayDate: format(new Date(item.date), 'PPP', { locale: ko }),
    총리뷰: item.reviewCount || 0,
    방문자리뷰: item.visitorReviewCount || 0,
    블로그리뷰: item.blogReviewCount || 0
  }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            아직 리뷰 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate growth
  const firstData = chartData[0]
  const lastData = chartData[chartData.length - 1]
  const totalGrowth = lastData.총리뷰 - firstData.총리뷰
  const visitorGrowth = lastData.방문자리뷰 - firstData.방문자리뷰
  const blogGrowth = lastData.블로그리뷰 - firstData.블로그리뷰

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-muted-foreground">
              총 증가: <span className="font-medium text-foreground">+{totalGrowth}</span>
            </span>
            <span className="text-muted-foreground">
              방문자: <span className="font-medium text-foreground">+{visitorGrowth}</span>
            </span>
            <span className="text-muted-foreground">
              블로그: <span className="font-medium text-foreground">+{blogGrowth}</span>
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorBlog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              label={{ 
                value: '리뷰 수', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 12 }
              }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-popover p-3 rounded-lg shadow-lg border">
                      <p className="text-sm font-medium mb-2">{data.displayDate}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-primary">총 리뷰:</span> {data.총리뷰}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium" style={{ color: 'hsl(var(--chart-1))' }}>
                            방문자 리뷰:
                          </span> {data.방문자리뷰}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium" style={{ color: 'hsl(var(--chart-2))' }}>
                            블로그 리뷰:
                          </span> {data.블로그리뷰}
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="rect"
            />
            <Area
              type="monotone"
              dataKey="총리뷰"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="방문자리뷰"
              stackId="2"
              stroke="hsl(var(--chart-1))"
              fill="url(#colorVisitor)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="블로그리뷰"
              stackId="2"
              stroke="hsl(var(--chart-2))"
              fill="url(#colorBlog)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}