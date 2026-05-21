# TimeCampus Portal

TimeCampus 主页前端，基于 React 19、TypeScript、Vite、Tailwind CSS 4 和 shadcn/ui。

## 本地开发

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

开发服务默认使用 Vite，`/api` 会代理到本机后端 `http://localhost:8080`。

## 路由

- `/`：首页
- `/admin/dashboard`：运营首页
- `/admin/pois`：POI 管理
- `/admin/imports`：官方内容上传
- `/admin/ugc`：UGC 审核
- `/admin/comments`：评论审核
- `/admin/map-tools`：地图工具
- `/admin/ops-map`：运营地图
- `/admin/logs`：审计日志

管理端登录使用后端 `POST /api/v1/admin/login`，本地 token key 为 `TimeCampus-Admin-Token`。

## 目录结构

```text
src/
  api/                    # 后端请求封装与接口适配
  components/             # 通用组件、布局组件、shadcn/ui 基础组件
    admin/                # 管理端 shell、layout、shared
    ui/                   # shadcn/ui 组件源码
  features/               # 复杂业务页面的局部组件
    admin/
      map-tools/          # 地图工具结果卡片
      operation-map/      # 运营地图、POI 详情、运营活动表格
      poi/                # POI 表单和表格
  hooks/                  # 通用 React hooks
  lib/                    # 通用工具函数
  mocks/                  # 开发期 mock 数据
  pages/                  # 路由级页面入口
    admin/
    portal-page.tsx
```

## 开发约定

- 页面入口放在 `src/pages`。
- 页面内部复杂、可复用或有独立状态的模块放在 `src/features`。
- 通用 UI 和布局组件放在 `src/components`，shadcn/ui 基础组件放在 `src/components/ui`。
- API 调用只放在 `src/api`，页面和 feature 组件不要直接散落 `fetch`。
- 后端未完成时可以保留 mock fallback，但 mock 数据不要写死在页面提交逻辑里。
- 不要在前端暴露腾讯地图 SK、COS 密钥等私密配置。
