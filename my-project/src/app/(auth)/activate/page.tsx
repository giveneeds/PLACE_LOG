'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { authApi } from '@/lib/api'

export default function ActivatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  
  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      return
    }
    
    authApi.activate(token)
      .then(() => {
        setStatus('success')
        toast({
          title: '계정 활성화 성공',
          description: '이제 로그인할 수 있습니다.',
        })
      })
      .catch(() => {
        setStatus('error')
        toast({
          title: '계정 활성화 실패',
          description: '유효하지 않거나 만료된 링크입니다.',
          variant: 'destructive',
        })
      })
  }, [searchParams, toast])

  return (
    <Card>
      <CardHeader>
        <CardTitle>계정 활성화</CardTitle>
        <CardDescription>
          {status === 'loading' && '계정을 활성화하는 중입니다...'}
          {status === 'success' && '계정이 성공적으로 활성화되었습니다!'}
          {status === 'error' && '계정 활성화에 실패했습니다.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' && (
          <Button onClick={() => router.push('/auth/login')} className="w-full">
            로그인하러 가기
          </Button>
        )}
        {status === 'error' && (
          <Button onClick={() => router.push('/auth/signup')} className="w-full">
            회원가입 페이지로
          </Button>
        )}
      </CardContent>
    </Card>
  )
}