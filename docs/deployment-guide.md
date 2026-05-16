# HabitMeter / 寻栖 部署指南

## 1. 推荐结论

当前项目推荐部署到 **Vercel**。

原因：

- HabitMeter 是 Next.js App Router 项目。
- 项目包含 Next.js API Routes，Vercel 对这类全栈 Next.js 项目支持最直接。
- Vercel 可以连接 GitHub，推送 commit 后自动触发部署。
- Vercel 会自动识别 Next.js 项目，通常不需要额外配置。

不推荐把当前项目部署到 Streamlit。Streamlit 主要面向 Python 数据应用，而 HabitMeter 是 TypeScript / Next.js 应用，迁移到 Streamlit 会变成重写项目，不是部署。

Netlify 理论上也可以部署 Next.js，但当前阶段优先选择 Vercel，可以减少适配成本。

## 2. 官方依据

本指南参考了以下官方文档：

- Vercel Next.js 文档：<https://vercel.com/docs/frameworks/nextjs>
- Vercel 环境变量文档：<https://vercel.com/docs/environment-variables>
- Auth.js 部署文档：<https://authjs.dev/getting-started/deployment>
- Auth.js Core 配置文档：<https://authjs.dev/reference/core>
- Prisma Vercel 部署文档：<https://docs.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel>

关键点：

- Vercel 对 Next.js 提供零配置部署支持，并可以和 Git provider 集成。
- Vercel 环境变量需要在项目设置中配置，变更后通常需要重新部署才会生效。
- Auth.js 需要 `AUTH_SECRET`，并且在代理/托管平台环境中需要信任安全的 host header；项目已在 `src/lib/auth.ts` 设置 `trustHost: true`。
- Prisma 官方建议在 Vercel 构建时运行 `prisma generate`，避免缓存导致 Prisma Client 过期。

## 3. 当前项目部署状态

当前项目适合部署为 **展示版 Demo**。

当前公开 Demo：

```text
https://habit-meter-nu.vercel.app
```

适合线上展示的能力：

- 地址搜索。
- 地图展示。
- 3km 生活圈。
- POI 可达性分析。
- A/B 地址通勤分析。
- 居住评分和结论摘要。
- 候选清单。
- 多候选对比。
- 偏好模式排序。
- 复制对比报告。

需要谨慎说明的能力：

- 登录和收藏依赖 Prisma + SQLite，适合本地开发，不适合作为 Vercel 上的正式生产数据库方案。
- 候选清单保存在当前浏览器 localStorage，不会同步到账户。
- 路线目前以文字结果展示，还没有绘制到地图上。

## 4. 需要配置的环境变量

在 Vercel Project Settings → Environment Variables 中配置：

| 变量 | 是否必需 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_AMAP_KEY` | 必需 | 高德地图 JS API key，用于浏览器地图 SDK。 |
| `NEXT_PUBLIC_AMAP_SECRET` | 必需 | 高德 JS API 安全配置值。根据高德 JS API 用法，需要在浏览器端配置。 |
| `AMAP_WEB_KEY` | 必需 | 高德 Web Service key，只在服务端 `/api/route/*` 代理中使用。 |
| `AUTH_SECRET` | 必需 | Auth.js / NextAuth 用于 JWT 和 cookie 加密的 secret，建议至少 32 字符随机字符串。 |
| `DATABASE_URL` | 本地必需，线上谨慎 | Prisma 数据库连接。当前 schema 使用 SQLite，正式线上建议迁移到 Postgres 类数据库后再开启登录收藏。 |

本地 `.env.local` 示例：

```env
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key
NEXT_PUBLIC_AMAP_SECRET=your_amap_js_security_config
AMAP_WEB_KEY=your_amap_web_service_key
AUTH_SECRET=your_auth_secret
DATABASE_URL="file:./dev.db"
```

注意：

- 不要把真实 `.env` 或 `.env.local` 提交到 GitHub。
- `AMAP_WEB_KEY` 不能使用 `NEXT_PUBLIC_` 前缀。
- 线上配置环境变量后，重新部署才能确保新值生效。

## 5. GitHub + Vercel 部署流程

### 5.1 准备 GitHub 仓库

1. 确认 `.env.local`、`prisma/dev.db`、`.next/`、`node_modules/` 未被提交。
2. 确认 `.env.example` 存在，且只包含占位值。
3. 推送当前仓库到 GitHub。

### 5.2 导入 Vercel

1. 打开 Vercel Dashboard。
2. 选择 Add New Project。
3. 从 GitHub 导入 HabitMeter 仓库。
4. Framework Preset 选择 Next.js，通常会自动识别。
5. Build Command 保持默认 `npm run build`。
6. Install Command 保持默认 `npm install`。
7. Output Directory 保持默认。

### 5.3 配置环境变量

在导入项目时或导入后进入 Settings → Environment Variables，添加第 4 节列出的变量。

推荐至少先配置 Production 环境。如果需要 Preview 部署也完整可用，再同步配置 Preview 环境变量。

### 5.4 部署与验证

部署完成后检查：

1. 首页可以打开。
2. 地图可以加载。
3. 地址搜索有结果。
4. 输入地址 A 后，3km 生活圈和 POI 可以显示。
5. 输入地址 B 后，通勤结果可以显示。
6. 候选清单可以添加、删除、刷新后仍存在于当前浏览器。
7. 切换偏好模式后，对比排序会更新。
8. `/api/auth/session` 不报 `UntrustedHost`。

## 6. 本地开发与线上部署差异

| 项目 | 本地开发 | Vercel 展示版 |
| --- | --- | --- |
| 地图与 POI | 依赖本地 `.env.local` | 依赖 Vercel 环境变量 |
| 通勤路线 | `/api/route/*` 代理 | Vercel Serverless Function |
| 候选清单 | localStorage | localStorage |
| 登录收藏 | SQLite 本地文件 | 不建议作为正式线上能力 |
| 数据库 | `prisma/dev.db` | 建议未来迁移 Postgres |
| 构建 | `npm run build` | Git push 后自动构建 |

## 7. SQLite 的限制

当前 Prisma schema 使用 SQLite：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

SQLite 很适合本地开发和原型验证，但不适合作为 Vercel Serverless 多实例环境下的正式数据库：

- 本地 `prisma/dev.db` 不能提交到公开仓库。
- Serverless 环境的文件系统和实例生命周期不适合依赖本地数据库文件持久化。
- 多实例环境下，文件型数据库不适合共享写入。

因此，当前 Showcase 阶段建议：

- 核心演示重点放在地图、评分、通勤、候选清单、多候选对比。
- 登录收藏功能可以保留代码，但不要把它包装成正式线上生产能力。
- P3 再迁移到 Postgres / Supabase / Neon / Prisma Postgres。

## 8. P3 数据库迁移建议

如果后续要把 HabitMeter 做成正式线上产品，建议：

1. 将 `prisma/schema.prisma` 的 datasource 从 SQLite 改为 PostgreSQL。
2. 选择一个托管数据库：
   - Supabase Postgres
   - Neon
   - Prisma Postgres
   - Railway / Render Postgres
3. 将 `DATABASE_URL` 配置到 Vercel。
4. 使用 Prisma migrate 管理 schema：

```bash
npx prisma migrate dev
npx prisma migrate deploy
```

5. 将候选清单从 localStorage 同步到账户。
6. 为 Preview 和 Production 使用不同数据库，避免预览部署影响生产数据。

## 9. 本轮项目配置改动

为了提高 Vercel 构建稳定性，`package.json` 增加了：

```json
"postinstall": "prisma generate"
```

这样 Vercel 安装依赖后会重新生成 Prisma Client，降低因为缓存导致 Prisma Client 过期的风险。

## 10. 部署前检查清单

- [ ] GitHub 仓库不包含真实 `.env` 文件。
- [ ] GitHub 仓库不包含 `prisma/dev.db`。
- [ ] Vercel 已配置所有必需环境变量。
- [ ] AMap key 已设置域名白名单。
- [ ] `npm run build` 本地通过。
- [ ] README 中的运行方式准确。
- [ ] 登录收藏被描述为本地/原型能力，而不是完整生产能力。
- [ ] 候选 localStorage 限制已在文档中说明。

## 11. 推荐展示策略

上线后，推荐把 Vercel 链接作为公开 Demo，但演示重点放在无需账号也能完成的主链路：

1. 输入候选居住地。
2. 查看生活圈和 POI 可达性。
3. 输入通勤目的地。
4. 查看评分和通勤推荐。
5. 加入候选。
6. 比较多个候选。
7. 切换偏好模式。
8. 复制对比报告。

这样即使登录收藏因为数据库方案暂未生产化，也不会影响产品核心展示。

## 12. 部署记录

### v1.3.1

- 平台：Vercel
- 仓库：GitHub `Aunknownrubbish/HabitMeter`
- 分支：`main`
- 线上地址：<https://habit-meter-nu.vercel.app>
- 状态：已完成首次公开 Demo 部署。
