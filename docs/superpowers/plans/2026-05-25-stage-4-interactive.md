# Stage 4：消息中心 + 收藏 + 订阅 + 搜索 Implementation Plan

**Goal：** 落地用户互动基础设施 —— 站内信消息中心、演出收藏（含分组）、开售提醒订阅（定时任务触发推送）、ES 搜索（演出 / 艺人 / 资讯）。

**约定：** 跳过 git commit / 单元测试 / 端到端验收。代码风格紧密照搬 Stage 2/3。

---

## 内部分阶段

### 4.1 消息中心（基础设施，被其他模块依赖）
- **T1**: Message + UserMessage 实体 / Mapper / XML
- **T2**: MessageService + ErrorCode
- **T3**: admin MessageBroadcastController + DTOs
- **T4**: user MessageController（list / unread/count / read / read-all / delete）
- **T5**: 前端 shared types: Message + i18n
- **T6**: admin 群发页面 + 路由 / 菜单
- **T7**: user 消息中心页（5 类型 Tab + 未读红点 + 一键已读）+ 路由 + 底部 Tab

### 4.2 收藏 + 分组
- **T8**: FavoriteGroup + UserFavorite Entity / Mapper / XML
- **T9**: FavoriteService（CRUD 分组 + add/remove 收藏 + 移动到分组）
- **T10**: user FavoriteController
- **T11**: user 端"我的收藏"页 + 分组管理 + 收藏按钮（在 ShowDetailPage 加按钮）

### 4.3 订阅 + 开售提醒
- **T12**: ShowSubscribe Entity / Mapper / XML
- **T13**: SubscribeService + 定时任务（每分钟扫开售提醒,产生 Message + 调 broadcast 到订阅者）
- **T14**: user SubscribeController
- **T15**: user 端"我的订阅"页 + 订阅按钮（在 ShowDetailPage 加按钮）

### 4.4 搜索（ES）
- **T16**: SearchSyncConsumer 实现（替换 Stage 1 骨架）—— 完成 show/artist/article 写 ES 逻辑
- **T17**: 钩 ShowService/ArtistService/ArticleService 的 save/delete → send SearchSyncEvent
- **T18**: user SearchController（演出 / 艺人 / 资讯 / 聚合）+ 搜索历史（Redis）
- **T19**: 前端 user 搜索页 + 高亮渲染

---

## 关键设计点

### 4.1.1 广播消息懒生成策略

`message` 表存广播主体一条;`user_message` 表存用户↔消息关系。

懒生成：用户首次拉取消息列表时，发现有"广播消息但还没有 user_message 记录"则按需 INSERT。

实现位置：`MessageService.listForUser(userId, type)`：
1. 查 user_message + LEFT JOIN message → 该用户已有的关系记录
2. 查所有 broadcast=1 的 message 中,user_id 还没有 user_message 记录的（用 NOT EXISTS / NOT IN）
3. 为这些 broadcast 消息批量 INSERT user_message
4. 重新查列表返回

为了简化 Stage 4，可以先用同步方案；扩量后再改异步。

### 4.1.2 订单触发消息

订单关键节点（下单 / 支付 / 退款 / 出票）应自动产生订单消息。Stage 4 在 OrderService 加 hook (调用 MessageService.sendOrderMessage(userId, type, title, content, orderId))。

### 4.3.1 定时任务

新增 `core/src/main/java/com/ticket/core/scheduler/SubscribeNotifier.java` 加 `@Scheduled(cron = "0 * * * * ?")`（每分钟扫描）：
- 查 `show_subscribe` WHERE notified_pre=0 AND show.open_sale_time - notify_before_minutes <= NOW
- 写 user_message + 标记 notified_pre=1
- 同样扫 notified_open=0 AND show.open_sale_time <= NOW

需要 admin / user / core 启用 @EnableScheduling（通常在主 Application 类上加注解）。

### 4.4.1 ES 同步钩子

Stage 1 已有 SearchSyncProducer + SearchSyncEvent + 空骨架 Consumer。Stage 4 完成：
1. SearchSyncConsumer 真正写 ES：
   - 接到 type=show + op=UPSERT → 读 DB Show + ShowVO + artist join → 转成 ES doc 写入
   - 接到 type=artist + op=UPSERT → 读 Artist → 写 ES
   - 接到 type=article + op=UPSERT → 读 Article + category/artist join → 写 ES
   - op=DELETE → ES DeleteRequest
2. 钩业务：
   - admin ShowController save/delete → 发 SearchSyncEvent
   - admin ArtistController save/delete → 发
   - admin ArticleController save/publish/offline/delete → 发

### 4.4.2 搜索高亮

ES query 加 highlight：
```java
HighlightBuilder hb = new HighlightBuilder()
    .field("name").field("title").field("stage_name").field("description").field("summary")
    .preTags("<em>").postTags("</em>");
```

前端用 `<HighlightText>` 组件直接 dangerouslySetInnerHTML 渲染（DOMPurify 二次清洗）。

### 4.4.3 搜索历史

用户搜索时往 Redis 写一份 `search:history:{userId}` (List 类型，LPUSH + LTRIM 保留最近 10)。
clear 时 DEL。

---

## ErrorCode 扩展（Stage 4 末尾）

```java
    ARTICLE_NOT_FOUND(1050, "资讯不存在"),
    MESSAGE_NOT_FOUND(1060, "消息不存在"),
    FAVORITE_GROUP_NOT_FOUND(1070, "收藏分组不存在"),
    FAVORITE_GROUP_NAME_DUPLICATED(1071, "分组名已存在"),
    SUBSCRIBE_NOT_FOUND(1080, "订阅不存在");
```

---

## 执行节奏

按 T1-T19 顺序。每个 task 一个 implementer。

完成后 Stage 4 落地，进入 Stage 5 评价系统。
