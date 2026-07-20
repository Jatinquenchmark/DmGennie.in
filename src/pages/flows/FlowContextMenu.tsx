import { useEffect } from "react";
import { Scissors, Copy, ClipboardPaste, Link2, Trash2 } from "lucide-react";

export interface MenuState {
  x: number;
  y: number;
  nodeId: string;
}

// Lightweight right-click menu for flow nodes (Radix-in-canvas is fiddly, so a plain
// fixed-position menu). Closes on outside click / Escape.
export function FlowContextMenu({
  menu,
  canPaste,
  onCut,
  onCopy,
  onPaste,
  onLink,
  onDelete,
  onClose,
}: {
  menu: MenuState;
  canPaste: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onLink: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const items = [
    { label: "Cut", icon: Scissors, run: onCut, disabled: false },
    { label: "Copy", icon: Copy, run: onCopy, disabled: false },
    { label: "Paste", icon: ClipboardPaste, run: onPaste, disabled: !canPaste },
    { label: "Link to…", icon: Link2, run: onLink, disabled: false },
    { label: "Delete", icon: Trash2, run: onDelete, disabled: false, danger: true },
  ];

  return (
    <div
      className="fixed z-50 min-w-[168px] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      style={{ top: menu.y, left: menu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          disabled={item.disabled}
          onClick={() => { item.run(); onClose(); }}
          className={[
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium transition",
            item.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-muted",
            item.danger ? "text-destructive hover:bg-destructive/10" : "text-foreground",
          ].join(" ")}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
