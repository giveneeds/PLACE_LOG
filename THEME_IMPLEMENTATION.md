# 🎨 Spotify 기반 테마 시스템 구현 완료

## 📋 구현된 테마 시스템

### 1. 테마 정의 파일
- `src/styles/theme.ts` - 중앙화된 테마 객체
- Spotify 디자인 참조한 색상, 타이포그래피, 간격 정의
- CSS 변수로 내보내기 기능

### 2. Tailwind CSS 설정
- `tailwind.config.ts` 업데이트
- Spotify 스타일 색상 팔레트 적용
- 다크 테마 우선 설정
- 커스텀 애니메이션 및 트랜지션 추가

### 3. 글로벌 스타일
- `src/styles/globals.css` 전체 재작성
- Spotify 스타일 스크롤바
- 다크 테마 CSS 변수 설정
- 공통 애니메이션 클래스 추가

## 🎨 주요 디자인 토큰

### 색상 시스템
- **Primary**: `#1DB954` (Spotify 그린)
- **Background**: `#000000` (Pure Black)
- **Elevated**: `#121212`, `#1f1f1f`, `#2a2a2a` (계층적 배경)
- **Text**: `#ffffff`, `#b3b3b3`, `#a7a7a7` (텍스트 계층)

### 타이포그래피
- **Font Family**: Inter 기반 시스템 폰트
- **Font Size**: 12px~48px 체계적 스케일
- **Font Weight**: 400~900 범위

### 간격 시스템
- **Spacing**: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- **Border Radius**: 2px, 4px, 8px, 12px, 16px, 24px, full

## 🔧 업데이트된 컴포넌트

### 1. Button 컴포넌트
- Spotify 스타일 둥근 버튼 (pill shape)
- 호버 시 스케일 애니메이션
- 그린 기본 색상

### 2. Card 컴포넌트
- 다크 배경 (`#181818`)
- 호버 효과 및 그림자
- 글래스모피즘 스타일

### 3. Credit 관련 컴포넌트
- 다크 테마 적용
- Spotify 스타일 색상 사용
- 일관된 애니메이션

## ⚡ 애니메이션 시스템

### 듀레이션
- **Fastest**: 50ms (즉각적 피드백)
- **Fast**: 100ms (빠른 상호작용)
- **Normal**: 200ms (기본 트랜지션)
- **Slow**: 300ms (부드러운 전환)

### 이징
- **Default**: `cubic-bezier(0.3, 0, 0, 1)`
- **Accelerate**: `cubic-bezier(0.8, 0, 1, 1)`
- **Decelerate**: `cubic-bezier(0, 0, 0.2, 1)`

## 🛠️ 유틸리티 클래스

### 애니메이션
- `.animate-hover` - 호버 시 스케일 업
- `.animate-press` - 클릭 시 스케일 다운
- `.card-hover` - 카드 호버 효과

### 레이아웃
- `.flex-center` - 중앙 정렬
- `.flex-between` - 양끝 정렬
- `.grid-cards` - 카드 그리드 레이아웃

### 텍스트
- `.text-gradient` - 그라데이션 텍스트
- `.text-display-*` - 디스플레이 텍스트 크기
- `.text-headline-*` - 헤드라인 텍스트 크기

## 🎯 적용 방법

### 1. 기본 사용
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Spotify 스타일 버튼
<Button variant="default">기본 버튼</Button>
<Button variant="secondary">보조 버튼</Button>

// 다크 테마 카드
<Card className="p-6">
  <h3 className="text-xl font-semibold mb-4">카드 제목</h3>
  <p className="text-gray-400">카드 내용</p>
</Card>
```

### 2. 색상 사용
```tsx
// Tailwind 클래스
<div className="bg-dark-elevated text-white">
<div className="bg-primary text-white">
<div className="border border-gray-800">

// CSS 변수
<div style={{ backgroundColor: 'var(--bg-elevated)' }}>
```

### 3. 애니메이션
```tsx
<div className="animate-hover card-hover">
  <button className="animate-press">클릭 효과</button>
</div>
```

## 📌 다음 단계
1. 기존 페이지들에 새 테마 적용
2. 컴포넌트별 일관성 검토
3. 반응형 디자인 최적화
4. 접근성 개선