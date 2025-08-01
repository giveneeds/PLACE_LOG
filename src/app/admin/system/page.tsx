'use client'

import { useEffect, useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Server, Database, Clock, CheckCircle, XCircle, AlertTriangle, Activity, Settings, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error'
  crawler: 'running' | 'stopped' | 'error'
  github_actions: 'active' | 'inactive' | 'error'
  last_crawl: string | null
  uptime: string
  total_requests: number
  error_rate: number
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  source: string
}

interface CrawlerConfig {
  schedule: string
  max_results: number
  timeout: number
  retry_attempts: number
  active: boolean
}

export default function AdminSystemPage() {
  const { toast } = useToast()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [config, setConfig] = useState<CrawlerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchSystemData()
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [statusResponse, logsResponse, configResponse] = await Promise.all([
        fetch('/api/admin/system/status'),
        fetch('/api/admin/system/logs'),
        fetch('/api/admin/system/config')
      ])

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatus(statusData.status)
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs)
      }

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfig(configData.config)
      }
    } catch (error: any) {
      toast({
        title: '시스템 데이터 로드 실패',
        description: error.message || '시스템 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshSystemStatus = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/system/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        toast({
          title: '시스템 상태 새로고침 완료',
          description: '시스템 상태가 업데이트되었습니다.',
        })
      }
    } catch (error: any) {
      toast({
        title: '새로고침 실패',
        description: error.message || '시스템 상태를 새로고침하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
      case 'stopped':
      case 'inactive':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'active':
        return 'bg-green-500'
      case 'warning':
      case 'stopped':
      case 'inactive':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  관리자 대시보드
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">시스템 설정</h1>
                <p className="text-gray-400">시스템 상태 모니터링 및 설정 관리</p>
              </div>
            </div>
            <Button onClick={refreshSystemStatus} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : (
            <Tabs defaultValue="status" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="status">시스템 상태</TabsTrigger>
                <TabsTrigger value="logs">시스템 로그</TabsTrigger>                
                <TabsTrigger value="config">크롤러 설정</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-6">
                {/* System Status Overview */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">데이터베이스</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status?.database || 'unknown')}
                            <span className="text-sm text-white capitalize">
                              {status?.database || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">크롤러</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status?.crawler || 'unknown')}
                            <span className="text-sm text-white capitalize">
                              {status?.crawler || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Server className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">GitHub Actions</p>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status?.github_actions || 'unknown')}
                            <span className="text-sm text-white capitalize">
                              {status?.github_actions || 'Unknown'}
                            </span>
                          </div>
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
                        <div className="flex-1">
                          <p className="text-xs text-gray-400">마지막 크롤링</p>
                          <p className="text-sm text-white">
                            {status?.last_crawl ? formatDate(status.last_crawl) : '없음'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-gray-800">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-2">시스템 업타임</p>
                        <p className="text-2xl font-bold text-white">
                          {status?.uptime || '0시간'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-2">총 요청 수</p>
                        <p className="text-2xl font-bold text-white">
                          {status?.total_requests?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-800">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-2">에러율</p>
                        <p className="text-2xl font-bold text-white">
                          {status?.error_rate ? `${status.error_rate.toFixed(2)}%` : '0%'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-6">
                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">시스템 로그</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-300">시간</TableHead>
                          <TableHead className="text-gray-300">레벨</TableHead>
                          <TableHead className="text-gray-300">소스</TableHead>
                          <TableHead className="text-gray-300">메시지</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id} className="border-gray-800">
                            <TableCell className="text-gray-300">
                              {formatDate(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                log.level === 'error' ? 'destructive' :
                                log.level === 'warning' ? 'secondary' : 'default'
                              }>
                                {log.level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{log.source}</TableCell>
                            <TableCell className="text-white">{log.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="space-y-6">
                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">크롤러 설정</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {config ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-300 block mb-2">스케줄</label>
                            <p className="text-white bg-gray-800 p-2 rounded">
                              {config.schedule}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-300 block mb-2">최대 결과 수</label>
                            <p className="text-white bg-gray-800 p-2 rounded">
                              {config.max_results}개
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-300 block mb-2">타임아웃</label>
                            <p className="text-white bg-gray-800 p-2 rounded">
                              {config.timeout}초
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-300 block mb-2">재시도 횟수</label>
                            <p className="text-white bg-gray-800 p-2 rounded">
                              {config.retry_attempts}회
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-300 block mb-2">상태</label>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${config.active ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-white">
                                {config.active ? '활성' : '비활성'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        설정 정보를 불러올 수 없습니다.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AdminOnly>
  )
}