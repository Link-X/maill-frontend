# Stage 2：Banner / 运营位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 端到端落地"首页 Banner / 运营位"功能——admin 端可 CRUD/上下架/排序/上传图片；user 端首页拉取并以轮播形式展示。

**Architecture：** 后端在 `core` 模块新增 Banner Entity / Mapper / Service，admin 与 user 各暴露自己的 Controller（admin 写 + user 只读）。前端 admin / user 两端各自接入 API，admin 新增管理页（沿用 categories 页面的 React + RTK Query 模式），user 在 HomePage 顶部嵌入 framer-motion 轮播组件。

**Tech Stack：** Spring Boot 2.7.18 + MyBatis；React 18 + RTK Query + react-hook-form + zod + framer-motion + lucide-react + react-i18next；i18n 默认中文（与现有命名空间风格一致）。

---

## 前置约束

1. **修正 spec**：spec 中"admin 用 Vue 3 + WangEditor" 是错的。admin 实际是 **React 18 + RTK Query**，与 user 端同栈。WangEditor 决策推迟到 Stage 3 资讯模块再定（届时如选 Tiptap / React-Quill 也合理）。
2. **跳过 git commit**（用户偏好，全程不 `git add` / `git commit`）。
3. 数据库 `banner` 表已在 Stage 1 schema-v2.sql 创建完成。
4. 图片上传走现有 `/api/admin/upload/image`，仅需扩展前端 `UploadDir` 白名单加 `'banners'`。
5. 需要额外加 ErrorCode：`BANNER_NOT_FOUND`。

---

## 文件结构总览

```
maill-backend/
├─ core/
│   ├─ src/main/java/com/ticket/core/
│   │   ├─ domain/entity/Banner.java               🆕
│   │   ├─ mapper/BannerMapper.java                🆕
│   │   └─ service/BannerService.java              🆕
│   └─ src/main/resources/mapper/BannerMapper.xml  🆕
├─ common/src/main/java/com/ticket/common/exception/ErrorCode.java  🔧 加 BANNER_NOT_FOUND
├─ admin/src/main/java/com/ticket/admin/
│   ├─ controller/BannerController.java            🆕
│   └─ dto/
│       ├─ BannerSaveRequest.java                  🆕
│       ├─ BannerStatusRequest.java                🆕
│       └─ BannerSortRequest.java                  🆕
├─ user/src/main/java/com/ticket/user/
│   └─ controller/BannerController.java            🆕
└─ core/src/test/java/com/ticket/core/service/
    └─ BannerServiceTest.java                      🆕

maill-frontend/
├─ packages/shared/src/types/
│   ├─ banner.ts                                   🆕
│   └─ index.ts                                    🔧 re-export Banner
├─ apps/admin/src/
│   ├─ features/
│   │   ├─ banners/
│   │   │   ├─ bannersApi.ts                       🆕
│   │   │   ├─ BannersPage.tsx                     🆕
│   │   │   └─ BannerFormDrawer.tsx                🆕
│   │   └─ upload/uploadApi.ts                     🔧 加 'banners' 到 UploadDir
│   ├─ router/index.tsx                            🔧 加 /banners 路由
│   ├─ layouts/AdminLayout.tsx                     🔧 加菜单项
│   └─ store/index.ts                              🔧 注册 bannersApi
└─ apps/user/src/features/home/
    ├─ bannersApi.ts                               🆕
    ├─ BannerCarousel.tsx                          🆕
    └─ HomePage.tsx                                🔧 顶部嵌入 BannerCarousel
```

**i18n**（admin 端只在中文资源加 banner 命名空间，与现有 category/show 风格一致；user 端无独立文案，复用通用样式）：
```
apps/admin/src/i18n/zh-CN/banner.ts                🆕
apps/admin/src/i18n/index.ts                       🔧 注册 banner 命名空间
```

---

## Task 1：后端 Entity + Mapper + XML

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/domain/entity/Banner.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/mapper/BannerMapper.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/resources/mapper/BannerMapper.xml`

- [ ] **Step 1.1：创建 `Banner.java`**

```java
package com.ticket.core.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "首页 Banner / 运营位实体")
@Data
public class Banner {
    @Schema(description = "Banner ID", example = "1") private Long id;
    @Schema(description = "后台备注,前端可不展示", example = "618 活动 banner") private String title;
    @Schema(description = "图片 URL", example = "http://localhost:9000/image/banners/xxx.jpg") private String imageUrl;
    @Schema(description = "跳转类型 0=无 1=演出 2=艺人 3=资讯 4=外链", example = "1") private Integer linkType;
    @Schema(description = "跳转目标:演出/艺人/资讯 ID 或外链 URL", example = "42") private String linkTarget;
    @Schema(description = "排序,越小越靠前", example = "10") private Integer sort;
    @Schema(description = "定时上架时间,null=立即生效") private LocalDateTime startAt;
    @Schema(description = "定时下架时间,null=永久") private LocalDateTime endAt;
    @Schema(description = "状态 0=下架 1=上架", example = "1", allowableValues = {"0","1"}) private Integer status;
    @Schema(description = "创建时间") private LocalDateTime createTime;
    @Schema(description = "更新时间") private LocalDateTime updateTime;
}
```

- [ ] **Step 1.2：创建 `BannerMapper.java`**

```java
package com.ticket.core.mapper;

import com.ticket.core.domain.entity.Banner;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface BannerMapper {

    int insert(Banner banner);

    int update(Banner banner);

    int updateStatus(@Param("id") Long id,
                     @Param("status") Integer status,
                     @Param("updateTime") LocalDateTime updateTime);

    int updateSort(@Param("id") Long id,
                   @Param("sort") Integer sort,
                   @Param("updateTime") LocalDateTime updateTime);

    int deleteById(@Param("id") Long id);

    Banner selectById(@Param("id") Long id);

    /**
     * admin 列表查询。
     * @param status null = 不过滤
     */
    List<Banner> selectByCondition(@Param("status") Integer status);

    /**
     * user 端有效 banner:status=1 且当前时间在 start_at/end_at 范围内（任一字段 NULL 视为不限）。
     * 按 sort ASC, id ASC 排序。
     */
    List<Banner> selectEffective(@Param("now") LocalDateTime now);
}
```

- [ ] **Step 1.3：创建 `BannerMapper.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.ticket.core.mapper.BannerMapper">

    <resultMap id="BannerResultMap" type="com.ticket.core.domain.entity.Banner">
        <id     column="id"          property="id"/>
        <result column="title"       property="title"/>
        <result column="image_url"   property="imageUrl"/>
        <result column="link_type"   property="linkType"/>
        <result column="link_target" property="linkTarget"/>
        <result column="sort"        property="sort"/>
        <result column="start_at"    property="startAt"/>
        <result column="end_at"      property="endAt"/>
        <result column="status"      property="status"/>
        <result column="create_time" property="createTime"/>
        <result column="update_time" property="updateTime"/>
    </resultMap>

    <sql id="AllColumns">
        id, title, image_url, link_type, link_target, sort,
        start_at, end_at, status, create_time, update_time
    </sql>

    <insert id="insert" parameterType="com.ticket.core.domain.entity.Banner"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO banner (title, image_url, link_type, link_target, sort,
                            start_at, end_at, status, create_time, update_time)
        VALUES (#{title}, #{imageUrl}, #{linkType}, #{linkTarget}, #{sort},
                #{startAt}, #{endAt}, #{status}, #{createTime}, #{updateTime})
    </insert>

    <update id="update" parameterType="com.ticket.core.domain.entity.Banner">
        UPDATE banner
        SET title       = #{title},
            image_url   = #{imageUrl},
            link_type   = #{linkType},
            link_target = #{linkTarget},
            sort        = #{sort},
            start_at    = #{startAt},
            end_at      = #{endAt},
            status      = #{status},
            update_time = #{updateTime}
        WHERE id = #{id}
    </update>

    <update id="updateStatus">
        UPDATE banner
        SET status = #{status}, update_time = #{updateTime}
        WHERE id = #{id}
    </update>

    <update id="updateSort">
        UPDATE banner
        SET sort = #{sort}, update_time = #{updateTime}
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM banner WHERE id = #{id}
    </delete>

    <select id="selectById" resultMap="BannerResultMap">
        SELECT <include refid="AllColumns"/> FROM banner WHERE id = #{id}
    </select>

    <select id="selectByCondition" resultMap="BannerResultMap">
        SELECT <include refid="AllColumns"/>
        FROM banner
        <where>
            <if test="status != null">AND status = #{status}</if>
        </where>
        ORDER BY sort ASC, id ASC
    </select>

    <select id="selectEffective" resultMap="BannerResultMap">
        SELECT <include refid="AllColumns"/>
        FROM banner
        WHERE status = 1
          AND (start_at IS NULL OR start_at &lt;= #{now})
          AND (end_at   IS NULL OR end_at   &gt;= #{now})
        ORDER BY sort ASC, id ASC
    </select>

</mapper>
```

- [ ] **Step 1.4：编译验证**

```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am compile -q && echo "COMPILE OK"
```
Expect: `COMPILE OK`.

---

## Task 2：后端 BannerService + ErrorCode 扩展

**Files:**
- Modify: `/Users/xdb/Desktop/test/maill-backend/common/src/main/java/com/ticket/common/exception/ErrorCode.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/main/java/com/ticket/core/service/BannerService.java`

- [ ] **Step 2.1：在 `ErrorCode.java` 加 `BANNER_NOT_FOUND`**

Read 文件，在最后一个枚举值（`CATEGORY_NAME_DUPLICATED(1013, "分类名已存在")`）后面追加（注意把分号移到新枚举值后）：

```java
    CATEGORY_NAME_DUPLICATED(1013, "分类名已存在"),
    BANNER_NOT_FOUND(1020, "Banner 不存在");
```

- [ ] **Step 2.2：创建 `BannerService.java`**

```java
package com.ticket.core.service;

import com.ticket.common.exception.BusinessException;
import com.ticket.common.exception.ErrorCode;
import com.ticket.core.domain.entity.Banner;
import com.ticket.core.mapper.BannerMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Banner / 运营位服务
 */
@Service
public class BannerService {

    private final BannerMapper bannerMapper;

    public BannerService(BannerMapper bannerMapper) {
        this.bannerMapper = bannerMapper;
    }

    @Transactional
    public Banner save(Banner banner) {
        LocalDateTime now = LocalDateTime.now();
        if (banner.getSort() == null) banner.setSort(0);
        if (banner.getStatus() == null) banner.setStatus(0);
        if (banner.getLinkType() == null) banner.setLinkType(0);

        if (banner.getId() == null) {
            banner.setCreateTime(now);
            banner.setUpdateTime(now);
            bannerMapper.insert(banner);
            return banner;
        }
        Banner exist = bannerMapper.selectById(banner.getId());
        if (exist == null) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        banner.setUpdateTime(now);
        bannerMapper.update(banner);
        return bannerMapper.selectById(banner.getId());
    }

    @Transactional
    public void updateStatus(Long id, Integer status) {
        if (bannerMapper.selectById(id) == null) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        bannerMapper.updateStatus(id, status, LocalDateTime.now());
    }

    /**
     * 拖拽排序:按 orderedIds 顺序写入 sort,从 10 开始,步长 10。
     */
    @Transactional
    public void reorder(List<Long> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now();
        int sort = 10;
        for (Long id : orderedIds) {
            bannerMapper.updateSort(id, sort, now);
            sort += 10;
        }
    }

    @Transactional
    public void delete(Long id) {
        bannerMapper.deleteById(id);
    }

    public Banner getById(Long id) {
        return bannerMapper.selectById(id);
    }

    public List<Banner> listByCondition(Integer status) {
        return bannerMapper.selectByCondition(status);
    }

    /** 用户端:仅 status=1 且当前时间在 start_at/end_at 范围内 */
    public List<Banner> listEffective() {
        return bannerMapper.selectEffective(LocalDateTime.now());
    }
}
```

- [ ] **Step 2.3：编译验证**

```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am compile -q && echo "COMPILE OK"
```
Expect: `COMPILE OK`.

---

## Task 3：后端 admin Controller + DTOs

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/admin/src/main/java/com/ticket/admin/dto/BannerSaveRequest.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/admin/src/main/java/com/ticket/admin/dto/BannerStatusRequest.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/admin/src/main/java/com/ticket/admin/dto/BannerSortRequest.java`
- Create: `/Users/xdb/Desktop/test/maill-backend/admin/src/main/java/com/ticket/admin/controller/BannerController.java`

- [ ] **Step 3.1：创建 `BannerSaveRequest.java`**

```java
package com.ticket.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Schema(description = "保存 Banner 请求(id 为空=新增,否则=更新)")
@Data
public class BannerSaveRequest {
    @Schema(description = "Banner ID,新增传 null") private Long id;
    @Schema(description = "后台备注", example = "618 活动")
    @Size(max = 100) private String title;
    @Schema(description = "图片 URL", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank @Size(max = 500) private String imageUrl;
    @Schema(description = "跳转类型 0=无 1=演出 2=艺人 3=资讯 4=外链", example = "1")
    @Min(0) @Max(4) private Integer linkType;
    @Schema(description = "跳转目标")
    @Size(max = 500) private String linkTarget;
    @Schema(description = "排序")
    @Min(0) private Integer sort;
    @Schema(description = "定时上架时间(null=立即)") private LocalDateTime startAt;
    @Schema(description = "定时下架时间(null=永久)") private LocalDateTime endAt;
    @Schema(description = "状态 0=下架 1=上架", example = "0")
    @Min(0) @Max(1) private Integer status;
}
```

- [ ] **Step 3.2：创建 `BannerStatusRequest.java`**

```java
package com.ticket.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Schema(description = "Banner 上下架请求")
@Data
public class BannerStatusRequest {
    @Schema(description = "Banner ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull private Long id;
    @Schema(description = "目标状态 0=下架 1=上架", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull @Min(0) @Max(1) private Integer status;
}
```

- [ ] **Step 3.3：创建 `BannerSortRequest.java`**

```java
package com.ticket.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import java.util.List;

@Schema(description = "Banner 排序请求,按数组顺序重写 sort")
@Data
public class BannerSortRequest {
    @Schema(description = "按目标顺序排列的 Banner ID 列表", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty private List<Long> orderedIds;
}
```

- [ ] **Step 3.4：创建 `BannerController.java`**

```java
package com.ticket.admin.controller;

import com.ticket.admin.dto.BannerSaveRequest;
import com.ticket.admin.dto.BannerSortRequest;
import com.ticket.admin.dto.BannerStatusRequest;
import com.ticket.common.result.Result;
import com.ticket.core.domain.entity.Banner;
import com.ticket.core.service.BannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Tag(name = "Banner 管理", description = "首页 Banner / 运营位 CRUD,支持图片(MinIO URL)、跳转配置、定时上下架、拖拽排序")
@RestController
@RequestMapping("/api/admin/banner")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @Operation(summary = "Banner 列表",
               description = "管理端列表,按 sort ASC,id ASC 排序;不传 status 则返回全部")
    @GetMapping("/list")
    public Result<List<Banner>> list(
            @Parameter(description = "状态过滤:0=下架 1=上架;不传则全部") @RequestParam(required = false) Integer status) {
        return Result.success(bannerService.listByCondition(status));
    }

    @Operation(summary = "Banner 详情")
    @GetMapping("/{id}")
    public Result<Banner> get(@PathVariable Long id) {
        return Result.success(bannerService.getById(id));
    }

    @Operation(summary = "保存 Banner", description = "id 为空=新增,否则=更新")
    @PostMapping("/save")
    public Result<Banner> save(@Valid @RequestBody BannerSaveRequest req) {
        Banner banner = new Banner();
        BeanUtils.copyProperties(req, banner);
        return Result.success(bannerService.save(banner));
    }

    @Operation(summary = "上下架")
    @PostMapping("/status")
    public Result<Void> status(@Valid @RequestBody BannerStatusRequest req) {
        bannerService.updateStatus(req.getId(), req.getStatus());
        return Result.success(null);
    }

    @Operation(summary = "拖拽排序", description = "按 orderedIds 顺序重写 sort,步长 10")
    @PostMapping("/sort")
    public Result<Void> sort(@Valid @RequestBody BannerSortRequest req) {
        bannerService.reorder(req.getOrderedIds());
        return Result.success(null);
    }

    @Operation(summary = "删除")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bannerService.delete(id);
        return Result.success(null);
    }
}
```

- [ ] **Step 3.5：编译验证**

```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl admin -am compile -q && echo "COMPILE OK"
```
Expect: `COMPILE OK`.

---

## Task 4：后端 user Controller（只读）

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/user/src/main/java/com/ticket/user/controller/BannerController.java`

- [ ] **Step 4.1：创建 user `BannerController.java`**

```java
package com.ticket.user.controller;

import com.ticket.common.result.Result;
import com.ticket.core.domain.entity.Banner;
import com.ticket.core.service.BannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Banner", description = "首页 Banner / 运营位,只返回当前有效(已上架且在时间窗内)的 Banner")
@RestController
@RequestMapping("/api/banner")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @Operation(summary = "首页有效 Banner 列表",
               description = "status=1 且 start_at <= NOW <= end_at(NULL 视为无限),按 sort ASC 排序")
    @GetMapping("/list")
    public Result<List<Banner>> list() {
        return Result.success(bannerService.listEffective());
    }
}
```

- [ ] **Step 4.2：编译验证**

```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl user -am compile -q && echo "COMPILE OK"
```
Expect: `COMPILE OK`.

---

## Task 5：BannerService 单元测试

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-backend/core/src/test/java/com/ticket/core/service/BannerServiceTest.java`

> **测试策略**：Mockito 单元测试，不起 Spring 上下文，验证 Service 的核心行为：save 新增 vs 更新分支、reorder 顺序逻辑、updateStatus 校验存在性。

- [ ] **Step 5.1：创建 `BannerServiceTest.java`**

```java
package com.ticket.core.service;

import com.ticket.common.exception.BusinessException;
import com.ticket.common.exception.ErrorCode;
import com.ticket.core.domain.entity.Banner;
import com.ticket.core.mapper.BannerMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class BannerServiceTest {

    @Test
    void save_new_banner_fills_defaults_and_inserts() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);

        Banner input = new Banner();
        input.setImageUrl("http://x/y.jpg");
        // sort/status/linkType 不传

        Banner saved = service.save(input);

        // 默认值已填充
        assertEquals(0, saved.getSort());
        assertEquals(0, saved.getStatus());
        assertEquals(0, saved.getLinkType());
        assertNotNull(saved.getCreateTime());
        assertNotNull(saved.getUpdateTime());

        verify(mapper).insert(saved);
        verify(mapper, never()).update(any());
    }

    @Test
    void save_existing_banner_updates_when_found() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);

        Banner exist = new Banner();
        exist.setId(42L);
        when(mapper.selectById(42L)).thenReturn(exist, exist); // first for guard, second for return

        Banner input = new Banner();
        input.setId(42L);
        input.setImageUrl("http://x.jpg");

        service.save(input);

        verify(mapper).update(input);
        verify(mapper, never()).insert(any());
    }

    @Test
    void save_existing_banner_throws_when_missing() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);
        when(mapper.selectById(99L)).thenReturn(null);

        Banner input = new Banner();
        input.setId(99L);
        input.setImageUrl("http://x.jpg");

        BusinessException ex = assertThrows(BusinessException.class, () -> service.save(input));
        assertEquals(ErrorCode.BANNER_NOT_FOUND.getCode(), ex.getCode());
    }

    @Test
    void updateStatus_validates_existence() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);
        when(mapper.selectById(7L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> service.updateStatus(7L, 1));
        verify(mapper, never()).updateStatus(anyLong(), any(), any());
    }

    @Test
    void reorder_writes_sort_in_order_with_step_10() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);

        service.reorder(Arrays.asList(3L, 1L, 2L));

        ArgumentCaptor<Long> ids = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Integer> sorts = ArgumentCaptor.forClass(Integer.class);
        verify(mapper, times(3)).updateSort(ids.capture(), sorts.capture(), any(LocalDateTime.class));

        assertEquals(Arrays.asList(3L, 1L, 2L), ids.getAllValues());
        assertEquals(Arrays.asList(10, 20, 30), sorts.getAllValues());
    }

    @Test
    void reorder_empty_list_does_nothing() {
        BannerMapper mapper = mock(BannerMapper.class);
        BannerService service = new BannerService(mapper);

        service.reorder(List.of());

        verifyNoInteractions(mapper);
    }
}
```

- [ ] **Step 5.2：运行测试**

```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core test -Dtest=BannerServiceTest -q 2>&1 | tail -10
```
Expect: `Tests run: 6, Failures: 0, Errors: 0`, BUILD SUCCESS.

---

## Task 6：前端 shared types

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-frontend/packages/shared/src/types/banner.ts`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/packages/shared/src/types/index.ts`

- [ ] **Step 6.1：创建 `banner.ts`**

```typescript
// 首页 Banner（与后端 com.ticket.core.domain.entity.Banner 对齐）
export interface Banner {
  id: number;
  title?: string;
  imageUrl: string;
  /** 0=无 1=演出 2=艺人 3=资讯 4=外链 */
  linkType?: 0 | 1 | 2 | 3 | 4;
  linkTarget?: string;
  sort?: number;
  startAt?: string;
  endAt?: string;
  /** 0=下架 1=上架 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}

export const BANNER_LINK_TYPE = {
  NONE: 0,
  SHOW: 1,
  ARTIST: 2,
  ARTICLE: 3,
  URL: 4,
} as const;
```

- [ ] **Step 6.2：在 `types/index.ts` re-export**

Read 现有 `/Users/xdb/Desktop/test/maill-frontend/packages/shared/src/types/index.ts`，在末尾添加：

```typescript
export * from './banner';
```

(如果 index.ts 已是 `export *` 风格，按现有风格添加即可。)

- [ ] **Step 6.3：typecheck**

```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C packages/shared typecheck 2>&1 | tail -5
```
Expect: 无报错（`pnpm` exit 0）。如果 packages/shared 没有 typecheck script，可改用：
```bash
cd /Users/xdb/Desktop/test/maill-frontend/packages/shared && npx tsc --noEmit
```
Expect: 无 stdout / 无报错。

---

## Task 7：前端 admin bannersApi

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/banners/bannersApi.ts`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/upload/uploadApi.ts`（加 `'banners'` 到 UploadDir）
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/store/index.ts`（注册 bannersApi）

- [ ] **Step 7.1：扩展 UploadDir**

Edit `apps/admin/src/features/upload/uploadApi.ts` 第 11 行：

把
```typescript
export type UploadDir = 'posters' | 'avatars' | 'rooms' | 'categories' | 'misc';
```

替换为：
```typescript
export type UploadDir = 'posters' | 'avatars' | 'rooms' | 'categories' | 'banners' | 'misc';
```

- [ ] **Step 7.2：创建 `bannersApi.ts`**

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Banner } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
}

export interface BannerSaveBody {
  id?: number;
  title?: string;
  imageUrl: string;
  linkType?: 0 | 1 | 2 | 3 | 4;
  linkTarget?: string;
  sort?: number;
  startAt?: string;
  endAt?: string;
  status?: 0 | 1;
}

export const bannersApi = createApi({
  reducerPath: 'bannersApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Banner'],
  endpoints: (build) => ({
    listBanners: build.query<Banner[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/banner/list',
        params: { status: arg?.status },
      }),
      providesTags: (result) => [
        'Banner',
        ...(result ?? []).map((b) => ({ type: 'Banner' as const, id: b.id })),
      ],
    }),
    saveBanner: build.mutation<Banner, BannerSaveBody>({
      query: (body) => ({ url: '/api/admin/banner/save', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    updateBannerStatus: build.mutation<void, { id: number; status: 0 | 1 }>({
      query: (body) => ({ url: '/api/admin/banner/status', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Banner', id: arg.id }, 'Banner'],
    }),
    sortBanners: build.mutation<void, { orderedIds: number[] }>({
      query: (body) => ({ url: '/api/admin/banner/sort', method: 'POST', body }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/banner/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),
  }),
});

export const {
  useListBannersQuery,
  useSaveBannerMutation,
  useUpdateBannerStatusMutation,
  useSortBannersMutation,
  useDeleteBannerMutation,
} = bannersApi;
```

- [ ] **Step 7.3：在 store 注册**

Edit `apps/admin/src/store/index.ts`：
- 在 import 区域加：
  ```typescript
  import { bannersApi } from '@/features/banners/bannersApi';
  ```
- 在 `reducer` 对象里加一行（在 reportsApi 之后）：
  ```typescript
  [bannersApi.reducerPath]: bannersApi.reducer,
  ```
- 在 `middleware` 的 `.concat(...)` 列表里加 `bannersApi.middleware,`（在 reportsApi.middleware 之后）

- [ ] **Step 7.4：admin typecheck**

```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/admin typecheck 2>&1 | tail -10
```
Expect: BUILD SUCCESS / 退出 0。

---

## Task 8：admin Banner 管理页 + 抽屉 + 路由 + 菜单 + i18n

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/banners/BannersPage.tsx`
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/banners/BannerFormDrawer.tsx`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/router/index.tsx`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/layouts/AdminLayout.tsx`
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/i18n/zh-CN/banner.ts`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/i18n/index.ts`

> **设计说明**：沿用 `CategoriesPage` 现有模式——`DataTable` + `PageHeader` + `ConfirmDialog` + `Badge` + `notify`。表单用 RHF + Zod（与 ShowFormPage 同风格，但 Banner 简化为 Drawer）。图片上传按钮调用 `useUploadImageMutation`，dir='banners'。

- [ ] **Step 8.1：先 Read 这 3 个现有文件作为模板**

```
/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/categories/CategoriesPage.tsx
/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/features/categories/CategoryFormDrawer.tsx
/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/i18n/zh-CN/category.ts
```

理解 PageHeader / DataTable / ConfirmDialog / FormDrawer 的接口与样式，再继续编写。

- [ ] **Step 8.2：创建 `i18n/zh-CN/banner.ts`**

```typescript
export const banner = {
  page: {
    title: 'Banner / 运营位',
    description: '首页轮播图与运营位管理。支持图片上传、跳转配置、定时上下架、拖拽排序。',
    addBtn: '新建 Banner',
  },
  field: {
    image: '图片',
    title: '备注',
    linkType: '跳转类型',
    linkTarget: '跳转目标',
    sort: '排序',
    startAt: '上架时间',
    endAt: '下架时间',
    status: '状态',
    actions: '操作',
  },
  linkType: {
    none: '无跳转',
    show: '演出',
    artist: '艺人',
    article: '资讯',
    url: '外链',
  },
  status: {
    online: '已上架',
    offline: '已下架',
  },
  drawer: {
    titleNew: '新建 Banner',
    titleEdit: '编辑 Banner',
    uploadBtn: '上传图片',
    uploading: '上传中…',
    saveBtn: '保存',
    cancelBtn: '取消',
    placeholderTitle: '后台备注，前端可不展示',
    placeholderLinkTarget: '跳转目标（演出/艺人/资讯 ID 或完整外链 URL）',
    helpDateTime: '本地时间，空表示无限制',
  },
  toast: {
    saved: '已保存',
    deleted: '已删除',
    statusOn: '已上架',
    statusOff: '已下架',
  },
  confirmDelete: {
    title: '删除 Banner',
    message: '确认删除该 Banner？此操作不可撤销。',
    confirm: '删除',
    cancel: '取消',
  },
} as const;
```

- [ ] **Step 8.3：注册到 i18n**

Read `/Users/xdb/Desktop/test/maill-frontend/apps/admin/src/i18n/index.ts`。按现有 category 的注册方式追加 banner 命名空间（典型做法）：

```typescript
import { banner } from './zh-CN/banner';
// ...
const resources = {
  'zh-CN': {
    // ...existing namespaces
    banner,
  },
};
```

如果现有 index.ts 风格不同（例如懒加载/逐文件 import），按现有模式仿写——优先匹配项目已有写法，**不要重构 i18n 模块**。

- [ ] **Step 8.4：创建 `BannersPage.tsx`**

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Plus, Edit2, Trash2, Power, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Button,
  extractErrorMessage,
  notify,
  type Banner,
} from '@maill/shared';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/Badge';
import { formatDateTime } from '@/lib/format';
import {
  useListBannersQuery,
  useUpdateBannerStatusMutation,
  useDeleteBannerMutation,
  useSortBannersMutation,
} from './bannersApi';
import { BannerFormDrawer } from './BannerFormDrawer';

export default function BannersPage() {
  const { t } = useTranslation(['banner', 'common']);
  const { data: banners = [], isLoading } = useListBannersQuery();
  const [updateStatus] = useUpdateBannerStatusMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation();
  const [sortBanners] = useSortBannersMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Banner | null>(null);

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (b: Banner) => { setEditing(b); setDrawerOpen(true); };

  const toggleStatus = async (b: Banner) => {
    const willEnable = b.status !== 1;
    try {
      await updateStatus({ id: b.id, status: willEnable ? 1 : 0 }).unwrap();
      notify.success(t(willEnable ? 'banner:toast.statusOn' : 'banner:toast.statusOff'));
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const move = async (b: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex((x) => x.id === b.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= banners.length) return;
    const next = [...banners];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    try {
      await sortBanners({ orderedIds: next.map((x) => x.id) }).unwrap();
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const linkTypeLabel = (lt?: number) => {
    if (!lt) return t('banner:linkType.none');
    return [
      t('banner:linkType.none'),
      t('banner:linkType.show'),
      t('banner:linkType.artist'),
      t('banner:linkType.article'),
      t('banner:linkType.url'),
    ][lt] ?? t('banner:linkType.none');
  };

  const columns: Column<Banner>[] = [
    {
      key: 'image',
      header: t('banner:field.image'),
      render: (b) => (
        <div className="flex items-center gap-2">
          {b.imageUrl ? (
            <img src={b.imageUrl} alt="" className="h-10 w-20 rounded object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      ),
    },
    { key: 'title', header: t('banner:field.title'), render: (b) => b.title || '-' },
    { key: 'linkType', header: t('banner:field.linkType'), render: (b) => linkTypeLabel(b.linkType) },
    { key: 'linkTarget', header: t('banner:field.linkTarget'), render: (b) => b.linkTarget || '-' },
    { key: 'sort', header: t('banner:field.sort'), render: (b) => b.sort ?? 0 },
    {
      key: 'window',
      header: `${t('banner:field.startAt')} / ${t('banner:field.endAt')}`,
      render: (b) => (
        <div className="text-xs text-muted-foreground">
          <div>{b.startAt ? formatDateTime(b.startAt) : '-'}</div>
          <div>{b.endAt ? formatDateTime(b.endAt) : '-'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('banner:field.status'),
      render: (b) =>
        b.status === 1
          ? <Badge variant="success">{t('banner:status.online')}</Badge>
          : <Badge variant="muted">{t('banner:status.offline')}</Badge>,
    },
    {
      key: 'actions',
      header: t('banner:field.actions'),
      render: (b) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" title="上移" onClick={() => move(b, 'up')}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="下移" onClick={() => move(b, 'down')}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="上下架" onClick={() => toggleStatus(b)}>
            <Power className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="编辑" onClick={() => openEdit(b)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" title="删除" onClick={() => setPendingDelete(b)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('banner:page.title')}
        description={t('banner:page.description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('banner:page.addBtn')}
          </Button>
        }
      />
      <DataTable data={banners} columns={columns} isLoading={isLoading} rowKey={(b) => b.id} />

      <BannerFormDrawer
        open={drawerOpen}
        banner={editing}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('banner:confirmDelete.title')}
        message={t('banner:confirmDelete.message')}
        confirmText={t('banner:confirmDelete.confirm')}
        cancelText={t('banner:confirmDelete.cancel')}
        confirmVariant="destructive"
        isLoading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteBanner(pendingDelete.id).unwrap();
            notify.success(t('banner:toast.deleted'));
            setPendingDelete(null);
          } catch (e) {
            notify.error(extractErrorMessage(e));
          }
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8.5：创建 `BannerFormDrawer.tsx`**

```tsx
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  extractErrorMessage,
  notify,
  type Banner,
} from '@maill/shared';
import { Drawer } from '@/components/Drawer';
import { useSaveBannerMutation } from './bannersApi';
import { useUploadImageMutation } from '@/features/upload/uploadApi';

const schema = z.object({
  title: z.string().max(100).optional().or(z.literal('')),
  imageUrl: z.string().url('必须是合法 URL'),
  linkType: z.coerce.number().int().min(0).max(4),
  linkTarget: z.string().max(500).optional().or(z.literal('')),
  sort: z.coerce.number().int().min(0).default(0),
  startAt: z.string().optional().or(z.literal('')),
  endAt: z.string().optional().or(z.literal('')),
  status: z.coerce.number().int().min(0).max(1).default(0),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  banner: Banner | null;
  onClose: () => void;
}

export function BannerFormDrawer({ open, banner, onClose }: Props) {
  const { t } = useTranslation(['banner', 'common']);
  const [saveBanner, { isLoading: saving }] = useSaveBannerMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();

  const {
    handleSubmit,
    register,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // datetime-local 需要 'YYYY-MM-DDTHH:mm'，截断后端的 ISO/MySQL 字符串
  const toLocal = (s?: string) => (s ? s.replace(' ', 'T').slice(0, 16) : '');
  const toBackend = (s?: string) => (s ? s.replace('T', ' ') + ':00'.slice(s.length - 13 >= 0 ? 0 : 0) : undefined);

  useEffect(() => {
    if (!open) return;
    if (banner) {
      reset({
        title: banner.title || '',
        imageUrl: banner.imageUrl,
        linkType: (banner.linkType ?? 0) as 0,
        linkTarget: banner.linkTarget || '',
        sort: banner.sort ?? 0,
        startAt: toLocal(banner.startAt),
        endAt: toLocal(banner.endAt),
        status: (banner.status ?? 0) as 0,
      });
    } else {
      reset({
        title: '', imageUrl: '', linkType: 0 as 0, linkTarget: '',
        sort: 0, startAt: '', endAt: '', status: 0 as 0,
      });
    }
  }, [open, banner, reset]);

  const imageUrl = watch('imageUrl');

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await uploadImage({ file, dir: 'banners' }).unwrap();
      setValue('imageUrl', res.url, { shouldValidate: true });
    } catch (err) {
      notify.error(extractErrorMessage(err));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveBanner({
        id: banner?.id,
        title: values.title || undefined,
        imageUrl: values.imageUrl,
        linkType: values.linkType as 0,
        linkTarget: values.linkTarget || undefined,
        sort: values.sort,
        startAt: values.startAt ? values.startAt.replace('T', ' ') + ':00' : undefined,
        endAt:   values.endAt   ? values.endAt.replace('T', ' ')   + ':00' : undefined,
        status: values.status as 0,
      }).unwrap();
      notify.success(t('banner:toast.saved'));
      onClose();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t(banner ? 'banner:drawer.titleEdit' : 'banner:drawer.titleNew')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('banner:drawer.cancelBtn')}</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('banner:drawer.saveBtn')}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t('banner:field.image')}</Label>
          {imageUrl && (
            <img src={imageUrl} alt="" className="h-32 w-full rounded object-cover border" />
          )}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span>{uploading ? t('banner:drawer.uploading') : t('banner:drawer.uploadBtn')}</span>
              <input type="file" accept="image/*" hidden onChange={handlePickImage} />
            </label>
            <Input
              className="flex-1"
              placeholder="https://..."
              {...register('imageUrl')}
            />
          </div>
          {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>{t('banner:field.title')}</Label>
          <Input placeholder={t('banner:drawer.placeholderTitle')} {...register('title')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('banner:field.linkType')}</Label>
            <Controller
              control={control}
              name="linkType"
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <option value="0">{t('banner:linkType.none')}</option>
                  <option value="1">{t('banner:linkType.show')}</option>
                  <option value="2">{t('banner:linkType.artist')}</option>
                  <option value="3">{t('banner:linkType.article')}</option>
                  <option value="4">{t('banner:linkType.url')}</option>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('banner:field.sort')}</Label>
            <Input type="number" {...register('sort')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('banner:field.linkTarget')}</Label>
          <Input placeholder={t('banner:drawer.placeholderLinkTarget')} {...register('linkTarget')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('banner:field.startAt')}</Label>
            <Input type="datetime-local" {...register('startAt')} />
          </div>
          <div className="space-y-2">
            <Label>{t('banner:field.endAt')}</Label>
            <Input type="datetime-local" {...register('endAt')} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('banner:drawer.helpDateTime')}</p>

        <div className="space-y-2">
          <Label>{t('banner:field.status')}</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <option value="0">{t('banner:status.offline')}</option>
                <option value="1">{t('banner:status.online')}</option>
              </Select>
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}
```

> **重要**：如果 `@/components/Drawer` / `@/components/PageHeader` / `@/components/DataTable` / `@/components/ConfirmDialog` / `@/components/Badge` 或 `Select` 组件签名跟我假设的不一致，按现有 `CategoriesPage.tsx` / `CategoryFormDrawer.tsx` 的实际 props 调整。**实际编码以已读取的现有文件签名为准**。

- [ ] **Step 8.6：在 router 加 `/banners`**

Edit `apps/admin/src/router/index.tsx`：
- 在 lazy 区域加：
  ```typescript
  const BannersPage = lazy(() => import('@/features/banners/BannersPage'));
  ```
- 在 `children:` 数组里 `categories` 路由附近加：
  ```typescript
  { path: 'banners', element: withSuspense(<BannersPage />) },
  ```

- [ ] **Step 8.7：在 AdminLayout 加菜单**

Read `apps/admin/src/layouts/AdminLayout.tsx`，找到现有菜单项数组（如 NAV_ITEMS / sidebar items），按现有项目模式加一项：
```typescript
{ to: '/banners', label: 'Banner', icon: ImageIcon }
```
具体 label 和 icon 风格按现有项目使用（如 t('layout.banner') / Image from lucide-react）。**不要重构 layout**，仅追加菜单项。

- [ ] **Step 8.8：admin typecheck + 启动 dev server 手验**

```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/admin typecheck 2>&1 | tail -5
```
Expect: 退出 0。

启动开发服务器（后台）：
```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/admin dev > /tmp/admin-dev.log 2>&1 &
sleep 5
grep -E "Local:|ready in" /tmp/admin-dev.log | head -2
```
Expect: vite 输出 `Local: http://localhost:5173/` 或类似（具体端口看实际配置）。

不需要在浏览器手工验证（端到端在 Task 10 做）；先停掉：
```bash
pkill -f "vite" || true
```

---

## Task 9：user 端 BannerCarousel + HomePage 接入

**Files:**
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/user/src/features/home/bannersApi.ts`
- Create: `/Users/xdb/Desktop/test/maill-frontend/apps/user/src/features/home/BannerCarousel.tsx`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/user/src/features/home/HomePage.tsx`
- Modify: `/Users/xdb/Desktop/test/maill-frontend/apps/user/src/store/index.ts`（注册 bannersApi）

- [ ] **Step 9.1：创建 user `bannersApi.ts`**

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Banner } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

export const bannersApi = createApi({
  reducerPath: 'bannersApi',
  baseQuery: userBaseQuery,
  endpoints: (build) => ({
    listEffectiveBanners: build.query<Banner[], void>({
      query: () => ({ url: '/api/banner/list' }),
    }),
  }),
});

export const { useListEffectiveBannersQuery } = bannersApi;
```

> 注：user 端 base query 路径请确认——查看 `apps/user/src/api/` 目录里 baseQuery 命名，可能叫 `userBaseQuery` 或 `baseQuery`。按实际命名调整。

- [ ] **Step 9.2：创建 `BannerCarousel.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BANNER_LINK_TYPE, type Banner } from '@maill/shared';

const AUTOPLAY_MS = 4000;

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const handleClick = (b: Banner) => {
    if (!b.linkTarget) return;
    switch (b.linkType) {
      case BANNER_LINK_TYPE.SHOW:
        navigate(`/show/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.ARTIST:
        // Stage 3 落地后启用
        navigate(`/artist/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.ARTICLE:
        navigate(`/article/${b.linkTarget}`);
        break;
      case BANNER_LINK_TYPE.URL:
        window.open(b.linkTarget, '_blank', 'noopener,noreferrer');
        break;
      default:
        break;
    }
  };

  const current = banners[idx];

  return (
    <div className="relative w-full overflow-hidden rounded-xl aspect-[16/7] bg-muted">
      <AnimatePresence mode="wait">
        <motion.button
          key={current.id}
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => handleClick(current)}
          className="absolute inset-0 w-full h-full block"
        >
          <img
            src={current.imageUrl}
            alt={current.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.button>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9.3：在 HomePage 顶部接入**

Edit `apps/user/src/features/home/HomePage.tsx`：

加 import：
```typescript
import { useListEffectiveBannersQuery } from '@/features/home/bannersApi';
import { BannerCarousel } from '@/features/home/BannerCarousel';
```

在 `useListShowsQuery({...})` 调用附近加：
```typescript
const { data: banners = [] } = useListEffectiveBannersQuery();
```

在 JSX 中，把 BannerCarousel 放在 `<header>` 之前（即整个页面最顶部，列表/筛选之上）：
```tsx
return (
  <div className="px-4 py-3 space-y-4">
    {banners.length > 0 && <BannerCarousel banners={banners} />}
    <header className="space-y-3">
      ...
```

- [ ] **Step 9.4：在 user store 注册**

Edit `apps/user/src/store/index.ts`：
- 加 import：`import { bannersApi } from '@/features/home/bannersApi';`
- 在 `reducer` 加 `[bannersApi.reducerPath]: bannersApi.reducer,`
- 在 middleware 加 `bannersApi.middleware`

- [ ] **Step 9.5：user typecheck**

```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/user typecheck 2>&1 | tail -5
```
Expect: 退出 0。

---

## Task 10：端到端验收

**Files:** 无新增。

- [ ] **Step 10.1：确保 docker 服务都在跑**

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E "ticket-(mysql|redis|rabbitmq|minio|elasticsearch)"
```
Expect: 5 行 Up。

如果有 exited，重启：
```bash
cd /Users/xdb/Desktop/test/maill-backend && docker-compose up -d
```

- [ ] **Step 10.2：install core 模块到本地 maven 仓库**

(Stage 1 经验:core 代码变更后 admin/user 启动前必须先 install core)
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl common,core -am install -DskipTests -q && echo "INSTALL OK"
```
Expect: `INSTALL OK`.

- [ ] **Step 10.3：启动 admin 与 user 后端**

```bash
cd /Users/xdb/Desktop/test/maill-backend/admin && mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/admin-stage2.log 2>&1 &
cd /Users/xdb/Desktop/test/maill-backend/user  && mvn spring-boot:run -Dspring-boot.run.profiles=dev > /tmp/user-stage2.log 2>&1 &

for i in {1..60}; do
  ok_a=$(grep -c "Started AdminApplication" /tmp/admin-stage2.log 2>/dev/null)
  ok_u=$(grep -c "Started UserApplication"  /tmp/user-stage2.log 2>/dev/null)
  if [ "${ok_a:-0}" -gt 0 ] && [ "${ok_u:-0}" -gt 0 ]; then echo "BOTH STARTED"; break; fi
  if grep -q "APPLICATION FAILED TO START" /tmp/admin-stage2.log 2>/dev/null; then echo "ADMIN FAILED"; break; fi
  if grep -q "APPLICATION FAILED TO START" /tmp/user-stage2.log 2>/dev/null; then echo "USER FAILED"; break; fi
  sleep 2
done
```
Expect: `BOTH STARTED` within ~120 seconds (60 iterations × 2s sleep).

- [ ] **Step 10.4：admin 注册一个测试管理员 + 登录 + 获取 token**

```bash
# 注册
curl -s -X POST http://localhost:8081/api/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_banner_test","password":"pass1234","inviteCode":"dev-admin-invite-please-change-in-prod"}'

# 登录
TOKEN=$(curl -s -X POST http://localhost:8081/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_banner_test","password":"pass1234"}' \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "TOKEN=$TOKEN"
```
Expect: TOKEN 非空（如果注册返回"已存在"也无所谓，登录拿到 token 即可）。

- [ ] **Step 10.5：通过 admin API 创建一个 banner（无需图片上传，直接给个 mock URL）**

```bash
curl -s -X POST http://localhost:8081/api/admin/banner/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "stage2 test banner",
    "imageUrl": "http://localhost:9000/image/banners/test.jpg",
    "linkType": 1,
    "linkTarget": "1",
    "sort": 10,
    "status": 1
  }'
```
Expect: `{"code":200,"msg":"ok","data":{"id":..., "title":"stage2 test banner", ..., "status":1, ...}}`.

- [ ] **Step 10.6：从 user 端 API 读取**

```bash
curl -s http://localhost:8082/api/banner/list | python3 -m json.tool 2>/dev/null | head -25
```

注意 user 端口可能不是 8082，看 `application-dev.yml` 实际配置。可用 `grep -E "server:|port:" /Users/xdb/Desktop/test/maill-backend/user/src/main/resources/application-dev.yml`。

Expect: 返回的 list 包含上一步创建的 banner（status=1 且无时间窗限制，应直接出现）。

- [ ] **Step 10.7：验证 admin list 接口**

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8081/api/admin/banner/list" | python3 -m json.tool 2>/dev/null | head -30
```
Expect: 至少 1 条记录（含上一步创建的）。

- [ ] **Step 10.8：清理测试数据 & 停服务**

把测试 banner 删掉（避免污染）：
```bash
BID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8081/api/admin/banner/list" \
  | sed -n 's/.*"id":\([0-9]*\).*"title":"stage2 test banner".*/\1/p' | head -1)
[ -n "$BID" ] && curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "http://localhost:8081/api/admin/banner/${BID}"
echo "DELETED $BID"
```

停服务：
```bash
pkill -f "spring-boot:run" || true
sleep 2
```

- [ ] **Step 10.9：前端 typecheck 总覆盖**

```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/admin typecheck && pnpm -C apps/user typecheck && pnpm -C packages/shared typecheck 2>&1 | tail -10
```
Expect: 三个都退出 0。

---

## Self-Review 检查表

| 检查项 | 任务覆盖 |
|---|---|
| Spec 4.6 节 banner 表 → 后端 Entity / Mapper / Service | Task 1-2 |
| Spec 5.1/5.2 节 admin/user Controller | Task 3, 4 |
| 单元测试 | Task 5 |
| Spec 7.4/7.5 节 admin Banner 管理页 | Task 8 |
| Spec 7.1/7.2 节 user 首页 Banner 轮播 | Task 9 |
| 端到端联通验收 | Task 10 |
| 字段命名 createTime/updateTime / create_time/update_time 一致 | ✅ |
| TS 类型与后端字段对齐 | ✅ |
| `'banners'` 加入 UploadDir | Task 7 |
| router + menu + i18n + store 完整接入 | Task 8 / Task 9 |

无 TBD / TODO。**spec 修正**:WangEditor 决策推迟到 Stage 3 富文本登场时再定（admin 实际是 React 不是 Vue）。

---

## Stage 2 → Stage 3 衔接说明

Stage 2 完成后：
- 首页能看到管理员配置的 Banner 轮播
- admin 可以 CRUD/排序/上下架/上传图片
- 后端 Banner CRUD 与"有效列表"业务规则（status=1 且时间窗内）落地

Stage 3 计划（艺人 + 资讯）：
1. Artist Entity/Mapper/Service/Controller + admin/user 双端 + 艺人主页
2. show ↔ artist 多对多关联
3. ArticleCategory + Article（含富文本编辑器选型决策）
4. ES 同步 hook：在 show / artist / article 的 save/delete 时调用 SearchSyncProducer（Stage 4 消费）

完成 Stage 2 后再写 Stage 3 plan。
