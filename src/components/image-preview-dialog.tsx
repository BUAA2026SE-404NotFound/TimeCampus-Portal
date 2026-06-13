import { XIcon } from "lucide-react"
import { createPortal } from "react-dom"

export type ImagePreviewState = {
  src: string
  placeholderSrc?: string
  alt: string
  caption?: string
}

export function ImagePreviewDialog({
  image,
  onOpenChange,
}: {
  image: ImagePreviewState | null
  onOpenChange: (open: boolean) => void
}) {
  if (!image) {
    return null
  }

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="影像预览"
      className="fixed inset-0 z-[2147483647] grid cursor-zoom-out place-items-center bg-transparent p-3 font-mono sm:p-6"
      onClick={() => onOpenChange(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onOpenChange(false)
        }
      }}
      tabIndex={0}
    >
      <figure
        className="relative grid h-[min(82svh,760px)] w-[min(94vw,1120px)] cursor-default grid-rows-[minmax(0,1fr)_auto] overflow-hidden border bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-10 grid size-9 place-items-center border bg-background/95 text-foreground shadow-sm transition hover:border-primary hover:text-primary focus:ring-2 focus:ring-ring focus:outline-none"
          aria-label="关闭影像预览"
          onClick={() => onOpenChange(false)}
        >
          <XIcon className="size-4" />
        </button>
        <button
          type="button"
          className="relative size-full min-h-0 min-w-0 cursor-zoom-out overflow-hidden bg-muted/20 focus:outline-none"
          aria-label="关闭影像预览"
          onClick={() => onOpenChange(false)}
        >
          <span className="absolute inset-3 sm:inset-5">
            <img
              src={image.src}
              alt={image.alt}
              className="absolute inset-0 size-full object-contain"
              loading="eager"
            />
          </span>
        </button>
        {image.caption ? (
          <figcaption className="truncate border-t bg-background px-4 py-3 text-xs text-muted-foreground">
            {image.caption}
          </figcaption>
        ) : null}
      </figure>
    </div>,
    document.body
  )
}
