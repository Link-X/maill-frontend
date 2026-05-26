import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      screens: { xs: '380px' },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          2: 'hsl(var(--brand-2))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        area: {
          a: 'hsl(var(--rose))',
          b: 'hsl(var(--amber))',
          c: 'hsl(var(--emerald))',
          d: 'hsl(var(--sky))',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand-2)) 100%)',
        'gradient-brand-soft':
          'linear-gradient(135deg, hsl(var(--brand) / 0.12) 0%, hsl(var(--brand-2) / 0.12) 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        // Skeleton 光带从左扫到右
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // EmptyState/空状态图标的呼吸光
        'breath-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        // 收藏成功心跳
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.25)' },
          '60%': { transform: 'scale(0.92)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'breath-glow': 'breath-glow 2.8s ease-in-out infinite',
        heartbeat: 'heartbeat 0.5s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
