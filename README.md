# TimeCampus Portal

TimeCampus Portal 是“时光航迹”的前端子模块，负责门户首页、项目详情、小程序说明、公开校园地图和 Web 管理端。项目基于 React 19、TypeScript、Vite、Tailwind CSS 4、shadcn/ui、GSAP 和腾讯地图 JS API。

## 本地开发

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

Vite 开发服务默认监听 `5173`，并把 `/api` 代理到本机后端 `http://localhost:8080`。

## 环境变量

```env
VITE_API_BASE_URL=
VITE_CAP_API_ENDPOINT=https://cap.example.com/<site-key>/
VITE_TENCENT_MAP_KEY=...
VITE_ADMIN_DOMAIN=admin.timecampus.asia
VITE_PORTAL_DOMAIN=www.timecampus.asia
VITE_ADMIN_REDIRECT=true
```

| 变量 | 用途 |
| --- | --- |
| `VITE_API_BASE_URL` | 可选，指定完整 API base URL；缺省使用同源 `/api/v1` |
| `VITE_CAP_API_ENDPOINT` | Cap site endpoint，只能包含公开 site key，不能包含 secret |
| `VITE_TENCENT_MAP_KEY` | 腾讯地图 JS Key，前端不得保存 SK |
| `VITE_ADMIN_DOMAIN` | 管理端生产域名 |
| `VITE_PORTAL_DOMAIN` | 门户生产域名，用于管理端返回首页 |
| `VITE_ADMIN_REDIRECT` | 是否把 `/admin` 访问跳转到管理端域名；本地可设为 `false` |

## 路由

公开页面：

- `/`：门户首页
- `/project-info`：项目信息详情
- `/mini-program`：微信小程序说明
- `/campus-map`：独立校园地图页，懒加载腾讯地图脚本和地图页面代码

管理端页面：

- `/login`、`/register`：管理员登录和注册
- `/admin/dashboard`：运营首页
- `/admin/ops-map`：运营地图
- `/admin/logs`：审计日志
- `/admin/accounts`：管理员管理
- `/admin/pois`：POI 管理
- `/admin/imports`：内容上传
- `/admin/ugc`：UGC 审核
- `/admin/comments`：评论审核，当前因微信小程序服务策略标记为已废弃
- `/admin/map-tools`：地图工具

管理端登录调用 `POST /api/v1/admin/login`，本地 token key 为 `TimeCampus-Admin-Token`。生产登录页应通过 Cap widget 获取 `capToken`，真正校验由 Backend 使用 Cap secret 完成。

## 目录结构

```text
src/
  api/                    # Backend 请求封装与接口适配
  components/             # 通用组件、管理端 shell、shadcn/ui 基础组件
  data/                   # 静态展示数据和校园历史素材索引
  features/admin/         # 管理端复杂业务模块
  hooks/                  # 通用 React hooks
  lib/                    # 工具函数、腾讯地图加载器
  pages/                  # 路由级页面入口
  types/                  # 跨页面共享类型
```

## 架构约定

- 页面入口放在 `src/pages`。
- 页面内复杂、可复用或有独立状态的模块放在 `src/features`。
- 通用 UI 和布局组件放在 `src/components`，shadcn/ui 基础组件放在 `src/components/ui`。
- API 调用统一放在 `src/api`，页面和 feature 组件不直接散落 `fetch`。
- 管理端数据失败、登录过期或 `none` 权限时展示明确提示，不展示虚假 fallback 数据。
- 首页不初始化腾讯地图；公开地图进入 `/campus-map` 后再加载地图脚本和数据。
- 使用后端返回的媒体 URL，不在前端拼接受保护文件路径。
- 不在前端暴露腾讯地图 SK、COS 密钥、Cap secret、DeepSeek key 等私密配置。

## 管理员权限

| 角色 | 能力 |
| --- | --- |
| `super` | 超级管理员，可管理普通管理员，但不能直接授权另一个 `super` |
| `admin` | 普通管理员，可进行运营与内容写操作 |
| `read` | 只读管理员，可查看运营数据和内容 |
| `none` | 未授权管理员，只显示空界面和授权提示，不加载受保护数据 |

## 相关文档

- 根文档索引：[../docs/README.md](../docs/README.md)
- 功能规格：[../docs/functional-spec.md](../docs/functional-spec.md)
- 技术规格：[../docs/technical-spec.md](../docs/technical-spec.md)
- 文档维护指南：[../docs/documentation-maintenance.md](../docs/documentation-maintenance.md)
- 部署说明：[../docs/deploy.md](../docs/deploy.md)
