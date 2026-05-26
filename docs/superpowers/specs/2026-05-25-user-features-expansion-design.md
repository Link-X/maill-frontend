# 用户端功能扩展设计文档

- **创建日期**：2026-05-25
- **作者**：xdb（与 Claude 协作）
- **状态**：待评审
- **前端仓库**：`/Users/xdb/Desktop/test/maill-frontend`（pnpm workspace，user=React 移动端，admin=Vue 3）
- **后端仓库**：`/Users/xdb/Desktop/test/maill-backend`（Spring Boot 多模块：admin / user / payment / common / core）

---

## 1. 背景与目标

当前用户端（移动 H5）功能链路完整但偏单调：仅含登录注册、首页、演出详情、选座、下单支付、订单、个人中心、验票。缺少能提升停留时长、复购率、用户互动的"周边"功能。

本次扩展目标：

| # | 功能 | 用户价值 |
|---|---|---|
| 1 | 搜索 + 收藏 + 开售提醒 + 消息中心 | 提升内容触达和复访率 |
| 2 | 演出评价 + 晒图（楼中楼） | 真实口碑沉淀，辅助购买决策 |
| 3 | 演出资讯 + 艺人主页 | 内容化运营，扩大用户停留 |
| 4 | 首页 Banner + 运营位 | 给运营留出活动 / 专题位 |

---

## 2. 关键决策汇总

| 项 | 决策 | 原因 |
|---|---|---|
| 图片存储 | 复用现有 MinIO（admin 已有 `UploadController`） | 零成本 |
| 消息通道 | 仅站内信（暂不做 App push / 短信） | 范围可控 |
| 评价权限 | 演出可选三种：无评价 / 所有登录可评 / 仅已观看可评（按订单核销）。回复同样适用 | 既灵活又支持真实口碑 |
| 评论树 | 楼中楼两层结构（一级评论 + 二级回复，`@用户` 表示回谁） | 表结构清晰，移动端体验好 |
| 评论图文 | 一级和二级均可带图 | 用户互动更丰富 |
| 评论点赞 | 支持点赞 / 取消，最热排序按点赞数 | 用户参与感 |
| 评论审核 | 先发后审：默认可见，违规靠用户举报 + admin 隐藏 / 删除 | 体验优先 |
| 评论排序 | 支持「最新 / 最热」切换 | 标准模式 |
| 评价时机 | 订单核销后即可评（无需等演出结束） | 鼓励即时反馈 |
| 收藏 / 关注 | 收藏=演出（支持自定义分组），关注=艺人（不分组）。两张表分开建 | 业务语义清晰 |
| 消息类型 | 5 类：订单 / 开售提醒 / 系统通知 / 互动 / 关注动态 | 覆盖核心场景 |
| 未读推送 | 前端轮询（30s + 进页面强制刷新） | 简单稳定，时效性够 |
| 艺人关联 | 演出 ↔ 艺人多对多，关联表可带 `role`（主演 / 导演等） | 灵活 |
| 资讯分类 | 后台可管理（独立 `article_category` 表，与演出分类不混用） | 业务语义不同 |
| 资讯内容 | 富文本，admin 用 WangEditor | 中文友好、上传图片接 MinIO 开箱即用 |
| 开售提醒触发 | 提前 N 分钟（默认 10）+ 开售时各推送一次 | 两阶段提醒 |
| Banner 跳转类型 | 5 种：无跳转 / 演出 / 艺人 / 资讯 / 外链 | 覆盖运营常用场景 |
| 搜索引擎 | Elasticsearch 8 + ES 自带高亮 | 学习生产级方案 |
| 搜索范围 | 演出 + 艺人 + 资讯，Tab 分类展示 | 内容全覆盖 |
| ES 同步 | 业务写 DB → 发 MQ → 消费者写 ES（事务消息 + RabbitMQ） | 解耦、容错；RabbitMQ 已部署 |
| MQ 选型 | RabbitMQ（已在 docker-compose） | 零部署成本 |

---

## 3. 系统架构

### 3.1 新增 / 复用中间件

| 中间件 | 状态 | 用途 |
|---|---|---|
| MySQL 8 | ✅ 已有 | 业务数据 |
| Redis + Redisson | ✅ 已有 | 缓存、分布式锁、搜索历史 |
| RabbitMQ | ✅ 已有 | ES 同步、订单消息入站内信、统计回写 |
| MinIO | ✅ 已有 | 评价图 / Banner / 艺人头像 / 资讯封面 |
| **Elasticsearch 8** | 🆕 新增到 docker-compose | 搜索（演出 / 艺人 / 资讯） |

### 3.2 后端模块改动

```
maill-backend
├─ common ........... 🔧 加 ES Client 封装、MQ 公共配置、上传服务抽象
├─ core ............. 🔧 加 ES 同步消费者（监听 MQ → 写 ES）
├─ user ............. 🆕 +8 个 Controller
│                       Search / Favorite / Subscribe / Message
│                       Review / Artist / Article / Banner（只读）
├─ admin ............ 🆕 +6 个 Controller
│                       Banner / Artist / Article / ArticleCategory
│                       ReviewModeration / MessageBroadcast
│                     🔧 ShowController 改造（artist 关联、reviewMode、openSaleTime）
├─ payment .......... ⚪ 不动
└─ docker-compose ... 🔧 加 elasticsearch 服务
```

### 3.3 前端模块改动

```
apps/user/src/features
├─ search ............ 🆕 搜索页（Tab：演出 / 艺人 / 资讯，高亮）
├─ favorites ......... 🆕 收藏列表 + 分组管理
├─ subscriptions ..... 🆕 开售提醒订阅列表
├─ messages .......... 🆕 消息中心（5 类型 Tab，未读红点）
├─ reviews ........... 🆕 评价发布 / 回复 / 详情（楼中楼）
├─ artists ........... 🆕 艺人列表 + 艺人主页
├─ articles .......... 🆕 资讯列表 + 资讯详情
├─ home .............. 🔧 加 Banner 轮播 + 运营位
├─ shows ............. 🔧 详情页：关联艺人、评分、评价 Tab、收藏 / 订阅按钮
└─ profile ........... 🔧 加各功能入口

apps/admin/src/features
├─ banners ........... 🆕 Banner 管理
├─ artists ........... 🆕 艺人管理
├─ articles .......... 🆕 资讯管理 + 分类管理
├─ reviews ........... 🆕 评价审核 + 举报处理
├─ messages .......... 🆕 站内信群发
└─ shows ............. 🔧 演出表单加 reviewMode / openSaleTime / artistIds
```

---

## 4. 数据库设计（15 张新表 + show 表改造）

> 通用字段省略：`id BIGINT PK AUTO_INCREMENT, created_at DATETIME, updated_at DATETIME`。

### 4.1 收藏 + 订阅

**`favorite_group`** — 用户自定义收藏分组

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | BIGINT | |
| name | VARCHAR(50) | 分组名 |
| sort | INT | 排序 |
| **UK** | (user_id, name) | 同用户分组名不重复 |

**`user_favorite`** — 收藏演出

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | BIGINT | |
| show_id | BIGINT | |
| group_id | BIGINT NULL | NULL = 未分组 |
| **UK** | (user_id, show_id) | |
| **IDX** | (user_id, group_id) | |

**`show_subscribe`** — 开售提醒订阅

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | BIGINT | |
| show_id | BIGINT | |
| notify_before_minutes | INT | 提前提醒分钟数，默认 10 |
| notified_pre | TINYINT | 已推送「提前提醒」 |
| notified_open | TINYINT | 已推送「开售」 |
| **UK** | (user_id, show_id) | |

### 4.2 消息中心

**`message`** — 消息主表

| 字段 | 类型 | 说明 |
|---|---|---|
| type | TINYINT | 1=订单 2=开售 3=系统 4=互动 5=关注动态 |
| title | VARCHAR(200) | |
| content | TEXT | |
| link_type | TINYINT | 0=无 1=演出 2=艺人 3=资讯 4=订单 5=URL |
| link_target | VARCHAR(500) | target_id 或 URL |
| broadcast | TINYINT | 0=单发 1=广播 |

**`user_message`** — 用户↔消息关系

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | BIGINT | |
| message_id | BIGINT | |
| is_read | TINYINT | |
| read_at | DATETIME NULL | |
| **IDX** | (user_id, is_read, created_at DESC) | 未读列表 |

> **广播消息策略**：发广播时只在 `message` 写一条；用户首次进入消息列表时按需"懒生成" `user_message` 记录，避免大用户量场景写爆。

### 4.3 评价系统

**`show_review`** — 评价主表（含一级评论 + 二级回复）

| 字段 | 类型 | 说明 |
|---|---|---|
| show_id | BIGINT | |
| user_id | BIGINT | |
| order_id | BIGINT NULL | "已观看"模式必填 |
| parent_id | BIGINT NULL | NULL=一级评论；否则=所属一级评论 ID |
| reply_to_user_id | BIGINT NULL | 二级回复时 @ 谁 |
| content | TEXT | |
| rating | TINYINT NULL | 1-5 星，仅一级评论 |
| like_count | INT DEFAULT 0 | |
| reply_count | INT DEFAULT 0 | 仅一级评论维护 |
| status | TINYINT | 0=正常 1=举报中 2=被隐藏 |
| **IDX** | (show_id, parent_id, created_at DESC) | 列表 |
| **IDX** | (show_id, parent_id, like_count DESC) | 最热排序 |
| **IDX** | (parent_id, created_at) | 楼中楼 |

**`show_review_image`** — 评价图片

| 字段 | 类型 | 说明 |
|---|---|---|
| review_id | BIGINT | |
| url | VARCHAR(500) | |
| sort | INT | |
| **IDX** | (review_id, sort) | |

**`show_review_like`** — 点赞

| 字段 | 类型 | 说明 |
|---|---|---|
| review_id | BIGINT | |
| user_id | BIGINT | |
| **UK** | (review_id, user_id) | |

**`show_review_report`** — 举报

| 字段 | 类型 | 说明 |
|---|---|---|
| review_id | BIGINT | |
| reporter_id | BIGINT | |
| reason | VARCHAR(200) | |
| status | TINYINT | 0=待处理 1=已处理-保留 2=已处理-删除 |
| handler_id | BIGINT NULL | admin 处理人 |
| handled_at | DATETIME NULL | |
| **IDX** | (status, created_at) | |

### 4.4 艺人

**`artist`**

| 字段 | 类型 | 说明 |
|---|---|---|
| name | VARCHAR(100) | 本名 |
| stage_name | VARCHAR(100) | 艺名 |
| avatar_url | VARCHAR(500) | |
| gender | TINYINT | 0=保密 1=男 2=女 |
| nationality | VARCHAR(50) | |
| tags | VARCHAR(500) | 逗号分隔，如"歌手,演员" |
| bio | VARCHAR(500) | 简介短文本 |
| description | LONGTEXT | 富文本详介 |
| social_links | JSON | {weibo, instagram, x} |
| follow_count | INT DEFAULT 0 | 冗余统计 |
| show_count | INT DEFAULT 0 | 冗余统计 |
| status | TINYINT | 0=下架 1=上架 |
| **IDX** | (name), (stage_name) | |

**`show_artist`** — 多对多关联

| 字段 | 类型 | 说明 |
|---|---|---|
| show_id | BIGINT | |
| artist_id | BIGINT | |
| role | VARCHAR(50) NULL | "主演 / 导演"等 |
| sort | INT | 展示顺序 |
| **UK** | (show_id, artist_id) | |

**`user_follow_artist`**

| 字段 | 类型 | 说明 |
|---|---|---|
| user_id | BIGINT | |
| artist_id | BIGINT | |
| **UK** | (user_id, artist_id) | |
| **IDX** | (artist_id) | 给艺人查粉丝 |

### 4.5 资讯

**`article_category`**

| 字段 | 类型 | 说明 |
|---|---|---|
| name | VARCHAR(50) | |
| sort | INT | |
| status | TINYINT | 0=下架 1=上架 |
| **UK** | (name) | |

**`article`**

| 字段 | 类型 | 说明 |
|---|---|---|
| category_id | BIGINT | |
| title | VARCHAR(200) | |
| summary | VARCHAR(500) | 列表展示 |
| content | LONGTEXT | 富文本 |
| cover_url | VARCHAR(500) | |
| artist_id | BIGINT NULL | 可关联艺人 |
| author | VARCHAR(50) | |
| view_count | INT DEFAULT 0 | |
| status | TINYINT | 0=草稿 1=已发布 2=已下架 |
| published_at | DATETIME NULL | |
| **IDX** | (category_id, status, published_at DESC), (artist_id) | |

### 4.6 Banner

**`banner`**

| 字段 | 类型 | 说明 |
|---|---|---|
| title | VARCHAR(100) | 后台备注 |
| image_url | VARCHAR(500) | |
| link_type | TINYINT | 0=无 1=演出 2=艺人 3=资讯 4=外链 |
| link_target | VARCHAR(500) | target_id 或 URL |
| sort | INT | |
| start_at | DATETIME NULL | 定时上架 |
| end_at | DATETIME NULL | 定时下架 |
| status | TINYINT | 0=下架 1=上架 |
| **IDX** | (status, sort) | |

### 4.7 现有 `show` 表改造

```sql
ALTER TABLE `show`
  ADD COLUMN review_mode TINYINT NOT NULL DEFAULT 1
      COMMENT '0=无评价 1=所有可评 2=仅已观看',
  ADD COLUMN avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN review_count INT NOT NULL DEFAULT 0,
  ADD COLUMN open_sale_time DATETIME NULL COMMENT '开售时间，开售提醒触发依据',
  ADD INDEX idx_name (name),
  ADD INDEX idx_open_sale_time (open_sale_time);
```

---

## 5. 后端接口清单

> 命名约定：user 端 `/api/<resource>`，admin 端 `/api/admin/<resource>`。

### 5.1 User 端

#### `SearchController` — `/api/search`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/show?kw=&page=&size=` | 搜索演出（ES，带高亮） |
| GET | `/artist?kw=&page=&size=` | 搜索艺人 |
| GET | `/article?kw=&page=&size=` | 搜索资讯 |
| GET | `/all?kw=` | 三类聚合（每类 Top 5，首屏用） |
| GET | `/history` | 搜索历史（Redis 存最近 10 条） |
| DELETE | `/history` | 清空搜索历史 |

#### `FavoriteController` — `/api/favorite`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/add` | `{showId, groupId?}` |
| POST | `/remove` | `{showId}` |
| POST | `/move` | 移动到分组 `{showId, groupId}` |
| GET | `/list?groupId=&page=&size=` | 收藏列表 |
| GET | `/check?showId=` | 是否已收藏 |
| GET | `/group/list` | 分组列表 |
| POST | `/group/create` | `{name}` |
| POST | `/group/rename` | `{id, name}` |
| POST | `/group/delete` | `{id}`（关联收藏 group_id 置 NULL） |

#### `SubscribeController` — `/api/subscribe`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/add` | `{showId, notifyBeforeMinutes?}` |
| POST | `/remove` | `{showId}` |
| GET | `/list?page=` | 我的订阅 |
| GET | `/check?showId=` | 是否已订阅 |

#### `MessageController` — `/api/message`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/list?type=&page=&size=` | 分类型分页 |
| GET | `/unread/count` | 各类型未读数 |
| POST | `/read` | `{messageIds: []}` |
| POST | `/read/all` | `{type?}` |
| POST | `/delete` | `{messageIds: []}` |

#### `ReviewController` — `/api/review`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/publish` | 一级评论 `{showId, orderId?, rating, content, images:[]}` |
| POST | `/reply` | 二级回复 `{parentId, replyToUserId?, content, images:[]}` |
| GET | `/list?showId=&sort=latest\|hottest&page=` | 一级评论 |
| GET | `/replies?parentId=&page=` | 楼中楼 |
| GET | `/detail/{id}` | 评论详情 |
| POST | `/like` | `{reviewId}` |
| POST | `/unlike` | `{reviewId}` |
| POST | `/report` | `{reviewId, reason}` |
| POST | `/delete` | 自删 `{reviewId}` |
| GET | `/my?page=` | 我发布的 |
| GET | `/check-permission?showId=` | 当前用户能否评价 |

#### `ArtistController` — `/api/artist`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/list?page=&size=` | 艺人列表 |
| GET | `/{id}` | 艺人详情 |
| GET | `/{id}/shows?page=` | 该艺人演出 |
| GET | `/{id}/articles?page=` | 该艺人资讯 |
| POST | `/follow` | `{artistId}` |
| POST | `/unfollow` | `{artistId}` |
| GET | `/follow/list?page=` | 我关注的 |
| GET | `/follow/check?artistId=` | 是否已关注 |

#### `ArticleController` — `/api/article`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/list?categoryId=&page=&size=` | 资讯列表 |
| GET | `/{id}` | 资讯详情（view_count + 1） |
| GET | `/category/list` | 分类列表 |
| GET | `/by-artist/{artistId}` | 艺人相关资讯 |

#### `BannerController` — `/api/banner`
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/list` | 首页有效 banner（status=1 且在 start_at~end_at 之间） |

### 5.2 Admin 端

#### `BannerController` — `/api/admin/banner`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/list` | 分页列表（含已下架） |
| GET | `/{id}` | 详情 |
| POST | `/save` | 新增 / 更新 |
| POST | `/status` | 上下架 `{id, status}` |
| POST | `/sort` | 拖拽排序 `{orderedIds: []}` |
| POST | `/delete` | `{id}` |

#### `ArtistController` — `/api/admin/artist`
标准 CRUD：`/list /{id} /save /status /delete`

#### `ArticleController` — `/api/admin/article`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/list` | 按状态过滤分页 |
| GET | `/{id}` | 详情 |
| POST | `/save` | 草稿 / 发布 |
| POST | `/publish` | `{id}` |
| POST | `/offline` | `{id}` |
| POST | `/delete` | `{id}` |

#### `ArticleCategoryController` — `/api/admin/article-category`
标准 CRUD：`/list /save /status /delete /sort`

#### `ReviewModerationController` — `/api/admin/review`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/list` | 按 status / show / keyword 过滤 |
| POST | `/hide` | `{reviewId}` |
| POST | `/restore` | `{reviewId}` |
| POST | `/delete` | 硬删除 |
| POST | `/report/list` | 举报列表 |
| POST | `/report/handle` | `{reportId, action: keep\|delete}` |

#### `MessageBroadcastController` — `/api/admin/message`
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/broadcast` | 群发系统通知 |
| POST | `/send` | 单发 `{userIds:[], ...}` |
| POST | `/list` | 已发列表 |

### 5.3 现有接口改造

**Admin `ShowController`**：
- 演出 `save` 请求体新增：`reviewMode`、`openSaleTime`、`artistIds: []`、`artistRoles: { artistId: role }`
- save 时同步写 `show_artist` 关联表
- save 后异步发 MQ 消息 → core 模块消费 → 写 ES

---

## 6. 异步任务设计

| 任务 | 触发方式 | 队列 / 调度 | 说明 |
|---|---|---|---|
| ES 同步 | show / artist / article 写入后发 MQ | `mq.search.sync` | 消费者写 ES |
| 开售-提前推送 | 定时器每分钟扫描 | scheduled task | 扫 `notified_pre=0` 且接近提前时间的订阅，入站内信 |
| 开售-开售推送 | 定时器每分钟扫描 | scheduled task | 扫 `notified_open=0` 且开售时间已到的订阅，入站内信 |
| 订单消息 | OrderService 关键节点（下单 / 支付 / 退款 / 出票）发 MQ | `mq.order.message` | 消费者写 user_message |
| 演出统计回写 | 评价 publish / delete 发 MQ | `mq.review.stats` | 异步更新 `show.avg_rating`、`review_count` |
| 评论点赞 / 回复计数 | 评价 like / reply 时同 MQ 或事务内更新 `like_count` / `reply_count` | — | 性能权衡：写量小可直接同步更新 |

---

## 7. 前端页面清单

### 7.1 User 端新增路由

| 路由 | 页面 | 关键元素 |
|---|---|---|
| `/search` | 搜索页 | 搜索框 + 历史 + Tab(演出/艺人/资讯) + 高亮 |
| `/favorites` | 我的收藏 | 分组 Tab + 演出网格 + 长按多选移动 |
| `/favorites/groups` | 收藏分组管理 | 增删改 |
| `/subscriptions` | 我的订阅 | 列表 + 取消订阅 |
| `/messages` | 消息中心 | 5 类 Tab + 未读红点 + 一键已读 |
| `/messages/:id` | 消息详情（可选） | 长内容用 |
| `/review/publish?showId=&orderId=` | 发布评价 | 5 星 + 文本 + 多图上传 |
| `/review/reply?parentId=` | 回复楼层 | 文本 + 图片 |
| `/review/:id` | 评价详情 | 一级 + 楼中楼 + 点赞 / 举报 |
| `/artists` | 艺人列表 | 网格 |
| `/artist/:id` | 艺人主页 | 头像 + 标签 + 详介 + Tab(演出/资讯) + 关注 |
| `/follows` | 我关注的艺人 | 列表 |
| `/articles` | 资讯列表 | 分类 Tab + 卡片流 |
| `/article/:id` | 资讯详情 | 富文本 + 关联艺人 / 演出卡片 |

### 7.2 User 端改造

| 页面 | 改动 |
|---|---|
| `/` (HomePage) | 顶部 Banner 轮播 + "热门艺人""最新资讯"运营位 |
| `/show/:id` | 关联艺人 chip + 平均评分 + 评价 Tab + 收藏 / 订阅按钮 |
| `/profile` | 入口：收藏 / 订阅 / 关注 / 评价 / 消息 |
| `MobileLayout` | 底部 Tab 加"消息"（带未读红点） |

### 7.3 复用组件 / Hook

- `useUnreadCount()` — 全局未读数轮询（30s + 进消息页强刷）
- `<HighlightText>` — 渲染 ES 的 `<em>` 高亮
- `<ImageUploader>` — 多图上传 MinIO
- `<RichTextRenderer>` — 富文本渲染（防 XSS）
- `<StarRating>` — 5 星打分
- `<FollowButton>` / `<FavoriteButton>` / `<SubscribeButton>` — 状态切换按钮（乐观更新）

### 7.4 Admin 端新增

| 路由 | 页面 |
|---|---|
| `/banner` | Banner 管理（拖拽排序 + 抽屉编辑） |
| `/artist`、`/artist/edit/:id?` | 艺人列表 + 编辑 |
| `/article`、`/article/edit/:id?` | 资讯列表 + WangEditor 编辑 |
| `/article/category` | 资讯分类管理 |
| `/review` | 评价审核 |
| `/review/report` | 举报处理 |
| `/message/broadcast` | 站内信群发 |
| `/message/history` | 已发列表 |

### 7.5 Admin 端改造

| 页面 | 改动 |
|---|---|
| 演出编辑 | 加 reviewMode 下拉 / openSaleTime 选择器 / 艺人多选（带 role） |
| 演出列表 | 加平均评分列、被收藏数列（可选） |
| 报表 | 加"被收藏 Top 10""关注最多艺人 Top 10"看板 |

---

## 8. 落地顺序（5 个阶段，每阶段独立可上线）

### Stage 1：基础设施
- docker-compose 加 ES 服务，验证启动
- common 加 ES Client + MQ 公共配置
- core 加 ES 同步消费者骨架
- 编写 SQL 迁移：15 张新表 + show 表改造

### Stage 2：Banner（独立、最简）
- 后端：admin / user BannerController
- 前端：admin Banner 管理页 + user 首页轮播

### Stage 3：艺人 + 资讯
- 后端：admin / user 的 Artist、Article、ArticleCategory
- 前端：admin 艺人 / 资讯 / 分类管理（WangEditor）+ user 艺人主页、资讯列表 / 详情
- 改造：演出编辑页加艺人多选；演出详情页展示艺人

### Stage 4：搜索 + 收藏 + 订阅 + 消息中心
- 消息中心基础设施先做（被其他依赖）
- ES 同步任务（演出 / 艺人 / 资讯都已存在）
- Search / Favorite / Subscribe Controller
- 定时任务（开售提醒扫描器）
- 前端：搜索页、收藏页、订阅页、消息中心、底部 Tab 红点

### Stage 5：评价 + 晒图 + 楼中楼 + 审核
- Review Controller + 异步统计回写
- admin Review 审核 + 举报处理
- 前端：评价发布 / 回复 / 详情、演出详情页评价 Tab
- 前端：admin 评价审核 + 举报处理

---

## 9. 验收标准

每个阶段需满足：

- **后端**
  - 单元测试覆盖核心业务逻辑（Service 层）
  - 接口在 Knife4j / Postman 全部可调通
  - SQL 迁移在本地 docker MySQL 跑通无错
- **前端**
  - user 端在移动端真机或 DevTools 模拟器跑通核心流程
  - admin 在 PC 浏览器跑通 CRUD
- **跨端**
  - admin 新增 / 修改演出后 30 秒内 ES 可搜到
  - 订阅演出后，到达时间能收到站内信
  - 用户发评价后 admin 审核端可见

---

## 10. 风险与权衡

| 风险 | 缓解策略 |
|---|---|
| ES 部署 / 调优学习成本 | 先用单节点 ES + 默认配置，索引字段尽量少；同步失败不影响主流程，可降级 LIKE |
| MQ 消费失败导致 ES 数据不一致 | 死信队列 + 定时全量重建索引脚本兜底 |
| 广播消息 user_message 写爆 | 懒生成策略：用户首次拉列表才写关系记录 |
| 富文本 XSS | 后端入库前用 jsoup / OWASP Java HTML Sanitizer 过滤；前端使用 `DOMPurify` 二次防护 |
| 评价"先发后审"出现违规内容 | 举报触达 admin、客户端举报阈值自动隐藏（达 N 次自动 status=1） |
| 评价图存储滥用 | 单评论图片数限制（如最多 9 张）+ 单图大小限制 |
| 楼中楼回复数据量大 | 一级评论懒加载二级；二级用 cursor / 时间游标分页 |

---

## 11. 待 plan 阶段细化的内容

- 各 Service 层的事务边界（特别是评价 publish 同时更新统计）
- ES 索引 mapping（中文分词器：ik_max_word vs ik_smart）
- 广播消息懒生成的并发安全策略（同一用户同一消息并发请求时不重复生成）
- 演出详情页评价的初始加载策略（一级 + 每一级前 2 条回复 vs 仅一级）
- 用户删除自己评论后，楼中楼回复如何处理（保留显示"该评论已删除"，还是级联删除）
- 收藏分组删除后未分组演出的处理方式（已确定 group_id 置 NULL，需补默认排序逻辑）

---

## 12. 不在本设计范围（明确排除）

- 优惠券 / 积分 / 等级体系
- 限时秒杀 / 早鸟票
- 拼团 / 邀请有礼
- 签到 / 任务体系
- 附近演出 / 地图找演出
- 深色模式
- App push / 短信通道
- 演出详情下的"问答"独立模块

如需引入以上功能，将作为后续设计独立处理。
