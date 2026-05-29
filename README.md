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

## 环境变量

```env
VITE_CAP_API_ENDPOINT=https://cap.example.com/<site-key>/
VITE_TENCENT_MAP_KEY=...
```

`VITE_CAP_API_ENDPOINT` 是 Cap Standalone 中某个 site key 的公开 endpoint，只能放 site key，不能放 secret key。管理员登录页会把 Cap 生成的 `capToken` 随 `/api/v1/admin/login` 一起提交；真正校验必须由后端使用 Cap secret 调用 `/siteverify` 完成。

## 路由

- `/`：首页
- `/admin/dashboard`：运营首页
- `/admin/pois`：POI 管理
- `/admin/imports`：内容上传
- `/admin/ugc`：UGC 审核
- `/admin/comments`：评论审核
- `/admin/map-tools`：地图工具
- `/admin/ops-map`：运营地图
- `/admin/logs`：审计日志

管理端登录使用后端 `POST /api/v1/admin/login`，本地 token key 为 `TimeCampus-Admin-Token`。登录页已接入 `src/components/cap-verification.tsx`，之后注册页可复用同一组件。

## Cap 部署要点

1. 在北京节点准备 `cap.timecampus.example` 域名与 HTTPS 反向代理。
2. 使用 `tiago2/cap:latest` 与 `valkey/valkey:9-alpine` 启动 Cap Standalone。
3. 登录 Cap dashboard，创建 TimeCampus 管理端 site key，记录 site key 和 secret key。
4. 前端构建时配置 `VITE_CAP_API_ENDPOINT=https://cap.timecampus.example/<site-key>/`。
5. 后端配置 `CAP_SITEVERIFY_URL=https://cap.timecampus.example/<site-key>/siteverify` 和 `CAP_SECRET=<secret-key>`，登录接口收到 `capToken` 后先完成服务端校验。
6. Nginx/Caddy 反代 Cap 时保留真实客户端 IP，例如 `X-Forwarded-For`，Cap 容器配置 `RATELIMIT_IP_HEADER=x-forwarded-for`。

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
