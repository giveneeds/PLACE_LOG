'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { canAccessAdminFeatures } from '@/lib/auth/rbac'
import { BarChart3, LogOut, User, Settings } from 'lucide-react'

export function Navbar() {
  const { user, userRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: '로그아웃 완료',
        description: '성공적으로 로그아웃되었습니다.',
      })
      
      router.push('/')
    } catch (error: any) {
      toast({
        title: '로그아웃 실패',
        description: error.message || '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="w-6 h-6" />
            Place Log Pro
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">대시보드</Button>
                </Link>
                {canAccessAdminFeatures(userRole) && (
                  <Link href="/admin">
                    <Button variant="ghost">
                      <Settings className="w-4 h-4 mr-2" />
                      관리자
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  {user.email}
                  {userRole && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {userRole === 'admin' ? '관리자' : '사용자'}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/signup">
                  <Button>회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}