# maill-frontend

订票系统前端，配合 [maill-backend](../maill-backend) 使用。

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
