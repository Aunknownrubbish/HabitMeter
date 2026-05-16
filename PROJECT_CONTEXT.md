# 项目目标

**寻栖** — 全国通用居住环境决策工具。帮助租房/购房者直观评估意向居住地周边的配套设施和生活便利度，同时量化通勤成本。

核心交互流程：输入意向居住地（地址 A）→ 地图定位 + 3km 生活圈 POI 分析 → 输入上班地址（地址 B）→ 四种通勤方案（公交/驾车/步行/骑行）自动计算。登录后可收藏地址。

# 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 16.x |
| 语言 | TypeScript | 6.x |
| 样式 | Tailwind CSS | 4.x |
| 地图 | 高德地图 JS API | 2.0 |
| 地图加载 | @amap/amap-jsapi-loader | 1.x |
| 图标 | Lucide React | 1.x |
| ORM | Prisma | 5.x |
| 数据库 | SQLite (dev.db) | — |
| 认证 | NextAuth.js | 5.0.0-beta |
| 密码哈希 | bcryptjs | 3.x |

# 前端结构

```
src/
├── app/
│   ├── layout.tsx                    # 根布局 (metadata, Providers wrapper)
│   ├── page.tsx                      # 主页面 (状态中心, 桌面/移动端布局)
│   ├── globals.css                   # Tailwind 主题变量 + AMap 容器修复
│   └── api/
│       ├── auth/[...nextauth]/       # NextAuth 认证端点
│       ├── auth/register/            # 注册端点 (POST)
│       ├── locations/                # 收藏 CRUD (GET/POST + [id]/DELETE)
│       └── route/                    # 高德路线代理 (driving/transit/walking/riding)
├── components/
│   ├── Providers.tsx                 # SessionProvider 包裹
│   ├── layout/
│   │   ├── Sidebar.tsx               # 桌面端 400px 侧边栏
│   │   └── MobileDrawer.tsx          # 移动端可拖拽抽屉 (3档吸附 + Tab 导航)
│   ├── map/
│   │   └── MapContainer.tsx          # 高德地图核心 (初始化/标记/圆圈/POI搜索/路线)
│   ├── search/
│   │   ├── AddressInput.tsx          # 地址自动补全输入框 (AMap.AutoComplete)
│   │   └── POIToggles.tsx            # POI 分类开关 (至少保持 1 个开启)
│   ├── commute/
│   │   └── CommutePanel.tsx          # 通勤结果展示 (驾车/公交/步行/骑行)
│   ├── auth/
│   │   ├── AuthPanel.tsx             # 登录/注册表单 + 已登录状态
│   │   └── SavedLocations.tsx        # 收藏地址列表 (收藏/删除/切换)
│   └── ui/
│       ├── Card.tsx                  # 通用卡片
│       ├── Button.tsx                # 通用按钮 (primary/secondary, sm/md)
│       ├── Input.tsx                 # 通用输入框
│       └── Toggle.tsx                # 开关组件
├── lib/
│   ├── amap.ts                       # 高德地图异步加载 + 密钥配置
│   ├── auth.ts                       # NextAuth 配置 (Credentials provider, JWT)
│   ├── db.ts                         # Prisma 单例客户端
│   └── env.ts                        # 环境变量集中校验 (服务端+客户端)
└── types/
    ├── index.ts                      # POIItem, POICategory, CommuteResult 等类型
    └── next-auth.d.ts                # NextAuth 模块增强 (Session.user.id)
```

组件树（自上而下）:
- `RootLayout` → `Providers` (SessionProvider) → `Home`
  - `Sidebar` (桌面) / `MobileDrawer` (移动端)
    - `AddressInput` (A/B)
    - `POIToggles`
    - `CommutePanel`
    - `AuthPanel`
    - `SavedLocations`
  - `MapContainer` (全屏地图)

# 后端结构

所有后端逻辑在 Next.js API Routes 中，无独立服务端。

**数据库**: SQLite (`prisma/dev.db`)，通过 Prisma ORM 访问。

**Schema** (2 个模型):
- `User` — id, email (unique), name?, password (bcrypt), locations[], createdAt
- `SavedLocation` — id, userId (FK→User, cascade), name, address, lat, lng, createdAt

**认证流程**: NextAuth Credentials Provider → bcrypt 密码校验 → JWT session → `session.user.id` 携带 userId（通过 `next-auth.d.ts` 模块增强类型安全）。

# API

| 端点 | 方法 | 说明 | 认证 |
|---|---|---|---|
| `/api/auth/*` | GET/POST | NextAuth 自动处理 (login/logout/session) | — |
| `/api/auth/register` | POST | 注册新用户 (email + password + name?) | — |
| `/api/locations` | GET | 获取当前用户收藏列表 | 需要 |
| `/api/locations` | POST | 添加收藏 (name, address, lat, lng) | 需要 |
| `/api/locations/[id]` | DELETE | 删除指定收藏 (校验 userId 归属) | 需要 |
| `/api/route/driving` | GET | 高德驾车路线代理 (origin, destination) | — |
| `/api/route/transit` | GET | 高德公交路线代理 (origin, destination, city) | — |
| `/api/route/walking` | GET | 高德步行路线代理 (origin, destination) | — |
| `/api/route/riding` | GET | 高德骑行路线代理 (origin, destination) | — |

> 路线请求已从浏览器直连迁移至 `/api/route/*` 服务端代理。`AMAP_WEB_KEY` 仅存在于服务端，不暴露到客户端。

# 当前功能

- [x] 地址 A/B 双搜索（全国范围，AMap.AutoComplete 自动补全）
- [x] 高德地图渲染 + 地址 A 中心定位 + 3km 蓝色生活圈
- [x] 5 类 POI 搜索（便利店/地铁站/公交站/公园/医院），彩色圆点标记（仅 ≤3000m）
- [x] POI 可达性评价（数量 + 最近距离 + good/average/weak/none 评级）
- [x] 通勤分析（驾车/公交/步行/骑行 4 种方案，公交含换乘分段详情）
- [x] 通勤推荐（优先公交 > 驾车 > 骑行 > 步行，含警告提示）
- [x] 居住评分模型 v1（0-100 分，5 维度：通勤/交通/生活/医疗/休闲）
- [x] 结论摘要卡（总分 + 等级 + 分数条 + 优劣势）
- [x] 用户注册/登录（邮箱+密码，bcrypt 哈希，JWT session）
- [x] 地址收藏（登录后可收藏/备注/删除，含评分快照预览）
- [x] 桌面端 400px 侧边栏布局（搜索 → 结论 → 通勤 → 配套 → 账号 → 收藏）
- [x] 移动端可拖拽底部抽屉（peek/half/full 三档吸附）
- [x] 移动端 Tab 导航（搜索/结论/通勤/配套/收藏 5 个标签）
- [x] 骨架屏加载态 + 地图/路线/收藏错误状态全覆盖

# 已知问题

1. **NEXT_PUBLIC_AMAP_SECRET 前端暴露** — `.env.local` 中 `NEXT_PUBLIC_AMAP_SECRET` 以 `NEXT_PUBLIC_` 前缀命名，会打包到客户端 JS。但 AMap JS API 2.0 的 `_AMapSecurityConfig.securityJsCode` 必须在浏览器端设置，这是高德官方要求的用法。通过域名白名单限制 Key 使用范围。
2. **SQLite 并发限制** — SQLite 在 Vercel/多实例部署时不可用，迁移到 PostgreSQL 需要改 Prisma provider。
3. **路线在地图上不可见** — 当前路线结果仅以文字展示在 CommutePanel 中，地图上不绘制路线 polyline。路线可视化留待 P2。

# P0 修复记录 (2026-05-16)

以下问题已在 P0 安全加固中修复：

| # | 问题 | 状态 |
|---|---|---|
| P0-1 | TypeScript build 失败 + Session 类型不兼容 | fixed |
| P0-2 | AMAP_WEB_KEY 硬编码前端 + 直连高德 REST API | fixed — 已迁移至 /api/route/* 代理 |
| P0-3 | process.env.*! 分散无校验 | fixed — 新增 src/lib/env.ts 集中管理 |
| P0-4 | fetch .catch(() => {}) 静默吞错 + 无限 loading | fixed — 新增 commuteError / mapError / noResults 等错误状态 |
| P0-5 | POI 搜索用 bounds 粗筛可能包含 >3000m 的点 | fixed — 精确距离二次过滤 |
| P0-6 | MapContainer 未使用 type import | fixed — 清理 dead code |

# P1 功能增强 (2026-05-16)

| # | 功能 | 说明 |
|---|---|---|
| P1-1 | 居住评分模型 | `src/lib/living-score.ts` — 0-100 分，通勤/交通/生活/医疗/休闲 5 维度 |
| P1-2 | 结论摘要卡 | `LivingSummaryCard` — 总分 + 等级 + 分数条 + strengths/weaknesses |
| P1-3 | POI 可达性评价 | `src/lib/poi-analysis.ts` + `POISummaryPanel` — 数量 + 最近距离 + 评级 |
| P1-4 | 通勤推荐 | `src/lib/commute-recommendation.ts` — 优先级推荐 + 警告横幅 |
| P1-5 | 信息架构调整 | Sidebar 重排 + MobileDrawer 新增结论 tab + 初始引导 |
| P1-6 | 收藏增强 | 评分快照预览 + 删除确认 + 名称引导 |

所有 P1 功能均已通过 `npm run build` 验证。

# 数据流

```
用户输入地址 A
  → AddressInput (AMap.AutoComplete 搜索)
  → Home state: setAddressA({ lat, lng, name })
  → MapContainer: 地图定位 + 绘制 A 标记 + 3km 圆
  → MapContainer: AMap.PlaceSearch 搜索 5 类 POI (bounds 搜索)
  → Home state: setPOIResults(Record<POICategory, POIItem[]>)
  → Sidebar/MobileDrawer: 统计卡片 + POI 列表

用户输入地址 B
  → AddressInput (AMap.AutoComplete 搜索)
  → Home state: setAddressB({ lat, lng, name })
  → MapContainer: 绘制 B 标记 + fitView
  → MapContainer: 4 路并发 fetch /api/route/* 代理 (driving/transit/walking/riding)
  → 4 路全部失败时触发 onCommuteError，停止 loading 并显示错误
  → Sidebar/MobileDrawer: CommutePanel 展示

用户登录
  → AuthPanel: signIn("credentials", { email, password })
  → NextAuth: Credentials provider → JWT
  → SessionProvider 广播 session 对象

用户收藏地址
  → SavedLocations: POST /api/locations (name, address, lat, lng)
  → auth() 校验 → db.savedLocation.create → 返回新记录
  → GET /api/locations 刷新列表

用户选择已收藏地址
  → SavedLocations.onSelect({ lat, lng, name })
  → Home: setAddressA(loc) → MapContainer 重新定位 + POI 搜索
```

# AI 注意事项

- 高德地图 JS API 2.0 必须通过 `@amap/amap-jsapi-loader` 异步加载，不可用 `<script>` 标签。
- `_AMapSecurityConfig` 必须在加载 AMap 之前设置到 `window` 上 — `src/lib/amap.ts:10-12` 已处理。
- 项目已用 Git 管理，当前分支 `main`，最新 tag `v1.1.0`。
- 项目处于 P1 居住决策增强完成状态（5 阶段 + P0 + P1-1~P1-6），可运行但未部署到生产环境。
- 开发服务器命令：`npm run dev` → http://localhost:3000。
- 所有地图交互逻辑集中在 `MapContainer.tsx`，修改时要特别注意副作用和 ref 管理。
- 桌面/移动端共享相同的 props 接口 — 修改 Sidebar props 时需同步 MobileDrawer。
- 环境变量通过 `src/lib/env.ts` 集中管理，禁止在业务代码中直接使用 `process.env.*!`。
- Prisma migrations 需要手动运行：`npx prisma migrate dev`。
