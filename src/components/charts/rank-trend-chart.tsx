'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RankData {
  date: string
  rank: number | null
}

interface RankTrendChartProps {
  data: RankData[]
  title?: string
  description?: string
  height?: number
}

export function RankTrendChart({ 
  data, 
  title = '순위 변화 추이',
  description = '시간에 따른 검색 순위 변화',
  height = 400 
}: RankTrendChartProps) {
  // Filter out null ranks and format data
  const chartData = data
    .filter(item => item.rank !== null)
    .map(item => ({
      ...item,
      date: format(new Date(item.date), 'MM/dd', { locale: ko }),
      displayDate: format(new Date(item.date), 'PPP', { locale: ko }),
      // Invert rank for better visualization (lower rank = higher position)
      invertedRank: item.rank
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
            아직 순위 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate average rank
  const avgRank = Math.round(
    chartData.reduce((sum, item) => sum + (item.rank || 0), 0) / chartData.length
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              reversed
              domain={[1, 'dataMax + 5']}
              ticks={[1, 5, 10, 15, 20]}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              label={{ 
                value: '순위', 
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
                    <div className="bg-popover p-2 rounded-lg shadow-lg border">
                      <p className="text-sm font-medium">{data.displayDate}</p>
                      <p className="text-sm text-primary">
                        순위: {data.rank}위
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="line"
            />
            <ReferenceLine 
              y={avgRank} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: `평균: ${avgRank}위`, 
                position: 'right',
                style: { fontSize: 12 }
              }}
            />
            <Line 
              type="monotone" 
              dataKey="invertedRank" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name="순위"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}