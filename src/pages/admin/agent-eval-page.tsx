import { useEffect, useState } from "react"
import { FlaskConical, Play } from "lucide-react"

import {
  getAgentEvalCases,
  runAgentEval,
  type AgentEvalSummary,
  type EvalMode,
  type EvalSuite,
} from "@/api/agent"
import type { AdminProfile } from "@/types/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
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

export function AgentEvalPage({ role }: { role: AdminProfile["role"] }) {
  const [suite, setSuite] = useState<EvalSuite>("all")
  const [mode, setMode] = useState<EvalMode>("fixture")
  const [caseCount, setCaseCount] = useState(0)
  const [summary, setSummary] = useState<AgentEvalSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canRun = role === "ADMIN" || role === "SUPER"

  useEffect(() => {
    let cancelled = false
    getAgentEvalCases(suite)
      .then((result) => {
        if (!cancelled) setCaseCount(result.cases.length)
      })
      .catch(() => {
        if (!cancelled) setCaseCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [suite])

  async function runEvaluation() {
    setLoading(true)
    setError("")
    try {
      setSummary(await runAgentEval(suite, mode))
    } catch (requestError) {
      setSummary(null)
      setError(
        requestError instanceof Error ? requestError.message : "Agent Eval 运行失败"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="rounded-none shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical />
            评测运行
          </CardTitle>
          <CardDescription>
            Fixture 不访问外部服务；Live 会调用 Backend、MCP 和路线服务。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="sm:grid sm:grid-cols-[220px_220px_auto] sm:items-end">
            <Field>
              <FieldLabel>评测套件</FieldLabel>
              <Select
                value={suite}
                onValueChange={(value) => setSuite(value as EvalSuite)}
              >
                <SelectTrigger className="w-full rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="maintenance">运营智能体</SelectItem>
                    <SelectItem value="guide">游客导览</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{caseCount} 个用例</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>运行模式</FieldLabel>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as EvalMode)}
              >
                <SelectTrigger className="w-full rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="fixture">Fixture</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                {mode === "live" ? "需要本地服务配置完整" : "确定性本地回归"}
              </FieldDescription>
            </Field>
            <Button
              type="button"
              className="w-fit rounded-none"
              disabled={!canRun || loading}
              onClick={() => void runEvaluation()}
            >
              <Play data-icon="inline-start" />
              {loading ? "运行中..." : "运行评测"}
            </Button>
          </FieldGroup>
          {error ? (
            <Field data-invalid className="mt-4">
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
          {!canRun ? (
            <p className="mt-4 text-sm text-muted-foreground">
              当前账号只有读取权限，运行评测需要 admin 或 super。
            </p>
          ) : null}
        </CardContent>
      </Card>

      {summary ? (
        <section className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="通过率" value={`${Math.round(summary.passRate * 100)}%`} />
            <MetricCard label="平均分" value={String(summary.averageOverall)} />
            <MetricCard label="通过" value={`${summary.passed}/${summary.total}`} />
            <MetricCard
              label="门禁"
              value={
                summary.passRate >= summary.minPassRate &&
                summary.averageOverall >= summary.minOverall
                  ? "PASS"
                  : "FAIL"
              }
            />
          </div>

          <Card className="rounded-none shadow-none">
            <CardHeader>
              <CardTitle>用例结果</CardTitle>
              <CardDescription>
                {summary.suite} · {summary.mode} ·{" "}
                {new Date(summary.generatedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Suite</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.results.map((result) => (
                    <TableRow key={result.caseId}>
                      <TableCell className="max-w-64 font-medium">
                        <span className="block truncate">{result.caseId}</span>
                      </TableCell>
                      <TableCell>{result.suite}</TableCell>
                      <TableCell>{result.overall}</TableCell>
                      <TableCell>
                        <Badge
                          variant={result.passed ? "default" : "destructive"}
                          className="rounded-none"
                        >
                          {result.passed ? "PASS" : "FAIL"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.latencyMs === undefined
                          ? "-"
                          : `${result.latencyMs} ms`}
                      </TableCell>
                      <TableCell>
                        <details className="min-w-56">
                          <summary className="cursor-pointer select-none">
                            查看
                          </summary>
                          <div className="mt-2 grid gap-2 text-xs">
                            <p className="whitespace-pre-wrap">
                              {result.trace.output}
                            </p>
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap bg-muted/30 p-2">
                              {JSON.stringify(result.metrics, null, 2)}
                            </pre>
                            {result.failureReasons.length ? (
                              <p className="text-destructive">
                                {result.failureReasons.join("；")}
                              </p>
                            ) : null}
                            {result.trace.toolCalls.length ? (
                              <p className="break-all text-muted-foreground">
                                Tools:{" "}
                                {result.trace.toolCalls
                                  .map((tool) => tool.name)
                                  .join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
