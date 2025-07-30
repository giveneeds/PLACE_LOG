'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('테스트 중...')
  const [profilesStatus, setProfilesStatus] = useState<string>('확인 중...')
  const [authStatus, setAuthStatus] = useState<string>('확인 중...')
  const [details, setDetails] = useState<any>({})

  const supabase = createClient()

  const testConnection = async () => {
    try {
      // 1. 기본 연결 테스트
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
      
      if (error) {
        setConnectionStatus(`연결 실패: ${error.message}`)
        setDetails(prev => ({ ...prev, connectionError: error }))
      } else {
        setConnectionStatus('✅ Supabase 연결 성공')
        setProfilesStatus(`✅ profiles 테이블 확인됨 (${data?.length || 0}개 레코드)`)
      }
    } catch (error: any) {
      setConnectionStatus(`연결 오류: ${error.message}`)
      setDetails(prev => ({ ...prev, connectionError: error }))
    }

    // 2. 인증 상태 확인
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setAuthStatus(`인증 오류: ${error.message}`)
      } else if (user) {
        setAuthStatus(`✅ 로그인 상태: ${user.email}`)
        
        // 프로필 확인
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (profileError) {
            setDetails(prev => ({ ...prev, profileError, userId: user.id }))
          } else {
            setDetails(prev => ({ ...prev, profile, userId: user.id }))
          }
        } catch (profileError) {
          setDetails(prev => ({ ...prev, profileError, userId: user.id }))
        }
      } else {
        setAuthStatus('❌ 로그인되지 않음')
      }
    } catch (error: any) {
      setAuthStatus(`인증 확인 오류: ${error.message}`)
    }
  }

  const createTestProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          name: user.email!,
          role: 'admin'
        })
        .select()

      if (error) {
        alert(`프로필 생성 실패: ${error.message}`)
      } else {
        alert('프로필이 생성/업데이트되었습니다!')
        testConnection() // 재테스트
      }
    } catch (error: any) {
      alert(`오류: ${error.message}`)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>연결 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Supabase 연결:</strong> {connectionStatus}</p>
              <p><strong>Profiles 테이블:</strong> {profilesStatus}</p>
              <p><strong>인증 상태:</strong> {authStatus}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>환경변수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p><strong>ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>세부 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={testConnection}>다시 테스트</Button>
          <Button onClick={createTestProfile} variant="outline">
            관리자 프로필 생성
          </Button>
        </div>
      </div>
    </div>
  )
}