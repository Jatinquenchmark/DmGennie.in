import { useState } from "react";
import { Trash2, Plus, X, Images } from "lucide-react";
import type { Node } from "@xyflow/react";
import { BLOCKS, type FieldSpec, type FlowNodeData } from "./flowTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ContentPicker, type MediaItem } from "./ContentPicker";

export interface BuilderMedia {
  connected: boolean;
  loading: boolean;
  posts: MediaItem[];
  stories: MediaItem[];
}

// Right rail: edits the selected node's data using the field schema from the registry.
export function NodeInspector({
  node,
  media,
  onChange,
  onDelete,
}: {
  node: Node | null;
  media: BuilderMedia;
  onChange: (key: string, value: unknown) => void;
  onDelete: () => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">Select a block to edit it, or drag a new one onto the canvas.</p>
      </div>
    );
  }

  const data = node.data as FlowNodeData;
  const spec = BLOCKS[data.type];
  if (!spec) return null;
  const Icon = spec.icon;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: spec.accent }}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{spec.label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{spec.description}</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {spec.fields.map((field) =>
          field.type === "content" ? (
            <ContentField key={field.key} data={data} media={media} value={data[field.key]} onChange={(v) => onChange(field.key, v)} />
          ) : (
            <Field key={field.key} field={field} value={data[field.key]} onChange={(v) => onChange(field.key, v)} accent={spec.accent} />
          ),
        )}
      </div>

      {spec.type !== "start" && (
        <div className="border-t border-border p-3">
          <button
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 py-2 text-sm font-bold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete block
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
  accent,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
  accent: string;
}) {
  const label = (
    <label className="mb-1.5 block text-xs font-bold text-foreground">{field.label}</label>
  );

  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <Textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          value={String(value ?? field.options?.[0] ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "buttons" || field.type === "keywords") {
    return <ListField label={field.label} items={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} placeholder={field.placeholder} accent={accent} />;
  }

  return (
    <div>
      {label}
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}

function ListField({
  label,
  items,
  onChange,
  placeholder,
  accent,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  accent: string;
}) {
  const add = () => onChange([...items, ""]);
  const update = (i: number, v: string) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-foreground">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
            <button onClick={() => remove(i)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className={cn("flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80")}
          style={{ color: accent }}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

// Instagram post/story picker — only relevant when the Start trigger is post- or story-based.
function ContentField({
  data,
  media,
  value,
  onChange,
}: {
  data: FlowNodeData;
  media: BuilderMedia;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerType = String(data.triggerType ?? "");
  const kind = triggerType === "Story reply" ? "story" : triggerType === "Post or Reel comment" ? "post" : null;
  if (!kind) return null; // DM keyword / Live comment don't select content

  const selected = Array.isArray(value) ? (value as string[]) : [];
  const summary = selected.length ? selected.join(", ") : kind === "post" ? "All posts & reels" : "All stories";

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-foreground">Which {kind === "post" ? "posts / reels" : "stories"}?</label>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-foreground transition hover:border-muted-foreground/50"
      >
        <Images className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{summary}</span>
      </button>
      {open && (
        <ContentPicker
          kind={kind}
          items={kind === "post" ? media.posts : media.stories}
          connected={media.connected}
          loading={media.loading}
          initial={selected}
          onClose={() => setOpen(false)}
          onConfirm={(titles) => { onChange(titles); setOpen(false); }}
        />
      )}
    </div>
  );
}
