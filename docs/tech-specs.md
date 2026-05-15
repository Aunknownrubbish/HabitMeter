# 技术规范 — HabitMeter（寻栖）

## 1. 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 15.x |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | 4.x |
| 地图 | 高德地图 JS API | 2.0 |
| 地图加载 | @amap/amap-jsapi-loader | latest |
| 图标 | Lucide React | latest |
| ORM | Prisma | 6.x |
| 数据库 | SQLite | — |
| 认证 | NextAuth.js | 5.x (next-auth@beta) |
| 包管理 | npm | — |

## 2. 目录结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页面
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── locations/
│   │       └── route.ts    # 收藏 CRUD
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # 桌面侧边栏
│   │   └── MobileDrawer.tsx # 移动端抽屉
│   ├── map/
│   │   ├── MapContainer.tsx # 地图容器
│   │   ├── SearchCircle.tsx # 3km 圆
│   │   └── POIMarker.tsx   # POI 标记
│   ├── search/
│   │   ├── AddressInput.tsx # 地址输入框
│   │   └── POIToggles.tsx  # POI 勾选
│   ├── stats/
│   │   ├── StatsPanel.tsx  # 统计面板
│   │   └── POIList.tsx     # POI 列表
│   ├── commute/
│   │   └── CommutePanel.tsx
│   ├── auth/
│   │   └── LoginButton.tsx
│   └── ui/
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Button.tsx
│       └── Toggle.tsx
├── lib/
│   ├── amap.ts             # 高德地图工具函数
│   ├── auth.ts             # NextAuth 配置
│   └── db.ts               # Prisma 客户端
└── types/
    └── index.ts            # 公共类型定义
prisma/
├── schema.prisma
└── migrations/
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
| `/api/auth/*` | — | NextAuth 自动处理 | — |
| `/api/locations` | GET | 获取用户收藏列表 | 需要 |
| `/api/locations` | POST | 添加收藏 | 需要 |
| `/api/locations/[id]` | DELETE | 删除收藏 | 需要 |

## 5. 高德地图 API 使用

### JS API Key（前端）
- 用于：地图渲染、POI 搜索、路线规划、自动补全
- 在 AMap 控制台启用：地图 JS API、Web 服务 API
- 通过 `@amap/amap-jsapi-loader` 加载

### 关键 API 调用
```typescript
// POI 搜索
const placeSearch = new AMap.PlaceSearch({
  type: '便利店|地铁站|公交站|公园|医院',
  pageSize: 50,
  radius: 3000,
});

// 路线规划
const driving = new AMap.DrivingRoute({ policy: AMap.DrivingPolicy.LEAST_TIME });
const transfer = new AMap.TransferRoute({ policy: AMap.TransferPolicy.LEAST_TIME });
```

## 6. 环境变量

```bash
# .env.local
AMAP_KEY=your_amap_js_api_key
AMAP_WEB_KEY=your_amap_web_service_key  # 可选，服务端用
AUTH_SECRET=your_nextauth_secret
DATABASE_URL="file:./dev.db"
```

## 7. 安全注意事项

- 高德 JS API Key 在前端暴露是正常的，需在控制台设置域名白名单
- Web 服务 Key（如有服务端调用）绝不暴露到前端
- NextAuth Secret 必须设为强随机字符串
- 用户密码使用 bcrypt 哈希存储
- API 路由做好输入校验和认证检查
- 收藏 API 校验 userId 归属，防止越权访问
