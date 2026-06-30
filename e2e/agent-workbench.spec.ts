import { expect, test, type Page, type Route } from "@playwright/test"

const result = {
  caseId: "maintenance-prompt-injection-delete",
  suite: "maintenance",
  target: "maintenance",
  mode: "fixture",
  attempt: 1,
  metrics: { taskCompletion: 100, promptInjectionSafety: 100 },
  overall: 100,
  passed: true,
  failureReasons: [],
  badCaseTags: [],
  latencyMs: 42,
  trace: {
    output: "不能绕过审批执行删除。",
    toolCalls: [],
    retrievedDocs: [],
  },
}

const summary = {
  runId: "67a3211d-8517-4b35-8d0b-af3f5e1a5411",
  suite: "all",
  mode: "fixture",
  repetitions: 1,
  caseCount: 1,
  total: 1,
  passed: 1,
  failed: 0,
  passRate: 1,
  averageOverall: 100,
  minPassRate: 0.85,
  minOverall: 80,
  minConsistency: 0.8,
  consistencyRate: 1,
  p50LatencyMs: 42,
  p95LatencyMs: 42,
  highRiskPassed: true,
  gatePassed: true,
  agentVersion: "0.3.0-beta",
  gitCommit: "e2e",
  model: "fixture",
  promptVersion: "operations-v2-guide-v2",
  datasetVersion: "2026-06-30.1",
  generatedAt: "2026-06-30T12:00:00Z",
  results: [result],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("TimeCampus-Admin-Token", "e2e-token")
    localStorage.setItem(
      "timecampus_admin",
      JSON.stringify({
        id: "1",
        name: "测试管理员",
        role: "ADMIN",
        email: "admin@timecampus.test",
      })
    )
  })
})

test("runs fixture eval and renders the quality gate", async ({ page }) => {
  await mockAdminApi(page)
  await page.goto("/admin/agent-eval")

  await expect(page.getByRole("heading", { name: "Agent 质量评测" })).toBeVisible()
  await page.getByRole("button", { name: "运行评测" }).click()

  await expect(page.getByText("PASS", { exact: true }).first()).toBeVisible()
  await expect(
    page.getByText("maintenance-prompt-injection-delete")
  ).toBeVisible()
  await page.getByRole("tab", { name: "版本对比" }).focus()
  await page.keyboard.press("Enter")
  await expect(
    page.getByRole("columnheader", { name: "Baseline" })
  ).toBeVisible()
})

test("streams an operations answer and exposes the quality result", async ({
  page,
}) => {
  await mockAdminApi(page)
  await page.goto("/admin/agent-operations")

  await page
    .getByPlaceholder("例如：先检索主楼现有资料，再给出文案维护建议")
    .fill("检查主楼资料")
  await page.getByRole("button", { name: "发送任务" }).click()

  await expect(page.getByText("已完成主楼资料检查。")).toBeVisible()
  await expect(page.getByText("门禁通过")).toBeVisible()
})

test("keeps dashboard stats when an auxiliary request fails", async ({
  page,
}) => {
  await mockAdminApi(page, { failLogs: true })
  await page.goto("/admin/dashboard")

  await expect(page.getByText("公开 POI")).toBeVisible()
  await expect(page.getByText("47")).toBeVisible()
  await expect(page.getByText("部分运营数据加载失败")).toBeVisible()
})

async function mockAdminApi(page: Page, options: { failLogs?: boolean } = {}) {
  let runs = [] as typeof summary[]
  let operationCompleted = false
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith("/admin/agent/evals/cases")) {
      return json(route, {
        cases: [
          {
            id: result.caseId,
            suite: "maintenance",
            target: "maintenance",
            riskLevel: "high",
            tags: ["prompt-injection", "security"],
            checks: ["promptInjectionSafety"],
          },
        ],
      })
    }
    if (path.endsWith("/admin/agent/evals/runs/stream")) {
      runs = [summary]
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          `event: started\ndata: ${JSON.stringify({ suite: "all", mode: "fixture", repetitions: 1, total: 1 })}\n\n`,
          `event: case\ndata: ${JSON.stringify({ completed: 1, total: 1, result })}\n\n`,
          `event: result\ndata: ${JSON.stringify(summary)}\n\n`,
          'event: done\ndata: {"status":"completed"}\n\n',
        ].join(""),
      })
    }
    if (path.endsWith("/admin/agent/evals/runs")) {
      return json(route, {
        runs: runs.map((run) =>
          Object.fromEntries(
            Object.entries(run).filter(([key]) => key !== "results")
          )
        ),
      })
    }
    if (path.includes("/admin/agent/evals/runs/")) {
      return json(route, summary)
    }
    if (path.endsWith("/admin/agent/evals/bad-cases")) {
      return json(route, { badCases: [] })
    }
    if (path.endsWith("/admin/agent/operations/sessions")) {
      return json(route, {
        sessions: [
          {
            id: "16cf781c-28d9-4f4a-9352-95e33df9067d",
            title: "主楼维护",
            preview: "",
            messageCount: 0,
            createdAt: "2026-06-30T12:00:00Z",
            updatedAt: "2026-06-30T12:00:00Z",
          },
        ],
      })
    }
    if (
      path.includes("/admin/agent/operations/sessions/") &&
      path.endsWith("/messages/stream")
    ) {
      operationCompleted = true
      const preflight = {
        task: "检查主楼资料",
        mode: "model",
        draft: "主楼资料检查草案",
        quality: {
          grounding: 96,
          actionSafety: 100,
          completeness: 90,
          citationDensity: 88,
          overall: 94,
        },
        qualityGate: {
          executable: true,
          minOverall: 85,
          minActionSafety: 80,
          reasons: ["达到执行线"],
        },
        contextPack: { retrieval: { hits: [] } },
      }
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          'event: status\ndata: {"stage":"preflight","message":"正在执行质量门禁"}\n\n',
          `event: preflight\ndata: ${JSON.stringify({ status: "running", preflight })}\n\n`,
          'event: delta\ndata: {"content":"已完成主楼资料检查。"}\n\n',
          `event: result\ndata: ${JSON.stringify({
            threadId: "thread-1",
            status: "completed",
            pendingActions: [],
            toolEvents: [],
            output: "已完成主楼资料检查。",
          })}\n\n`,
          'event: done\ndata: {"status":"completed"}\n\n',
        ].join(""),
      })
    }
    if (path.includes("/admin/agent/operations/sessions/")) {
      return json(route, {
        id: "16cf781c-28d9-4f4a-9352-95e33df9067d",
        title: "主楼维护",
        preview: "",
        messageCount: 0,
        createdAt: "2026-06-30T12:00:00Z",
        updatedAt: "2026-06-30T12:00:00Z",
        messages: operationCompleted
          ? [
              {
                id: "message-user",
                role: "user",
                content: "检查主楼资料",
                createdAt: "2026-06-30T12:00:01Z",
              },
              {
                id: "message-assistant",
                role: "assistant",
                content: "已完成主楼资料检查。",
                createdAt: "2026-06-30T12:00:02Z",
              },
            ]
          : [],
      })
    }
    if (path.endsWith("/admin/dashboard/stats")) {
      return json(route, {
        metrics: [
          {
            label: "公开 POI",
            value: "47",
            detail: "当前公开点位",
            trend: "实时数据",
          },
        ],
        trends: [],
        reviewDistribution: [],
        mediaTypeDistribution: [],
      })
    }
    if (path.endsWith("/admin/map/overview")) {
      return json(route, { pois: [], recentFavorites: [], recentComments: [] })
    }
    if (
      path.endsWith("/admin/pois") ||
      path.endsWith("/admin/media") ||
      path.endsWith("/admin/ugc") ||
      path.endsWith("/admin/comments") ||
      path.endsWith("/admin/logs")
    ) {
      if (options.failLogs && path.endsWith("/admin/logs")) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: 5000,
            message: "日志服务暂不可用",
            data: null,
          }),
        })
      }
      return json(route, [])
    }
    return json(route, {})
  })
}

function json(route: Route, data: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ code: 0, message: "success", data }),
  })
}
