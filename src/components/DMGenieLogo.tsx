import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { svg: 28, text: 'text-lg' },
  md: { svg: 34, text: 'text-xl' },
  lg: { svg: 44, text: 'text-2xl' },
}

export function DMGennieLogo({ size = 'md', className = '' }: LogoProps) {
  const { svg, text } = sizes[size]

  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 group select-none ${className}`}
      aria-label="DMGennie home"
    >
      {/* SVG replicates the brand: two diagonal slash strokes + dot */}
      <svg
        width={svg}
        height={svg}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#5b5ef4" fillOpacity="0.12" />
        <path
          d="M10 27 L19 13"
          stroke="#5b5ef4"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <path
          d="M17 27 L26 13"
          stroke="#5b5ef4"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        <circle cx="29" cy="27" r="3" fill="#5b5ef4" />
      </svg>

      <span
        className={`font-extrabold tracking-tight text-foreground group-hover:text-accent-blue transition-colors ${text}`}
      >
        DM<span className="text-accent-blue">Gennie</span>
      </span>
    </Link>
  )
}

export default DMGennieLogo
