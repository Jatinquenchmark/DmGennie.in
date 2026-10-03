import { Check } from 'lucide-react'

type TrustChipsProps = {
  labels?: string[]
  variant?: 'light' | 'dark'
  className?: string
}

const defaultLabels = ['Official Meta Integration', 'No Credit Card', 'Instant Setup']

export function TrustChips({ labels = defaultLabels, variant = 'light', className = '' }: TrustChipsProps) {
  const isDark = variant === 'dark'

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {labels.map((label) => (
        <span
          key={label}
          className={
            isDark
              ? 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.075] px-4 py-2 text-sm font-bold text-white/70 shadow-raised backdrop-blur-xl'
              : 'inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-bold text-slate-500 backdrop-blur-xl'
          }
        >
          <span
            className={
              isDark
                ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[#f1bd51]/16 text-[#f1bd51]'
                : 'flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand'
            }
          >
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </span>
          {label}
        </span>
      ))}
    </div>
  )
}
