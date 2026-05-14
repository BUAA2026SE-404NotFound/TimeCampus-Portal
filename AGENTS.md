# TimeCampus 管理端 UI - AGENTS

此目录是 TimeCampus（时光航迹）管理端前端。后续 agent 在本模块内开发时，应优先遵循本文，再参考仓库根目录 `AGENTS.md` 与后端代码/文档。

## 项目定位

- 技术栈：React 19 + Vite 7 + TypeScript + Tailwind CSS 4。
- 包管理：使用 `pnpm`，不要混用 `npm install` 或 `yarn`。
- 目标：实现 Alpha 阶段管理端网页，用于 POI、官方内容、UGC/评论审核、地图工具、审计日志与运营 dashboard。
- 后端尚未完全实现时，页面可以使用 mock 数据，但必须把 mock 与真实 API 适配层隔离，方便后续切换。

## 开发命令

```powershell
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

## UI 与代码约定

- 使用 TypeScript，组件文件优先使用 `.tsx`。
- 路径别名：`@` 指向 `src`。
- UI 组件优先放在 `src/components`；通用 shadcn 风格基础组件放在 `src/components/ui`。
- API 访问封装在 `src/api` 或 `src/lib/request.ts`，页面不要直接散落 `fetch`/`axios` 调用。
- 管理端是工作台，不要做营销落地页。首屏应是可操作的后台界面。
- 后端未就绪时，使用明确命名的 mock 数据，例如 `src/mocks` 或 API adapter 内 fallback；不要把 mock 写死在表单提交逻辑里。

## API 基础约定

后端 Alpha API 基础路径按仓库根目录说明为 `/api`。如本地开发需要代理，优先在 `vite.config.ts` 中增加：

```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
}
```

所有接口统一返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

前端 request 层应只向页面返回 `data`，并统一处理非 0 `code`、HTTP 错误与登录失效。

## 鉴权

- 请求头：`Authorization: Bearer <token>`。
- 管理端路由 `/api/admin/**` 需要 ADMIN 权限。
- 管理端前端应保存 token 与管理员资料，但避免把敏感信息写入日志。
- 未登录访问管理端页面时跳转登录页。
- 退出登录时清理本地 token 与管理员资料。

建议本地 key：

- token：`TimeCampus-Admin-Token`
- admin profile：`timecampus_admin`

## 管理端页面范围

Alpha 管理端至少包含：

- 登录页
- Dashboard / 运营首页
- POI 管理
- 官方内容批量导入
- UGC 审核
- 评论审核
- 地图工具
- 运营地图
- 审计日志
- 页脚的 ICP 备案信息以及其他声明与开发团队联系方式（ICP备案号：京ICP备2026018715号-2），注意备案号需链接至[工信部官网](https://beian.miit.gov.cn/)

Dashboard 在后端未完成时可以展示 mock 图表，但应保留真实 API 接入点。推荐图表：

- POI 总数、官方内容数、待审核 UGC、最近日志/互动热度
- 访问/投稿趋势
- 审核状态分布
- POI 内容覆盖或热度排行

## 管理端 API 清单

### Auth

管理端登录接口如后端实现为专用路径，前端可使用：

- `POST /api/admin/login`
- `POST /api/admin/logout`

若后端尚未实现，登录页使用 mock 仅限开发环境，并在代码中明确标注。

### POI
管理端：

- `POST /api/admin/pois`
- `PUT /api/admin/pois/{id}`
- `DELETE /api/admin/pois/{id}`

POI 校验：

- `name` 必填。
- `latitude` 范围 `-90..90`。
- `longitude` 范围 `-180..180`。
- `status` 使用 `ACTIVE/INACTIVE` 或与后端实际枚举适配。

### 内容

管理端：

- `POST /api/admin/contents/batch-import`

官方内容导入默认：

- `type = OFFICIAL`
- `review_status = APPROVED`
- `publish_status = VISIBLE`

### 时间切换

- `GET /api/pois/{id}/time-switch?year=YYYY`

年份范围：

- `1953..当前年份`

### UGC 审核

用户上传：

- `POST /api/ugc`
  - `multipart/form-data`
  - 字段：`file`, `poiId`, `year`, `description`, `source?`

管理端：

- `GET /api/admin/ugc?status=PENDING`
- `POST /api/admin/ugc/{id}/approve`
- `POST /api/admin/ugc/{id}/reject`
  - body 必须包含 `reason`

审核规则：

- 上传：`review_status = PENDING`, `publish_status = HIDDEN`
- 通过：`review_status = APPROVED`, `publish_status = VISIBLE`
- 驳回：`review_status = REJECTED`, `publish_status = HIDDEN`，必须填写驳回原因

### 评论审核

后端最小表包含 `comment`，管理端应支持审核：

- 列表：按后端实际实现接入，建议 `GET /api/admin/comments?status=PENDING`
- 通过：建议 `POST /api/admin/comments/{id}/approve`
- 驳回：建议 `POST /api/admin/comments/{id}/reject`，body 包含 `reason`

如果后端实际路径不同，前端只修改 `src/api/comment.ts`，页面层不要感知差异。

### 收藏

- `POST /api/favorites/{targetType}/{targetId}`
- `DELETE /api/favorites/{targetType}/{targetId}`
- `GET /api/favorites`

管理端一般只展示聚合数据，不直接替用户新增/删除收藏。

### 地图工具

- `GET /api/map/reverse-geocode?lat&lng`
- `GET /api/map/poi-search?keyword&region`

地图工具页面只调用后端封装接口，不在前端保存腾讯地图 SecretKey。

### 审计日志

后端最小表为 `log`。管理端应支持列表查询，建议：

- `GET /api/admin/logs?type&limit`

如果后端实际路径不同，统一收敛在 `src/api/log.ts`。

## 数据字段命名适配

后端数据库使用 snake_case，但 Java/JSON 可能返回 camelCase。前端页面统一使用 camelCase：

- `created_at` -> `createdAt`
- `updated_at` -> `updatedAt`
- `review_status` -> `reviewStatus`
- `publish_status` -> `publishStatus`
- `avatar_url` -> `avatarUrl`
- `identity_type` -> `identityType`
- `target_type` -> `targetType`
- `target_id` -> `targetId`

若后端返回 snake_case，在 request/adapter 层转换，不要在每个组件里重复判断。

## 文件上传校验

UGC 上传前端应先做基础校验：

- 图片格式仅允许 jpg/jpeg/png。
- 文件大小 <= 10MB。
- 年份范围：1953 到当前年份。
- `poiId`、`year`、`description` 必填。

后端仍是最终校验来源；前端校验只用于更好的交互。

## 开发注意事项

- 不要在前端暴露腾讯地图 SecretKey、COS 密钥或任何后端私密配置。
- 管理端 API 错误要提供明确 toast/message。
- 表格、筛选、审核操作应有 loading/empty/error 状态。
- 删除、驳回、退出登录等破坏性操作需要确认。
- 新增页面时同步更新路由、侧边栏导航与必要的 mock/API adapter。
