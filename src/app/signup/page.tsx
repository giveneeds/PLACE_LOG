'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, CheckCircle, Gift } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  // 이미 로그인된 경우 대시보드로 리다이렉트
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: '오류',
        description: '비밀번호가 일치하지 않습니다.',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirm: true
          }
        },
      })

      console.log('Signup response:', { data, error })

      if (error) throw error

      // 사용자가 생성되었다면 profiles 테이블에 추가 시도
      if (data?.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              role: 'user',
            })
          
          if (profileError) {
            console.log('Profile creation error (might be expected if trigger works):', profileError)
          }
        } catch (profileError) {
          console.log('Profile creation failed:', profileError)
        }
      }

      // 회원가입 성공 처리
      if (data?.user) {
        if (data.session) {
          // 바로 로그인된 경우
          toast({
            title: '회원가입 성공',
            description: '환영합니다! 3 크레딧이 자동으로 지급되었습니다.',
          })
          router.push('/dashboard')
        } else {
          // 이메일 확인이 필요한 경우
          toast({
            title: '회원가입 성공',
            description: '로그인 페이지에서 동일한 정보로 로그인하세요.',
          })
          router.push('/login')
        }
      }
    } catch (error: any) {
      toast({
        title: '회원가입 실패',
        description: error.message || '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // AuthProvider가 아직 로딩 중이면 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-lg text-gray-400">로딩 중...</div>
        </div>
      </div>
    )
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
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Gift className="w-4 h-4 text-primary" />
            가입하면 3 크레딧 무료 제공
          </div>
        </div>

        {/* Signup Form */}
        <Card className="border-gray-800">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-white">무료 회원가입</CardTitle>
            <CardDescription className="text-gray-400">
              이메일과 비밀번호만으로 간단하게 시작하세요
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
                  placeholder="최소 6자리 이상"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={6}
                  className="bg-dark-elevated2 border-gray-700 focus:border-primary text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  minLength={6}
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
                {loading ? '처리중...' : '무료 회원가입'}
              </Button>
              
              <div className="text-sm text-center text-gray-400">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
                  로그인
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Welcome Benefits */}
        <div className="mt-8 p-6 bg-dark-elevated2 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-white">회원가입 혜택</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>가입 즉시 <strong className="text-primary">3 크레딧</strong> 무료 제공</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>네이버 플레이스 순위 추적 <strong className="text-white">무료</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>경쟁사 분석 및 비교 <strong className="text-white">무료</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span>검증된 마케팅 레시피 3개 열람 가능</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              신용카드 불필요
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              언제든 해지 가능
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              개인정보 보호
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}