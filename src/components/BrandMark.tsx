// The one DMGennie mark: magenta tile, white strokes, pink dot. Size via `size` or className.
export function BrandMark({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <rect width="40" height="40" rx="10" fill="#C13584" />
      <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="29" cy="27" r="3" fill="#f5a9c4" />
    </svg>
  )
}
