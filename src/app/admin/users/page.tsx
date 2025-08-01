'use client'

import { useEffect, useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Users, Shield, User } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  credit_balance: number
  tracked_places_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage])

  const fetchUsers = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?page=${page}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error: any) {
      toast({
        title: '사용자 목록 로드 실패',
        description: error.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user role')
      }

      toast({
        title: '권한 변경 완료',
        description: `사용자 권한이 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다.`,
      })

      // 목록 새로고침
      await fetchUsers(currentPage)
    } catch (error: any) {
      toast({
        title: '권한 변경 실패',
        description: error.message || '권한 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
              <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
              <p className="text-gray-400">등록된 사용자 목록 및 권한 관리</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">총 사용자</p>
                    <p className="text-2xl font-bold text-white">{pagination?.total || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">관리자</p>
                    <p className="text-2xl font-bold text-white">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">일반 사용자</p>
                    <p className="text-2xl font-bold text-white">
                      {users.filter(u => u.role === 'user').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">사용자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">로딩 중...</div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-300">이메일</TableHead>
                        <TableHead className="text-gray-300">역할</TableHead>
                        <TableHead className="text-gray-300">크레딧</TableHead>
                        <TableHead className="text-gray-300">플레이스</TableHead>
                        <TableHead className="text-gray-300">가입일</TableHead>
                        <TableHead className="text-gray-300">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-gray-800">
                          <TableCell className="text-white">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? '관리자' : '일반'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.credit_balance?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.tracked_places_count}개
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">일반</SelectItem>
                                <SelectItem value="admin">관리자</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-gray-400 text-sm">
                        총 {pagination.total}명 중 {((pagination.page - 1) * pagination.limit) + 1}-
                        {Math.min(pagination.page * pagination.limit, pagination.total)}명 표시
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page <= 1}
                          onClick={() => setCurrentPage(pagination.page - 1)}
                        >
                          이전
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => setCurrentPage(pagination.page + 1)}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminOnly>
  )
}