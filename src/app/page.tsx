import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, Eye, Users, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-base text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-dark-elevated">
        <div className="container-content py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gradient">
              Place Log
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  무료 회원가입
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-dark-elevated to-dark-base">
        <div className="container-content text-center">
          <h1 className="text-display-large mb-6 max-w-4xl mx-auto leading-tight">
            막막한 상위노출 작업,<br />
            <span className="text-gradient">구체적인 데이터로 모두 잡아내세요</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            네이버 플레이스 순위 추적부터 검증된 마케팅 레시피까지,<br />
            데이터 기반의 스마트한 상위노출 전략을 시작하세요.
          </p>

          {/* CTA Button */}
          <div className="mb-16">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-12 py-4 animate-hover">
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              ✓ 가입 시 3 크레딧 무료 제공 · ✓ 신용카드 불필요
            </p>
          </div>

          {/* Service Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-dark-elevated2 rounded-xl p-8 border border-gray-800 shadow-overlay">
              <div className="bg-dark-surface rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">실시간 순위 대시보드</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    실시간 업데이트
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-dark-elevated3 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">3위</div>
                    <div className="text-xs text-gray-400">강남 맛집</div>
                  </div>
                  <div className="bg-dark-elevated3 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-warning mb-1">7위</div>
                    <div className="text-xs text-gray-400">서울 카페</div>
                  </div>
                  <div className="bg-dark-elevated3 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">2위</div>
                    <div className="text-xs text-gray-400">분당 병원</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3가지 핵심 가치 */}
      <section className="py-20 bg-dark-elevated">
        <div className="container-content">
          <div className="text-center mb-16">
            <h2 className="text-display-medium mb-4">
              왜 Place Log인가요?
            </h2>
            <p className="text-lg text-gray-400">
              복잡한 상위노출 작업을 간단하고 명확하게
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 1. 경쟁사 데이터 분석 */}
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">경쟁사 데이터 분석</h3>
                <p className="text-gray-400 mb-6">
                  같은 키워드로 노출되는 경쟁사들의 순위 변화를 
                  실시간으로 추적하고 분석합니다.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    실시간 순위 추적
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    경쟁사 비교 분석
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    키워드별 순위 변화
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. 검증된 리워드 플랜 */}
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-4">검증된 리워드 플랜</h3>
                <p className="text-gray-400 mb-6">
                  실제로 성과를 낸 마케팅 전략과 
                  작업 플랜을 크레딧으로 열람할 수 있습니다.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-warning" />
                    실전 마케팅 레시피
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-warning" />
                    단계별 실행 가이드
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-warning" />
                    업종별 맞춤 전략
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. 레퍼런스의 대행사 즉시 연결 */}
            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-info/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-info" />
                </div>
                <h3 className="text-xl font-semibold mb-4">대행사 즉시 연결</h3>
                <p className="text-gray-400 mb-6">
                  검증된 레퍼런스를 보유한 마케팅 대행사의 
                  연락처를 즉시 확인할 수 있습니다.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-info" />
                    검증된 대행사 목록
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-info" />
                    실제 성과 레퍼런스
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-info" />
                    즉시 연락 가능
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 간단한 시작 과정 */}
      <section className="py-20 bg-dark-base">
        <div className="container-content">
          <div className="text-center mb-16">
            <h2 className="text-display-medium mb-4">
              30초면 시작할 수 있어요
            </h2>
            <p className="text-lg text-gray-400">
              복잡한 설정 없이 바로 사용 가능
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">회원가입</h3>
              <p className="text-gray-400">
                이메일만으로 간단하게 가입<br />
                3 크레딧 무료 제공
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">플레이스 등록</h3>
              <p className="text-gray-400">
                네이버 플레이스 URL과<br />
                키워드 입력 (무료)
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">결과 확인</h3>
              <p className="text-gray-400">
                실시간 순위 추적 시작<br />
                마케팅 레시피 열람
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary-dark/10 border-t border-gray-800">
        <div className="container-content text-center">
          <h2 className="text-display-medium mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            복잡한 상위노출 작업을 데이터로 단순화하고,<br />
            검증된 전략으로 실제 성과를 만들어보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-12 py-4 animate-hover">
                무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <div className="text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                무료 크레딧 3개 제공
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800 bg-dark-elevated">
        <div className="container-content">
          <div className="text-center text-gray-400">
            <div className="text-2xl font-bold text-gradient mb-4">Place Log</div>
            <p className="text-sm">
              © 2025 Place Log. 네이버 플레이스 순위 추적 및 마케팅 플랫폼
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}