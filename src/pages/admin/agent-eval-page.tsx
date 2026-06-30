import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  FlaskConical,
  Play,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"

import {
  createAgentBadCase,
  getAgentBadCases,
  getAgentEvalCases,
  getAgentEvalRun,
  getAgentEvalRuns,
  streamAgentEval,
  updateAgentBadCase,
  type AgentBadCase,
  type AgentEvalCase,
  type AgentEvalResult,
  type AgentEvalRunSummary,
  type AgentEvalSummary,
  type EvalMode,
  type EvalSuite,
} from "@/api/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { AdminProfile } from "@/types/admin"

type ResultFilter = "all" | "passed" | "failed"

export function AgentEvalPage({ role }: { role: AdminProfile["role"] }) {
  const [suite, setSuite] = useState<EvalSuite>("all")
  const [mode, setMode] = useState<EvalMode>("fixture")
  const [repetitions, setRepetitions] = useState(1)
  const [cases, setCases] = useState<AgentEvalCase[]>([])
  const [summary, setSummary] = useState<AgentEvalSummary | null>(null)
  const [history, setHistory] = useState<AgentEvalRunSummary[]>([])
  const [badCases, setBadCases] = useState<AgentBadCase[]>([])
  const [baselineId, setBaselineId] = useState("")
  const [candidateId, setCandidateId] = useState("")
  const [baseline, setBaseline] = useState<AgentEvalSummary | null>(null)
  const [candidate, setCandidate] = useState<AgentEvalSummary | null>(null)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [resolutions, setResolutions] = useState<Record<string, string>>({})
  const canRun = role === "ADMIN" || role === "SUPER"

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAgentEvalCases(suite),
      getAgentEvalRuns(),
      getAgentBadCases(),
    ])
      .then(([caseResponse, runResponse, badCaseResponse]) => {
        if (cancelled) return
        setCases(caseResponse.cases)
        setHistory(runResponse.runs)
        setBadCases(badCaseResponse.badCases)
        if (runResponse.runs.length) {
          setCandidateId((current) => current || runResponse.runs[0].runId)
          setBaselineId(
            (current) =>
              current || runResponse.runs[1]?.runId || runResponse.runs[0].runId
          )
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "评测工作台加载失败"
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [suite])

  useEffect(() => {
    if (!baselineId || !candidateId) return
    let cancelled = false
    Promise.all([getAgentEvalRun(baselineId), getAgentEvalRun(candidateId)])
      .then(([nextBaseline, nextCandidate]) => {
        if (!cancelled) {
          setBaseline(nextBaseline)
          setCandidate(nextCandidate)
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "版本对比加载失败"
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [baselineId, candidateId])

  async function runEvaluation() {
    setLoading(true)
    setError("")
    setSummary(null)
    setCompleted(0)
    setTotal(cases.length * repetitions)
    try {
      await streamAgentEval(
        { suite, mode, repetitions },
        {
          onStarted: (event) => {
            setTotal(event.total)
            setCompleted(0)
          },
          onCase: (event) => {
            setCompleted(event.completed)
          },
          onResult: (result) => {
            setSummary(result)
          },
        }
      )
      const runResponse = await getAgentEvalRuns()
      setHistory(runResponse.runs)
      if (runResponse.runs[0]) {
        setCandidateId(runResponse.runs[0].runId)
        setBaselineId(runResponse.runs[1]?.runId ?? runResponse.runs[0].runId)
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Agent Eval 运行失败"
      )
    } finally {
      setLoading(false)
    }
  }

  async function addBadCase(result: AgentEvalResult) {
    if (!summary) return
    try {
      const created = await createAgentBadCase(summary.runId, result.caseId)
      setBadCases((current) =>
        current.some((item) => item.id === created.id)
          ? current
          : [created, ...current]
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Bad Case 沉淀失败"
      )
    }
  }

  async function resolveBadCase(item: AgentBadCase) {
    try {
      const updated = await updateAgentBadCase(
        item.id,
        item.status === "open" ? "resolved" : "open",
        resolutions[item.id] ?? item.resolution
      )
      setBadCases((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Bad Case 更新失败"
      )
    }
  }

  const tags = useMemo(
    () => [...new Set(cases.flatMap((item) => item.tags))].sort(),
    [cases]
  )
  const caseMetadata = useMemo(
    () => new Map(cases.map((item) => [item.id, item])),
    [cases]
  )
  const filteredResults = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return (summary?.results ?? []).filter((result) => {
      const metadata = caseMetadata.get(result.caseId)
      return (
        (resultFilter === "all" ||
          (resultFilter === "passed" ? result.passed : !result.passed)) &&
        (tagFilter === "all" || metadata?.tags.includes(tagFilter)) &&
        (!normalized || result.caseId.toLowerCase().includes(normalized))
      )
    })
  }, [caseMetadata, query, resultFilter, summary, tagFilter])
  const comparison = useMemo(
    () => (baseline && candidate ? compareRuns(baseline, candidate) : null),
    [baseline, candidate]
  )

  return (
    <div className="grid gap-5">
      <section className="border bg-background" aria-labelledby="eval-run-title">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b p-4">
          <div>
            <h2 id="eval-run-title" className="flex items-center gap-2 font-semibold">
              <FlaskConical className="size-5" />
              Agent 质量评测
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fixture 用于确定性回归，Live 运行真实模型、MCP 与路线工具。
            </p>
          </div>
          <Badge variant="outline" className="rounded-none">
            {cases.length} cases
          </Badge>
        </header>
        <div className="grid gap-4 p-4 md:grid-cols-[200px_200px_160px_auto] md:items-end">
          <Control label="评测套件">
            <Select value={suite} onValueChange={(value) => setSuite(value as EvalSuite)}>
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="maintenance">运营智能体</SelectItem>
                <SelectItem value="guide">游客导览</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Control label="运行模式">
            <Select
              value={mode}
              onValueChange={(value) => {
                const nextMode = value as EvalMode
                setMode(nextMode)
                setRepetitions(nextMode === "live" ? 3 : 1)
              }}
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixture">Fixture</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </Control>
          <Control label="重复次数">
            <Select
              value={String(repetitions)}
              onValueChange={(value) => setRepetitions(Number(value))}
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} 次
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Control>
          <Button
            type="button"
            className="w-fit rounded-none"
            disabled={!canRun || loading || !cases.length}
            onClick={() => void runEvaluation()}
          >
            {loading ? <RotateCcw className="animate-spin" /> : <Play />}
            {loading ? "运行中" : "运行评测"}
          </Button>
        </div>
        {loading ? (
          <div className="border-t p-4" aria-live="polite">
            <div className="mb-2 flex justify-between text-sm">
              <span>正在执行用例</span>
              <span className="font-mono">
                {completed}/{total}
              </span>
            </div>
            <Progress value={total ? (completed / total) * 100 : 0} />
          </div>
        ) : null}
        {error ? (
          <p className="border-t p-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {summary ? <SummaryMetrics summary={summary} /> : null}

      <Tabs defaultValue="results" className="grid gap-4">
        <TabsList className="h-auto w-fit rounded-none">
          <TabsTrigger value="results" className="rounded-none">
            运行结果
          </TabsTrigger>
          <TabsTrigger value="compare" className="rounded-none">
            版本对比
          </TabsTrigger>
          <TabsTrigger value="bad-cases" className="rounded-none">
            Bad Cases
            {badCases.filter((item) => item.status === "open").length ? (
              <Badge variant="destructive" className="ml-2 rounded-none">
                {badCases.filter((item) => item.status === "open").length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-0">
          <section className="border bg-background">
            <header className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_180px_180px]">
              <Input
                value={query}
                className="rounded-none"
                placeholder="搜索 Case ID"
                aria-label="搜索评测用例"
                onChange={(event) => setQuery(event.target.value)}
              />
              <Select
                value={resultFilter}
                onValueChange={(value) => setResultFilter(value as ResultFilter)}
              >
                <SelectTrigger className="w-full rounded-none" aria-label="筛选状态">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="passed">通过</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full rounded-none" aria-label="筛选标签">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部标签</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </header>
            {summary ? (
              <ResultTable
                results={filteredResults}
                metadata={caseMetadata}
                badCases={badCases}
                runId={summary.runId}
                canRun={canRun}
                onAddBadCase={addBadCase}
              />
            ) : (
              <EmptyState text="运行评测或从版本对比中选择历史结果" />
            )}
          </section>
        </TabsContent>

        <TabsContent value="compare" className="mt-0">
          <section className="border bg-background">
            <header className="grid gap-4 border-b p-4 md:grid-cols-2">
              <RunSelect
                label="Baseline"
                value={baselineId}
                runs={history}
                onChange={setBaselineId}
              />
              <RunSelect
                label="Candidate"
                value={candidateId}
                runs={history}
                onChange={setCandidateId}
              />
            </header>
            {comparison ? (
              <ComparisonView comparison={comparison} />
            ) : (
              <EmptyState text="至少需要一条评测历史才能进行版本对比" />
            )}
          </section>
        </TabsContent>

        <TabsContent value="bad-cases" className="mt-0">
          <section className="border bg-background">
            <header className="border-b p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-5" />
                Bad Case 闭环
              </h3>
            </header>
            {badCases.length ? (
              <div className="divide-y">
                {badCases.map((item) => (
                  <article key={item.id} className="grid gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-semibold">{item.caseId}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(item.updatedAt).toLocaleString()} · {item.suite}
                        </p>
                      </div>
                      <Badge
                        variant={item.status === "open" ? "destructive" : "outline"}
                        className="rounded-none"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-destructive">
                      {item.failureReasons.join("；") || "人工标记的回归风险"}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="rounded-none"
                        value={resolutions[item.id] ?? item.resolution}
                        placeholder="处理结论"
                        disabled={!canRun}
                        onChange={(event) =>
                          setResolutions((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-none"
                        disabled={!canRun}
                        onClick={() => void resolveBadCase(item)}
                      >
                        {item.status === "open" ? "标记已解决" : "重新打开"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="当前没有 Bad Case" />
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryMetrics({ summary }: { summary: AgentEvalSummary }) {
  const metrics = [
    {
      label: "质量门禁",
      value: summary.gatePassed ? "PASS" : "FAIL",
      detail: summary.highRiskPassed ? "高风险用例通过" : "高风险用例失败",
    },
    {
      label: "通过率",
      value: `${Math.round(summary.passRate * 100)}%`,
      detail: `${summary.passed}/${summary.total} attempts`,
    },
    {
      label: "平均分",
      value: summary.averageOverall.toFixed(1),
      detail: `${summary.caseCount} cases`,
    },
    {
      label: "一致性",
      value: `${Math.round(summary.consistencyRate * 100)}%`,
      detail: `${summary.repetitions} repetitions`,
    },
    {
      label: "P95 延迟",
      value: summary.p95LatencyMs === undefined ? "-" : `${summary.p95LatencyMs} ms`,
      detail: `P50 ${summary.p50LatencyMs ?? "-"} ms`,
    },
  ]
  return (
    <section className="grid gap-px border bg-border sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-background p-4">
          <p className="text-xs text-muted-foreground">{metric.label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{metric.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
        </div>
      ))}
    </section>
  )
}

function ResultTable({
  results,
  metadata,
  badCases,
  runId,
  canRun,
  onAddBadCase,
}: {
  results: AgentEvalResult[]
  metadata: Map<string, AgentEvalCase>
  badCases: AgentBadCase[]
  runId: string
  canRun: boolean
  onAddBadCase: (result: AgentEvalResult) => Promise<void>
}) {
  if (!results.length) return <EmptyState text="没有符合筛选条件的结果" />
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Attempt</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>Trace</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const item = metadata.get(result.caseId)
            const saved = badCases.some(
              (badCase) =>
                badCase.runId === runId && badCase.caseId === result.caseId
            )
            return (
              <TableRow key={`${result.caseId}-${result.attempt}`}>
                <TableCell className="min-w-64">
                  <p className="font-mono text-xs font-semibold">{result.caseId}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item?.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-none text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{item?.riskLevel ?? "-"}</TableCell>
                <TableCell className="font-mono">{result.attempt}</TableCell>
                <TableCell className="font-mono">{result.overall.toFixed(1)}</TableCell>
                <TableCell>
                  <Badge
                    variant={result.passed ? "default" : "destructive"}
                    className="rounded-none"
                  >
                    {result.passed ? "PASS" : "FAIL"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {result.latencyMs === undefined ? "-" : `${result.latencyMs} ms`}
                </TableCell>
                <TableCell className="min-w-72">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">
                      查看输出与工具轨迹
                    </summary>
                    <div className="mt-3 grid gap-3 text-xs">
                      <p className="whitespace-pre-wrap leading-5">{result.trace.output}</p>
                      <pre className="max-h-48 overflow-auto border bg-muted/20 p-3">
                        {JSON.stringify(result.metrics, null, 2)}
                      </pre>
                      {result.trace.toolCalls.map((tool, index) => (
                        <div key={`${tool.name}-${index}`} className="border p-3">
                          <div className="flex justify-between gap-3">
                            <code>{tool.name}</code>
                            <Badge variant="outline" className="rounded-none">
                              {tool.status}
                            </Badge>
                          </div>
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(tool.arguments, null, 2)}
                          </pre>
                        </div>
                      ))}
                      {result.failureReasons.length ? (
                        <p className="text-destructive">
                          {result.failureReasons.join("；")}
                        </p>
                      ) : null}
                      {!result.passed ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-fit rounded-none"
                          disabled={!canRun || saved}
                          onClick={() => void onAddBadCase(result)}
                        >
                          <AlertTriangle />
                          {saved ? "已沉淀" : "沉淀为 Bad Case"}
                        </Button>
                      ) : null}
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function RunSelect({
  label,
  value,
  runs,
  onChange,
}: {
  label: string
  value: string
  runs: AgentEvalRunSummary[]
  onChange: (value: string) => void
}) {
  return (
    <Control label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full rounded-none">
          <SelectValue placeholder={`选择 ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {runs.map((run) => (
            <SelectItem key={run.runId} value={run.runId}>
              {run.agentVersion} · {run.mode} ·{" "}
              {new Date(run.generatedAt).toLocaleString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Control>
  )
}

function ComparisonView({
  comparison,
}: {
  comparison: ReturnType<typeof compareRuns>
}) {
  return (
    <div>
      <div className="grid gap-px border-b bg-border sm:grid-cols-3">
        <Delta label="通过率" value={comparison.passRateDelta * 100} suffix=" pp" />
        <Delta label="平均分" value={comparison.scoreDelta} />
        <Delta label="P95 延迟" value={comparison.latencyDelta} suffix=" ms" inverse />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Baseline</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>判定</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparison.rows.map((row) => (
              <TableRow key={row.caseId}>
                <TableCell className="font-mono text-xs">{row.caseId}</TableCell>
                <TableCell>{row.baseline.toFixed(1)}</TableCell>
                <TableCell>{row.candidate.toFixed(1)}</TableCell>
                <TableCell className={row.delta < 0 ? "text-destructive" : ""}>
                  {formatDelta(row.delta)}
                </TableCell>
                <TableCell>
                  {row.regressed ? (
                    <Badge variant="destructive" className="rounded-none">
                      REGRESSION
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-none">
                      STABLE
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function Delta({
  label,
  value,
  suffix = "",
  inverse = false,
}: {
  label: string
  value: number
  suffix?: string
  inverse?: boolean
}) {
  const negative = inverse ? value > 0 : value < 0
  return (
    <div className="bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-xl font-semibold ${negative ? "text-destructive" : ""}`}>
        {formatDelta(value)}
        {suffix}
      </p>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center p-6 text-sm text-muted-foreground">
      {text}
    </div>
  )
}

function compareRuns(baseline: AgentEvalSummary, candidate: AgentEvalSummary) {
  const baselineScores = averageScores(baseline.results)
  const candidateScores = averageScores(candidate.results)
  const rows = [...new Set([...baselineScores.keys(), ...candidateScores.keys()])]
    .map((caseId) => {
      const before = baselineScores.get(caseId) ?? 0
      const after = candidateScores.get(caseId) ?? 0
      const delta = after - before
      return {
        caseId,
        baseline: before,
        candidate: after,
        delta,
        regressed: delta <= -10 || (before >= 80 && after < 80),
      }
    })
    .sort((a, b) => Number(b.regressed) - Number(a.regressed) || a.delta - b.delta)
  return {
    passRateDelta: candidate.passRate - baseline.passRate,
    scoreDelta: candidate.averageOverall - baseline.averageOverall,
    latencyDelta: (candidate.p95LatencyMs ?? 0) - (baseline.p95LatencyMs ?? 0),
    rows,
  }
}

function averageScores(results: AgentEvalResult[]) {
  const grouped = new Map<string, number[]>()
  for (const result of results) {
    grouped.set(result.caseId, [...(grouped.get(result.caseId) ?? []), result.overall])
  }
  return new Map(
    [...grouped].map(([caseId, scores]) => [
      caseId,
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    ])
  )
}

function formatDelta(value: number) {
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? "+" : ""}${rounded}`
}
