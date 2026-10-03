import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";

type LoadingCardProps = {
  title?: string;
  subtitle?: string;
  detail?: string;
  className?: string;
};

function DMGennieLoadingMark() {
  return (
    <div className="relative mx-auto flex h-16 w-16 items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0 rounded-card border border-brand/20 bg-brand-soft" />
      <div className="absolute inset-[-6px] rounded-card border-2 border-brand/15 border-t-brand animate-spin" />
      <BrandMark size={36} className="relative animate-pulse" />
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-2 w-2 animate-bounce rounded-full bg-brand"
          style={{ animationDelay: `${dot * 140}ms` }}
        />
      ))}
    </div>
  );
}

export function LoadingCard({
  title = "Loading DMGennie",
  subtitle = "Preparing your Instagram automation workspace...",
  detail,
  className,
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-card border border-slate-200 bg-white px-8 py-9 text-center shadow-overlay",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <DMGennieLoadingMark />
      <div className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">DMGennie</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>
        {detail ? (
          <p className="mt-4 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
            {detail}
          </p>
        ) : null}
      </div>
      <LoadingDots />
    </div>
  );
}

export function LoadingScreen(props: LoadingCardProps) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(193, 53, 132,0.14),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(192,122,138,0.12),transparent_28%),linear-gradient(180deg,#fff_0%,#F7F7FB_58%,#FBEAF3_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/8 blur-3xl" />
      <div className="relative w-full">
        <LoadingCard {...props} />
      </div>
    </div>
  );
}

type SkeletonCardProps = {
  className?: string;
  rows?: number;
  showIcon?: boolean;
};

export function SkeletonCard({ className, rows = 3, showIcon = false }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-card border border-slate-200 bg-white p-5 shadow-raised", className)}>
      <div className="flex items-start gap-3">
        {showIcon ? <div className="dmgenie-shimmer h-11 w-11 rounded-card" /> : null}
        <div className="flex-1 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "dmgenie-shimmer h-3 rounded-full",
                index === 0 && "w-2/3",
                index === 1 && "w-full",
                index >= 2 && "w-1/2",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  text?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  text = "We couldn’t load your dashboard. Please refresh or try again.",
  retryLabel = "Retry",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-slate-50 px-5", className)}>
      <div className="w-full max-w-[440px] rounded-card border border-red-100 bg-white p-8 text-center shadow-overlay">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-slate-100 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-hover"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
