import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BLOCKS, type FlowNodeData } from "./flowTypes";
import { cn } from "@/lib/utils";

// One generic node renderer for every block type. Header colour, icon, body
// preview and handles all come from the block registry (flowTypes.ts).
function FlowNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const spec = BLOCKS[nodeData.type];
  if (!spec) return null;
  const Icon = spec.icon;
  const summary = spec.preview(nodeData);

  return (
    <div
      className={cn(
        "w-60 select-none rounded-2xl border bg-card text-card-foreground shadow-sm transition",
        selected ? "border-transparent ring-2 ring-offset-2 ring-offset-background" : "border-border",
      )}
      style={selected ? ({ "--tw-ring-color": spec.accent } as React.CSSProperties) : undefined}
    >
      {spec.hasTarget && (
        <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-background" style={{ background: spec.accent }} />
      )}

      <div className="flex items-center gap-2 rounded-t-2xl px-3 py-2" style={{ background: `${spec.accent}14` }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: spec.accent }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold" style={{ color: spec.accent }}>
          {spec.label}
        </span>
      </div>

      <div className="px-3 py-2.5">
        <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{summary}</p>
      </div>

      {spec.sources.length > 1 ? (
        <div className="flex justify-around border-t border-border px-2 py-1.5">
          {spec.sources.map((s) => (
            <span key={s.id} className="relative text-[10px] font-bold text-muted-foreground">
              {s.label}
              <Handle
                type="source"
                id={s.id}
                position={Position.Bottom}
                className="!h-3 !w-3 !border-2 !border-background"
                style={{ background: spec.accent, bottom: -14, left: "50%" }}
              />
            </span>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          id={spec.sources[0]?.id}
          position={Position.Bottom}
          className="!h-3 !w-3 !border-2 !border-background"
          style={{ background: spec.accent }}
        />
      )}
    </div>
  );
}

export const FlowNode = memo(FlowNodeComponent);
