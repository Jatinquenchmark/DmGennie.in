import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { Check } from "lucide-react";

// A dashed, pulsing "suggested" connection with an inline Connect button.
// data.onAccept promotes it to a real edge.
export function SuggestedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const onAccept = (data as { onAccept?: () => void } | undefined)?.onAccept;
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: "#C13584", strokeWidth: 2, strokeDasharray: "6 4", opacity: 0.7 }} />
      <EdgeLabelRenderer>
        <button
          onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
          className="nodrag nopan pointer-events-auto absolute flex animate-pulse items-center gap-1 rounded-full bg-[#C13584] px-2 py-1 text-[10px] font-bold text-white shadow-md"
          style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
        >
          <Check className="h-3 w-3" /> Connect
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
