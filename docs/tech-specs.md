# 技术规范 — HabitMeter（寻栖）

## 1. 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 16.x |
| 语言 | TypeScript | 6.x |
| 样式 | Tailwind CSS | 4.x |
| 地图 | 高德地图 JS API | 2.0 |
| 地图加载 | @amap/amap-jsapi-loader | 1.x |
| 图标 | Lucide React | 1.x |
| ORM | Prisma | 5.x |
| 数据库 | SQLite | — |
| 认证 | NextAuth.js | 5.0.0-beta |
| 环境变量 | src/lib/env.ts | — |
| 包管理 | npm | — |

## 2. 目录结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页面 (状态中心)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts    # NextAuth 认证端点
│   │   │   └── register/
│   │   │       └── route.ts    # 注册端点
│   │   ├── locations/
│   │   │   ├── route.ts        # 收藏 CRUD (GET/POST)
│   │   │   └── [id]/
│   │   │       └── route.ts    # 删除收藏 (DELETE)
│   │   └── route/
│   │       ├── driving/route.ts   # 驾车路线代理
│   │       ├── transit/route.ts   # 公交路线代理
│   │       ├── walking/route.ts   # 步行路线代理
│   │       └── riding/route.ts    # 骑行路线代理
│   └── globals.css
├── components/
│   ├── Providers.tsx           # SessionProvider
│   ├── layout/
│   │   ├── Sidebar.tsx         # 桌面侧边栏
│   │   └── MobileDrawer.tsx    # 移动端抽屉
│   ├── map/
│   │   └── MapContainer.tsx    # 地图核心 (初始化/标记/圆/POI/路线)
│   ├── search/
│   │   ├── AddressInput.tsx    # 地址输入框
│   │   └── POIToggles.tsx     # POI 勾选开关
│   ├── commute/
│   │   └── CommutePanel.tsx    # 通勤结果展示
│   ├── auth/
│   │   ├── AuthPanel.tsx       # 登录/注册表单
│   │   └── SavedLocations.tsx  # 收藏地址列表
│   └── ui/
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Button.tsx
│       └── Toggle.tsx
├── lib/
│   ├── amap.ts                 # 高德地图加载
│   ├── auth.ts                 # NextAuth 配置
│   ├── db.ts                   # Prisma 客户端
│   └── env.ts                  # 环境变量集中校验
└── types/
    ├── index.ts                # POI/Commute 类型
    └── next-auth.d.ts          # NextAuth 模块增强
prisma/
└── schema.prisma
```

## 3. 数据库 Schema

```prisma
model User {
  id        String          @id @default(uuid())
  email     String          @unique
  name      String?
  password  String          // hashed
  locations SavedLocation[]
  createdAt DateTime        @default(now())
}

model SavedLocation {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String               // 用户自定义名称
  address   String               // 完整地址
  lat       Float
  lng       Float
  createdAt DateTime @default(now())
}
```

## 4. API 设计

| 端点 | 方法 | 说明 | 认证 |
|---|---|---|---|
| `/api/auth/*` | GET/POST | NextAuth 自动处理 (login/logout/session) | — |
| `/api/auth/register` | POST | 注册新用户 | — |
| `/api/locations` | GET | 获取用户收藏列表 | 需要 |
| `/api/locations` | POST | 添加收藏 | 需要 |
| `/api/locations/[id]` | DELETE | 删除指定收藏 (校验 userId) | 需要 |
| `/api/route/driving` | GET | 驾车路线代理 (origin, destination) | — |
| `/api/route/transit` | GET | 公交路线代理 (origin, destination, city) | — |
| `/api/route/walking` | GET | 步行路线代理 (origin, destination) | — |
| `/api/route/riding` | GET | 骑行路线代理 (origin, destination) | — |

## 5. 高德地图 API 使用

### JS API Key（前端）
- 用于：地图渲染、POI 搜索、地址自动补全
- 在 AMap 控制台启用：地图 JS API
- 通过 `@amap/amap-jsapi-loader` 加载
- 配置通过 `src/lib/env.ts` 的 `getClientAmapConfig()` 读取

### Web 服务 Key（服务端）
- 用于：路线规划 (driving/transit/walking/riding)
- 通过 `/api/route/*` 代理，Key 不暴露到客户端
- 配置通过 `src/lib/env.ts` 的 `getAmapWebKey()` 读取

## 6. 环境变量

```bash
# .env.local
NEXT_PUBLIC_AMAP_KEY=your_amap_js_api_key       # 前端地图 JS API
NEXT_PUBLIC_AMAP_SECRET=your_amap_js_secret     # 前端安全密钥
AMAP_WEB_KEY=your_amap_web_service_key          # 服务端 Web 服务 Key
AUTH_SECRET=your_nextauth_secret
DATABASE_URL="file:./dev.db"
```

所有环境变量通过 `src/lib/env.ts` 集中校验和读取。

## 7. 安全注意事项

- 高德 JS API Key (`NEXT_PUBLIC_AMAP_KEY`) 在前端暴露是正常的，需在控制台设置域名白名单
- `AMAP_WEB_KEY` 仅存在于服务端，绝不暴露到前端
- NextAuth Secret 必须设为强随机字符串
- 用户密码使用 bcrypt 哈希存储
- API 路由做好输入校验和认证检查
- 收藏 API 校验 userId 归属，防止越权访问
- `process.env.*!` 非空断言已全局替换为 `src/lib/env.ts` 集中校验
