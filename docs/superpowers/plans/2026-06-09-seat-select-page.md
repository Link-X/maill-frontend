# 独立选座页改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把「用户选座」从场次页 `/session/:id` 拆到独立选座页 `/session/:id/seat`，并让整场都是选座的场次自动直达。

**Architecture:** 抽取两个共享展示组件（价位图例卡、页头），新建 `SeatSelectPage` 装载现有 `SeatGrid`+`SelectionBar`，改造 `SessionSeatPage` 移除内嵌座位图、改为「去选座」入口卡片并加自动 `replace` 重定向。复用现有 cart / 下单（`/order/confirm`）链路，不改后端。

**Tech Stack:** React 18 + TypeScript + React Router 6 + Redux Toolkit + Tailwind + framer-motion + i18next。

**测试说明:** 本项目无单元测试框架（仅 `typecheck` / `lint`）。每个任务用 `pnpm --filter ./apps/user run typecheck` 和 `pnpm --filter ./apps/user run lint` 验证，最后做手动 dev 验证。lint 配置为 `--max-warnings=0`，**未使用的 import/变量会导致失败**，每步注意清理。

---

## File Structure

新建：
- `apps/user/src/features/sessions/PriceLegendCard.tsx` — 价位图例卡（含 `PriceLegendChip`），两页共用
- `apps/user/src/features/sessions/SessionPageHeader.tsx` — 沉浸式页头（返回+标题+时间），两页共用
- `apps/user/src/features/sessions/SeatSelectPage.tsx` — 新独立选座页

修改：
- `packages/shared/src/i18n/locales/zh-CN/session.json` / `en-US/session.json` — 新增 `userSeat` 文案
- `apps/user/src/router/index.tsx` — 注册 `session/:id/seat` 路由
- `apps/user/src/features/sessions/SessionSeatPage.tsx` — 移除内嵌选座、改入口卡片、加自动直达、改用共享组件

---

## Task 1: i18n 新增文案

**Files:**
- Modify: `packages/shared/src/i18n/locales/zh-CN/session.json`（`userSeat` 对象内）
- Modify: `packages/shared/src/i18n/locales/en-US/session.json`（`userSeat` 对象内）

- [ ] **Step 1: 在 zh-CN 的 `userSeat` 对象追加 4 个 key**

在 `userSeat` 现有最后一个 key（`"seconds": "秒"`）后补逗号并加入：

```json
    "goPick": "去选座",
    "pickAreaSub": "点击进入座位图选座",
    "selectSeatTitle": "选择座位",
    "noPickArea": "本场次暂无可选座区域"
```

- [ ] **Step 2: 在 en-US 的 `userSeat` 对象追加同名 key**

```json
    "goPick": "Pick seats",
    "pickAreaSub": "Tap to open the seat map",
    "selectSeatTitle": "Select seats",
    "noPickArea": "No seat-selection area for this session"
```

- [ ] **Step 3: 校验 JSON 合法**

Run: `node -e "require('./packages/shared/src/i18n/locales/zh-CN/session.json');require('./packages/shared/src/i18n/locales/en-US/session.json');console.log('ok')"`
Expected: 输出 `ok`（无 JSON 解析错误）

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/i18n/locales/zh-CN/session.json packages/shared/src/i18n/locales/en-US/session.json
git commit -m "i18n: 选座页新增去选座等文案"
```

---

## Task 2: PriceLegendCard 共享组件

从 `SessionSeatPage.tsx` 抽取「价位区域」图例卡 + `PriceLegendChip`。

**Files:**
- Create: `apps/user/src/features/sessions/PriceLegendCard.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { useTranslation } from 'react-i18next';
import { type AreaPriceVO } from '@maill/shared';
import { formatMoney } from '@/lib/format';

/** 价位区域图例卡 — 场次页与选座页共用 */
export function PriceLegendCard({
  areaPriceList,
  priceColorMap,
}: {
  areaPriceList: AreaPriceVO[];
  priceColorMap: Map<string, string>;
}) {
  const { t } = useTranslation(['session']);
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3">
      <div className="text-[11px] text-muted-foreground mb-2">价位区域</div>
      <div className="flex flex-wrap gap-1.5">
        {areaPriceList.map((p) => (
          <PriceLegendChip
            key={p.areaId}
            color={priceColorMap.get(p.areaId) ?? '#94a3b8'}
            price={formatMoney(p.price)}
            isAllocate={p.saleMode === 2}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-brand ring-2 ring-brand/25" />
          {t('session:userSeat.legendSelected')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-foreground/30 ring-1 ring-foreground/10" />
          {t('session:userSeat.legendSold')}
        </span>
      </div>
    </div>
  );
}

function PriceLegendChip({
  color,
  price,
  isAllocate,
}: {
  color: string;
  price: string;
  isAllocate?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 pl-1 pr-2 h-5 rounded-full
                 bg-muted/60 border border-border/40 text-[11px] font-medium tabular-nums"
    >
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />
      {price}
      {isAllocate && (
        <span className="text-[9px] text-muted-foreground/80 font-normal ml-0.5">派座</span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `pnpm --filter ./apps/user run typecheck`
Expected: PASS（无类型错误）

- [ ] **Step 3: Commit**

```bash
git add apps/user/src/features/sessions/PriceLegendCard.tsx
git commit -m "refactor: 抽取 PriceLegendCard 价位图例卡组件"
```

---

## Task 3: SessionPageHeader 共享组件

从 `SessionSeatPage.tsx`（113-152 行）抽取沉浸式页头。

**Files:**
- Create: `apps/user/src/features/sessions/SessionPageHeader.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

/** 场次/选座页通用沉浸式页头:返回 + 标题 + 时间 */
export function SessionPageHeader({
  title,
  startTime,
  sessionName,
  showName,
}: {
  title: string;
  startTime: string;
  sessionName?: string;
  showName?: string;
}) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  return (
    <header className="relative isolate px-4 pt-3 pb-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-brand-soft opacity-70" />
      <div
        aria-hidden
        className="absolute -top-16 -right-12 w-44 h-44 rounded-full bg-brand/15 blur-3xl pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="h-10 w-10 rounded-full
                     bg-white/65 dark:bg-white/10 backdrop-blur-xl
                     border border-white/40 dark:border-white/15
                     shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]
                     flex items-center justify-center shrink-0
                     active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold truncate leading-tight">{title}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3 text-brand" />
            <span className="truncate">
              {formatDateTime(startTime)}
              {sessionName && showName && <span className="ml-1">· {sessionName}</span>}
            </span>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `pnpm --filter ./apps/user run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/user/src/features/sessions/SessionPageHeader.tsx
git commit -m "refactor: 抽取 SessionPageHeader 页头组件"
```

---

## Task 4: SeatSelectPage 独立选座页

**Files:**
- Create: `apps/user/src/features/sessions/SeatSelectPage.tsx`

依赖 Task 2/3 的组件与 Task 1 的 `noPickArea` 文案。

- [ ] **Step 1: 创建页面文件**

```tsx
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ticket } from 'lucide-react';
import { extractErrorMessage, notify } from '@maill/shared';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDateTime } from '@/lib/format';
import { useGetSessionDetailQuery, useGetMyPurchaseLimitQuery } from './sessionsApi';
import { SeatGrid, buildPriceColorMap } from './SeatGrid';
import { SelectionBar } from './SelectionBar';
import { PriceLegendCard } from './PriceLegendCard';
import { SessionPageHeader } from './SessionPageHeader';
import { setSessionContext } from './cartSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

/** 独立选座页:顶部场次名/价位图例,中间座位图,底部价格计算 + 下单 */
export default function SeatSelectPage() {
  const { t } = useTranslation(['session', 'common']);
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const sessionId = id ?? '';

  // 每次进入强制重拉,避免命中缓存看到陈旧座位状态
  const { data, isLoading, error } = useGetSessionDetailQuery(sessionId, {
    skip: !sessionId,
    refetchOnMountOrArgChange: true,
  });

  const isAuthed = useSelector(selectIsAuthenticated);
  const { data: myLimit } = useGetMyPurchaseLimitQuery(sessionId, {
    skip: !sessionId || !isAuthed,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (sessionId) dispatch(setSessionContext(sessionId));
  }, [sessionId, dispatch]);

  useEffect(() => {
    if (error) notify.error(extractErrorMessage(error));
  }, [error]);

  const priceColorMap = useMemo(
    () => buildPriceColorMap(data?.areaPriceList ?? []),
    [data?.areaPriceList],
  );
  const allocateAreaIds = useMemo(
    () =>
      new Set(
        (data?.areaPriceList ?? []).filter((a) => a.saleMode === 2).map((a) => a.areaId),
      ),
    [data?.areaPriceList],
  );
  const hasPickModeAreas = useMemo(
    () => (data?.areaPriceList ?? []).some((a) => (a.saleMode ?? 1) === 1),
    [data?.areaPriceList],
  );

  const sessionLimitPerUser = data?.session.limitPerUser ?? 4;
  const effectiveLimit = isAuthed
    ? Math.max(0, myLimit?.remaining ?? sessionLimitPerUser)
    : sessionLimitPerUser;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t('session:userSeat.loadFailed')}
      </div>
    );
  }

  const { session, areaPriceList, seatSection, showName } = data;
  const sessionStatus = Number(session.status);

  return (
    <div className="pb-36">
      <SessionPageHeader
        title={showName ?? session.name ?? `场次 #${session.id}`}
        startTime={session.startTime}
        sessionName={session.name}
        showName={showName}
      />

      <div className="px-4 mb-3">
        <PriceLegendCard areaPriceList={areaPriceList} priceColorMap={priceColorMap} />
      </div>

      {hasPickModeAreas ? (
        <>
          <div className="px-4">
            <SeatGrid
              rows={seatSection.seatRows}
              rowCount={seatSection.rowCount}
              columnCount={seatSection.columnCount}
              areaPriceList={areaPriceList}
              limitPerUser={effectiveLimit}
              onLimitExceed={() =>
                notify.warn(
                  effectiveLimit === 0
                    ? '已达到本场次限购上限,无法再选'
                    : t('session:userSeat.limitToast', { n: effectiveLimit }),
                )
              }
              allocateAreaIds={allocateAreaIds}
            />
          </div>
          <SelectionBar
            sessionId={sessionId}
            limitPerUser={effectiveLimit}
            sessionStatus={sessionStatus}
          />
        </>
      ) : (
        <div className="px-4 pt-10">
          <EmptyState icon={Ticket} title={t('session:userSeat.noPickArea')} description="" />
        </div>
      )}
    </div>
  );
}
```

> 注：`formatDateTime` 已在 `SessionPageHeader` 内使用，这里 import 仅为保持与场次页一致的可用工具；若 lint 报未使用，删除该 import 行。

- [ ] **Step 2: typecheck**

Run: `pnpm --filter ./apps/user run typecheck`
Expected: PASS

- [ ] **Step 3: lint（清理未使用 import）**

Run: `pnpm --filter ./apps/user run lint`
Expected: PASS。若报 `formatDateTime` 未使用，删除第 `import { formatDateTime } from '@/lib/format';` 行后重跑至 PASS。

- [ ] **Step 4: Commit**

```bash
git add apps/user/src/features/sessions/SeatSelectPage.tsx
git commit -m "feat: 新增独立选座页 SeatSelectPage"
```

---

## Task 5: 注册路由

**Files:**
- Modify: `apps/user/src/router/index.tsx`

- [ ] **Step 1: 新增 lazy 声明**

在第 12 行 `const SessionSeatPage = lazy(...)` 下方新增一行：

```tsx
const SeatSelectPage = lazy(() => import('@/features/sessions/SeatSelectPage'));
```

- [ ] **Step 2: 新增子路由**

在 `{ path: 'session/:id', element: withSuspense(<SessionSeatPage />) },`（第 48 行）下方新增：

```tsx
      { path: 'session/:id/seat', element: withSuspense(<SeatSelectPage />) },
```

- [ ] **Step 3: typecheck + lint**

Run: `pnpm --filter ./apps/user run typecheck && pnpm --filter ./apps/user run lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/user/src/router/index.tsx
git commit -m "feat: 注册 /session/:id/seat 选座页路由"
```

---

## Task 6: 改造 SessionSeatPage

移除内嵌座位图与底部选座栏，改为「去选座」入口卡片 + 自动直达，并复用共享组件。

**Files:**
- Modify: `apps/user/src/features/sessions/SessionSeatPage.tsx`

- [ ] **Step 1: 调整顶部 import**

将第 18-19 行：

```tsx
import { SeatGrid, buildPriceColorMap } from './SeatGrid';
import { SelectionBar } from './SelectionBar';
```

改为（移除 `SeatGrid` 组件与 `SelectionBar`，保留 `buildPriceColorMap`，新增两个共享组件）：

```tsx
import { buildPriceColorMap } from './SeatGrid';
import { PriceLegendCard } from './PriceLegendCard';
import { SessionPageHeader } from './SessionPageHeader';
```

并把第 6 行 lucide 图标 import 中的 `ChevronDown` 一行补上 `ChevronRight`（用于入口卡片箭头）：

```tsx
import { ArrowLeft, MapPin, Info, Clock, Calendar, ChevronDown, ChevronRight, Timer, CalendarX } from 'lucide-react';
```

- [ ] **Step 2: 新增自动直达 useEffect**

在现有 `useEffect`（处理 `error` 的那个，约第 48-50 行）之后新增：

```tsx
  // 自动直达:整场都是用户选座(无派座区)→ 直接跳独立选座页;
  // 用 replace 让历史栈为 [show, seat],从选座页返回回到 show 页,杜绝 session↔seat 死循环
  useEffect(() => {
    if (data && hasPickModeAreas && allocateAreaIds.size === 0) {
      navigate(`/session/${sessionId}/seat`, { replace: true });
    }
  }, [data, hasPickModeAreas, allocateAreaIds, sessionId, navigate]);
```

> `hasPickModeAreas` 与 `allocateAreaIds` 已在组件内定义（`useMemo`），此处直接复用。

- [ ] **Step 3: 用 SessionPageHeader 替换内联 header**

将整段 `<header className="relative isolate ...">...</header>`（约第 113-152 行）整体替换为：

```tsx
      <SessionPageHeader
        title={showName ?? session.name ?? `场次 #${session.id}`}
        startTime={session.startTime}
        sessionName={session.name}
        showName={showName}
      />
```

- [ ] **Step 4: 用 PriceLegendCard 替换内联价位图例块**

将整段「价格图例」`<div className="px-4 mb-3"><div className="rounded-2xl bg-card ...">...</div></div>`（约第 215-240 行）整体替换为：

```tsx
      {/* ===== 价格图例 ===== */}
      <div className="px-4 mb-3">
        <PriceLegendCard areaPriceList={areaPriceList} priceColorMap={priceColorMap} />
      </div>
```

- [ ] **Step 5: 用「去选座」入口卡片替换 SeatGrid + SelectionBar**

将 `{hasPickModeAreas && (<div className="px-4"><SeatGrid .../></div>)}`（约第 253-271 行）与其后 `{hasPickModeAreas && (<SelectionBar .../>)}`（约第 274-280 行）这两段，整体替换为选座区入口卡片列表：

```tsx
      {/* ===== 选座区(saleMode=1)— 改为入口卡片,点击进独立选座页 ===== */}
      {(() => {
        const pickAreas = areaPriceList.filter((a) => (a.saleMode ?? 1) === 1);
        if (pickAreas.length === 0) return null;
        return (
          <div className="px-4 space-y-2">
            {pickAreas.map((a) => (
              <PickAreaCard
                key={a.areaId}
                color={priceColorMap.get(a.areaId) ?? '#94a3b8'}
                price={formatMoney(a.price)}
                label={t('session:userSeat.goPick')}
                sub={t('session:userSeat.pickAreaSub')}
                onClick={() => navigate(`/session/${sessionId}/seat`)}
              />
            ))}
          </div>
        );
      })()}
```

- [ ] **Step 6: 删除不再使用的 PriceLegendChip 函数,新增 PickAreaCard 子组件**

删除文件底部的 `function PriceLegendChip(...) {...}`（约第 385-396 行，已移入 PriceLegendCard）。在文件底部新增：

```tsx
function PickAreaCard({
  color,
  price,
  label,
  sub,
  onClick,
}: {
  color: string;
  price: string;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                 bg-card border border-border/60
                 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]
                 hover:border-brand/30 hover:shadow-[0_10px_22px_-8px_rgba(15,23,42,0.18)]
                 active:scale-[0.99] transition-all duration-200"
    >
      <span className="inline-block h-9 w-9 rounded-xl shrink-0" style={{ background: color }} />
      <div className="min-w-0 flex-1 text-left">
        <div className="font-semibold tabular-nums">{price}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand shrink-0">
        {label}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}
```

- [ ] **Step 7: typecheck + lint（重点清理未使用 import）**

Run: `pnpm --filter ./apps/user run typecheck && pnpm --filter ./apps/user run lint`
Expected: PASS。常见残留：移除内联 header 后若 `ArrowLeft`/`Calendar`/`motion` 仅 header 用过且别处不再用，lint 会报未使用 → 逐一删除对应 import。注意 `SessionStatusBanner`/`InfoRow`/`formatCountdown` 仍在用的图标（`Timer`/`CalendarX`/`Calendar`/`MapPin`/`Info`/`Clock`/`ChevronDown`）不要误删；`motion` 若 header 外不再使用则删除其 import。以 lint 报告为准逐项清理至 PASS。

- [ ] **Step 8: Commit**

```bash
git add apps/user/src/features/sessions/SessionSeatPage.tsx
git commit -m "feat: 场次页移除内嵌选座,改为去选座入口卡片并自动直达"
```

---

## Task 7: 全量验证

- [ ] **Step 1: 全量 typecheck + lint**

Run: `pnpm --filter ./apps/user run typecheck && pnpm --filter ./apps/user run lint`
Expected: 均 PASS

- [ ] **Step 2: 启动 dev 手动验证**

Run: `pnpm --filter ./apps/user run dev`，浏览器打开后核对验收标准：

1. 全选座场次:从 `/show/:id` 点击 → 直接停在 `/session/:id/seat`;浏览器返回回到 show 页(无中转、无循环)。
2. 混合场次:`/session/:id` 显示派座卡片 + 每个选座区一张「去选座」卡片;点击卡片进选座页,可正常点座、底部价格更新、下单进 `/order/confirm`。
3. 全派座场次:`/session/:id` 表现与改造前一致(派座卡片,无座位图)。
4. 选座页:顶部场次名/价位图例、中间座位图、底部价格 + 下单按钮齐全。
5. 未开售/已结束场次进选座页:底部下单按钮按 status 正确禁用。

- [ ] **Step 3: 收尾**

手动验证通过后,本计划完成。若有 UI 微调,单独提交。

---

## Self-Review

- **Spec 覆盖:** 路由(Task5)、show 页不动(无需任务)、session 页移除内嵌+入口卡片+自动直达(Task6)、新选座页(Task4)、共享组件 PriceLegendCard/SessionPageHeader(Task2/3)、i18n(Task1)、各模式行为(Task6 Step2/5 + Task7 验证) — 全部覆盖。
- **占位扫描:** 无 TBD/TODO;每个代码步骤含完整代码。
- **类型一致:** `PriceLegendCard({areaPriceList, priceColorMap})`、`SessionPageHeader({title,startTime,sessionName,showName})`、`PickAreaCard({color,price,label,sub,onClick})`、i18n key `goPick/pickAreaSub/noPickArea` 在定义与调用处一致。
</content>
