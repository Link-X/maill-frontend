# Stage 3a：艺人 + 关注 + 演出表单改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal：** 端到端落地"艺人主页 + 演出 ↔ 艺人多对多 + 用户关注艺人"功能，并把演出表单改造为支持选择艺人 / 评价模式 / 开售时间。

**Architecture：** 后端在 core 模块新增 Artist / ShowArtist / UserFollowArtist 三张表对应的 Entity / Mapper / Service；admin 端 ArtistController CRUD + ShowController 改造写入关联；user 端 ArtistController 提供艺人列表/主页/关注。前端 admin 新增艺人管理页 + 演出表单嵌入艺人多选；user 新增艺人列表/主页 + 关注按钮。

**Tech Stack：** Spring Boot 2.7.18 + MyBatis；React 18 + RTK Query + react-hook-form + zod + framer-motion + lucide-react + react-i18next。

---

## 前置约束

1. 数据库 `artist` / `show_artist` / `user_follow_artist` 已在 Stage 1 schema-v2.sql 创建。`show` 表的 `review_mode` / `open_sale_time` 字段也已就绪。
2. **跳过 git commit**（用户偏好）。
3. **跳过单元测试**（用户偏好）。
4. **跳过端到端验收 task**——交付后用户自己启动验证。
5. **不在 Stage 3a 加 ES 同步钩子**——推到 Stage 4 一起加（届时统一钩 show/artist/article save/delete）。
6. **图片上传**：艺人头像通过 `UploadDir` 加 `'artists'`，复用现有 MinIO。

---

## 文件结构总览

```
maill-backend/
├─ common/src/main/java/com/ticket/common/exception/ErrorCode.java  🔧 +ARTIST_NOT_FOUND, +ARTIST_NAME_DUPLICATED
├─ core/
│   ├─ src/main/java/com/ticket/core/
│   │   ├─ domain/entity/
│   │   │   ├─ Artist.java                                           🆕
│   │   │   ├─ ShowArtist.java                                       🆕
│   │   │   └─ UserFollowArtist.java                                 🆕
│   │   ├─ mapper/
│   │   │   ├─ ArtistMapper.java                                     🆕
│   │   │   ├─ ShowArtistMapper.java                                 🆕
│   │   │   └─ UserFollowArtistMapper.java                           🆕
│   │   └─ service/
│   │       ├─ ArtistService.java                                    🆕
│   │       └─ ShowService.java                                      🔧 save 时同步写 show_artist + reviewMode/openSaleTime
│   └─ src/main/resources/mapper/
│       ├─ ArtistMapper.xml                                          🆕
│       ├─ ShowArtistMapper.xml                                      🆕
│       └─ UserFollowArtistMapper.xml                                🆕
├─ admin/src/main/java/com/ticket/admin/
│   ├─ controller/
│   │   ├─ ArtistController.java                                     🆕
│   │   └─ ShowController.java                                       🔧 透传新字段到 Service
│   └─ dto/
│       ├─ ArtistSaveRequest.java                                    🆕
│       ├─ ArtistStatusRequest.java                                  🆕
│       ├─ ShowCreateRequest.java                                    🔧 +artistIds +reviewMode +openSaleTime
│       └─ ShowUpdateRequest.java                                    🔧 同上
└─ user/src/main/java/com/ticket/user/
    └─ controller/ArtistController.java                              🆕

maill-frontend/
├─ packages/shared/src/
│   ├─ types/
│   │   ├─ artist.ts                                                 🆕
│   │   ├─ show.ts                                                   🔧 +artists?: Artist[] +reviewMode +openSaleTime
│   │   └─ index.ts                                                  🔧 re-export artist
│   └─ i18n/
│       ├─ locales/zh-CN/artist.json                                 🆕
│       ├─ locales/en-US/artist.json                                 🆕
│       ├─ locales/zh-CN/admin.json                                  🔧 +nav.artists
│       ├─ locales/en-US/admin.json                                  🔧 同
│       └─ index.ts                                                  🔧 注册 artist 命名空间(admin+user 都用)
├─ apps/admin/src/
│   ├─ features/
│   │   ├─ artists/
│   │   │   ├─ artistsApi.ts                                         🆕
│   │   │   ├─ ArtistsPage.tsx                                       🆕
│   │   │   └─ ArtistFormDrawer.tsx                                  🆕
│   │   ├─ shows/
│   │   │   ├─ ShowFormDrawer.tsx                                    🔧 加艺人多选 + 评价模式 + 开售时间
│   │   │   └─ showsApi.ts                                           🔧 save body 增加新字段类型
│   │   └─ upload/uploadApi.ts                                       🔧 UploadDir +'artists'
│   ├─ router/index.tsx                                              🔧 +/artists
│   ├─ layouts/AdminLayout.tsx                                       🔧 +nav item
│   └─ store/index.ts                                                🔧 注册 artistsApi
└─ apps/user/src/
    ├─ features/
    │   ├─ artists/
    │   │   ├─ artistsApi.ts                                         🆕
    │   │   ├─ ArtistsListPage.tsx                                   🆕
    │   │   ├─ ArtistDetailPage.tsx                                  🆕
    │   │   └─ FollowsPage.tsx                                       🆕(我的关注)
    │   └─ shows/
    │       └─ ShowDetailPage.tsx                                    🔧 展示关联艺人 chip
    ├─ router/index.tsx                                              🔧 +/artists +/artist/:id +/follows
    ├─ layouts/MobileLayout.tsx                                      🔧 个人中心入口加"我的关注"(若适用)
    └─ store/index.ts                                                🔧 注册 artistsApi
```

---

## Task 1：后端 Artist Entity + Mapper + XML

**Files:**
- Create: `core/src/main/java/com/ticket/core/domain/entity/Artist.java`
- Create: `core/src/main/java/com/ticket/core/mapper/ArtistMapper.java`
- Create: `core/src/main/resources/mapper/ArtistMapper.xml`

- [ ] **Step 1.1：创建 `Artist.java`**

```java
package com.ticket.core.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "艺人实体")
@Data
public class Artist {
    @Schema(description = "艺人 ID") private Long id;
    @Schema(description = "本名") private String name;
    @Schema(description = "艺名") private String stageName;
    @Schema(description = "头像 URL") private String avatarUrl;
    @Schema(description = "性别 0=保密 1=男 2=女") private Integer gender;
    @Schema(description = "国籍/地区") private String nationality;
    @Schema(description = "标签,逗号分隔") private String tags;
    @Schema(description = "简介短文本") private String bio;
    @Schema(description = "富文本详介") private String description;
    @Schema(description = "社交链接 JSON 字符串,如 {\"weibo\":\"\",\"instagram\":\"\",\"x\":\"\"}") private String socialLinks;
    @Schema(description = "粉丝数") private Integer followCount;
    @Schema(description = "关联演出数") private Integer showCount;
    @Schema(description = "状态 0=下架 1=上架") private Integer status;
    @Schema(description = "创建时间") private LocalDateTime createTime;
    @Schema(description = "更新时间") private LocalDateTime updateTime;
}
```

- [ ] **Step 1.2：创建 `ArtistMapper.java`**

```java
package com.ticket.core.mapper;

import com.ticket.core.domain.entity.Artist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ArtistMapper {

    int insert(Artist artist);
    int update(Artist artist);
    int updateStatus(@Param("id") Long id, @Param("status") Integer status, @Param("updateTime") LocalDateTime updateTime);
    int deleteById(@Param("id") Long id);

    Artist selectById(@Param("id") Long id);
    Artist selectByName(@Param("name") String name);

    /**
     * admin 列表查询
     * @param status   null=不过滤
     * @param keyword  null/空=不过滤;按 name/stage_name 前缀模糊匹配
     */
    List<Artist> selectByCondition(@Param("status") Integer status,
                                   @Param("keyword") String keyword);

    /** user 端列表:仅 status=1 */
    List<Artist> selectEnabled(@Param("page") Integer page,
                               @Param("size") Integer size);

    int countEnabled();

    int incrFollowCount(@Param("id") Long id);
    int decrFollowCount(@Param("id") Long id);

    /** 重算演出数(精确,可在 show <-> artist 关联变更后调用) */
    int refreshShowCount(@Param("id") Long id);
}
```

- [ ] **Step 1.3：创建 `ArtistMapper.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.ticket.core.mapper.ArtistMapper">

    <resultMap id="ArtistResultMap" type="com.ticket.core.domain.entity.Artist">
        <id     column="id"           property="id"/>
        <result column="name"         property="name"/>
        <result column="stage_name"   property="stageName"/>
        <result column="avatar_url"   property="avatarUrl"/>
        <result column="gender"       property="gender"/>
        <result column="nationality"  property="nationality"/>
        <result column="tags"         property="tags"/>
        <result column="bio"          property="bio"/>
        <result column="description"  property="description"/>
        <result column="social_links" property="socialLinks"/>
        <result column="follow_count" property="followCount"/>
        <result column="show_count"   property="showCount"/>
        <result column="status"       property="status"/>
        <result column="create_time"  property="createTime"/>
        <result column="update_time"  property="updateTime"/>
    </resultMap>

    <sql id="AllColumns">
        id, name, stage_name, avatar_url, gender, nationality, tags,
        bio, description, social_links, follow_count, show_count, status,
        create_time, update_time
    </sql>

    <insert id="insert" parameterType="com.ticket.core.domain.entity.Artist"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO artist (name, stage_name, avatar_url, gender, nationality, tags,
                            bio, description, social_links, follow_count, show_count,
                            status, create_time, update_time)
        VALUES (#{name}, #{stageName}, #{avatarUrl}, #{gender}, #{nationality}, #{tags},
                #{bio}, #{description}, #{socialLinks}, #{followCount}, #{showCount},
                #{status}, #{createTime}, #{updateTime})
    </insert>

    <update id="update" parameterType="com.ticket.core.domain.entity.Artist">
        UPDATE artist
        SET name         = #{name},
            stage_name   = #{stageName},
            avatar_url   = #{avatarUrl},
            gender       = #{gender},
            nationality  = #{nationality},
            tags         = #{tags},
            bio          = #{bio},
            description  = #{description},
            social_links = #{socialLinks},
            status       = #{status},
            update_time  = #{updateTime}
        WHERE id = #{id}
    </update>

    <update id="updateStatus">
        UPDATE artist SET status = #{status}, update_time = #{updateTime} WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM artist WHERE id = #{id}
    </delete>

    <select id="selectById" resultMap="ArtistResultMap">
        SELECT <include refid="AllColumns"/> FROM artist WHERE id = #{id}
    </select>

    <select id="selectByName" resultMap="ArtistResultMap">
        SELECT <include refid="AllColumns"/> FROM artist WHERE name = #{name}
    </select>

    <select id="selectByCondition" resultMap="ArtistResultMap">
        SELECT <include refid="AllColumns"/>
        FROM artist
        <where>
            <if test="status != null">AND status = #{status}</if>
            <if test="keyword != null and keyword != ''">
                AND (name LIKE CONCAT(#{keyword}, '%') OR stage_name LIKE CONCAT(#{keyword}, '%'))
            </if>
        </where>
        ORDER BY id DESC
    </select>

    <select id="selectEnabled" resultMap="ArtistResultMap">
        SELECT <include refid="AllColumns"/>
        FROM artist
        WHERE status = 1
        ORDER BY follow_count DESC, id DESC
        <if test="page != null and size != null">
            LIMIT #{size} OFFSET #{page}
        </if>
    </select>

    <select id="countEnabled" resultType="int">
        SELECT COUNT(*) FROM artist WHERE status = 1
    </select>

    <update id="incrFollowCount">
        UPDATE artist SET follow_count = follow_count + 1 WHERE id = #{id}
    </update>

    <update id="decrFollowCount">
        UPDATE artist SET follow_count = GREATEST(follow_count - 1, 0) WHERE id = #{id}
    </update>

    <update id="refreshShowCount">
        UPDATE artist
        SET show_count = (SELECT COUNT(*) FROM show_artist WHERE artist_id = #{id})
        WHERE id = #{id}
    </update>

</mapper>
```

- [ ] **Step 1.4：编译**
```bash
cd /Users/xdb/Desktop/test/maill-backend && mvn -pl core -am compile -q && echo "COMPILE OK"
```

---

## Task 2：后端 ShowArtist 关联 Entity + Mapper + XML

**Files:**
- Create: `core/src/main/java/com/ticket/core/domain/entity/ShowArtist.java`
- Create: `core/src/main/java/com/ticket/core/mapper/ShowArtistMapper.java`
- Create: `core/src/main/resources/mapper/ShowArtistMapper.xml`

- [ ] **Step 2.1：`ShowArtist.java`**
```java
package com.ticket.core.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "演出-艺人关联")
@Data
public class ShowArtist {
    @Schema(description = "关联 ID") private Long id;
    @Schema(description = "演出 ID") private Long showId;
    @Schema(description = "艺人 ID") private Long artistId;
    @Schema(description = "角色") private String role;
    @Schema(description = "排序") private Integer sort;
    @Schema(description = "创建时间") private LocalDateTime createTime;
    @Schema(description = "更新时间") private LocalDateTime updateTime;
}
```

- [ ] **Step 2.2：`ShowArtistMapper.java`**
```java
package com.ticket.core.mapper;

import com.ticket.core.domain.entity.Artist;
import com.ticket.core.domain.entity.ShowArtist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ShowArtistMapper {

    int insert(ShowArtist link);
    int batchInsert(@Param("links") List<ShowArtist> links);

    int deleteByShowId(@Param("showId") Long showId);
    int deleteByArtistId(@Param("artistId") Long artistId);

    /** 一个演出关联的艺人列表(JOIN artist) */
    List<Artist> selectArtistsByShowId(@Param("showId") Long showId);

    /** 多个演出 → 各自的艺人列表(组装用) */
    List<ShowArtist> selectByShowIds(@Param("showIds") List<Long> showIds);

    /** 艺人下的演出 ID 列表 */
    List<Long> selectShowIdsByArtistId(@Param("artistId") Long artistId,
                                       @Param("page") Integer page,
                                       @Param("size") Integer size);

    int countShowsByArtistId(@Param("artistId") Long artistId);
}
```

- [ ] **Step 2.3：`ShowArtistMapper.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.ticket.core.mapper.ShowArtistMapper">

    <resultMap id="ShowArtistResultMap" type="com.ticket.core.domain.entity.ShowArtist">
        <id     column="id"          property="id"/>
        <result column="show_id"     property="showId"/>
        <result column="artist_id"   property="artistId"/>
        <result column="role"        property="role"/>
        <result column="sort"        property="sort"/>
        <result column="create_time" property="createTime"/>
        <result column="update_time" property="updateTime"/>
    </resultMap>

    <resultMap id="ArtistResultMap" type="com.ticket.core.domain.entity.Artist">
        <id     column="id"           property="id"/>
        <result column="name"         property="name"/>
        <result column="stage_name"   property="stageName"/>
        <result column="avatar_url"   property="avatarUrl"/>
        <result column="gender"       property="gender"/>
        <result column="nationality"  property="nationality"/>
        <result column="tags"         property="tags"/>
        <result column="bio"          property="bio"/>
        <result column="description"  property="description"/>
        <result column="social_links" property="socialLinks"/>
        <result column="follow_count" property="followCount"/>
        <result column="show_count"   property="showCount"/>
        <result column="status"       property="status"/>
        <result column="create_time"  property="createTime"/>
        <result column="update_time"  property="updateTime"/>
    </resultMap>

    <insert id="insert">
        INSERT INTO show_artist (show_id, artist_id, role, sort, create_time, update_time)
        VALUES (#{showId}, #{artistId}, #{role}, #{sort}, NOW(), NOW())
    </insert>

    <insert id="batchInsert">
        INSERT INTO show_artist (show_id, artist_id, role, sort, create_time, update_time) VALUES
        <foreach collection="links" item="it" separator=",">
            (#{it.showId}, #{it.artistId}, #{it.role}, #{it.sort}, NOW(), NOW())
        </foreach>
    </insert>

    <delete id="deleteByShowId">
        DELETE FROM show_artist WHERE show_id = #{showId}
    </delete>

    <delete id="deleteByArtistId">
        DELETE FROM show_artist WHERE artist_id = #{artistId}
    </delete>

    <select id="selectArtistsByShowId" resultMap="ArtistResultMap">
        SELECT a.id, a.name, a.stage_name, a.avatar_url, a.gender, a.nationality, a.tags,
               a.bio, a.description, a.social_links, a.follow_count, a.show_count, a.status,
               a.create_time, a.update_time
        FROM show_artist sa
        JOIN artist a ON a.id = sa.artist_id
        WHERE sa.show_id = #{showId}
        ORDER BY sa.sort ASC, sa.id ASC
    </select>

    <select id="selectByShowIds" resultMap="ShowArtistResultMap">
        SELECT id, show_id, artist_id, role, sort, create_time, update_time
        FROM show_artist
        WHERE show_id IN
        <foreach collection="showIds" item="sid" open="(" close=")" separator=",">#{sid}</foreach>
        ORDER BY show_id ASC, sort ASC
    </select>

    <select id="selectShowIdsByArtistId" resultType="long">
        SELECT show_id FROM show_artist
        WHERE artist_id = #{artistId}
        ORDER BY id DESC
        <if test="page != null and size != null">
            LIMIT #{size} OFFSET #{page}
        </if>
    </select>

    <select id="countShowsByArtistId" resultType="int">
        SELECT COUNT(*) FROM show_artist WHERE artist_id = #{artistId}
    </select>

</mapper>
```

- [ ] **Step 2.4：编译** `mvn -pl core -am compile -q && echo COMPILE OK`

---

## Task 3：后端 UserFollowArtist Mapper + XML

**Files:**
- Create: `core/src/main/java/com/ticket/core/domain/entity/UserFollowArtist.java`
- Create: `core/src/main/java/com/ticket/core/mapper/UserFollowArtistMapper.java`
- Create: `core/src/main/resources/mapper/UserFollowArtistMapper.xml`

- [ ] **Step 3.1：`UserFollowArtist.java`**
```java
package com.ticket.core.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Schema(description = "用户关注艺人")
@Data
public class UserFollowArtist {
    @Schema(description = "关联 ID") private Long id;
    @Schema(description = "用户 ID") private Long userId;
    @Schema(description = "艺人 ID") private Long artistId;
    @Schema(description = "创建时间") private LocalDateTime createTime;
    @Schema(description = "更新时间") private LocalDateTime updateTime;
}
```

- [ ] **Step 3.2：`UserFollowArtistMapper.java`**
```java
package com.ticket.core.mapper;

import com.ticket.core.domain.entity.Artist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserFollowArtistMapper {

    /** insertIgnore=幂等;返回插入数(0/1) */
    int insertIgnore(@Param("userId") Long userId, @Param("artistId") Long artistId);

    int delete(@Param("userId") Long userId, @Param("artistId") Long artistId);

    /** 是否已关注(0=未关注 1=已关注) */
    int countFollow(@Param("userId") Long userId, @Param("artistId") Long artistId);

    /** 我关注的艺人 */
    List<Artist> selectFollowedArtists(@Param("userId") Long userId,
                                       @Param("page") Integer page,
                                       @Param("size") Integer size);

    int countFollowedByUser(@Param("userId") Long userId);
}
```

- [ ] **Step 3.3：`UserFollowArtistMapper.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.ticket.core.mapper.UserFollowArtistMapper">

    <resultMap id="ArtistResultMap" type="com.ticket.core.domain.entity.Artist">
        <id     column="id"           property="id"/>
        <result column="name"         property="name"/>
        <result column="stage_name"   property="stageName"/>
        <result column="avatar_url"   property="avatarUrl"/>
        <result column="gender"       property="gender"/>
        <result column="nationality"  property="nationality"/>
        <result column="tags"         property="tags"/>
        <result column="bio"          property="bio"/>
        <result column="description"  property="description"/>
        <result column="social_links" property="socialLinks"/>
        <result column="follow_count" property="followCount"/>
        <result column="show_count"   property="showCount"/>
        <result column="status"       property="status"/>
        <result column="create_time"  property="createTime"/>
        <result column="update_time"  property="updateTime"/>
    </resultMap>

    <insert id="insertIgnore">
        INSERT IGNORE INTO user_follow_artist (user_id, artist_id, create_time, update_time)
        VALUES (#{userId}, #{artistId}, NOW(), NOW())
    </insert>

    <delete id="delete">
        DELETE FROM user_follow_artist WHERE user_id = #{userId} AND artist_id = #{artistId}
    </delete>

    <select id="countFollow" resultType="int">
        SELECT COUNT(*) FROM user_follow_artist
        WHERE user_id = #{userId} AND artist_id = #{artistId}
    </select>

    <select id="selectFollowedArtists" resultMap="ArtistResultMap">
        SELECT a.id, a.name, a.stage_name, a.avatar_url, a.gender, a.nationality, a.tags,
               a.bio, a.description, a.social_links, a.follow_count, a.show_count, a.status,
               a.create_time, a.update_time
        FROM user_follow_artist ufa
        JOIN artist a ON a.id = ufa.artist_id
        WHERE ufa.user_id = #{userId} AND a.status = 1
        ORDER BY ufa.id DESC
        <if test="page != null and size != null">
            LIMIT #{size} OFFSET #{page}
        </if>
    </select>

    <select id="countFollowedByUser" resultType="int">
        SELECT COUNT(*) FROM user_follow_artist WHERE user_id = #{userId}
    </select>

</mapper>
```

- [ ] **Step 3.4：编译** `mvn -pl core -am compile -q && echo COMPILE OK`

---

## Task 4：ArtistService + ErrorCode 扩展

**Files:**
- Modify: `common/src/main/java/com/ticket/common/exception/ErrorCode.java`
- Create: `core/src/main/java/com/ticket/core/service/ArtistService.java`

- [ ] **Step 4.1：在 ErrorCode 加 2 个枚举**

Current ending（Stage 2 改过）:
```java
    CATEGORY_NAME_DUPLICATED(1013, "分类名已存在"),
    BANNER_NOT_FOUND(1020, "Banner 不存在");
```

Change to:
```java
    CATEGORY_NAME_DUPLICATED(1013, "分类名已存在"),
    BANNER_NOT_FOUND(1020, "Banner 不存在"),
    ARTIST_NOT_FOUND(1030, "艺人不存在"),
    ARTIST_NAME_DUPLICATED(1031, "艺人名已存在");
```

- [ ] **Step 4.2：创建 `ArtistService.java`**

```java
package com.ticket.core.service;

import com.ticket.common.exception.BusinessException;
import com.ticket.common.exception.ErrorCode;
import com.ticket.core.domain.entity.Artist;
import com.ticket.core.mapper.ArtistMapper;
import com.ticket.core.mapper.UserFollowArtistMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 艺人服务:CRUD + 关注关系。
 */
@Service
public class ArtistService {

    private final ArtistMapper artistMapper;
    private final UserFollowArtistMapper followMapper;

    public ArtistService(ArtistMapper artistMapper, UserFollowArtistMapper followMapper) {
        this.artistMapper = artistMapper;
        this.followMapper = followMapper;
    }

    @Transactional
    public Artist save(Artist artist) {
        LocalDateTime now = LocalDateTime.now();
        if (artist.getStatus() == null) artist.setStatus(1);
        if (artist.getGender() == null) artist.setGender(0);

        if (artist.getId() == null) {
            // 新增:校验本名唯一
            if (artist.getName() != null && artistMapper.selectByName(artist.getName().trim()) != null) {
                throw new BusinessException(ErrorCode.ARTIST_NAME_DUPLICATED);
            }
            if (artist.getName() != null) artist.setName(artist.getName().trim());
            if (artist.getFollowCount() == null) artist.setFollowCount(0);
            if (artist.getShowCount() == null) artist.setShowCount(0);
            artist.setCreateTime(now);
            artist.setUpdateTime(now);
            artistMapper.insert(artist);
            return artist;
        }
        Artist exist = artistMapper.selectById(artist.getId());
        if (exist == null) throw new BusinessException(ErrorCode.ARTIST_NOT_FOUND);
        if (artist.getName() != null) {
            artist.setName(artist.getName().trim());
            Artist byName = artistMapper.selectByName(artist.getName());
            if (byName != null && !byName.getId().equals(artist.getId())) {
                throw new BusinessException(ErrorCode.ARTIST_NAME_DUPLICATED);
            }
        }
        artist.setUpdateTime(now);
        artistMapper.update(artist);
        return artistMapper.selectById(artist.getId());
    }

    @Transactional
    public void updateStatus(Long id, Integer status) {
        if (artistMapper.selectById(id) == null) {
            throw new BusinessException(ErrorCode.ARTIST_NOT_FOUND);
        }
        artistMapper.updateStatus(id, status, LocalDateTime.now());
    }

    @Transactional
    public void delete(Long id) {
        artistMapper.deleteById(id);
        // 注:关联 show_artist / user_follow_artist 不级联删,由各 admin/user 路径自行处理(避免误删用户关注)
    }

    public Artist getById(Long id) {
        return artistMapper.selectById(id);
    }

    public List<Artist> listByCondition(Integer status, String keyword) {
        return artistMapper.selectByCondition(status, keyword);
    }

    public List<Artist> listEnabled(Integer page, Integer size) {
        Integer offset = (page != null && size != null) ? (page - 1) * size : null;
        return artistMapper.selectEnabled(offset, size);
    }

    public int countEnabled() {
        return artistMapper.countEnabled();
    }

    // ----- 关注 -----

    @Transactional
    public boolean follow(Long userId, Long artistId) {
        if (artistMapper.selectById(artistId) == null) {
            throw new BusinessException(ErrorCode.ARTIST_NOT_FOUND);
        }
        int inserted = followMapper.insertIgnore(userId, artistId);
        if (inserted > 0) {
            artistMapper.incrFollowCount(artistId);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean unfollow(Long userId, Long artistId) {
        int deleted = followMapper.delete(userId, artistId);
        if (deleted > 0) {
            artistMapper.decrFollowCount(artistId);
            return true;
        }
        return false;
    }

    public boolean isFollowing(Long userId, Long artistId) {
        return followMapper.countFollow(userId, artistId) > 0;
    }

    public List<Artist> listFollowedArtists(Long userId, Integer page, Integer size) {
        Integer offset = (page != null && size != null) ? (page - 1) * size : null;
        return followMapper.selectFollowedArtists(userId, offset, size);
    }
}
```

- [ ] **Step 4.3：编译** `mvn -pl core -am compile -q && echo COMPILE OK`

---

## Task 5：admin ArtistController + DTOs

**Files:**
- Create: `admin/src/main/java/com/ticket/admin/dto/ArtistSaveRequest.java`
- Create: `admin/src/main/java/com/ticket/admin/dto/ArtistStatusRequest.java`
- Create: `admin/src/main/java/com/ticket/admin/controller/ArtistController.java`

- [ ] **Step 5.1：`ArtistSaveRequest.java`**
```java
package com.ticket.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Schema(description = "保存艺人(id 为空=新增,否则=更新)")
@Data
public class ArtistSaveRequest {
    @Schema(description = "艺人 ID,新增传 null") private Long id;
    @Schema(description = "本名", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank @Size(max = 100) private String name;
    @Schema(description = "艺名") @Size(max = 100) private String stageName;
    @Schema(description = "头像 URL") @Size(max = 500) private String avatarUrl;
    @Schema(description = "性别 0=保密 1=男 2=女", example = "0")
    @Min(0) @Max(2) private Integer gender;
    @Schema(description = "国籍/地区") @Size(max = 50) private String nationality;
    @Schema(description = "标签,逗号分隔") @Size(max = 500) private String tags;
    @Schema(description = "简介短文本") @Size(max = 500) private String bio;
    @Schema(description = "富文本详介") private String description;
    @Schema(description = "社交链接 JSON 字符串") private String socialLinks;
    @Schema(description = "状态 0=下架 1=上架", example = "1")
    @Min(0) @Max(1) private Integer status;
}
```

- [ ] **Step 5.2：`ArtistStatusRequest.java`**
```java
package com.ticket.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Schema(description = "艺人上下架请求")
@Data
public class ArtistStatusRequest {
    @NotNull private Long id;
    @NotNull @Min(0) @Max(1) private Integer status;
}
```

- [ ] **Step 5.3：`ArtistController.java`**
```java
package com.ticket.admin.controller;

import com.ticket.admin.dto.ArtistSaveRequest;
import com.ticket.admin.dto.ArtistStatusRequest;
import com.ticket.common.result.Result;
import com.ticket.core.domain.entity.Artist;
import com.ticket.core.service.ArtistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Tag(name = "艺人管理", description = "艺人 CRUD,可通过 show_artist 关联到演出")
@RestController
@RequestMapping("/api/admin/artist")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @Operation(summary = "艺人列表")
    @GetMapping("/list")
    public Result<List<Artist>> list(
            @Parameter(description = "0=下架 1=上架;不传则全部") @RequestParam(required = false) Integer status,
            @Parameter(description = "name/stage_name 前缀模糊") @RequestParam(required = false) String keyword) {
        return Result.success(artistService.listByCondition(status, keyword));
    }

    @Operation(summary = "艺人详情")
    @GetMapping("/{id}")
    public Result<Artist> get(@PathVariable Long id) {
        return Result.success(artistService.getById(id));
    }

    @Operation(summary = "保存艺人(id 为空=新增,否则=更新)")
    @PostMapping("/save")
    public Result<Artist> save(@Valid @RequestBody ArtistSaveRequest req) {
        Artist artist = new Artist();
        BeanUtils.copyProperties(req, artist);
        return Result.success(artistService.save(artist));
    }

    @Operation(summary = "上下架")
    @PostMapping("/status")
    public Result<Void> status(@Valid @RequestBody ArtistStatusRequest req) {
        artistService.updateStatus(req.getId(), req.getStatus());
        return Result.success(null);
    }

    @Operation(summary = "删除艺人(不级联删除关注/演出关联)")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        artistService.delete(id);
        return Result.success(null);
    }
}
```

- [ ] **Step 5.4：编译** `mvn -pl admin -am compile -q && echo COMPILE OK`

---

## Task 6：演出 Service / Controller 改造（加 artistIds + reviewMode + openSaleTime）

**Files:**
- Modify: `core/src/main/java/com/ticket/core/service/ShowService.java`（在 create/update 增加同步 show_artist 逻辑 + 写入新字段）
- Modify: `core/src/main/java/com/ticket/core/mapper/ShowMapper.java` 和 `ShowMapper.xml`（INSERT / UPDATE 加新字段）
- Modify: `admin/src/main/java/com/ticket/admin/dto/ShowCreateRequest.java`
- Modify: `admin/src/main/java/com/ticket/admin/dto/ShowUpdateRequest.java`
- Modify: `admin/src/main/java/com/ticket/admin/controller/ShowController.java`（透传新字段）
- Modify: `core/src/main/java/com/ticket/core/domain/entity/Show.java`（加 reviewMode/openSaleTime/artists 字段）

> **方法**：先 Read 这 6 个文件理解现有代码 → 在每个文件中只追加、不重构。

- [ ] **Step 6.1：读取这 6 个文件作为基线**

Read:
- `core/src/main/java/com/ticket/core/domain/entity/Show.java`（24 行左右）
- `core/src/main/java/com/ticket/core/mapper/ShowMapper.java`
- `core/src/main/resources/mapper/ShowMapper.xml`
- `core/src/main/java/com/ticket/core/service/ShowService.java`
- `admin/src/main/java/com/ticket/admin/dto/ShowCreateRequest.java`
- `admin/src/main/java/com/ticket/admin/dto/ShowUpdateRequest.java`

- [ ] **Step 6.2：扩展 `Show.java`**

在现有字段后追加（位置：`extend` 字段之前，保持与表列出顺序对应）：

```java
    @Schema(description = "评价模式 0=无评价 1=所有可评 2=仅已观看",
            example = "1", allowableValues = {"0","1","2"})
    private Integer reviewMode;
    @Schema(description = "平均评分(冗余,DB 维护)") private java.math.BigDecimal avgRating;
    @Schema(description = "评价数(冗余,DB 维护)") private Integer reviewCount;
    @Schema(description = "开售时间,用于开售提醒触发") private LocalDateTime openSaleTime;
    /** Service 层 join 后注入 */
    @Schema(description = "关联艺人(查询时由 Service 注入)") private java.util.List<Artist> artists;
```

`import` 区域加 `import java.util.List;`(如果还没有)和保留现有的 import。

- [ ] **Step 6.3：扩展 `ShowMapper.xml`**

在现有 `<resultMap>` 中加 4 行：
```xml
        <result column="review_mode"    property="reviewMode"/>
        <result column="avg_rating"     property="avgRating"/>
        <result column="review_count"   property="reviewCount"/>
        <result column="open_sale_time" property="openSaleTime"/>
```

INSERT 现有的列清单和 `VALUES` 加上 4 列：
- 列：`..., review_mode, avg_rating, review_count, open_sale_time, ...`
- 值：`..., #{reviewMode}, #{avgRating}, #{reviewCount}, #{openSaleTime}, ...`
（确保 DEFAULT 也能用,故如果传 NULL,DB 会用 DEFAULT;此处推荐传值,在 Service 给默认。）

UPDATE 加：
```sql
    review_mode    = #{reviewMode},
    open_sale_time = #{openSaleTime},
```
（不 update avg_rating / review_count,它们由评价 Service 异步维护。）

SELECT 的列清单加上 `review_mode, avg_rating, review_count, open_sale_time`。

> 改完后 **Read 你修改后的 xml**,确认 4 处都改对（resultMap / insert / update / select)，避免漏。

- [ ] **Step 6.4：扩展 `ShowCreateRequest` / `ShowUpdateRequest`**

在两个文件末尾分别追加（保持现有字段不动）：

```java
    @Schema(description = "评价模式 0=无评价 1=所有可评 2=仅已观看;默认 1",
            example = "1", allowableValues = {"0","1","2"})
    @javax.validation.constraints.Min(0)
    @javax.validation.constraints.Max(2)
    private Integer reviewMode;

    @Schema(description = "开售时间(null=立即可购)") private java.time.LocalDateTime openSaleTime;

    @Schema(description = "关联艺人 ID 列表(可空)") private java.util.List<Long> artistIds;

    @Schema(description = "艺人角色映射 {artistId: '主演'}", example = "{\"1\":\"主演\"}")
    private java.util.Map<Long, String> artistRoles;
```

- [ ] **Step 6.5：扩展 `ShowController.create/update`**

把 request → entity 的 BeanUtils.copyProperties / 手动 set 处加上新字段（按你看到的 ShowController 代码风格）：
```java
show.setReviewMode(req.getReviewMode());
show.setOpenSaleTime(req.getOpenSaleTime());
// 然后 service 接受 entity + artistIds + artistRoles
Show saved = showService.create(show, req.getArtistIds(), req.getArtistRoles());
```

`ShowService.create/update` 方法签名相应改造（加 2 个参数）。

- [ ] **Step 6.6：扩展 `ShowService`**

在 `ShowService` 注入 `ShowArtistMapper` 和 `ArtistMapper`。

`create(Show show, List<Long> artistIds, Map<Long,String> artistRoles)`：
1. 现有 insert 演出之后,如果 artistIds 非空,组装 `ShowArtist` 列表 batchInsert
2. 对每个 artistId 调 `artistMapper.refreshShowCount(id)` 以保证冗余统计正确

`update(Show show, List<Long> artistIds, Map<Long,String> artistRoles)`：
1. 现有 update 演出之后,如果 artistIds 非 null（即使是 []）：
   - `showArtistMapper.deleteByShowId(showId)` 删旧
   - 如果非空,batchInsert 新的
   - 对涉及到的 artist（旧的 + 新的）`refreshShowCount`

补一个 `getDetail(Long id)`(可选)：读 show 同时 join `selectArtistsByShowId` 注入 `show.setArtists(...)`,供 admin 详情/编辑回显。

> 默认值：如果 `reviewMode == null`,Service 设为 `1`（所有可评）。

具体代码视已有 ShowService 代码风格自然衔接,**不要重写整个 Service**。

- [ ] **Step 6.7：编译** `mvn -pl admin -am compile -q && echo COMPILE OK`

---

## Task 7：user ArtistController

**File:** Create `user/src/main/java/com/ticket/user/controller/ArtistController.java`

> 路径 `/api/artist`。user 端鉴权机制：从 SecurityContext / JwtPrincipal 拿 userId（参考现有 `user/src/main/java/com/ticket/user/controller/OrderController.java` 看怎么拿当前用户）。

- [ ] **Step 7.1：读现有 user OrderController（任何已有 user 模块的 Controller），找到从 token 拿 userId 的 helper / annotation**

```bash
grep -rE "@AuthenticationPrincipal|getUserId|JwtAuthenticationToken" /Users/xdb/Desktop/test/maill-backend/user/src/main/java/ 2>/dev/null | head -10
```

记住正确的 userId 注入方式。

- [ ] **Step 7.2：实现 ArtistController**

```java
package com.ticket.user.controller;

import com.ticket.common.result.Result;
import com.ticket.core.domain.entity.Artist;
import com.ticket.core.service.ArtistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "艺人", description = "用户端艺人:列表/主页/关注/我的关注")
@RestController
@RequestMapping("/api/artist")
public class ArtistController {

    private final ArtistService artistService;
    // TODO: 注入获取当前 userId 的 helper,与 user 模块其他 Controller 保持一致

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @Operation(summary = "艺人列表(已上架)")
    @GetMapping("/list")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        List<Artist> list = artistService.listEnabled(page, size);
        int total = artistService.countEnabled();
        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);
        return Result.success(result);
    }

    @Operation(summary = "艺人详情")
    @GetMapping("/{id}")
    public Result<Artist> get(@PathVariable Long id) {
        return Result.success(artistService.getById(id));
    }

    @Operation(summary = "关注艺人")
    @PostMapping("/follow")
    public Result<Boolean> follow(@RequestBody FollowRequest req) {
        Long userId = getCurrentUserId();
        return Result.success(artistService.follow(userId, req.artistId));
    }

    @Operation(summary = "取消关注")
    @PostMapping("/unfollow")
    public Result<Boolean> unfollow(@RequestBody FollowRequest req) {
        Long userId = getCurrentUserId();
        return Result.success(artistService.unfollow(userId, req.artistId));
    }

    @Operation(summary = "是否已关注")
    @GetMapping("/follow/check")
    public Result<Boolean> check(@RequestParam @NotNull Long artistId) {
        Long userId = getCurrentUserId();
        return Result.success(artistService.isFollowing(userId, artistId));
    }

    @Operation(summary = "我关注的艺人")
    @GetMapping("/follow/list")
    public Result<List<Artist>> followList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        Long userId = getCurrentUserId();
        return Result.success(artistService.listFollowedArtists(userId, page, size));
    }

    /** 与 user 模块其他 Controller 一致的方式取当前 userId(实现时按 Step 7.1 调研结果替换) */
    private Long getCurrentUserId() {
        // 占位:实际实现按现有惯例填充,常见模式如:
        //   ((JwtPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUserId();
        // 或者用 @AuthenticationPrincipal JwtPrincipal principal 作为方法参数。
        // 调研结果在 Step 7.1 已知,请按现有代码替换这里。
        throw new UnsupportedOperationException("see Step 7.1: 与 OrderController 保持一致");
    }

    @lombok.Data
    public static class FollowRequest {
        @javax.validation.constraints.NotNull
        public Long artistId;
    }
}
```

⚠️ implementer **必须**先 Step 7.1 调研，把 `getCurrentUserId()` 用现有惯例实现（不能 throw），且 `/follow` `/unfollow` `/follow/check` `/follow/list` 都用它。

- [ ] **Step 7.3：编译** `mvn -pl user -am compile -q && echo COMPILE OK`

---

## Task 8：shared Artist + Show 类型扩展

**Files:**
- Create: `packages/shared/src/types/artist.ts`
- Modify: `packages/shared/src/types/show.ts`（加 artists / reviewMode / openSaleTime / avgRating / reviewCount）
- Modify: `packages/shared/src/types/index.ts`（re-export artist）

- [ ] **Step 8.1：`artist.ts`**

```typescript
// 艺人（与后端 com.ticket.core.domain.entity.Artist 对齐）
export interface Artist {
  id: number;
  name: string;
  stageName?: string;
  avatarUrl?: string;
  /** 0=保密 1=男 2=女 */
  gender?: 0 | 1 | 2;
  nationality?: string;
  /** 逗号分隔标签 */
  tags?: string;
  /** 简介短文本 */
  bio?: string;
  /** 富文本详介 */
  description?: string;
  /** JSON 字符串,如 {"weibo":"","instagram":"","x":""} */
  socialLinks?: string;
  followCount?: number;
  showCount?: number;
  /** 0=下架 1=上架 */
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}
```

- [ ] **Step 8.2：扩展 `show.ts`**

Read 现有 `packages/shared/src/types/show.ts`，找到 Show interface 末尾，追加：
```typescript
  /** 0=无评价 1=所有可评 2=仅已观看 */
  reviewMode?: 0 | 1 | 2;
  avgRating?: number;
  reviewCount?: number;
  openSaleTime?: string;
  artists?: Artist[];
```

并在文件顶部加 `import type { Artist } from './artist';`。

- [ ] **Step 8.3：`types/index.ts` 追加**

```typescript
export * from './artist';
```

- [ ] **Step 8.4：typecheck** `cd /Users/xdb/Desktop/test/maill-frontend/packages/shared && npx tsc --noEmit`

---

## Task 9：admin artistsApi + store + UploadDir

**Files:**
- Modify: `apps/admin/src/features/upload/uploadApi.ts`（UploadDir 加 `'artists'`）
- Create: `apps/admin/src/features/artists/artistsApi.ts`
- Modify: `apps/admin/src/store/index.ts`（注册 artistsApi）

- [ ] **Step 9.1：扩展 UploadDir**

把：
```typescript
export type UploadDir = 'posters' | 'avatars' | 'rooms' | 'categories' | 'banners' | 'misc';
```
改为：
```typescript
export type UploadDir = 'posters' | 'avatars' | 'rooms' | 'categories' | 'banners' | 'artists' | 'misc';
```

- [ ] **Step 9.2：`artistsApi.ts`**

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Artist } from '@maill/shared';
import { adminBaseQuery } from '@/api/adminBase';

interface ListArg {
  status?: 0 | 1;
  keyword?: string;
}

export interface ArtistSaveBody {
  id?: number;
  name: string;
  stageName?: string;
  avatarUrl?: string;
  gender?: 0 | 1 | 2;
  nationality?: string;
  tags?: string;
  bio?: string;
  description?: string;
  socialLinks?: string;
  status?: 0 | 1;
}

export const artistsApi = createApi({
  reducerPath: 'artistsApi',
  baseQuery: adminBaseQuery,
  tagTypes: ['Artist'],
  endpoints: (build) => ({
    listArtists: build.query<Artist[], ListArg | void>({
      query: (arg) => ({
        url: '/api/admin/artist/list',
        params: { status: arg?.status, keyword: arg?.keyword || undefined },
      }),
      providesTags: (result) => [
        'Artist',
        ...(result ?? []).map((a) => ({ type: 'Artist' as const, id: a.id })),
      ],
    }),
    getArtist: build.query<Artist, number | string>({
      query: (id) => `/api/admin/artist/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Artist', id }],
    }),
    saveArtist: build.mutation<Artist, ArtistSaveBody>({
      query: (body) => ({ url: '/api/admin/artist/save', method: 'POST', body }),
      invalidatesTags: ['Artist'],
    }),
    updateArtistStatus: build.mutation<void, { id: number; status: 0 | 1 }>({
      query: (body) => ({ url: '/api/admin/artist/status', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Artist', id: arg.id }, 'Artist'],
    }),
    deleteArtist: build.mutation<void, number>({
      query: (id) => ({ url: `/api/admin/artist/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Artist'],
    }),
  }),
});

export const {
  useListArtistsQuery,
  useGetArtistQuery,
  useSaveArtistMutation,
  useUpdateArtistStatusMutation,
  useDeleteArtistMutation,
} = artistsApi;
```

- [ ] **Step 9.3：注册到 admin store**

参考 Stage 2 同样手法，加 import、reducer、middleware。

- [ ] **Step 9.4：typecheck** `pnpm -C apps/admin typecheck`

---

## Task 10：admin ArtistsPage + ArtistFormDrawer + 路由 + 菜单 + i18n

**Files:**
- Create: `packages/shared/src/i18n/locales/zh-CN/artist.json`
- Create: `packages/shared/src/i18n/locales/en-US/artist.json`
- Modify: `packages/shared/src/i18n/locales/zh-CN/admin.json`（+ `nav.artists`）
- Modify: `packages/shared/src/i18n/locales/en-US/admin.json`（同）
- Modify: `packages/shared/src/i18n/index.ts`（admin + user 都注册 artist 命名空间——user 也需要给艺人页用）
- Create: `apps/admin/src/features/artists/ArtistsPage.tsx`
- Create: `apps/admin/src/features/artists/ArtistFormDrawer.tsx`
- Modify: `apps/admin/src/router/index.tsx`（+ `/artists` 路由）
- Modify: `apps/admin/src/layouts/AdminLayout.tsx`（+ nav 项）

- [ ] **Step 10.1：i18n 资源 zh-CN/artist.json**

```json
{
  "page": {
    "title": "艺人管理",
    "subtitle": "维护艺人主页与演出关联",
    "addBtn": "新建艺人"
  },
  "table": {
    "avatar": "头像",
    "name": "本名",
    "stageName": "艺名",
    "nationality": "国籍/地区",
    "tags": "标签",
    "followCount": "粉丝",
    "showCount": "演出",
    "status": "状态",
    "actions": "操作"
  },
  "form": {
    "titleNew": "新建艺人",
    "titleEdit": "编辑艺人",
    "name": "本名",
    "namePlaceholder": "如：周杰伦",
    "nameRequired": "请输入本名",
    "stageName": "艺名",
    "stageNamePlaceholder": "若有,留空也可",
    "avatarUrl": "头像",
    "gender": "性别",
    "nationality": "国籍/地区",
    "tags": "标签(逗号分隔)",
    "tagsPlaceholder": "歌手,演员,钢琴家",
    "bio": "简介",
    "bioPlaceholder": "一句话简介,列表/卡片展示用",
    "description": "详细介绍",
    "descriptionPlaceholder": "支持多行,后续可升级为富文本",
    "socialLinks": "社交链接(JSON)",
    "socialLinksPlaceholder": "{\"weibo\":\"\",\"instagram\":\"\",\"x\":\"\"}",
    "status": "状态",
    "savedToast": "艺人已更新",
    "createdToast": "艺人已创建"
  },
  "gender": { "secret": "保密", "male": "男", "female": "女" },
  "status": { "online": "已上架", "offline": "已下架" },
  "action": { "enableShort": "上架", "disableShort": "下架" },
  "toggle": { "onlineToast": "已上架", "offlineToast": "已下架" },
  "delete": {
    "title": "删除艺人",
    "desc": "确定要删除艺人 {{name}} 吗？关联演出不会被删,但展示将失去该艺人。",
    "btn": "删除",
    "btnDeleting": "删除中...",
    "successToast": "已删除"
  },
  "user": {
    "listTitle": "艺人",
    "follow": "关注",
    "following": "已关注",
    "unfollow": "取消关注",
    "follows": "我的关注",
    "noShows": "暂无演出",
    "noArticles": "暂无资讯",
    "tabShows": "演出",
    "tabArticles": "资讯",
    "bio": "简介",
    "description": "详细介绍"
  }
}
```

- [ ] **Step 10.2：en-US/artist.json**

字面英文翻译。结构与 zh-CN 完全一致（每个 key 都翻译,本任务的 implementer 可以使用机器翻译质量）。

- [ ] **Step 10.3：admin.json 加 `nav.artists`**

zh-CN/admin.json `nav` 块加：
```json
"artists": "艺人管理",
```

en-US/admin.json 加：
```json
"artists": "Artists",
```

- [ ] **Step 10.4：i18n index.ts 注册 artist namespace（admin + user 都需要）**

读 `packages/shared/src/i18n/index.ts`：
1. Imports 加：
```typescript
import zhArtist from './locales/zh-CN/artist.json';
import enArtist from './locales/en-US/artist.json';
```
2. `USER_NAMESPACES` 加 `'artist'`
3. `ADMIN_NAMESPACES` 加 `'artist'`
4. `ZH_BUNDLES` 加 `artist: zhArtist,`
5. `EN_BUNDLES` 加 `artist: enArtist,`

- [ ] **Step 10.5：ArtistsPage.tsx**

仿 `CategoriesPage.tsx` 与 Stage 2 的 `BannersPage.tsx` 模式。
- 列：头像 / 本名 / 艺名 / 标签 / 粉丝数 / 演出数 / 状态 / 操作
- 操作：编辑 / 上下架 / 删除（不需要"上移/下移"——按 id DESC 即可）
- 顶部搜索框（keyword 联到 listArtists query）

具体代码风格紧密照搬 BannersPage.tsx,把 banner → artist 全部映射。

- [ ] **Step 10.6：ArtistFormDrawer.tsx**

仿 `BannerFormDrawer.tsx` 与 `CategoryFormDrawer.tsx`。
- ImageUploader dir="artists"（头像）
- Select 用 Select + SelectTrigger + SelectContent + SelectItem 模式
- 字段：name(必填), stageName, avatarUrl(via ImageUploader), gender(Select), nationality, tags, bio(textarea), description(textarea 多行,Stage 3a 不上富文本), socialLinks(textarea JSON), status(Select)
- 必填校验：name
- socialLinks 字段：尝试 JSON.parse 校验（实现可选,可作为高级字段）

- [ ] **Step 10.7：路由 + 菜单**

router 加 `/artists` lazy + child route。
AdminLayout `navItems` 在 banner 之后/orders 之后插一行：
```ts
{ to: '/artists', key: 'admin:nav.artists', icon: Users },
```
（`Users` 从 lucide-react import）

- [ ] **Step 10.8：typecheck** `pnpm -C apps/admin typecheck`

---

## Task 11：admin 演出表单改造（嵌入艺人多选 + reviewMode + openSaleTime）

**Files:**
- Modify: `apps/admin/src/features/shows/ShowFormDrawer.tsx`
- Modify: `apps/admin/src/features/shows/showsApi.ts`（save body type 加新字段）

- [ ] **Step 11.1：先读 ShowFormDrawer.tsx 与 showsApi.ts**

定位 form schema 与字段渲染区域。

- [ ] **Step 11.2：showsApi.ts 扩展**

`createShow` 和 `updateShow` 的 body 类型加上：
```typescript
reviewMode?: 0 | 1 | 2;
openSaleTime?: string;
artistIds?: number[];
artistRoles?: Record<number, string>;
```
（如 mutation 用 `Partial<Show>`,把 `Show` 类型扩展即可——因为 shared show.ts 已经扩展过 Show interface,直接生效。）

可能需要新增显式 body 类型 `ShowSaveBody` 包含 artistIds/artistRoles（Show entity 本身不含 artistIds）。

- [ ] **Step 11.3：ShowFormDrawer.tsx 加字段**

在现有 schema 里加：
```typescript
reviewMode: z.coerce.number().int().min(0).max(2).default(1),
openSaleTime: z.string().optional().or(z.literal('')),
artistIds: z.array(z.number()).default([]),
```

UI 部分：
- 评价模式：Select(无评价/所有可评/仅已观看),3 个 SelectItem
- 开售时间：`<Input type="datetime-local">`
- 艺人多选：用 `useListArtistsQuery({ status: 1 })` 拉艺人,渲染为可点击 chip 列表（已选 = 蓝底；未选 = 描边）。点击 toggle 加到 `artistIds`。

提交时把 `openSaleTime` 转 backend format（'YYYY-MM-DD HH:mm:ss'），与 Stage 2 BannerFormDrawer 同样的 toBackend 工具函数。

更新模式打开抽屉时，需要把 initial.artists?.map(a=>a.id) 作为 artistIds 默认值。

- [ ] **Step 11.4：typecheck** `pnpm -C apps/admin typecheck`

---

## Task 12：user 艺人列表/主页/关注 + 路由 + Profile 入口

**Files:**
- Create: `apps/user/src/features/artists/artistsApi.ts`
- Create: `apps/user/src/features/artists/ArtistsListPage.tsx`
- Create: `apps/user/src/features/artists/ArtistDetailPage.tsx`
- Create: `apps/user/src/features/artists/FollowsPage.tsx`
- Modify: `apps/user/src/router/index.tsx`（+ `/artists` `/artist/:id` `/follows`）
- Modify: `apps/user/src/store/index.ts`（注册 artistsApi）
- Modify: `apps/user/src/features/profile/ProfilePage.tsx`（加"我的关注"入口）
- Modify: `apps/user/src/features/shows/ShowDetailPage.tsx`（顶部展示关联艺人 chip）

- [ ] **Step 12.1：`apps/user/src/features/artists/artistsApi.ts`**

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Artist } from '@maill/shared';
import { userBaseQuery } from '@/api/userBase';

interface ListRes { list: Artist[]; total: number; page: number; size: number; }

export const artistsApi = createApi({
  reducerPath: 'artistsApi',
  baseQuery: userBaseQuery,
  tagTypes: ['Artist', 'Follow'],
  endpoints: (build) => ({
    listArtists: build.query<ListRes, { page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/artist/list', params: arg }),
    }),
    getArtist: build.query<Artist, number | string>({
      query: (id) => `/api/artist/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Artist', id: Number(id) }],
    }),
    followArtist: build.mutation<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/follow', method: 'POST', body: { artistId } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Artist', id }, 'Follow'],
    }),
    unfollowArtist: build.mutation<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/unfollow', method: 'POST', body: { artistId } }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Artist', id }, 'Follow'],
    }),
    checkFollow: build.query<boolean, number>({
      query: (artistId) => ({ url: '/api/artist/follow/check', params: { artistId } }),
      providesTags: (_r, _e, id) => [{ type: 'Follow' as const, id }],
    }),
    listFollows: build.query<Artist[], { page?: number; size?: number } | void>({
      query: (arg) => ({ url: '/api/artist/follow/list', params: arg }),
      providesTags: ['Follow'],
    }),
  }),
});

export const {
  useListArtistsQuery,
  useGetArtistQuery,
  useFollowArtistMutation,
  useUnfollowArtistMutation,
  useCheckFollowQuery,
  useListFollowsQuery,
} = artistsApi;
```

- [ ] **Step 12.2：ArtistsListPage.tsx**

移动端网格瀑布流（2 列），点击进艺人详情。参考 `apps/user/src/features/home/HomePage.tsx` 中 ShowCard 的网格写法。

每个 Card：
- 头像（圆形 80×80）
- 艺名 + 本名
- 粉丝数 / 演出数

- [ ] **Step 12.3：ArtistDetailPage.tsx**

主页:
- 顶部 Cover 区域 + 大头像 + 艺名 + 本名 + 简介
- 关注按钮（用 `useCheckFollowQuery` 拿当前关注状态,点击切换；显示 Loading）
- Tabs:演出 / 资讯（Stage 3a 资讯 Tab 暂时显示"敬请期待",Stage 3b 替换为真实列表）
- 演出 Tab：调一个新的接口拿艺人下的演出列表——**Stage 3a 暂时不实现**（需要 user 端的 ShowsByArtist 接口）;暂时用"敬请期待"占位或者通过 `useListShowsQuery` 在前端过滤（不够,因为 listShows 不 join artists）。
  - **简化方案**：Stage 3a 演出 Tab 也显示"敬请期待 / 即将开放",Stage 3b 或后续接力。

- [ ] **Step 12.4：FollowsPage.tsx**

仿 ArtistsListPage 结构，但数据源是 `useListFollowsQuery`。空态显示"还没关注任何艺人 → 去逛逛"。

- [ ] **Step 12.5：路由 / store 注册 / Profile 入口**

router 加：
```typescript
const ArtistsListPage = lazy(() => import('@/features/artists/ArtistsListPage'));
const ArtistDetailPage = lazy(() => import('@/features/artists/ArtistDetailPage'));
const FollowsPage = lazy(() => import('@/features/artists/FollowsPage'));
// child routes:
{ path: 'artists', element: withSuspense(<ArtistsListPage />) },
{ path: 'artist/:id', element: withSuspense(<ArtistDetailPage />) },
{ path: 'follows', element: withSuspense(<FollowsPage />) },
```

store 加 artistsApi（仿 Stage 2 bannersApi）。

ProfilePage：加一个入口 link 到 `/follows`（"我的关注"）；另一个入口 link 到 `/artists`（"探索艺人"）。

- [ ] **Step 12.6：ShowDetailPage 展示关联艺人 chip**

读 `apps/user/src/features/shows/ShowDetailPage.tsx`，找到展示演出名称/场馆的区域,下方插入：
```tsx
{show?.artists && show.artists.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {show.artists.map((a) => (
      <Link
        key={a.id}
        to={`/artist/${a.id}`}
        className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80"
      >
        {a.avatarUrl && <img src={a.avatarUrl} className="w-5 h-5 rounded-full object-cover" />}
        <span>{a.stageName || a.name}</span>
      </Link>
    ))}
  </div>
)}
```

⚠️ 此处依赖 user 端 show 详情接口在 `Show` 对象上注入 `artists`。**ShowVO 是否包含 artists 字段需要在后端的 user ShowController/Service 单独处理。** 这里假设后端 `/api/show/{id}` 在 Stage 3a 同步改造 → 在 ShowService.getDetail() 中 `setArtists()`（Task 6 Step 6.6 的扩展已经覆盖）。**如果还没改 user 端 show 接口的 VO，本任务可先在 user 端用 useGetArtistByShowQuery 单独拉**——但简单起见，直接让 user 端 show 详情后端 VO 带 artists 即可。

- [ ] **Step 12.7：typecheck** `pnpm -C apps/user typecheck`

---

## Self-Review

| 检查项 | 任务 |
|---|---|
| Artist Entity / Mapper / XML | Task 1 |
| ShowArtist 多对多 | Task 2 |
| UserFollowArtist | Task 3 |
| ArtistService(CRUD + 关注 + count) | Task 4 |
| admin Artist CRUD API | Task 5 |
| show 表单改造(artists + reviewMode + openSaleTime) | Task 6, 11 |
| user 艺人 + 关注 API | Task 7 |
| shared Artist + Show 类型扩展 | Task 8 |
| admin artistsApi + store | Task 9 |
| admin Artists 管理页 | Task 10 |
| user 艺人列表/主页/关注 | Task 12 |

无 TBD / TODO。

**已知简化**：
- 艺人主页"演出"Tab 在 Stage 3a 暂用占位（避免新增"按艺人查演出"接口；Stage 3b 资讯 Tab 落地时一起加）
- 富文本编辑器留给 Stage 3b（资讯一起决定 Tiptap vs WangEditor-React）

---

## Stage 3a → Stage 3b 衔接

3a 完成后：
- admin 可以管理艺人
- 演出表单能关联艺人 / 设置评价模式 / 开售时间
- user 端能看艺人列表/主页/关注

3b 将完成：
- 资讯分类 + 资讯 CRUD（含富文本编辑器选型 + 集成）
- 艺人主页"资讯"Tab 接入真实数据
- "按艺人查演出"接口（顺便接入艺人主页"演出"Tab）
- ES 同步钩子（show/artist/article save/delete 时调用 SearchSyncProducer）—— 这部分可以延后到 Stage 4 一起做
