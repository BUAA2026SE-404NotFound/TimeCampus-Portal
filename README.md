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
VITE_ADMIN_DOMAIN=你的管理端域名
VITE_PORTAL_DOMAIN=你的用户端域名
VITE_ADMIN_REDIRECT=true
```

`VITE_ADMIN_DOMAIN` 用于指定管理端域名。

`VITE_PORTAL_DOMAIN` 用于管理端“返回主页”等跨域跳转场景。

`VITE_ADMIN_REDIRECT` 控制是否将 `/admin` 访问强制跳转到管理端域名；本地测试可设置为 `false` 以保留 `localhost` 路由。

`VITE_CAP_API_ENDPOINT` 是 Cap Standalone 中某个 site key 的公开 endpoint，只能放 site key，不能放 secret key。管理员登录页会把 Cap 生成的 `capToken` 随 `/api/v1/admin/login` 一起提交；真正校验必须由后端使用 Cap secret 调用 `/siteverify` 完成。

## 路由

- `/`：首页
- `/project-info`：项目信息详情
- `/mini-program`：微信小程序说明
- `/campus-map`：独立校园卫星地图页；腾讯地图脚本、卫星瓦片和 POI marker 只在进入本页后加载，避免拖慢首页首屏
- `/login`：管理员登录
- `/register`：管理员注册
- `/admin/dashboard`：运营首页
- `/admin/pois`：POI 管理
- `/admin/imports`：内容上传
- `/admin/ugc`：UGC 审核
- `/admin/comments`：评论审核
- `/admin/map-tools`：地图工具
- `/admin/ops-map`：运营地图
- `/admin/accounts`：管理员管理
- `/admin/logs`：审计日志

管理端登录使用后端 `POST /api/v1/admin/login`，本地 token key 为 `TimeCampus-Admin-Token`。登录页已接入 `src/components/cap-verification.tsx`，之后注册页可复用同一组件。

## 首页与地图性能

首页使用 GSAP 和 shadcn/ui 组成项目入口、统计图表、横向影像胶片栏等轻量模块。腾讯地图不在首页初始化；首页只展示“校园卫星地图”入口卡片，点击进入 `/campus-map` 后才懒加载地图页面。

`/campus-map` 页面包含地图加载时间线、POI 点击弹窗和影像预览。POI 数据当前使用 `src/data/portal-map-data.ts` 中的硬编码用户端可见点位，以避免公开首页依赖管理员 token。

首屏之外的图片默认使用 `loading="lazy"`；首屏 hero 图片等关键视觉资源可显式设置为 `loading="eager"`。

## 管理员权限

管理端支持四种权限：

- `super`：超级管理员，可管理普通管理员，但不能直接授权另一个超级管理员。
- `admin`：普通管理员，可进行运营与内容管理。
- `read`：只读管理员，可查看数据但不能执行写操作。
- `none`：未授权管理员，只显示空界面并弹窗提示，不加载运营地图、媒体图片等受保护内容。

管理员管理页的角色变更使用确认对话框，避免下拉选择误触即提交。

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
  data/                   # 首页地图硬编码 POI、统计数据等静态数据
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
    campus-map-page.tsx
    mini-program-detail-page.tsx
    portal-page.tsx
    project-info-detail-page.tsx
```

## 开发约定

- 页面入口放在 `src/pages`。
- 页面内部复杂、可复用或有独立状态的模块放在 `src/features`。
- 通用 UI 和布局组件放在 `src/components`，shadcn/ui 基础组件放在 `src/components/ui`。
- API 调用只放在 `src/api`，页面和 feature 组件不要直接散落 `fetch`。
- 后端未完成时可以保留 mock fallback，但 mock 数据不要写死在页面提交逻辑里。
- 管理端数据失败、登录过期或 `none` 权限时，直接通过对话框提示，不再展示虚假 fallback 数据。
- 不要在前端暴露腾讯地图 SK、COS 密钥等私密配置。
