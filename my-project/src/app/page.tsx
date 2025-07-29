import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, TrendingUp, Shield, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          네이버 플레이스 순위를<br />
          <span className="text-blue-600">실시간으로 추적하세요</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          경쟁사 분석부터 내 매장 순위 관리까지,<br />
          데이터 기반의 스마트한 마케팅을 시작하세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg">
              무료로 시작하기
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline">
              로그인
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">실시간 순위 추적</h3>
            </div>
            <p className="text-gray-600">
              매일 2회 자동으로 순위를 확인하여<br />
              변화 추이를 한눈에 파악할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-semibold">경쟁사 분석</h3>
            </div>
            <p className="text-gray-600">
              같은 키워드로 검색되는 경쟁사들의<br />
              순위 변화를 함께 모니터링하세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">마케팅 인사이트</h3>
            </div>
            <p className="text-gray-600">
              성공한 마케팅 전략과 작업 메모를<br />
              크레딧으로 열람할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-12">간단한 3단계로 시작하세요</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold">플레이스 등록</h3>
            <p className="text-gray-600">
              네이버 플레이스 URL과<br />
              추적하고 싶은 검색어를 입력하세요
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold">자동 모니터링</h3>
            <p className="text-gray-600">
              매일 오전 11시, 오후 2시에<br />
              자동으로 순위를 확인합니다
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold">결과 확인</h3>
            <p className="text-gray-600">
              대시보드에서 순위 변화를<br />
              그래프와 표로 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-blue-50 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">지금 바로 시작해보세요</h2>
        <p className="text-gray-600 mb-8">
          무료 회원가입으로 Place Log Pro의 모든 기능을 경험해보세요
        </p>
        <Link href="/auth/signup">
          <Button size="lg">
            무료 회원가입
          </Button>
        </Link>
      </div>
    </div>
  )
}