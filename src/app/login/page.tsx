'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      console.log('Login response:', { data, error })

      if (error) throw error
      
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
      })

      // Check for redirect parameter
      const searchParams = new URLSearchParams(window.location.search)
      const redirectUrl = searchParams.get('redirect') || '/dashboard'
      
      router.push(redirectUrl)
      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      
      let errorMessage = '이메일 또는 비밀번호를 확인해주세요.'
      
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Supabase 설정에서 이메일 확인을 비활성화해주세요. 또는 이메일을 확인하고 다시 시도하세요.'
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.'
      }
      
      toast({
        title: '로그인 실패',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gradient mb-2">Place Log</div>
          <p className="text-gray-400">네이버 플레이스 순위 추적 플랫폼</p>
        </div>

        {/* Login Form */}
        <Card className="border-gray-800">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-white">로그인</CardTitle>
            <CardDescription className="text-gray-400">
              계정에 로그인하여 대시보드로 이동하세요
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-dark-elevated2 border-gray-700 focus:border-primary text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="bg-dark-elevated2 border-gray-700 focus:border-primary text-white placeholder:text-gray-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              
              <div className="text-sm text-center text-gray-400">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="text-primary hover:text-primary-light font-medium transition-colors">
                  무료 회원가입
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Benefits */}
        <div className="mt-8 p-6 bg-dark-elevated2 rounded-lg border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">로그인하면 이용 가능한 서비스</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              실시간 네이버 플레이스 순위 추적 (무료)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              경쟁사 분석 및 비교 (무료)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              검증된 마케팅 레시피 열람 (1 크레딧)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}