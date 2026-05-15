# UI/UX 设计规范 — HabitMeter（寻栖）

## 1. 配色方案

| 用途 | 色值 | Tailwind 类 |
|---|---|---|
| 页面底色 | `#F0F7FF` | `bg-blue-50` |
| 主色调 | `#3B82F6` | `blue-500` |
| 主色调浅 | `#EFF6FF` | `blue-50` |
| 主色调深 | `#2563EB` | `blue-600` |
| 文字主色 | `#1E293B` | `slate-800` |
| 文字次要 | `#64748B` | `slate-500` |
| 卡片背景 | `#FFFFFF` | `white` |
| 卡片边框 | `#E2E8F0` | `slate-200` |
| 成功/地铁 | `#22C55E` | `green-500` |
| 警告/公交 | `#F59E0B` | `amber-500` |
| 信息/便利店 | `#3B82F6` | `blue-500` |
| 公园 | `#10B981` | `emerald-500` |
| 医院 | `#EF4444` | `red-500` |

## 2. 字体与排版

- 字体：系统默认字体栈（`system-ui, -apple-system, sans-serif`）
- 标题：`font-semibold`，`text-lg`（18px）或 `text-xl`（20px）
- 正文：`text-sm`（14px）或 `text-base`（16px）
- 辅助文字：`text-xs`（12px），`text-slate-500`

## 3. 组件规范

### 卡片
```css
/* Tailwind */
rounded-xl        /* 12px 圆角 */
shadow-sm         /* 微阴影 */
border border-slate-200
bg-white
p-4               /* 16px 内边距 */
```

### 输入框
```css
rounded-lg        /* 8px 圆角 */
border border-slate-300
bg-white
px-4 py-2.5
focus:border-blue-500 focus:ring-1 focus:ring-blue-500
placeholder:text-slate-400
```

### 主按钮
```css
rounded-lg
bg-blue-500 hover:bg-blue-600
text-white font-medium
px-4 py-2.5
transition-colors
```

### 次按钮
```css
rounded-lg
border border-slate-300 bg-white
text-slate-700 hover:bg-slate-50
px-4 py-2.5
transition-colors
```

### 移动端底部抽屉
- 默认高度：屏幕 30%
- 可拖拽至 60% 或全屏
- 顶部有拖拽手柄（36px 宽，4px 高，圆角，灰色）
- 圆角顶部 `rounded-t-2xl`
- 阴影 `shadow-lg`

## 4. 间距系统

- 使用 Tailwind 默认间距（4px 基础单位）
- 组件间距：`gap-4`（16px）或 `gap-6`（24px）
- 页面内边距：`p-4` 或 `p-6`

## 5. 响应式断点

| 断点 | 宽度 | 布局 |
|---|---|---|
| `default` | < 768px | 移动端：上下布局 |
| `md` | ≥ 768px | 桌面端：左右布局 |
| `lg` | ≥ 1024px | 侧边栏宽度 400px |

## 6. 地图样式

- 使用高德地图官方默认样式（`amap://styles/light`）
- 3km 圆：填充 `rgba(59, 130, 246, 0.1)`，描边 `#3B82F6`，线宽 2px
- A 点标记：蓝色自定义 Marker
- B 点标记：红色自定义 Marker
- POI 标记：小圆点，按类别分色
- 初始缩放级别：14（约 3km 视野范围）
