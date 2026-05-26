# Stage 1：基础设施 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 为后续 4 个 Stage（Banner / 艺人资讯 / 搜索收藏订阅消息 / 评价）准备所有基础设施——包含 Elasticsearch 部署、15 张新表的 DDL、ES 索引初始化、RabbitMQ 搜索同步队列骨架。

**Architecture：** 在 `maill-backend` 后端 Spring Boot 多模块项目（2.7.18 / Java 11）中，扩展 `common` 模块加 ES Client 配置，扩展 `core` 模块加搜索同步 MQ 配置与 Producer/Consumer 骨架。数据库走"在 schema.sql 同目录新增 schema-v2.sql"的方式做版本管理，docker-compose 加 ES 服务。

**Tech Stack：** Spring Boot 2.7.18、Java 11、MySQL 8、Elasticsearch 7.17.x、RabbitMQ、spring-boot-starter-data-elasticsearch、spring-boot-starter-amqp（已有）

---

## 关键约束

> 这些是写 plan 时新发现、与 spec 不一致的细节，已据此调整：

1. **ES 版本调整**：spec 写 ES 8，但项目是 Spring Boot 2.7.18，最匹配的是 ES 7.17.x（spring-data-elasticsearch 4.x 系列）。本 plan 使用 ES 7.17.x。
2. **字段命名调整**：spec 里写的"created_at / updated_at"统一改为现有项目惯例 **`create_time` / `update_time`**（与 schema.sql 现有所有表保持一致）。
3. **SQL 迁移方式**：项目暂无 Flyway/Liquibase，已有 schema.sql 通过 docker-entrypoint-initdb.d 挂载初始化。本 plan 采用"新建 schema-v2.sql 增量脚本，手动执行"的方式。
4. **git 提交**：每个 Task 都包含 commit 步骤，用户偏好不提交时可自行跳过 commit 步骤。

---

## 文件结构总览

下面是 Stage 1 所有要创建/修改的文件清单，先 lockdown，避免后续重复决策。

```
maill-backend/
├─ docker-compose.yml                                    🔧 加 elasticsearch 服务
├─ sql/
│   └─ schema-v2.sql                                     🆕 15 张新表 + show 表 ALTER
├─ pom.xml                                               🔧 加 elasticsearch.version property
├─ common/
│   ├─ pom.xml                                           🔧 加 spring-boot-starter-data-elasticsearch
│   └─ src/main/java/com/ticket/common/
│       ├─ es/
│       │   ├─ ElasticsearchProperties.java              🆕 ES 配置 binding
│       │   ├─ ElasticsearchClientConfig.java            🆕 RestHighLevelClient Bean
│       │   └─ IndexInitializer.java                     🆕 启动时创建 show/artist/article 索引
│       └─ es/index/                                     🆕 索引常量
│           ├─ EsIndices.java                            🆕 索引名常量
│           ├─ ShowIndexMapping.java                     🆕 演出索引 mapping JSON
│           ├─ ArtistIndexMapping.java                   🆕 艺人索引 mapping JSON
│           └─ ArticleIndexMapping.java                  🆕 资讯索引 mapping JSON
│   └─ src/test/java/com/ticket/common/es/
│       └─ ElasticsearchClientConfigTest.java            🆕 ES 连通性集成测试
├─ core/
│   └─ src/main/java/com/ticket/core/mq/
│       ├─ config/
│       │   └─ RabbitMQConfig.java                       🔧 加搜索同步 Exchange/Queue 常量与 Bean
│       ├─ event/
│       │   └─ SearchSyncEvent.java                      🆕 搜索同步事件（type + targetId + op）
│       ├─ producer/
│       │   └─ SearchSyncProducer.java                   🆕 发送同步事件
│       └─ consumer/
│           └─ SearchSyncConsumer.java                   🆕 消费骨架（仅打印日志 + 调用接口）
│   └─ src/test/java/com/ticket/core/mq/
│       └─ SearchSyncProducerTest.java                   🆕 Producer 单元测试
├─ admin/src/main/resources/application-dev.yml         🔧 加 elasticsearch 配置
├─ user/src/main/resources/application-dev.yml          🔧 加 elasticsearch 配置
└─ payment/src/main/resources/application-dev.yml       🔧 加 elasticsearch 配置（如该模块也需要）
```

> **说明**：`common.es` 子包是新增；`core.mq` 子包已有，只是扩展。三个 application-dev.yml 都改，是因为三个 Spring Boot 应用都会扫描 common 模块的 ES Config，必须能拿到配置。

---

## Task 1：在 docker-compose 中加 Elasticsearch 服务

**Files:**
- Modify: `/Users/xdb/Desktop/test/maill-backend/docker-compose.yml`

- [ ] **Step 1.1：在 docker-compose.yml 中添加 elasticsearch 服务**

Edit `/Users/xdb/Desktop/test/maill-backend/docker-compose.yml`，在 `minio` 服务之后、`volumes:` 之前插入：

```yaml
  elasticsearch:
    image: elasticsearch:7.17.18
    container_name: ticket-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - TZ=Asia/Shanghai
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -fs http://localhost:9200/_cluster/health | grep -q '\"status\":\"yellow\\|green\"'"]
      interval: 10s
      timeout: 5s
      retries: 6
```

然后在底部 `volumes:` 段落最后一行加上：

```yaml
  es-data:
```

- [ ] **Step 1.2：启动 ES**

Run:
```bash
cd /Users/xdb/Desktop/test/maill-backend && docker-compose up -d elasticsearch
```

Expected：输出包含 `Creating ticket-elasticsearch ... done` 或 `Container ticket-elasticsearch  Started`。

- [ ] **Step 1.3：等待 ES 健康并验证**

Run（轮询直到健康）：
```bash
until curl -fs http://localhost:9200/_cluster/health 2>/dev/null | grep -q '"status":"\(yellow\|green\)"'; do sleep 2; done && curl -s http://localhost:9200
```

Expected：JSON 输出包含 `"version" : { "number" : "7.17.18", ... }`，集群健康。

- [ ] **Step 1.4：Commit**

```bash
cd /Users/xdb/Desktop/test/maill-backend
git add docker-compose.yml
git commit -m "feat(infra): 添加 Elasticsearch 7.17 服务到 docker-compose"
```

---

## Task 2：创建 schema-v2.sql（15 张新表 + show 表改造）

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/sql/schema-v2.sql`

- [ ] **Step 2.1：创建 schema-v2.sql 文件**

Create `/Users/xdb/Desktop/test/maill-backend/sql/schema-v2.sql` with the following content:

```sql
-- ============================================================
-- 用户端功能扩展 v2 迁移脚本
-- 关联设计文档：docs/superpowers/specs/2026-05-25-user-features-expansion-design.md
-- 注意：执行前请先确保 schema.sql 已建库建表
-- ============================================================

USE ticket_system;

-- ------------------------------------------------------------
-- 1. show 表改造
-- ------------------------------------------------------------
ALTER TABLE `show`
  ADD COLUMN review_mode    TINYINT       NOT NULL DEFAULT 1 COMMENT '0=无评价 1=所有可评 2=仅已观看' AFTER status,
  ADD COLUMN avg_rating     DECIMAL(3, 2) NOT NULL DEFAULT 0 COMMENT '平均评分,冗余统计' AFTER review_mode,
  ADD COLUMN review_count   INT           NOT NULL DEFAULT 0 COMMENT '评价数,冗余统计' AFTER avg_rating,
  ADD COLUMN open_sale_time DATETIME      NULL COMMENT '开售时间,用于开售提醒触发' AFTER review_count,
  ADD INDEX idx_name (name),
  ADD INDEX idx_open_sale_time (open_sale_time);

-- ------------------------------------------------------------
-- 2. 收藏分组表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorite_group (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL COMMENT '用户ID',
    name        VARCHAR(50) NOT NULL COMMENT '分组名',
    sort        INT         NOT NULL DEFAULT 0 COMMENT '排序,小靠前',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏分组';

-- ------------------------------------------------------------
-- 3. 用户收藏演出表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_favorite (
    id          BIGINT     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT     NOT NULL COMMENT '用户ID',
    show_id     BIGINT     NOT NULL COMMENT '演出ID',
    group_id    BIGINT     NULL     COMMENT '分组ID,NULL=未分组',
    create_time DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_show (user_id, show_id),
    KEY idx_user_group (user_id, group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏演出';

-- ------------------------------------------------------------
-- 4. 开售提醒订阅表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_subscribe (
    id                    BIGINT   NOT NULL AUTO_INCREMENT,
    user_id               BIGINT   NOT NULL COMMENT '用户ID',
    show_id               BIGINT   NOT NULL COMMENT '演出ID',
    notify_before_minutes INT      NOT NULL DEFAULT 10 COMMENT '提前提醒分钟数',
    notified_pre          TINYINT  NOT NULL DEFAULT 0 COMMENT '已推送提前提醒:0=否 1=是',
    notified_open         TINYINT  NOT NULL DEFAULT 0 COMMENT '已推送开售:0=否 1=是',
    create_time           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_show (user_id, show_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='演出开售提醒订阅';

-- ------------------------------------------------------------
-- 5. 消息主表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    type        TINYINT      NOT NULL COMMENT '1=订单 2=开售提醒 3=系统通知 4=互动 5=关注动态',
    title       VARCHAR(200) NOT NULL,
    content     TEXT         NOT NULL,
    link_type   TINYINT      NOT NULL DEFAULT 0 COMMENT '0=无 1=演出 2=艺人 3=资讯 4=订单 5=URL',
    link_target VARCHAR(500) NULL COMMENT 'target_id 或 URL',
    broadcast   TINYINT      NOT NULL DEFAULT 0 COMMENT '0=单发 1=广播',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_type_time (type, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息主表';

-- ------------------------------------------------------------
-- 6. 用户-消息关系表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_message (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL COMMENT '用户ID',
    message_id  BIGINT   NOT NULL COMMENT '消息ID',
    is_read     TINYINT  NOT NULL DEFAULT 0 COMMENT '0=未读 1=已读',
    read_at     DATETIME NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_msg (user_id, message_id),
    KEY idx_user_unread_time (user_id, is_read, create_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-消息关系';

-- ------------------------------------------------------------
-- 7. 演出评价主表（一级评论 + 二级回复）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_review (
    id                BIGINT   NOT NULL AUTO_INCREMENT,
    show_id           BIGINT   NOT NULL COMMENT '演出ID',
    user_id           BIGINT   NOT NULL COMMENT '发布用户ID',
    order_id          BIGINT   NULL     COMMENT '订单ID,"已观看"模式必填',
    parent_id         BIGINT   NULL     COMMENT 'NULL=一级评论;否则=所属一级评论ID',
    reply_to_user_id  BIGINT   NULL     COMMENT '二级回复时@的目标用户ID',
    content           TEXT     NOT NULL,
    rating            TINYINT  NULL     COMMENT '1-5星,仅一级评论',
    like_count        INT      NOT NULL DEFAULT 0,
    reply_count       INT      NOT NULL DEFAULT 0 COMMENT '仅一级评论维护',
    status            TINYINT  NOT NULL DEFAULT 0 COMMENT '0=正常 1=举报中 2=被隐藏',
    create_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_show_parent_time (show_id, parent_id, create_time DESC),
    KEY idx_show_parent_hot (show_id, parent_id, like_count DESC),
    KEY idx_parent_time (parent_id, create_time),
    KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='演出评价';

-- ------------------------------------------------------------
-- 8. 评价图片表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_review_image (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    review_id   BIGINT       NOT NULL,
    url         VARCHAR(500) NOT NULL,
    sort        INT          NOT NULL DEFAULT 0,
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_review_sort (review_id, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价图片';

-- ------------------------------------------------------------
-- 9. 评价点赞表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_review_like (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    review_id   BIGINT   NOT NULL,
    user_id     BIGINT   NOT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_user (review_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价点赞';

-- ------------------------------------------------------------
-- 10. 评价举报表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_review_report (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    review_id   BIGINT       NOT NULL,
    reporter_id BIGINT       NOT NULL COMMENT '举报人',
    reason      VARCHAR(200) NOT NULL,
    status      TINYINT      NOT NULL DEFAULT 0 COMMENT '0=待处理 1=已处理-保留 2=已处理-删除',
    handler_id  BIGINT       NULL     COMMENT 'admin 处理人',
    handled_at  DATETIME     NULL,
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_status_time (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价举报';

-- ------------------------------------------------------------
-- 11. 艺人表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artist (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL COMMENT '本名',
    stage_name    VARCHAR(100) NULL     COMMENT '艺名',
    avatar_url    VARCHAR(500) NULL,
    gender        TINYINT      NOT NULL DEFAULT 0 COMMENT '0=保密 1=男 2=女',
    nationality   VARCHAR(50)  NULL     COMMENT '国籍/地区',
    tags          VARCHAR(500) NULL     COMMENT '逗号分隔,如"歌手,演员"',
    bio           VARCHAR(500) NULL     COMMENT '简介短文本',
    description   LONGTEXT     NULL     COMMENT '富文本详介',
    social_links  JSON         NULL     COMMENT '{"weibo":"","instagram":"","x":""}',
    follow_count  INT          NOT NULL DEFAULT 0,
    show_count    INT          NOT NULL DEFAULT 0,
    status        TINYINT      NOT NULL DEFAULT 1 COMMENT '0=下架 1=上架',
    create_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_name (name),
    KEY idx_stage_name (stage_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='艺人';

-- ------------------------------------------------------------
-- 12. 演出-艺人关联表（多对多）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS show_artist (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    show_id     BIGINT      NOT NULL,
    artist_id   BIGINT      NOT NULL,
    role        VARCHAR(50) NULL COMMENT '角色,主演/导演/特邀等',
    sort        INT         NOT NULL DEFAULT 0,
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_show_artist (show_id, artist_id),
    KEY idx_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='演出-艺人关联';

-- ------------------------------------------------------------
-- 13. 用户关注艺人表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_follow_artist (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    artist_id   BIGINT   NOT NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_artist (user_id, artist_id),
    KEY idx_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注艺人';

-- ------------------------------------------------------------
-- 14. 资讯分类表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_category (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50) NOT NULL,
    sort        INT         NOT NULL DEFAULT 0,
    status      TINYINT     NOT NULL DEFAULT 1 COMMENT '0=下架 1=上架',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资讯分类';

-- ------------------------------------------------------------
-- 15. 资讯表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    category_id  BIGINT       NOT NULL,
    title        VARCHAR(200) NOT NULL,
    summary      VARCHAR(500) NULL COMMENT '摘要,列表展示用',
    content      LONGTEXT     NOT NULL COMMENT '富文本',
    cover_url    VARCHAR(500) NULL,
    artist_id    BIGINT       NULL COMMENT '可关联艺人',
    author       VARCHAR(50)  NULL,
    view_count   INT          NOT NULL DEFAULT 0,
    status       TINYINT      NOT NULL DEFAULT 0 COMMENT '0=草稿 1=已发布 2=已下架',
    published_at DATETIME     NULL,
    create_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_category_status_time (category_id, status, published_at DESC),
    KEY idx_artist (artist_id),
    KEY idx_status_time (status, published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资讯';

-- ------------------------------------------------------------
-- 16. Banner / 运营位表
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banner (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    title       VARCHAR(100) NULL COMMENT '后台备注,前端可不展示',
    image_url   VARCHAR(500) NOT NULL,
    link_type   TINYINT      NOT NULL DEFAULT 0 COMMENT '0=无 1=演出 2=艺人 3=资讯 4=外链',
    link_target VARCHAR(500) NULL,
    sort        INT          NOT NULL DEFAULT 0,
    start_at    DATETIME     NULL COMMENT '定时上架,NULL=立即生效',
    end_at      DATETIME     NULL COMMENT '定时下架,NULL=永久',
    status      TINYINT      NOT NULL DEFAULT 0 COMMENT '0=下架 1=上架',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_status_sort (status, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页Banner/运营位';
```

- [ ] **Step 2.2：在本地 MySQL 执行迁移**

Run（密码与 docker-compose.yml 中 `MYSQL_ROOT_PASSWORD=root123` 对应）：
```bash
docker exec -i ticket-mysql mysql -uroot -proot123 < /Users/xdb/Desktop/test/maill-backend/sql/schema-v2.sql
```

Expected：无报错输出（成功时 MySQL 静默）；若 show 表已含某字段会失败，按需处理。

- [ ] **Step 2.3：验证表创建成功**

Run：
```bash
docker exec ticket-mysql mysql -uroot -proot123 -e "USE ticket_system; SHOW TABLES LIKE '%';" 2>/dev/null | grep -E "favorite_group|user_favorite|show_subscribe|message|user_message|show_review|show_review_image|show_review_like|show_review_report|artist|show_artist|user_follow_artist|article_category|article|banner"
```

Expected：输出 15 行（每张新表一行）。

Run：
```bash
docker exec ticket-mysql mysql -uroot -proot123 -e "USE ticket_system; SHOW COLUMNS FROM \`show\` LIKE 'review_mode';" 2>/dev/null
```

Expected：包含 `review_mode | tinyint | NO | | 1` 的一行。

- [ ] **Step 2.4：Commit**

```bash
cd /Users/xdb/Desktop/test/maill-backend
git add sql/schema-v2.sql
git commit -m "feat(db): 新增用户端扩展 v2 迁移脚本(15张新表+show表改造)"
```

---

## Task 3：在 common 模块添加 Elasticsearch 依赖

**Files:**
- Modify: `/Users/xdb/Desktop/test/maill-backend/common/pom.xml`

- [ ] **Step 3.1：添加 spring-boot-starter-data-elasticsearch 依赖**

Edit `/Users/xdb/Desktop/test/maill-backend/common/pom.xml`，在 `<dependencies>` 块的最后一个 `</dependency>` 之后、`</dependencies>` 之前插入：

```xml
        <!-- Elasticsearch 7.17 客户端（与 Spring Boot 2.7 兼容） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
        </dependency>
```

- [ ] **Step 3.2：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common -am compile -q
```

Expected：BUILD SUCCESS，无报错。Spring Boot 2.7.18 默认会拉 ES client 7.17.x。

- [ ] **Step 3.3：Commit**

```bash
git add common/pom.xml
git commit -m "feat(common): 引入 spring-boot-starter-data-elasticsearch"
```

---

## Task 4：在 common 模块创建 ES 配置类与 Properties

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/ElasticsearchProperties.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/ElasticsearchClientConfig.java`
- Modify: `/Users/xdb/Desktop/test/maill-backend/admin/src/main/resources/application-dev.yml`
- Modify: `/Users/xdb/Desktop/test/maill-backend/user/src/main/resources/application-dev.yml`
- Modify: `/Users/xdb/Desktop/test/maill-backend/payment/src/main/resources/application-dev.yml`

- [ ] **Step 4.1：创建 ElasticsearchProperties**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/ElasticsearchProperties.java`:

```java
package com.ticket.common.es;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Elasticsearch 配置属性
 * 通过 application-*.yml 的 elasticsearch.* 注入
 */
@Data
@Component
@ConfigurationProperties(prefix = "elasticsearch")
public class ElasticsearchProperties {

    /** ES HTTP 地址,如 localhost:9200 */
    private String host = "localhost:9200";

    /** 连接超时(毫秒) */
    private int connectTimeoutMs = 3000;

    /** 读取超时(毫秒) */
    private int socketTimeoutMs = 10000;
}
```

- [ ] **Step 4.2：创建 ElasticsearchClientConfig**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/ElasticsearchClientConfig.java`:

```java
package com.ticket.common.es;

import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Elasticsearch RestHighLevelClient 配置
 * 注意:Spring Boot 2.7 默认提供 RestHighLevelClient(7.17.x),
 * 此处显式配置以便统一管理超时和地址。
 */
@Configuration
public class ElasticsearchClientConfig {

    private final ElasticsearchProperties properties;

    public ElasticsearchClientConfig(ElasticsearchProperties properties) {
        this.properties = properties;
    }

    @Bean(destroyMethod = "close")
    public RestHighLevelClient elasticsearchClient() {
        String[] parts = properties.getHost().split(":");
        String host = parts[0];
        int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 9200;

        RestClientBuilder builder = RestClient.builder(new HttpHost(host, port, "http"))
                .setRequestConfigCallback(req -> req
                        .setConnectTimeout(properties.getConnectTimeoutMs())
                        .setSocketTimeout(properties.getSocketTimeoutMs()));

        return new RestHighLevelClient(builder);
    }
}
```

- [ ] **Step 4.3：在三个 application-dev.yml 加 elasticsearch 配置**

Edit `/Users/xdb/Desktop/test/maill-backend/admin/src/main/resources/application-dev.yml`，在文件末尾追加：

```yaml

# Elasticsearch (本地 docker-compose)
elasticsearch:
  host: localhost:9200
  connect-timeout-ms: 3000
  socket-timeout-ms: 10000
```

Edit `/Users/xdb/Desktop/test/maill-backend/user/src/main/resources/application-dev.yml`，文件末尾追加相同的 6 行（同上）。

Edit `/Users/xdb/Desktop/test/maill-backend/payment/src/main/resources/application-dev.yml`，文件末尾追加相同的 6 行（同上）。

- [ ] **Step 4.4：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common -am compile -q
```

Expected：BUILD SUCCESS。

- [ ] **Step 4.5：Commit**

```bash
git add common/src/main/java/com/ticket/common/es admin/src/main/resources/application-dev.yml user/src/main/resources/application-dev.yml payment/src/main/resources/application-dev.yml
git commit -m "feat(common): 配置 Elasticsearch RestHighLevelClient"
```

---

## Task 5：创建索引常量与 mapping 定义

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/EsIndices.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ShowIndexMapping.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ArtistIndexMapping.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ArticleIndexMapping.java`

> **关于中文分词**：本 Stage 不引入 ik 分词器（需单独安装插件，增加部署复杂度）。先用 ES 自带的 `standard` 分词器，单字切分能基本满足搜索；后续 Stage 4 若用户量上来再单独安装 ik 插件并重建索引（这是个明确的、可推迟的优化）。

- [ ] **Step 5.1：创建 EsIndices 常量类**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/EsIndices.java`:

```java
package com.ticket.common.es.index;

/**
 * ES 索引名常量
 */
public final class EsIndices {

    private EsIndices() {}

    public static final String SHOW    = "show";
    public static final String ARTIST  = "artist";
    public static final String ARTICLE = "article";
}
```

- [ ] **Step 5.2：创建 ShowIndexMapping**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ShowIndexMapping.java`:

```java
package com.ticket.common.es.index;

/**
 * 演出索引 mapping。
 * 字段说明：
 *  - id              : long      演出ID
 *  - name            : text+kw   名称(可搜可聚合)
 *  - description     : text      简介
 *  - venue           : text      场馆
 *  - category_id     : long
 *  - category_name   : keyword
 *  - city_id         : long
 *  - city_name       : keyword
 *  - poster_url      : keyword   不分词
 *  - status          : integer
 *  - open_sale_time  : date
 *  - create_time     : date
 *  - avg_rating      : float
 *  - review_count    : integer
 */
public final class ShowIndexMapping {

    private ShowIndexMapping() {}

    public static final String JSON = "{\n" +
            "  \"settings\": { \"number_of_shards\": 1, \"number_of_replicas\": 0 },\n" +
            "  \"mappings\": {\n" +
            "    \"properties\": {\n" +
            "      \"id\":             { \"type\": \"long\" },\n" +
            "      \"name\":           { \"type\": \"text\", \"fields\": { \"kw\": { \"type\": \"keyword\" } } },\n" +
            "      \"description\":    { \"type\": \"text\" },\n" +
            "      \"venue\":          { \"type\": \"text\" },\n" +
            "      \"category_id\":    { \"type\": \"long\" },\n" +
            "      \"category_name\":  { \"type\": \"keyword\" },\n" +
            "      \"city_id\":        { \"type\": \"long\" },\n" +
            "      \"city_name\":      { \"type\": \"keyword\" },\n" +
            "      \"poster_url\":     { \"type\": \"keyword\", \"index\": false },\n" +
            "      \"status\":         { \"type\": \"integer\" },\n" +
            "      \"open_sale_time\": { \"type\": \"date\", \"format\": \"yyyy-MM-dd HH:mm:ss||epoch_millis\" },\n" +
            "      \"create_time\":    { \"type\": \"date\", \"format\": \"yyyy-MM-dd HH:mm:ss||epoch_millis\" },\n" +
            "      \"avg_rating\":     { \"type\": \"float\" },\n" +
            "      \"review_count\":   { \"type\": \"integer\" }\n" +
            "    }\n" +
            "  }\n" +
            "}";
}
```

- [ ] **Step 5.3：创建 ArtistIndexMapping**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ArtistIndexMapping.java`:

```java
package com.ticket.common.es.index;

public final class ArtistIndexMapping {

    private ArtistIndexMapping() {}

    public static final String JSON = "{\n" +
            "  \"settings\": { \"number_of_shards\": 1, \"number_of_replicas\": 0 },\n" +
            "  \"mappings\": {\n" +
            "    \"properties\": {\n" +
            "      \"id\":           { \"type\": \"long\" },\n" +
            "      \"name\":         { \"type\": \"text\", \"fields\": { \"kw\": { \"type\": \"keyword\" } } },\n" +
            "      \"stage_name\":   { \"type\": \"text\", \"fields\": { \"kw\": { \"type\": \"keyword\" } } },\n" +
            "      \"avatar_url\":   { \"type\": \"keyword\", \"index\": false },\n" +
            "      \"nationality\":  { \"type\": \"keyword\" },\n" +
            "      \"tags\":         { \"type\": \"keyword\" },\n" +
            "      \"bio\":          { \"type\": \"text\" },\n" +
            "      \"status\":       { \"type\": \"integer\" },\n" +
            "      \"create_time\":  { \"type\": \"date\", \"format\": \"yyyy-MM-dd HH:mm:ss||epoch_millis\" }\n" +
            "    }\n" +
            "  }\n" +
            "}";
}
```

- [ ] **Step 5.4：创建 ArticleIndexMapping**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/index/ArticleIndexMapping.java`:

```java
package com.ticket.common.es.index;

public final class ArticleIndexMapping {

    private ArticleIndexMapping() {}

    public static final String JSON = "{\n" +
            "  \"settings\": { \"number_of_shards\": 1, \"number_of_replicas\": 0 },\n" +
            "  \"mappings\": {\n" +
            "    \"properties\": {\n" +
            "      \"id\":            { \"type\": \"long\" },\n" +
            "      \"title\":         { \"type\": \"text\", \"fields\": { \"kw\": { \"type\": \"keyword\" } } },\n" +
            "      \"summary\":       { \"type\": \"text\" },\n" +
            "      \"content\":       { \"type\": \"text\" },\n" +
            "      \"cover_url\":     { \"type\": \"keyword\", \"index\": false },\n" +
            "      \"category_id\":   { \"type\": \"long\" },\n" +
            "      \"category_name\": { \"type\": \"keyword\" },\n" +
            "      \"artist_id\":     { \"type\": \"long\" },\n" +
            "      \"author\":        { \"type\": \"keyword\" },\n" +
            "      \"status\":        { \"type\": \"integer\" },\n" +
            "      \"published_at\":  { \"type\": \"date\", \"format\": \"yyyy-MM-dd HH:mm:ss||epoch_millis\" },\n" +
            "      \"create_time\":   { \"type\": \"date\", \"format\": \"yyyy-MM-dd HH:mm:ss||epoch_millis\" }\n" +
            "    }\n" +
            "  }\n" +
            "}";
}
```

- [ ] **Step 5.5：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common -am compile -q
```

Expected：BUILD SUCCESS。

- [ ] **Step 5.6：Commit**

```bash
git add common/src/main/java/com/ticket/common/es/index
git commit -m "feat(es): 添加 show/artist/article 索引 mapping 定义"
```

---

## Task 6：创建 IndexInitializer（应用启动时建索引）

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/IndexInitializer.java`

- [ ] **Step 6.1：创建 IndexInitializer**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/es/IndexInitializer.java`:

```java
package com.ticket.common.es;

import com.ticket.common.es.index.ArticleIndexMapping;
import com.ticket.common.es.index.ArtistIndexMapping;
import com.ticket.common.es.index.EsIndices;
import com.ticket.common.es.index.ShowIndexMapping;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.elasticsearch.common.xcontent.XContentType;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动时确保 ES 索引存在(不存在则创建,存在跳过)
 * 三个 Spring Boot 应用启动都会触发,但用 indices.exists() 做了幂等保护。
 */
@Slf4j
@Component
public class IndexInitializer implements ApplicationRunner {

    private final RestHighLevelClient client;

    public IndexInitializer(RestHighLevelClient client) {
        this.client = client;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureIndex(EsIndices.SHOW,    ShowIndexMapping.JSON);
            ensureIndex(EsIndices.ARTIST,  ArtistIndexMapping.JSON);
            ensureIndex(EsIndices.ARTICLE, ArticleIndexMapping.JSON);
        } catch (Exception e) {
            // ES 不可用时不阻塞应用启动,只记日志(后续业务用 try-catch 降级)
            log.warn("[ES] 初始化索引失败,稍后业务调用时会重试: {}", e.getMessage());
        }
    }

    private void ensureIndex(String name, String mappingJson) throws Exception {
        GetIndexRequest exists = new GetIndexRequest(name);
        if (client.indices().exists(exists, RequestOptions.DEFAULT)) {
            log.info("[ES] 索引已存在,跳过: {}", name);
            return;
        }
        CreateIndexRequest create = new CreateIndexRequest(name);
        create.source(mappingJson, XContentType.JSON);
        client.indices().create(create, RequestOptions.DEFAULT);
        log.info("[ES] 索引创建成功: {}", name);
    }
}
```

- [ ] **Step 6.2：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common -am compile -q
```

Expected：BUILD SUCCESS。

- [ ] **Step 6.3：启动 admin 模块手动验证索引创建**

Run（如果有 IDE 启动直接用 IDE；命令行如下）：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl admin -am spring-boot:run -Dspring-boot.run.profiles=dev
```

等 console 输出 `Started AdminApplication in ...`（约 30 秒）。

另开终端运行：
```bash
curl -s http://localhost:9200/_cat/indices?v
```

Expected：输出表头 + 3 行，分别对应 `show`、`artist`、`article` 索引。

验证完成后，关闭 admin（Ctrl+C）。

- [ ] **Step 6.4：Commit**

```bash
git add common/src/main/java/com/ticket/common/es/IndexInitializer.java
git commit -m "feat(es): 启动时自动创建 show/artist/article 索引"
```

---

## Task 7：创建 ES 连通性集成测试

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/common/src/test/java/com/ticket/common/es/ElasticsearchClientConfigTest.java`

> **测试策略**：用 `@SpringBootTest` 配合本地 docker 起的 ES，验证：(1) Client Bean 注入成功；(2) 能 ping 通；(3) 三个索引在启动后存在。不引入 Testcontainers（虽然现有项目用于 Redis 测试），简化流程：测试前提是本地 docker-compose 起 ES。

- [ ] **Step 7.1：编写失败测试（建一个最小 Spring Boot Application 用于测试）**

Create `/Users/xdb/Desktop/test/maill-backend/common/src/test/java/com/ticket/common/es/ElasticsearchClientConfigTest.java`:

```java
package com.ticket.common.es;

import com.ticket.common.es.index.EsIndices;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.core.MainResponse;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Elasticsearch 集成测试
 * 前提:本地 docker-compose up -d elasticsearch
 * 关闭方式:不设 -Des.it=true 即跳过
 */
@SpringBootTest(classes = ElasticsearchClientConfigTest.TestApp.class)
@EnabledIfSystemProperty(named = "es.it", matches = "true")
class ElasticsearchClientConfigTest {

    @SpringBootApplication
    @EnableAutoConfiguration
    @EnableConfigurationProperties(ElasticsearchProperties.class)
    @ComponentScan(basePackages = "com.ticket.common.es")
    static class TestApp {}

    @Autowired
    RestHighLevelClient client;

    @Test
    void should_ping_elasticsearch() throws Exception {
        MainResponse info = client.info(RequestOptions.DEFAULT);
        assertTrue(info.getVersion().getNumber().startsWith("7."),
                "期望 ES 7.x,实际:" + info.getVersion().getNumber());
    }

    @Test
    void should_create_three_indices() throws Exception {
        assertTrue(indexExists(EsIndices.SHOW),    "show 索引应该存在");
        assertTrue(indexExists(EsIndices.ARTIST),  "artist 索引应该存在");
        assertTrue(indexExists(EsIndices.ARTICLE), "article 索引应该存在");
    }

    private boolean indexExists(String name) throws Exception {
        return client.indices().exists(new GetIndexRequest(name), RequestOptions.DEFAULT);
    }
}
```

- [ ] **Step 7.2：运行测试**

Run（需要 ES 已启动）：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common -am test -Des.it=true -Dtest=ElasticsearchClientConfigTest -q
```

Expected：测试通过（Tests run: 2, Failures: 0）。

> 如果索引不存在导致 `should_create_three_indices` 失败，说明 Task 6 的 IndexInitializer 未跑过。先在主模块启一次（Task 6 Step 6.3）让索引创建，再跑测试。

- [ ] **Step 7.3：Commit**

```bash
git add common/src/test/java/com/ticket/common/es/ElasticsearchClientConfigTest.java
git commit -m "test(es): 添加 ES 连通性与索引存在性集成测试"
```

---

## Task 8：在 RabbitMQConfig 中扩展搜索同步队列

**Files:**
- Modify: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/config/RabbitMQConfig.java`

- [ ] **Step 8.1：在 RabbitMQConfig 中添加搜索同步常量与 Bean**

Read 现有 `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/config/RabbitMQConfig.java` 文件结构（已知前 60 行），在文件中合适位置（紧跟"支付成功相关"常量段之后）插入：

```java
    // 搜索同步相关
    public static final String SEARCH_SYNC_EXCHANGE    = "search.sync.exchange";
    public static final String SEARCH_SYNC_QUEUE       = "search.sync.queue";
    public static final String SEARCH_SYNC_ROUTING_KEY = "search.sync";
```

在文件底部 `}` 之前（即 class 闭合之前）插入：

```java
    /** 搜索同步交换机 */
    @Bean
    public DirectExchange searchSyncExchange() {
        return new DirectExchange(SEARCH_SYNC_EXCHANGE, true, false);
    }

    /** 搜索同步队列 */
    @Bean
    public Queue searchSyncQueue() {
        return QueueBuilder.durable(SEARCH_SYNC_QUEUE).build();
    }

    /** 绑定:搜索同步队列 ↔ 搜索同步交换机 */
    @Bean
    public Binding searchSyncBinding() {
        return BindingBuilder
                .bind(searchSyncQueue())
                .to(searchSyncExchange())
                .with(SEARCH_SYNC_ROUTING_KEY);
    }
```

- [ ] **Step 8.2：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am compile -q
```

Expected：BUILD SUCCESS。

- [ ] **Step 8.3：Commit**

```bash
git add core/src/main/java/com/ticket/core/mq/config/RabbitMQConfig.java
git commit -m "feat(mq): 扩展 RabbitMQConfig 添加搜索同步队列声明"
```

---

## Task 9：创建 SearchSyncEvent + Producer + Consumer 骨架

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/event/SearchSyncEvent.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/producer/SearchSyncProducer.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/consumer/SearchSyncConsumer.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/test/java/com/ticket/core/mq/SearchSyncProducerTest.java`

- [ ] **Step 9.1：创建 SearchSyncEvent**

Create `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/event/SearchSyncEvent.java`:

```java
package com.ticket.core.mq.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 搜索同步事件
 * 业务侧(admin 演出/艺人/资讯 save/delete)发送此事件,
 * core.SearchSyncConsumer 消费后写 ES。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchSyncEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 索引类型:show / artist / article */
    private String type;

    /** 主键 ID(用于从 DB 拉数据写 ES,或删除指定 doc) */
    private Long targetId;

    /** 操作:UPSERT / DELETE */
    private String op;

    public static SearchSyncEvent upsert(String type, Long id) {
        return new SearchSyncEvent(type, id, "UPSERT");
    }

    public static SearchSyncEvent delete(String type, Long id) {
        return new SearchSyncEvent(type, id, "DELETE");
    }
}
```

- [ ] **Step 9.2：创建 SearchSyncProducer**

Create `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/producer/SearchSyncProducer.java`:

```java
package com.ticket.core.mq.producer;

import com.ticket.core.mq.config.RabbitMQConfig;
import com.ticket.core.mq.event.SearchSyncEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SearchSyncProducer {

    private final RabbitTemplate rabbitTemplate;

    public SearchSyncProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void send(SearchSyncEvent event) {
        log.info("[MQ-SEARCH] 发送同步事件 type={} id={} op={}",
                event.getType(), event.getTargetId(), event.getOp());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.SEARCH_SYNC_EXCHANGE,
                RabbitMQConfig.SEARCH_SYNC_ROUTING_KEY,
                event);
    }
}
```

- [ ] **Step 9.3：创建 SearchSyncConsumer 骨架**

Create `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mq/consumer/SearchSyncConsumer.java`:

```java
package com.ticket.core.mq.consumer;

import com.ticket.core.mq.config.RabbitMQConfig;
import com.ticket.core.mq.event.SearchSyncEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * 搜索同步消费者(Stage 1 骨架)
 * 当前仅记录日志,具体的"从 DB 拉数据写 ES"逻辑在 Stage 3 / Stage 4 各业务模块完成时实现。
 *
 * 后续扩展点:
 *  - show:    Stage 3 实现 ShowSearchIndexer.upsert/delete
 *  - artist:  Stage 3 实现 ArtistSearchIndexer
 *  - article: Stage 3 实现 ArticleSearchIndexer
 */
@Slf4j
@Component
public class SearchSyncConsumer {

    @RabbitListener(queues = RabbitMQConfig.SEARCH_SYNC_QUEUE)
    public void onMessage(SearchSyncEvent event) {
        if (event == null || event.getType() == null) {
            log.warn("[MQ-SEARCH] 收到空消息或缺少 type,忽略");
            return;
        }
        log.info("[MQ-SEARCH] 收到同步事件 type={} id={} op={} (Stage 1 骨架,暂不写 ES)",
                event.getType(), event.getTargetId(), event.getOp());
    }
}
```

- [ ] **Step 9.4：编译验证**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am compile -q
```

Expected：BUILD SUCCESS。

- [ ] **Step 9.5：编写 Producer 单元测试**

Create `/Users/xdb/Desktop/test/maill-backend/core/src/test/java/com/ticket/core/mq/SearchSyncProducerTest.java`:

```java
package com.ticket.core.mq;

import com.ticket.core.mq.config.RabbitMQConfig;
import com.ticket.core.mq.event.SearchSyncEvent;
import com.ticket.core.mq.producer.SearchSyncProducer;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SearchSyncProducerTest {

    @Test
    void should_send_upsert_event_with_correct_routing() {
        RabbitTemplate template = mock(RabbitTemplate.class);
        SearchSyncProducer producer = new SearchSyncProducer(template);

        SearchSyncEvent event = SearchSyncEvent.upsert("show", 42L);
        producer.send(event);

        ArgumentCaptor<String> exchange = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> routingKey = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);

        verify(template).convertAndSend(exchange.capture(), routingKey.capture(), payload.capture());

        assertEquals(RabbitMQConfig.SEARCH_SYNC_EXCHANGE, exchange.getValue());
        assertEquals(RabbitMQConfig.SEARCH_SYNC_ROUTING_KEY, routingKey.getValue());
        assertEquals(event, payload.getValue());
    }
}
```

- [ ] **Step 9.6：运行单元测试**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am test -Dtest=SearchSyncProducerTest -q
```

Expected：Tests run: 1, Failures: 0。

- [ ] **Step 9.7：Commit**

```bash
git add core/src/main/java/com/ticket/core/mq/event/SearchSyncEvent.java \
        core/src/main/java/com/ticket/core/mq/producer/SearchSyncProducer.java \
        core/src/main/java/com/ticket/core/mq/consumer/SearchSyncConsumer.java \
        core/src/test/java/com/ticket/core/mq/SearchSyncProducerTest.java
git commit -m "feat(mq): 添加搜索同步 Event/Producer/Consumer 骨架"
```

---

## Task 10：端到端验收（Stage 1 完成验证）

**Files:** 无新增，全部为人工验证。

- [ ] **Step 10.1：启动所有服务**

Run：
```bash
cd /Users/xdb/Desktop/test/maill-backend && docker-compose up -d
```

Expected：所有容器 Up，特别是 `ticket-mysql`、`ticket-redis`、`ticket-rabbitmq`、`ticket-minio`、`ticket-elasticsearch`。

- [ ] **Step 10.2：验证 MySQL 新表存在**

Run：
```bash
docker exec ticket-mysql mysql -uroot -proot123 -e "USE ticket_system; SHOW TABLES;" 2>/dev/null | wc -l
```

Expected：30 行（15 旧表 + 15 新表 + 表头），具体数字取决于已有表数；至少 ≥ 16。

更严格的检查（必须出现 15 个）：
```bash
docker exec ticket-mysql mysql -uroot -proot123 -e "USE ticket_system; SHOW TABLES;" 2>/dev/null | grep -cE "^(favorite_group|user_favorite|show_subscribe|message|user_message|show_review|show_review_image|show_review_like|show_review_report|artist|show_artist|user_follow_artist|article_category|article|banner)$"
```

Expected：`15`。

- [ ] **Step 10.3：启动 admin 应用，验证 ES 索引自动创建**

Run（前台启动，看输出）：
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl admin -am spring-boot:run -Dspring-boot.run.profiles=dev
```

Expected console 包含三行 `[ES] 索引创建成功: show/artist/article`（首次启动）或 `[ES] 索引已存在,跳过: ...`（非首次）。

另开终端验证：
```bash
curl -s http://localhost:9200/_cat/indices?v | awk 'NR==1 || /(show|artist|article)/'
```

Expected：表头 + 至少 3 行（每个索引一行）。

- [ ] **Step 10.4：验证 RabbitMQ 搜索同步队列已声明**

打开浏览器访问 `http://localhost:15672`（用户名 guest / 密码 guest），点击 Queues 标签。

Expected：列表中能看到名为 `search.sync.queue` 的队列。

或命令行验证（需 rabbitmqctl，可跳过此命令直接看 Web UI）：
```bash
docker exec ticket-rabbitmq rabbitmqctl list_queues name 2>/dev/null | grep search.sync.queue
```

Expected：输出 `search.sync.queue`。

- [ ] **Step 10.5：端到端测试 MQ → Consumer**

在 RabbitMQ 管理后台 `Queues > search.sync.queue > Publish message`，发一条手动消息：
- Routing key: `search.sync`（在 search.sync.exchange 的 publish 表单中）
- Properties → content_type: `application/json`
- Payload:
  ```json
  {"type":"show","targetId":1,"op":"UPSERT"}
  ```

或者通过 exchange 发：在 `Exchanges > search.sync.exchange > Publish message` 中：
- Routing key: `search.sync`
- Payload 同上

回到 admin 应用 console 查看输出。

Expected：log 中出现：
```
[MQ-SEARCH] 收到同步事件 type=show id=1 op=UPSERT (Stage 1 骨架,暂不写 ES)
```

- [ ] **Step 10.6：关闭 admin 应用 & 提交收尾**

Ctrl+C 关闭 admin。

```bash
cd /Users/xdb/Desktop/test/maill-backend
git log --oneline | head -10
```

Expected：能看到 Task 1-9 共 9 个新 commit（如果你跳过了部分 commit 就少一些）。

无新代码需要 commit。Stage 1 完成。

---

## Self-Review 检查表（写完执行）

| 检查项 | 结果 |
|---|---|
| Spec 第 3.1 节"中间件 ES 新增" | ✅ Task 1 |
| Spec 第 4 节"15 张新表 + show 表改造" | ✅ Task 2 |
| Spec 第 3.2 节"common 加 ES Client" | ✅ Task 3-7 |
| Spec 第 3.2 节"core 加 ES 同步消费者" | ✅ Task 8-9 |
| Spec 第 6 节"ES 同步异步任务"骨架 | ✅ Task 9（具体业务侧调用留给 Stage 3-4） |
| 字段命名 create_time/update_time 一致性 | ✅ schema-v2.sql 全部统一 |
| 是否有 TBD / TODO | ✅ 无（Task 9 Consumer 明确说"Stage 1 骨架"是有意保留，非占位） |
| 类型一致性 | ✅ SearchSyncEvent.type 与 EsIndices 常量字符串严格一致："show"/"artist"/"article" |

---

## Stage 1 → Stage 2 衔接说明

Stage 1 完成后，下一步是 **Stage 2：Banner 模块**。Stage 2 的 plan 会在 Stage 1 实际执行完成后再写，原因：
- 需要根据 Stage 1 实际落地的配置/代码风格微调
- Stage 2 是独立模块（不依赖搜索/MQ），可以先用最简单的方式验证 admin/user 端联调

Stage 2 预计任务：
1. 创建 Banner 实体 + Mapper（admin）
2. 创建 BannerService + Controller（admin）
3. admin 前端 Banner 管理页（Vue 3）
4. 用户端 BannerController（只读）
5. user 前端首页加 Banner 轮播（React）
6. 端到端联调

完成 Stage 1 后告知，再继续写 Stage 2 plan。
