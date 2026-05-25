import type React from "react"
import type { CapWidget } from "cap-widget"

declare module "cap-widget/cap-floating.min.js"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "cap-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<CapWidget>,
        CapWidget
      > & {
        class?: string
        required?: boolean | ""
        "data-cap-api-endpoint"?: string
        "data-cap-hidden-field-name"?: string
        "data-cap-i18n-initial-state"?: string
        "data-cap-i18n-verifying-label"?: string
        "data-cap-i18n-solved-label"?: string
        "data-cap-i18n-error-label"?: string
        "data-cap-i18n-verify-aria-label"?: string
        "data-cap-i18n-verifying-aria-label"?: string
        "data-cap-i18n-verified-aria-label"?: string
        "data-cap-i18n-required-label"?: string
        "data-cap-i18n-error-aria-label"?: string
      }
    }
  }
}

export {}
