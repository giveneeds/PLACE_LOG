'use client'

import { useEffect, useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Database, CreditCard, FileText } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface AdminStats {
  totalUsers: number
  totalPlaces: number
  totalCredits: number
  totalMemoViews: number
  userGrowth: string
  placeGrowth: string
  creditGrowth: string
  memoGrowth: string
}

export default function AdminPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data.stats)
    } catch (error: any) {
      toast({
        title: '통계 로드 실패',
        description: error.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
        <div className="container mx-auto p-6">
          <div className="text-center">로딩 중...</div>
        </div>
      </AdminOnly>
    )
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600 mt-1">시스템 관리 및 사용자 관리</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.userGrowth || 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록된 플레이스</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPlaces?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.placeGrowth || 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">크레딧 판매</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCredits?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.creditGrowth || 'Loading...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">메모 조회수</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMemoViews?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.memoGrowth || 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>사용자 관리</CardTitle>
              <CardDescription>
                사용자 계정 및 권한 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/users">
                  <Button className="w-full" variant="outline">
                    사용자 목록 보기
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button className="w-full" variant="outline">
                    권한 관리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>데이터 관리</CardTitle>
              <CardDescription>
                플레이스 데이터 및 크롤링 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/data">
                  <Button className="w-full" variant="outline">
                    데이터 현황
                  </Button>
                </Link>
                <Button className="w-full" variant="outline">
                  크롤링 설정
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>레시피 관리</CardTitle>
              <CardDescription>
                마케팅 레시피 등록, 수정, 삭제
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/recipes">
                  <Button className="w-full" variant="outline">
                    레시피 관리
                  </Button>
                </Link>
                <Button className="w-full" variant="outline">
                  레시피 통계
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>결제 관리</CardTitle>
              <CardDescription>
                무통장 입금 확인 및 크레딧 지급
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/payments">
                  <Button className="w-full" variant="outline">
                    결제 승인
                  </Button>
                </Link>
                <Button className="w-full" variant="outline">
                  거래 내역
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>시스템 설정</CardTitle>
              <CardDescription>
                시스템 환경 설정 및 모니터링
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/system">
                  <Button className="w-full" variant="outline">
                    시스템 상태
                  </Button>
                </Link>
                <Link href="/admin/system">
                  <Button className="w-full" variant="outline">
                    로그 관리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>통계 및 분석</CardTitle>
              <CardDescription>
                사용량 통계 및 비즈니스 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/analytics">
                  <Button className="w-full" variant="outline">
                    사용량 통계
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button className="w-full" variant="outline">
                    수익 분석
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminOnly>
  )
}