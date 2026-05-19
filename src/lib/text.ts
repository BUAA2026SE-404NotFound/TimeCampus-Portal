export function textOr(value: string | null | undefined, fallback: string) {
  const text = value?.trim()

  return text || fallback
}
