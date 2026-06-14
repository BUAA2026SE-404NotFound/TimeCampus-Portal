import { useState } from "react"

import { mergeClassName } from "@/lib/utils"

type ProgressiveImageProps = {
  src?: string | null
  placeholderSrc?: string | null
  alt: string
  className?: string
  imageClassName?: string
  loading?: "eager" | "lazy"
  onClick?: () => void
  sizes?: string
}

export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  onClick,
  sizes,
}: ProgressiveImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const lowSrc = placeholderSrc && placeholderSrc !== src ? placeholderSrc : ""
  const loaded = Boolean(src) && loadedSrc === src

  return (
    <div
      className={mergeClassName(
        "relative overflow-hidden bg-muted",
        onClick && "cursor-zoom-in",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? alt : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick()
        }
      }}
    >
      {lowSrc ? (
        <img
          src={lowSrc}
          alt=""
          aria-hidden="true"
          className={mergeClassName(
            "absolute inset-0 size-full scale-105 object-cover blur-sm transition-opacity duration-500",
            loaded ? "opacity-0" : "opacity-100"
          )}
          loading={loading}
          decoding="async"
          sizes={sizes}
        />
      ) : null}
      {src ? (
        <img
          src={src}
          alt={alt}
          className={mergeClassName(
            "size-full object-cover transition duration-500",
            loaded ? "blur-0 opacity-100" : lowSrc ? "opacity-0" : "blur-sm",
            imageClassName
          )}
          loading={loading}
          decoding="async"
          sizes={sizes}
          onLoad={() => setLoadedSrc(src ?? null)}
        />
      ) : (
        <div className="grid size-full place-items-center text-sm text-muted-foreground">
          ?
        </div>
      )}
    </div>
  )
}
