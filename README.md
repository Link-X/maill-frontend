# maill-frontend

订票系统前端，配合 [maill-backend](https://github.com/Link-X/maill-backend) 使用。

## 应用

- `apps/user` — H5 用户端（端口 5173 → user 后端 8082）
- `apps/admin` — PC 商家端（端口 5174 → admin 后端 8081）
- `packages/shared` — 共享类型 / API 请求层 / 主题 / i18n

## 开发

```bash
pnpm i
pnpm dev:user      # 用户端
pnpm dev:admin     # 商家端
```

构建：

```bash
pnpm build:user
pnpm build:admin
```

## 预览

### 用户端 H5

|              首页 · 演出列表               |               全局搜索               |              资讯列表              |
| :----------------------------------------: | :----------------------------------: | :--------------------------------: |
| ![首页演出列表](./preview/1.png) | ![全局搜索](./preview/2.png) | ![资讯列表](./preview/4.png) |
|              **个人中心**              |             **演出详情**             |             **选座**             |
| ![个人中心](./preview/5.png) | ![演出详情](./preview/6.png) | ![选座](./preview/7.png) |
|              **订单详情 · 入场二维码**              |                                      |                                    |
| ![订单详情](./preview/8.png) |                                      |                                    |

### 商家端 PC

**数据报表**

![数据报表](./preview/9.png)

**演出管理**

![演出管理](./preview/10.png)

**场地座位模板编辑**

![场地座位模板编辑](./preview/11.png)

**订单管理**

![订单管理](./preview/12.png)
