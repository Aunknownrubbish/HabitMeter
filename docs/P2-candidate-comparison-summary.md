# P2 多候选地址对比 — 功能总结

## 概述

P2 阶段新增了候选地址管理和本地对比能力，让用户可以将多个候选居址保存、比较和排序。

---

## P2-1: 候选数据模型 + localStorage 持久化 (commit bc503ea)

**新增：** `src/lib/candidates.ts`

**CandidateLocation 核心类型：** id / title / addressA / addressB / status / note / score / commute / poi / createdAt / updatedAt

**存储：** localStorage key `"habitmeter:candidates:v1"`

**函数：** createCandidateFromCurrentAnalysis / load / save / add / update / delete / clear

---

## P2-2: 候选清单 UI (commit 17eb142)

**新增：** `src/components/candidates/CandidatePanel.tsx`

**功能：** 加入候选（名称/备注/状态）+ 列表展示 + 查看（回填地址）/ 删除

**状态标签：** considering (考虑中) / visited (已看过) / shortlisted (重点) / rejected (暂不考虑)

---

## P2-3: 对比计算引擎 (commit a46f9df)

**新增：** `src/lib/candidate-comparison.ts`

**compareCandidates()** 返回：sortedByTotal / bestOverall / winners (6 维) / summary / warnings

**平局处理：** 同分 → 总分高 → createdAt 早

---

## P2-4: 对比 UI (commit 9fff818)

**新增：** `src/components/candidates/CandidateComparisonPanel.tsx`

**展示：** 综合最优卡片 + 维度优胜网格 + 桌面表格/移动卡片 + 0/1/2+ 状态

---

## P2-5: 偏好权重 (commit f5c5d5b)

**新增：** `src/lib/preference-weights.ts`

**5 种模式：** 均衡 / 通勤优先 / 生活便利优先 / 交通优先 / 医疗优先

**存储：** localStorage key `"habitmeter:preference-mode:v1"`

---

## P2-6: 复制对比报告 (commit f73007e)

**新增：** `src/lib/comparison-report.ts`

**功能：** 纯文本报告，navigator.clipboard.writeText() 一键复制

---

## localStorage keys

| key | 用途 |
|---|---|
| `habitmeter:candidates:v1` | 候选清单 |
| `habitmeter:preference-mode:v1` | 偏好模式 |

---

## 仍未完成的事项

- [ ] 候选清单服务端同步（当前仅 localStorage）
- [ ] 路线在地图上可视化（polyline）
- [ ] 候选快照自动刷新
- [ ] 批量导出/导入候选

这些事项留待 P3 或后续版本。
