import { useEffect, useRef, useState } from "react"
import type {
  CapErrorEvent,
  CapProgressEvent,
  CapSolveEvent,
  CapWidget,
} from "cap-widget"

import capIcon from "@/assets/cap-icon-32x32.png"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription } from "@/components/ui/field"
import { mergeClassName } from "@/lib/utils"

const SOLVED_CLOSE_DELAY_MS = 1600

function decorateCapCredits(widget: CapWidget | null) {
  const credits =
    widget?.shadowRoot?.querySelector<HTMLAnchorElement>(".credits")
  if (!credits || credits.querySelector("[data-timecampus-cap-icon]")) return

  const icon = document.createElement("img")
  icon.src = capIcon
  icon.alt = ""
  icon.width = 16
  icon.height = 16
  icon.setAttribute("data-timecampus-cap-icon", "true")
  icon.style.cssText =
    "width:16px;height:16px;margin-inline-end:4px;object-fit:contain;display:inline-block;"
  credits.prepend(icon)
  credits.style.gap = "4px"
}

export function CapVerification({
  endpoint,
  value,
  onValueChange,
  resetSignal,
  skip,
}: {
  endpoint?: string
  value: string
  onValueChange: (token: string) => void
  resetSignal?: number
  /** 本地开发时跳过人机验证 */
  skip?: boolean
}) {
  const widgetRef = useRef<CapWidget | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)

  useEffect(() => {
    let active = true

    void import("cap-widget").then(() => {
      if (active) setWidgetReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const widget = widgetRef.current
    if (!widget) return

    function handleSolve(event: CapSolveEvent) {
      setError("")
      setProgress(100)
      onValueChange(event.detail.token)
      decorateCapCredits(widget)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false)
      }, SOLVED_CLOSE_DELAY_MS)
    }

    function handleProgress(event: CapProgressEvent) {
      setProgress(Math.round(event.detail.progress))
    }

    function handleError(event: CapErrorEvent) {
      setError(event.detail.message || "人机验证失败，请重试")
      onValueChange("")
    }

    function handleReset() {
      setProgress(0)
      setError("")
      onValueChange("")
    }

    decorateCapCredits(widget)
    const decorateTimer = window.setTimeout(() => decorateCapCredits(widget), 0)
    widget.addEventListener("solve", handleSolve)
    widget.addEventListener("progress", handleProgress)
    widget.addEventListener("error", handleError)
    widget.addEventListener("reset", handleReset)

    return () => {
      widget.removeEventListener("solve", handleSolve)
      widget.removeEventListener("progress", handleProgress)
      widget.removeEventListener("error", handleError)
      widget.removeEventListener("reset", handleReset)
      window.clearTimeout(decorateTimer)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [onValueChange, widgetReady])

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setOpen(false), 0)
    widgetRef.current?.reset()

    return () => window.clearTimeout(closeTimer)
  }, [endpoint, resetSignal])

  useEffect(() => {
    if (!open) return

    const decorateTimer = window.setTimeout(() => {
      decorateCapCredits(widgetRef.current)
    }, 0)

    return () => window.clearTimeout(decorateTimer)
  }, [open])

  useEffect(() => {
    if (!skip) return

    onValueChange("bypassed")

    return () => {
      onValueChange("")
    }
  }, [skip, onValueChange])

  if (skip) {
    return (
      <Field>
        <div className="flex items-center gap-2 border border-dashed border-emerald-500/50 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          人机验证已跳过（本地测试模式）
        </div>
        <FieldDescription>
          {endpoint
            ? "已启用 VITE_SKIP_CAPTCHA，人机验证已绕过。"
            : "未配置 VITE_CAP_API_ENDPOINT，人机验证已跳过。"}
        </FieldDescription>
      </Field>
    )
  }

  return (
    <Field>
      {endpoint ? (
        <>
          <Button
            type="button"
            variant="outline"
            className={mergeClassName(
              "w-full justify-start rounded-none font-mono",
              value && "border-primary text-primary"
            )}
            onClick={() => setOpen(true)}
          >
            <img
              src={capIcon}
              alt=""
              className="size-4 object-contain"
              aria-hidden="true"
            />
            {value ? "人机验证已通过" : "点击完成人机验证"}
          </Button>
          <div
            role="presentation"
            className={mergeClassName(
              "fixed inset-0 z-50 grid place-items-center px-4 transition-opacity",
              open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={(event) => {
              if (event.target === event.currentTarget && !value) {
                setOpen(false)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !value) {
                setOpen(false)
              }
            }}
          >
            <div className="border bg-card p-2 shadow-lg">
              {widgetReady ? (
                <cap-widget
                  ref={widgetRef}
                  required
                  class="timecampus-cap"
                  data-cap-api-endpoint={endpoint}
                  data-cap-hidden-field-name="capToken"
                  data-cap-i18n-initial-state="点击完成人机验证"
                  data-cap-i18n-verifying-label="验证中..."
                  data-cap-i18n-solved-label="验证通过"
                  data-cap-i18n-error-label="验证失败"
                  data-cap-i18n-verify-aria-label="点击进行人机验证"
                  data-cap-i18n-verifying-aria-label="正在验证，请稍候"
                  data-cap-i18n-verified-aria-label="人机验证已通过"
                  data-cap-i18n-required-label="请先完成人机验证"
                  data-cap-i18n-error-aria-label="人机验证失败，请重试"
                />
              ) : (
                <div
                  className="grid h-14 place-items-center text-sm text-muted-foreground"
                  style={{ width: "min(300px, calc(100vw - 32px))" }}
                >
                  正在加载验证组件...
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          未配置 Cap endpoint，本地开发将暂时跳过人机验证。
        </div>
      )}
      <FieldDescription>
        {error ||
          (value
            ? "已通过验证，请点击登录按钮"
            : endpoint
              ? progress > 0
                ? `验证进度 ${progress}%`
                : "验证通过后才能提交登录。"
              : "部署时请配置 VITE_CAP_API_ENDPOINT。")}
      </FieldDescription>
    </Field>
  )
}
