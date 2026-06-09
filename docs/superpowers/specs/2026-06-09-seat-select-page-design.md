# 选座流程改造：独立选座页设计

日期：2026-06-09
范围：apps/user（H5 用户端）

## 背景与目标

当前 `/session/:id`（`SessionSeatPage`）是一个混合页面：派座区（`saleMode=2`，选区域+数量）
和选座区（`saleMode=1`，canvas 点座位）都挤在同一页。座位图内嵌在场次详情中，用户在一屏里
既要看场次信息又要操作座位图，操作体验拥挤。

目标：把「用户选座」从场次页拆出，进入一个**专注的独立选座页**，让选座操作更顺手；
并对「整场都是用户选座」的场次做自动直达，减少一次无意义的中转停留。

## 关键约束（已确认）

1. **show 列表接口不含 saleMode**：`useListSessionsQuery` 返回的场次行只有
   `id/name/status/startTime/openSaleTime/limitPerUser` 等基础字段，**没有** `saleMode` /
   `areaPriceList`。因此「是否整场都是选座」只能在拿到 `/api/session/detail` 之后判断。
   → 自动直达逻辑放在 `SessionSeatPage` 加载 detail 之后，而非 show 页。
2. **一个场次可有多个选座区**：`areaPriceList` 是数组，可含多个 `saleMode=1` 区域。
   → 新选座页展示该场次**全部**选座区的座位图（与现有内嵌 `SeatGrid` 一致），不按区域分页。
3. 不改后端、不新增接口请求；复用现有 cart / 下单（`/order/confirm`）流程。

## 路由

新增 `/session/:id/seat`，对应 `SeatSelectPage`。嵌套在场次下，语义清晰。

## 页面职责变化

### ① `/show/:id`（ShowDetailPage）—— 不改动

点击场次仍跳 `/session/:id`。真正的「自动直达」在 session 页完成。

### ② `/session/:id`（SessionSeatPage）—— 移除内嵌选座

- **移除** 内嵌的 `SeatGrid`（座位图）与 `SelectionBar`（底部选座栏）及相关引入。
- 派座区 `AllocateAreaSection` 保持现状。
- 选座区（`saleMode=1`）改为 **每个区域一张「选座购票」卡片**：色块（取自
  `priceColorMap`）+ 价格 + 「去选座」箭头；点击 → `navigate('/session/:id/seat')`。
- **自动直达**：新增 `useEffect`，detail 加载完成后，若
  「存在选座区 且 不存在派座区」（`hasPickModeAreas && allocateAreaIds.size === 0`），
  执行 `navigate('/session/:id/seat', { replace: true })`。
  - 用 `replace` 是关键：历史栈变为 `[/show/:id, /session/:id/seat]`，从选座页返回直接回
    show 页，**杜绝 session ↔ seat 死循环**。
  - 自动直达不受场次 status 影响（未开售/已结束的全选座场次同样直达，进页面后由
    `SelectionBar` 按 status 禁用下单——与现有行为一致）。

### ③ `/session/:id/seat`（新建 SeatSelectPage）

- **顶部**：`SessionPageHeader`（返回 + 场次名 + 时间） + `PriceLegendCard`（价位图例）。
- **中间**：`SeatGrid`（仅渲染选座区，派座区已在组件内部过滤；传 `allocateAreaIds`）。
- **底部**：`SelectionBar`（价格计算 + 下单 → `/order/confirm`，流程不变）。
- 数据获取与副作用复用 session 页同款：`useGetSessionDetailQuery`（
  `refetchOnMountOrArgChange: true`）、`useGetMyPurchaseLimitQuery`、
  `setSessionContext(sessionId)`、`effectiveLimit` 计算逻辑。
- 边界：detail 加载中显示骨架屏；加载失败显示失败文案；若该场次**没有任何选座区**
  （理论上不该从入口进来），显示空态并提供返回，不渲染空座位图。

## 抽取的共享组件（避免两页重复）

均放在 `apps/user/src/features/sessions/`：

- `PriceLegendCard.tsx`：把 `SessionSeatPage` 内联的「价位区域」图例卡片（含
  `PriceLegendChip` 子组件、选中/已售图例脚注）抽成独立组件。
  Props：`areaPriceList: AreaPriceVO[]`、`priceColorMap: Map<string,string>`。
  `SessionSeatPage` 与 `SeatSelectPage` 共用。
- `SessionPageHeader.tsx`：把顶部「返回 + 场次名 + 时间」沉浸式 header 抽成独立组件。
  Props：`title`、`startTime`、`sessionName?`、`showName?`（保留现有标题拼接逻辑）。
  两页共用。

## 行为总览

| 场次构成 | session 页表现 |
|---|---|
| 全选座（无派座） | 自动 `replace` 跳选座页（体感"直接进了选座页"） |
| 全派座（无选座） | 留在 session 页，显示派座卡片（现有逻辑不变） |
| 混合 | 留在 session 页：派座卡片 + 每个选座区一张「去选座」卡片 |
| 无任何区域 | 留在 session 页（现有兜底） |

## 数据流（不变）

选座下单链路保持现状：

```
SeatSelectPage
  └ SeatGrid (onCellClick) → dispatch(toggleSeat) → Redux cart
  └ SelectionBar → navigate(/order/confirm?sessionId=...) → 提交锁座 → 轮询 → 支付
```

## 文件改动清单

新建：
- `apps/user/src/features/sessions/SeatSelectPage.tsx`
- `apps/user/src/features/sessions/PriceLegendCard.tsx`
- `apps/user/src/features/sessions/SessionPageHeader.tsx`

修改：
- `apps/user/src/router/index.tsx`：新增 `session/:id/seat` 路由（lazy + withSuspense）
- `apps/user/src/features/sessions/SessionSeatPage.tsx`：
  - 移除 `SeatGrid` / `SelectionBar` 引入与渲染
  - header 改用 `SessionPageHeader`、价位图例改用 `PriceLegendCard`
  - 选座区渲染为「去选座」卡片列表（新内联子组件 `PickAreaCard` 或直接内联）
  - 新增自动直达 `useEffect`
- 用户端 i18n `session` 命名空间：新增「去选座」「选座购票」等文案 key

## 验收标准

1. 全选座场次：从 show 页点击 → 直接停在 `/session/:id/seat`，返回回到 show 页（无中转/无循环）。
2. 混合场次：session 页显示派座卡片 + 选座区「去选座」卡片；点击卡片进选座页，能正常选座下单。
3. 全派座场次：session 页表现与改造前一致。
4. 选座页：顶部场次名/价位图例、中间座位图、底部价格+下单按钮齐全；下单走 `/order/confirm`。
5. 选座页未开售/已结束时下单按钮按 status 正确禁用。
6. `typecheck` 与 `lint` 通过。
</content>
</invoke>
