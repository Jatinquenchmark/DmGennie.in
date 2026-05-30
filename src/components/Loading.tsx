import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingCardProps = {
  title?: string;
  subtitle?: string;
  detail?: string;
  className?: string;
};

function DMGennieLoadingMark() {
  return (
    <div className="relative mx-auto flex h-16 w-16 items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0 rounded-2xl border border-[#5B4DFF]/20 bg-[#EEF0FF]" />
      <div className="absolute inset-[-6px] rounded-[1.4rem] border-2 border-[#5B4DFF]/15 border-t-[#5B4DFF] animate-spin" />
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative animate-pulse"
      >
        <rect width="40" height="40" rx="12" fill="#5B4DFF" />
        <path d="M10 27 L19 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M17 27 L26 13" stroke="white" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="29" cy="27" r="3" fill="white" />
      </svg>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-2 w-2 animate-bounce rounded-full bg-[#5B4DFF]"
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
        "w-full max-w-[420px] rounded-[24px] border border-[#E5E7EB] bg-white px-8 py-9 text-center shadow-[0_28px_80px_rgba(15,23,42,0.12)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <DMGennieLoadingMark />
      <div className="mt-6">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#5B4DFF]">DMGennie</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0F172A]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">{subtitle}</p>
        {detail ? (
          <p className="mt-4 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#64748B]">
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
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F7FB] px-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(91,77,255,0.14),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(192,122,138,0.12),transparent_28%),linear-gradient(180deg,#fff_0%,#F7F7FB_58%,#EEF0FF_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B4DFF]/8 blur-3xl" />
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
    <div className={cn("rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex items-start gap-3">
        {showIcon ? <div className="dmgenie-shimmer h-11 w-11 rounded-2xl" /> : null}
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
    <div className={cn("flex min-h-screen items-center justify-center bg-[#F7F7FB] px-5", className)}>
      <div className="w-full max-w-[440px] rounded-[24px] border border-[#FEE2E2] bg-white p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.10)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEECEC] text-[#EF4444]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-[#0F172A]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">{text}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#5B4DFF] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(91,77,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#4738E8]"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
