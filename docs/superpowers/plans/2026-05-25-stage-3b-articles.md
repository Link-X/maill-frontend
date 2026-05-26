# Stage 3b：资讯 + 富文本 Implementation Plan

**Goal：** 落地"资讯分类 + 资讯（含富文本）+ user 端浏览 + 艺人主页资讯 Tab"。

**Architecture：** 后端 core 模块 ArticleCategory + Article Entity / Mapper / Service，admin/user 双端 Controller。前端 admin 用 `@wangeditor/editor-for-react` 富文本编辑器（中文友好 + 自带图片上传配 MinIO），user 端只读渲染。

---

## 前置约束

1. **跳过 git commit / 单元测试 / 端到端验收**（按用户偏好）
2. **富文本编辑器选型**：`@wangeditor/editor-for-react`，理由：中文友好 + 文档全 + 图片上传接 MinIO 简单
3. **XSS 防护**：admin 入库前不过滤（信任 admin），user 端渲染时用 `DOMPurify` 二次防护
4. 数据库 `article_category` / `article` 已在 Stage 1 schema-v2.sql 创建
5. ES 同步钩子留给 Stage 4

---

## Task 列表（13 个）

### 后端
- **T1**: ArticleCategory Entity + Mapper + XML
- **T2**: ArticleCategoryService + ErrorCode + admin CategoryController
- **T3**: user 端 ArticleCategoryController（只读）
- **T4**: Article Entity + Mapper + XML
- **T5**: ArticleService + ErrorCode + admin ArticleController + DTOs
- **T6**: user 端 ArticleController（list / detail + view_count++ / by-artist）

### 前端
- **T7**: shared types + i18n 资源
- **T8**: admin articleCategoriesApi + articlesApi + store + UploadDir 加 `'articles'`
- **T9**: admin ArticleCategoriesPage（简单 CRUD）+ 路由 + 菜单
- **T10**: 安装 wangeditor 包 + admin ArticlesPage + ArticleEditPage（含富文本）+ 路由 + 菜单 + i18n
- **T11**: user articlesApi + ArticlesListPage（含分类 Tab）+ ArticleDetailPage（含 DOMPurify）+ 路由
- **T12**: user ArtistDetailPage 资讯 Tab 接入（用 `/api/article/by-artist/:id`）
- **T13**: user HomePage 加"最新资讯"运营位（可选,简单 Card 列表）

---

## 关键代码片段

### T1: ArticleCategory.java
```java
package com.ticket.core.domain.entity;
// ... @Schema, @Data
public class ArticleCategory {
    private Long id;
    private String name;
    private Integer sort;
    private Integer status; // 0=下架 1=上架
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
```

ArticleCategoryMapper 方法:
- insert/update/deleteById/selectById/selectByName
- selectByCondition(status)
- selectEnabled()（user 端用）

### T4: Article.java
```java
public class Article {
    private Long id;
    private Long categoryId;
    private String title;
    private String summary;
    private String content;       // 富文本 HTML
    private String coverUrl;
    private Long artistId;        // nullable
    private String author;
    private Integer viewCount;
    private Integer status;       // 0=草稿 1=已发布 2=已下架
    private LocalDateTime publishedAt;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    // VO 注入:
    private ArticleCategory category;
    private Artist artist;
}
```

ArticleMapper 方法:
- insert/update/deleteById/selectById
- updateStatus(id, status, publishedAt, updateTime) - 发布时同时设 publishedAt
- incrViewCount(id)
- selectByCondition(status, categoryId, keyword)（admin 列表）
- selectPublished(categoryId, page=offset, size=limit)（user 列表，仅 status=1 按 publishedAt DESC）
- countPublished(categoryId)
- selectByArtistId(artistId, page, size)（艺人主页用）

### T2: ErrorCode 扩展
```java
ARTIST_NAME_DUPLICATED(1031, "艺人名已存在"),
ARTICLE_CATEGORY_NOT_FOUND(1040, "资讯分类不存在"),
ARTICLE_CATEGORY_NAME_DUPLICATED(1041, "资讯分类名已存在"),
ARTICLE_CATEGORY_IN_USE(1042, "资讯分类已被资讯引用,无法删除"),
ARTICLE_NOT_FOUND(1050, "资讯不存在");
```

### T5: admin ArticleController endpoints
- POST /list (body: { status?, categoryId?, keyword?, page?, size? }) → 分页
- GET /{id}
- POST /save (id 为空=新增,否则=更新 - status=0 默认草稿)
- POST /publish { id } → 设 status=1, publishedAt=now
- POST /offline { id } → 设 status=2
- DELETE /{id}

### T6: user ArticleController endpoints
- GET /list?categoryId=&page=&size= → 仅 status=1 + 分页
- GET /{id} → 取详情 + viewCount++（异步）
- GET /category/list → 启用的分类
- GET /by-artist/{artistId}

### T10: @wangeditor/editor-for-react 集成

安装：
```bash
cd /Users/xdb/Desktop/test/maill-frontend && pnpm -C apps/admin add @wangeditor/editor @wangeditor/editor-for-react
```

ArticleEditPage 关键代码：
```tsx
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { useUploadImageMutation } from '@/features/upload/uploadApi';

// 内部状态
const [editor, setEditor] = useState<IDomEditor | null>(null);
const [html, setHtml] = useState('');
const [uploadImage] = useUploadImageMutation();

// editor 配置
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入资讯内容...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        try {
          const res = await uploadImage({ file, dir: 'articles' }).unwrap();
          insertFn(res.url, file.name, '');
        } catch (e) {
          // ignore
        }
      },
    },
  },
};

// 卸载时销毁
useEffect(() => () => { if (editor) editor.destroy(); }, [editor]);

// JSX
<div className="border rounded">
  <Toolbar editor={editor} mode="default" />
  <Editor
    defaultConfig={editorConfig}
    value={html}
    onCreated={setEditor}
    onChange={(e) => setHtml(e.getHtml())}
    mode="default"
    style={{ height: 500 }}
  />
</div>
```

### T11: user ArticleDetailPage XSS 防护

```bash
pnpm -C apps/user add dompurify @types/dompurify
```

```tsx
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(article.content || '');
<div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: clean }} />
```

### T7: shared types

```typescript
// article-category.ts
export interface ArticleCategory {
  id: number;
  name: string;
  sort?: number;
  status?: 0 | 1;
  createTime?: string;
  updateTime?: string;
}

// article.ts
import type { ArticleCategory } from './article-category';
import type { Artist } from './artist';

export interface Article {
  id: number;
  categoryId: number;
  title: string;
  summary?: string;
  content: string;
  coverUrl?: string;
  artistId?: number;
  author?: string;
  viewCount?: number;
  /** 0=草稿 1=已发布 2=已下架 */
  status?: 0 | 1 | 2;
  publishedAt?: string;
  createTime?: string;
  updateTime?: string;
  category?: ArticleCategory;
  artist?: Artist;
}

export const ARTICLE_STATUS = { DRAFT: 0, PUBLISHED: 1, OFFLINE: 2 } as const;
```

---

## i18n 命名空间

新增 `article` 命名空间（admin + user 共用），zh-CN/en-US 各一份，覆盖：
- `page.title/subtitle/addBtn`
- `table.title/category/author/status/viewCount/publishedAt/actions`
- `form.titleNew/titleEdit/title/summary/content/cover/artist/category/author/status/...`
- `status.draft/published/offline`
- `action.publish/offline/delete/...`

类似地 `articleCategory` 命名空间。

详细 JSON 内容由 implementer 按 Stage 2/3a 同等粒度生成。

---

## 落地顺序

按 T1-T13 顺序执行。每个 task 一个 implementer subagent。

完成后 Stage 3 全部落地，进入 Stage 4。
