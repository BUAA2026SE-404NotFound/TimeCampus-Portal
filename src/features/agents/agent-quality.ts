export type AgentQualityScore = {
  grounding: number
  actionSafety: number
  completeness: number
  citationDensity: number
  overall: number
}

export type AgentQualitySignal = {
  citedItems: number
  plannedActions: number
  destructiveActions: number
  unresolvedRisks: number
  requiredFields: number
  completedFields: number
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreAgentOutput(signal: AgentQualitySignal): AgentQualityScore {
  const grounding = clampScore(signal.citedItems * 24)
  const actionSafety = clampScore(
    100 - signal.destructiveActions * 28 - signal.unresolvedRisks * 16
  )
  const completeness = clampScore(
    signal.requiredFields === 0
      ? 100
      : (signal.completedFields / signal.requiredFields) * 100
  )
  const citationDensity = clampScore(
    signal.plannedActions === 0
      ? 100
      : (signal.citedItems / signal.plannedActions) * 55
  )

  return {
    grounding,
    actionSafety,
    completeness,
    citationDensity,
    overall: clampScore(
      grounding * 0.3 +
        actionSafety * 0.3 +
        completeness * 0.25 +
        citationDensity * 0.15
    ),
  }
}

export function qualityBand(score: number) {
  if (score >= 85) return "可执行"
  if (score >= 70) return "需复核"
  return "需补证"
}
