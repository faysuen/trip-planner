# Trip Planner — MVP 骨架

对应 PRD 中 P0 范围：极简问卷 → LLM生成候选景点 → 地理聚类/排序算法 →
交互式地图 → 高风险地区提醒 → 可选机票参考报价。

## 目录结构

```
app/
  page.tsx                       主页面（问卷 ⇄ 结果 两个状态）
  api/generate-itinerary/route.ts 编排整条生成链路的API
  layout.tsx / globals.css
components/
  Questionnaire.tsx    三步问卷 + 可选出发地/时间
  ItineraryMap.tsx      Mapbox地图，按天渲染标记与连线
  DayList.tsx           按天展示的行程列表
  RiskBanner.tsx         高风险地区警示横幅
  FlightQuoteCard.tsx    机票参考报价卡片
lib/
  geo/
    types.ts       Poi / DayPlan / ItineraryPlan 类型定义
    distance.ts     haversine距离、质心、最大跨度计算
    cluster.ts       ★ 核心算法：K-means按天分组 + 3-5km辐射圈约束
    route.ts          单日内访问顺序：最近邻 + 2-opt优化
    index.ts          对外唯一入口 planItinerary()
  llm/generateCandidates.ts   调用Claude生成候选景点（不含坐标）
  geocode.ts                   调用Mapbox Geocoding把候选点转真实坐标
  risk.ts                      高风险地区数据源接口（当前是占位实现）
  flights.ts                    机票报价数据源接口（当前是占位实现）
```

## 本地跑起来

```bash
npm install
cp .env.example .env.local   # 填入 ANTHROPIC_API_KEY / MAPBOX 相关token
npm run dev
```

## 核心设计原则（对应PRD 5.2）

LLM 只负责"给候选景点清单+文案"，**绝不负责决定地理分组和访问顺序**。
这两件事完全由 `lib/geo` 这个独立模块处理，好处：
- 可以脱离LLM单独写单元测试（喂假的POI坐标数据进去验证聚类效果）
- 后续想换算法（比如接入真实路网数据做更精确的通勤时间约束）时，
  只需要改这一个模块，不影响上层的LLM调用和UI

## 当前是占位、还没接真实数据源的部分

- `lib/risk.ts`：高风险地区判断，需要接美国国务院/英国FCDO等官方数据源
- `lib/flights.ts`：机票报价，需要接Skyscanner/Amadeus等API
- `lib/geocode.ts` 里的地理编码目前是逐个点位串行调用Mapbox API，
  景点多时会比较慢，后续可以改成批量请求或加缓存层

## 下一步优先做的事（对应之前讨论的开发顺序）

1. 先用假数据跑通问卷→地图的交互（当前骨架已经是"真实API接线"版本，
   如果想先看纯前端效果，可以把 `app/api/generate-itinerary/route.ts`
   临时换成返回mock数据）
2. 接入真实 ANTHROPIC_API_KEY，验证候选景点生成质量、调prompt
3. 用真实城市数据反复跑 `lib/geo/cluster.ts`，检验聚类效果
   （建议先测东京、巴黎这种POI密度高、数据丰富的城市）
4. 接入真实 MAPBOX token，验证地理编码成功率
5. 把 `lib/risk.ts` 和 `lib/flights.ts` 换成真实数据源
