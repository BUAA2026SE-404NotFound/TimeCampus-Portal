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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="影像预览"
      className="fixed inset-0 z-[2147483647] grid cursor-zoom-out place-items-center bg-transparent p-4 font-mono"
      onClick={() => onOpenChange(false)}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          onOpenChange(false)
        }
      }}
      tabIndex={0}
    >
      <figure className="grid size-full place-items-center">
        <img
          src={image.src}
          alt={image.alt}
          className="max-h-[96svh] max-w-[96vw] object-contain shadow-2xl"
          loading="eager"
        />
      </figure>
    </div>
  )
}
