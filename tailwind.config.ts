import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // 기존 색상 유지 (호환성)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Spotify 스타일 브랜드 색상
        primary: {
          DEFAULT: '#1DB954',
          light: '#1ED760',
          dark: '#169C46',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#2563EB',
          foreground: '#ffffff',
        },
        
        // 다크 테마 배경색
        dark: {
          base: '#000000',
          elevated: '#121212',
          elevated2: '#1f1f1f',
          elevated3: '#2a2a2a',
          paper: '#181818',
          surface: '#282828',
        },
        
        // 텍스트 색상
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        
        // UI 상태 색상
        success: '#1DB954',
        warning: '#ffa726',
        error: '#e22134',
        info: '#2196f3',
        
        // 기존 컬러 매핑
        destructive: {
          DEFAULT: '#e22134',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#282828',
          foreground: '#b3b3b3',
        },
        accent: {
          DEFAULT: '#1DB954',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#1f1f1f',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#181818',
          foreground: '#ffffff',
        },
        chart: {
          '1': '#1DB954',
          '2': '#2563EB',
          '3': '#ffa726',
          '4': '#e22134',
          '5': '#b3b3b3',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      
      borderRadius: {
        lg: '0.5rem',
        md: '0.25rem',
        sm: '0.125rem',
        pill: '9999px',
      },
      
      boxShadow: {
        'overlay': '0 4px 12px 0 rgba(0, 0, 0, 0.3)',
        'focus': '0 0 0 3px rgba(29, 185, 84, 0.3)',
      },
      
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      
      transitionDuration: {
        fastest: '50ms',
        fast: '100ms',
        normal: '200ms',
        slow: '300ms',
        slowest: '500ms',
      },
      
      transitionTimingFunction: {
        default: 'cubic-bezier(0.3, 0, 0, 1)',
        accelerate: 'cubic-bezier(0.8, 0, 1, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;