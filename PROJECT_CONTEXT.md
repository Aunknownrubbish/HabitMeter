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
│   └── db.ts                         # Prisma 单例客户端
└── types/
    └── index.ts                      # POIItem, POICategory, CommuteResult 等类型
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

**认证流程**: NextAuth Credentials Provider → bcrypt 密码校验 → JWT session → `(session.user as any).id` 携带 userId。

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

> 注意：实际路线请求在 `MapContainer.tsx` 中直接从浏览器发起（使用 `AMAP_WEB_KEY`），`/api/route/*` 代理端点存在但未被前端调用。Proxy 路线可改写为服务端代理以保护 Web 服务 Key。

# 当前功能

- [x] 地址 A/B 双搜索（全国范围，AMap.AutoComplete 自动补全）
- [x] 高德地图渲染 + 地址 A 中心定位 + 3km 蓝色生活圈
- [x] 5 类 POI 搜索（便利店/地铁站/公交站/公园/医院），彩色圆点标记
- [x] POI 统计面板（各类数量卡片 + 可展开列表，按距离排序）
- [x] 通勤分析（驾车/公交/步行/骑行 4 种方案，公交含换乘分段详情）
- [x] 用户注册/登录（邮箱+密码，bcrypt 哈希，JWT session）
- [x] 地址收藏（登录后可收藏、备注、切换查看、删除）
- [x] 桌面端 400px 侧边栏布局
- [x] 移动端可拖拽底部抽屉（peek/half/full 三档吸附）
- [x] 移动端 Tab 导航（搜索/配套/通勤/收藏 4 个标签）
- [x] 骨架屏加载态（POI 加载中、通勤计算中）
- [x] 移动端操作栏（显示当前地址 + POI 数量 + 展开/关闭按钮）

# 已知问题

1. **AMAP_WEB_KEY 前端暴露** — `MapContainer.tsx` 中硬编码了 Web 服务 Key (`78cd0cbcc2266dd32961ecf33894fa0e`)，路线请求从浏览器直接发往高德 HTTP API。应改为走 `/api/route/*` 服务端代理，保护 Web Key。
2. **NEXT_PUBLIC_AMAP_SECRET 前端暴露** — `.env.local` 中 `NEXT_PUBLIC_AMAP_SECRET` 以 `NEXT_PUBLIC_` 前缀命名，会打包到客户端 JS。JS API 安全密钥应通过服务端注入或删除此前缀。
3. **`(session.user as any).id` 类型断言** — 多处使用 `as any` 访问 `session.user.id`。应扩展 next-auth 的 Session 类型声明。
4. **MapContainer 中未使用的函数** — `getTrafficLabel`, `parseTransitSegments`, `drawRouteOnMap`, `safeBtoa`, `routeLinesRef` 定义但未被调用/引用（dead code）。
5. **`/api/route/*` 未被使用** — 前端直接请求高德 API，这些代理路由存在但无调用方。可作为迁移目标。
6. **SQLite 并发限制** — SQLite 在 Vercel/多实例部署时不可用，迁移到 PostgreSQL 需要改 Prisma provider。
7. **无环境变量校验** — `process.env.*!` 使用非空断言，运行时如果缺少环境变量会直接抛出错误，缺少友好的 fallback。

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
  → MapContainer: 4 路并发 fetch 高德 REST API (driving/transit/walking/riding)
  → Home state: handleCommuteResult 增量合并
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
- 此项目 **不是** git 仓库（初始状态为无版本控制），需要 `git init` + 初始 commit。
- 项目处于 MVP 完成状态（5 阶段全部完成），可运行但未部署到生产环境。
- 开发服务器命令：`npm run dev` → http://localhost:3000。
- Node.js 环境路径：`E:\Develop_Apps\NodeJS\node.exe`。
- 所有地图交互逻辑集中在 `MapContainer.tsx`，这是一个 400+ 行的 `"use client"` 大组件，修改时要特别注意副作用和 ref 管理。
- 桌面/移动端共享相同的 props 接口 — 修改 Sidebar props 时需同步 MobileDrawer。
- Prisma migrations 需要手动运行：`npx prisma migrate dev`。
