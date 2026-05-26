# Admin UI 动画与交互精修设计

> 日期：2026-05-26 · 范围：`apps/admin` 全应用 · 风格：Apple / Stripe Dashboard 风（柔顺 spring + 克制装饰）

## 1. 目标

把 admin 后台从"有动画"提升到"有质感"。重点不在堆动画数量，而在**关键瞬间的层级感和因果感**。

## 2. 总体路线（方案 B）

- 共享层一次性升级（基线水准）
- 3 个流量页深度定制：Reports / Shows / Orders / AdminLayout（惊艳瞬间）
- 全程尊重 `prefers-reduced-motion`
- 不重写动画层，沿用 framer-motion + tailwindcss-animate

## 3. 动画语言（Motion Tokens）

新建 `apps/admin/src/lib/motion/`：

### 3.1 Duration
```
instant 0.12 | fast 0.18 | base 0.24 | slow 0.38 | lazy 0.56
```

### 3.2 Easing
```
standard   = cubic-bezier(0.32, 0.72, 0, 1)  — 进出对称，最常用
emphasized = cubic-bezier(0.16, 1, 0.3, 1)   — 入场，先快后慢
decelerated = cubic-bezier(0, 0, 0.2, 1)     — 离场
```

### 3.3 Spring
```
snappy { stiffness: 380, damping: 30, mass: 0.6 } — nav indicator / tabs
gentle { stiffness: 220, damping: 26, mass: 0.8 } — drawer / modal
layout { stiffness: 300, damping: 32, mass: 0.7 } — layout 重排
```

### 3.4 Presets（常用动画原子）
- `fadeUp` — opacity 0→1, y 8→0
- `fadeIn` — opacity 0→1
- `scaleIn` — opacity 0→1, scale 0.96→1
- `slideRight` — opacity 0→1, x -8→0
- `popIn` — spring scale 0.9→1

### 3.5 Reduced-motion
- 全局：`<MotionConfig reducedMotion="user">` 注入 main.tsx，框架级兜底
- 局部：暴露 `useReducedMotion()` hook 供需要 fine-tune 的场景使用

## 4. 共享组件升级（apps/admin/src/components）

| 组件 | 改造 |
| --- | --- |
| `PageTransition` | 接 motion tokens；进入用 emphasized easing |
| `MotionButton` | tap scale 0.96 + hover y -1（可选 disable hover）|
| `Card` | 双层 shadow；hover y -3 + shadow 加深；`pressable` 新 prop（tap scale）|
| `DataTable` | 行 hover 加 x:2 微位移；> 30 行取消 stagger；空态接 `EmptyState` |
| `Drawer` | spring.gentle；表单字段内部 stagger 30ms/项；backdrop 渐入 |
| `Tabs` | 接 motion tokens；切换内容用 AnimatePresence mode="wait" fade |
| `Badge` | 状态变化时 `key` 强制 remount 触发入场，配 popIn |
| `Skeleton` | shimmer 替换 animate-pulse（CSS wave 动画）|
| `PageHeader` | icon hover 旋转 6deg；标题 fadeUp 进入 |
| `ConfirmDialog` | 接 motion tokens；destructive 时 confirm 按钮短暂 pulse |

## 5. 新增组件

- **AnimatedNumber** — `useMotionValue + useTransform` 实现数字 count-up，支持金额格式
- **EmptyState** — 图标 + 标题 + 描述 + 可选 CTA；进入 fadeUp + 图标 spring scale

Toast 复用 `@maill/shared` 的 `Toaster`（sonner）。

## 6. 视觉质感

- 暗色模式：card 顶部加 1px hsla(255,255,255,0.06) hairline（玻璃质感）
- 阴影：定义 `shadow-elevate-1/2/3` 三档双层 shadow utility（ambient + directional）
- backdrop-blur：sidebar/header 加 `saturate(180%)`
- 间距/色彩：保持现有，不动

## 7. AdminLayout 升级

- Sidebar 可折叠：点 logo 切换 240px ↔ 64px，宽度过渡用 spring.layout；折叠后 nav 文字 fade-out，仅留 icon
- Header 滚动收紧：scroll > 12px 时高度 64→52，加重 backdrop
- nav item hover：背景 fade-in + icon 微缩放（无 magnetic，避免过度装饰）

## 8. 路由过渡

- `PageTransition` 升级：opacity + y 同时，emphasized easing
- 增加 `AnimatePresence mode="wait"` 让出场和入场不重叠（除非 reduced-motion）

## 9. 重点页面专项

### 9.1 Reports
- KPI 卡片：进入 stagger 0.05s/张
- KPI 数字：`AnimatedNumber` count-up（金额含 formatter）
- RangePicker：选中态用 `layoutId="report-range"` 共享元素
- Charts：包一层 motion.div fadeUp 容器；保留 recharts 内置动画

### 9.2 Shows / Orders
- 表格行 hover：x:2 位移 + 右侧操作按钮 fade-in（默认半透明）
- 状态 Badge 翻牌：rotateX 90→0（仅状态变化时）
- Drawer 表单：fields stagger 进入

## 10. 范围之外

- 不引入新动画库（react-spring/lottie/auto-animate）
- 不动 user app
- 不重写 i18n / store / api
- 不做性能基准（用户暂不考虑）

## 11. 验证

- `pnpm --filter admin typecheck`
- `pnpm --filter admin dev` 启动，浏览主要页面：reports / shows / orders / banners
- 在系统偏好里切换 reduce-motion，确认仅 opacity 生效
- 切换明/暗主题确认 hairline 表现

## 12. 风险与回退

- 单组件升级后引入回归：每个 Phase 完成后做一次浏览
- `MotionConfig reducedMotion="user"` 影响所有 motion.* 元素，验证现有 nav layoutId 仍然正常
- AnimatedNumber 对 0/负数/Infinity 兜底为静态值
