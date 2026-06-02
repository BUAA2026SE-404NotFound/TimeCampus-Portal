import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

const sourcePath = join(process.cwd(), "src/features/agents/agent-quality.ts")
const source = readFileSync(sourcePath, "utf8")
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
})

const module = { exports: {} }
const execute = new Function("exports", "module", output.outputText)
execute(module.exports, module)

const { qualityBand, scoreAgentOutput } = module.exports

const strong = scoreAgentOutput({
  citedItems: 4,
  plannedActions: 4,
  destructiveActions: 0,
  unresolvedRisks: 0,
  requiredFields: 4,
  completedFields: 4,
})

assert.equal(strong.overall >= 85, true)
assert.equal(qualityBand(strong.overall), "可执行")

const risky = scoreAgentOutput({
  citedItems: 0,
  plannedActions: 3,
  destructiveActions: 1,
  unresolvedRisks: 2,
  requiredFields: 4,
  completedFields: 1,
})

assert.equal(risky.overall < 70, true)
assert.equal(qualityBand(risky.overall), "需补证")

console.log("agent quality checks passed")
