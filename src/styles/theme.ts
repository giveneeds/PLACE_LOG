// Place Log 테마 시스템 - Spotify 디자인 참조
export const theme = {
  colors: {
    // 브랜드 컬러 - 플레이스로그 고유 색상
    brand: {
      primary: '#1DB954', // 메인 그린
      primaryLight: '#1ED760',
      primaryDark: '#169C46',
      secondary: '#2563EB', // 블루 계열
    },
    
    // 배경 색상 - 다크 테마 기반
    background: {
      base: '#000000',
      elevated: '#121212',
      elevated2: '#1f1f1f',
      elevated3: '#2a2a2a',
      paper: '#181818',
      surface: '#282828',
    },
    
    // 텍스트 색상
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      tertiary: '#a7a7a7',
      disabled: '#535353',
      subdued: '#a7a7a7',
      inverse: '#000000',
    },
    
    // 인터랙티브 요소
    interactive: {
      accent: '#1db954',
      hover: '#1ed760',
      active: '#169c46',
      focus: '#1db954',
      subdued: '#282828',
      disabled: '#404040',
    },
    
    // UI 요소
    ui: {
      border: '#404040',
      borderLight: '#535353',
      highlight: '#ffffff',
      indicator: '#1db954',
      error: '#e22134',
      warning: '#ffa726',
      success: '#1db954',
      info: '#2196f3',
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2rem', // 32px
      '4xl': '2.5rem', // 40px
      '5xl': '3rem', // 48px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.6',
    },
  },
  
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    md: '0.25rem', // 4px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overlay: '0 4px 12px 0 rgba(0, 0, 0, 0.3)',
    focus: '0 0 0 3px rgba(29, 185, 84, 0.3)',
  },
  
  animation: {
    duration: {
      fastest: '50ms',
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
      slowest: '500ms',
    },
    
    easing: {
      default: 'cubic-bezier(0.3, 0, 0, 1)',
      accelerate: 'cubic-bezier(0.8, 0, 1, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  
  layout: {
    sidebar: {
      width: '240px',
      collapsedWidth: '64px',
    },
    
    header: {
      height: '64px',
    },
    
    content: {
      maxWidth: '1440px',
      padding: '24px',
    },
    
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};

// CSS 변수로 내보내기
export const cssVariables = {
  // 색상
  '--color-primary': theme.colors.brand.primary,
  '--color-primary-light': theme.colors.brand.primaryLight,
  '--color-primary-dark': theme.colors.brand.primaryDark,
  '--color-secondary': theme.colors.brand.secondary,
  
  '--bg-base': theme.colors.background.base,
  '--bg-elevated': theme.colors.background.elevated,
  '--bg-elevated-2': theme.colors.background.elevated2,
  '--bg-elevated-3': theme.colors.background.elevated3,
  '--bg-paper': theme.colors.background.paper,
  '--bg-surface': theme.colors.background.surface,
  
  '--text-primary': theme.colors.text.primary,
  '--text-secondary': theme.colors.text.secondary,
  '--text-tertiary': theme.colors.text.tertiary,
  '--text-disabled': theme.colors.text.disabled,
  
  '--border-color': theme.colors.ui.border,
  '--border-light': theme.colors.ui.borderLight,
  
  // 간격
  '--spacing-xs': theme.spacing.xs,
  '--spacing-sm': theme.spacing.sm,
  '--spacing-md': theme.spacing.md,
  '--spacing-lg': theme.spacing.lg,
  '--spacing-xl': theme.spacing.xl,
  
  // 둥글기
  '--radius-sm': theme.borderRadius.sm,
  '--radius-md': theme.borderRadius.md,
  '--radius-lg': theme.borderRadius.lg,
  '--radius-xl': theme.borderRadius.xl,
  '--radius-full': theme.borderRadius.full,
  
  // 그림자
  '--shadow-sm': theme.shadows.sm,
  '--shadow-md': theme.shadows.md,
  '--shadow-lg': theme.shadows.lg,
  '--shadow-overlay': theme.shadows.overlay,
  
  // 애니메이션
  '--duration-fast': theme.animation.duration.fast,
  '--duration-normal': theme.animation.duration.normal,
  '--duration-slow': theme.animation.duration.slow,
  '--easing-default': theme.animation.easing.default,
};