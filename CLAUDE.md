# CLAUDE.md — HabitMeter（寻栖）

## 项目简介

**寻栖** — 全国通用居住环境决策工具。帮助用户评估意向居住地周边配套和通勤效率。Next.js + 高德地图 + Tailwind CSS 构建的单页面 Web 应用。

---

## 标准文档索引

每次开始工作前，按需阅读以下文档：

| 文档 | 路径 | 用途 |
|---|---|---|
| 产品需求 | [docs/requirements.md](docs/requirements.md) | 功能清单、交互流程、页面布局 |
| 技术规范 | [docs/tech-specs.md](docs/tech-specs.md) | 技术栈、目录结构、Schema、API 设计、环境变量 |
| 设计规范 | [docs/design-specs.md](docs/design-specs.md) | 配色、字体、组件样式、响应式断点、地图样式 |
| 执行计划 | [docs/execution-plan.md](docs/execution-plan.md) | 5 阶段任务清单和完成标准 |

---

## 工作约定

### 代码风格
- 所有组件使用 TypeScript，props 必须显式定义 interface
- React 组件使用函数组件 + Hooks，不写 class 组件
- 文件名：组件用 PascalCase（`AddressInput.tsx`），工具函数用 camelCase（`amap.ts`）
- 使用 Tailwind 原子类，避免自定义 CSS（除非地图相关样式必须用内联 style）
- 不使用 `any` 类型，高德地图类型可用 `@amap/amap-jsapi-loader` 自带类型

### 目录约定
- 所有源码放在 `src/` 下
- UI 基础组件放 `src/components/ui/`
- 业务组件按功能模块分目录
- 地图相关逻辑封装在 `src/lib/amap.ts`
- API 路由遵循 Next.js App Router 约定

### 提交规范
- 每完成一个阶段的任务后提交一次
- 提交信息格式：`feat: 做了什么` 或 `fix: 修了什么`
- 不提交 `.env.local`（已在 `.gitignore` 中）

### 高德地图使用
- JS API 通过 `@amap/amap-jsapi-loader` 异步加载，不通过 `<script>` 标签
- POI 搜索和路线规划使用 AMap 内置插件，不走服务端 HTTP API
- API Key 存储在 `.env.local` 的 `NEXT_PUBLIC_AMAP_KEY` 中
- 在 AMap 控制台配置域名白名单以保护 Key

---

## 开发流程

1. **读规范** — 先确认当前阶段对应的标准文档
2. **按阶段执行** — 严格遵循 [execution-plan.md](docs/execution-plan.md) 的 5 阶段递进
3. **记录日志** — 每次会话结束时在 `dev-logs/YYYY-MM-DD.md` 记录完成和待办
4. **验证完成标准** — 对照阶段完成标准自查后再进入下一阶段

---

## 当前状态

- 项目阶段：**5 阶段全部完成 — MVP 交付**
- 上次工作：2026-05-11 完成移动端可拖拽抽屉、Tab 导航、骨架屏、触摸优化
- 下一步：配置高德 Key 域名白名单 → 生产部署
- Node.js 路径：`E:\Develop_Apps\NodeJS\node.exe`
- npm 路径：`E:\Develop_Apps\NodeJS\npm.cmd`，缓存目录 `C:\Users\X T\.npm-cache`
- 开发服务器：`npm run dev` → http://localhost:3000
