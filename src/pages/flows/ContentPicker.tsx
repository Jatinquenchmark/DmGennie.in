import { useState } from "react";
import { X, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaItem {
  id: string;
  title: string;
  type?: string;
  caption?: string;
  color?: string;
  metric?: string;
  thumbnailUrl?: string;
}

// Modal grid to pick specific posts/stories (or "All"). Mirrors the keyword builder's
// content selector but standalone for the flow builder's Start node.
export function ContentPicker({
  kind,
  items,
  connected,
  loading,
  initial,
  onClose,
  onConfirm,
}: {
  kind: "post" | "story";
  items: MediaItem[];
  connected: boolean;
  loading: boolean;
  initial: string[];
  onClose: () => void;
  onConfirm: (titles: string[]) => void;
}) {
  const allLabel = kind === "post" ? "All posts & reels" : "All stories";
  const [selected, setSelected] = useState<string[]>(initial.length ? initial : [allLabel]);
  const allSelected = selected.includes(allLabel);

  const toggle = (title: string) => {
    setSelected((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev.filter((t) => t !== allLabel), title]));
  };
  const pickAll = () => setSelected([allLabel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-border bg-card text-card-foreground shadow-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-base font-bold">Select {kind === "post" ? "posts / reels" : "stories"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={pickAll}
            className={cn("mb-3 flex w-full items-center justify-between rounded-control border p-3 text-left transition", allSelected ? "border-brand bg-brand/10" : "border-border hover:bg-muted")}
          >
            <span className="text-sm font-bold">{allLabel}</span>
            {allSelected && <Check className="h-4 w-4 text-brand" />}
          </button>

          {!connected ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Connect your Instagram account to pick specific {kind === "post" ? "posts" : "stories"}. You can still use “{allLabel}”.</p>
          ) : loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !items.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No {kind === "post" ? "posts" : "active stories"} found on your account.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {items.map((media) => {
                const on = selected.includes(media.title);
                return (
                  <button
                    key={media.id}
                    onClick={() => toggle(media.title)}
                    className={cn("group relative overflow-hidden rounded-control border text-left transition", on ? "border-brand ring-2 ring-brand/40" : "border-border hover:border-muted-foreground/40")}
                  >
                    <div className={cn("flex h-24 items-center justify-center bg-gradient-to-br text-white", media.color || "from-slate-400 to-slate-600")}>
                      {media.thumbnailUrl ? <img src={media.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 opacity-70" />}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-bold">{media.title}</p>
                      <p className="truncate text-2xs text-muted-foreground">{media.metric || media.type}</p>
                    </div>
                    {on && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><Check className="h-3 w-3" /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-xs font-medium text-muted-foreground">{allSelected ? allLabel : `${selected.length} selected`}</span>
          <button
            onClick={() => onConfirm(selected.length ? selected : [allLabel])}
            className="rounded-control bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
