import { PALETTE_BLOCKS, DND_MIME, type BlockType } from "./flowTypes";

// Left rail: draggable block types. Native HTML5 drag — the canvas handles onDrop.
export function BlockPalette() {
  const onDragStart = (event: React.DragEvent, type: BlockType) => {
    event.dataTransfer.setData(DND_MIME, type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
      <p className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Blocks</p>
      {PALETTE_BLOCKS.map((block) => {
        const Icon = block.icon;
        return (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => onDragStart(e, block.type)}
            className="flex cursor-grab select-none items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition hover:border-transparent hover:shadow-sm active:cursor-grabbing"
            style={{ ["--hover" as string]: block.accent }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: block.accent }}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{block.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{block.description}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
