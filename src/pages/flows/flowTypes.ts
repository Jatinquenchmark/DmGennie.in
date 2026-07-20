import type { ComponentType } from "react";
import {
  Zap,
  MessageSquareText,
  MousePointerClick,
  Image as ImageIcon,
  GitBranch,
  Tag,
  Clock,
  type LucideProps,
} from "lucide-react";

// A ManyChat-style flow is just a graph of blocks. Every block type is described
// once here (icon, accent, handles, inspector fields, node preview) so the node
// renderer, palette and inspector all stay in sync from a single source of truth.

export type BlockType =
  | "start"
  | "message"
  | "buttons"
  | "image"
  | "condition"
  | "action"
  | "delay";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "number"
  | "select"
  | "buttons"
  | "keywords"
  | "content"; // Instagram post/story picker (Start block only)

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[]; // for select
}

export interface HandleSpec {
  id: string;
  label?: string;
}

export interface BlockSpec {
  type: BlockType;
  label: string;
  description: string;
  icon: ComponentType<LucideProps>;
  accent: string; // hex, used for the node header + handle color
  hasTarget: boolean; // incoming handle (start blocks have none)
  sources: HandleSpec[]; // outgoing handle(s); condition has yes/no
  fields: FieldSpec[];
  defaultData: Record<string, unknown>;
  // one-line summary shown in the node body
  preview: (data: Record<string, unknown>) => string;
}

const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v : fallback);
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

export const BLOCKS: Record<BlockType, BlockSpec> = {
  start: {
    type: "start",
    label: "Start",
    description: "When someone triggers this flow",
    icon: Zap,
    accent: "#C13584",
    hasTarget: false,
    sources: [{ id: "out" }],
    fields: [
      {
        key: "triggerType",
        label: "Trigger",
        type: "select",
        options: ["Post or Reel comment", "Story reply", "DM keyword", "Live comment"],
      },
      { key: "content", label: "Which content?", type: "content" },
      { key: "keywords", label: "Keywords", type: "keywords", placeholder: "Add a keyword" },
    ],
    defaultData: { triggerType: "Post or Reel comment", content: ["All posts & reels"], keywords: ["link"] },
    preview: (d) => {
      const kw = arr(d.keywords);
      return kw.length ? `${str(d.triggerType, "Trigger")} · ${kw.map((k) => `+${k}`).join(", ")}` : str(d.triggerType, "Set a trigger");
    },
  },
  message: {
    type: "message",
    label: "Send Message",
    description: "Send a text DM",
    icon: MessageSquareText,
    accent: "#405DE6",
    hasTarget: true,
    sources: [{ id: "out" }],
    fields: [{ key: "text", label: "Message", type: "textarea", placeholder: "Hey @username, thanks for reaching out!" }],
    defaultData: { text: "Hey @username, thanks for reaching out!" },
    preview: (d) => str(d.text, "Empty message"),
  },
  buttons: {
    type: "buttons",
    label: "Buttons",
    description: "Message with tappable buttons",
    icon: MousePointerClick,
    accent: "#833AB4",
    hasTarget: true,
    sources: [{ id: "out" }],
    fields: [
      { key: "text", label: "Message", type: "textarea", placeholder: "Pick an option:" },
      { key: "buttons", label: "Buttons", type: "buttons", placeholder: "Button label" },
    ],
    defaultData: { text: "Pick an option:", buttons: ["Get the link", "Talk to us"] },
    preview: (d) => {
      const b = arr(d.buttons);
      return b.length ? `${b.length} button${b.length > 1 ? "s" : ""}: ${b.join(", ")}` : "No buttons yet";
    },
  },
  image: {
    type: "image",
    label: "Image",
    description: "Send an image or media",
    icon: ImageIcon,
    accent: "#0EA5E9",
    hasTarget: true,
    sources: [{ id: "out" }],
    fields: [
      { key: "url", label: "Image URL", type: "url", placeholder: "https://…/image.jpg" },
      { key: "caption", label: "Caption", type: "text", placeholder: "Optional caption" },
    ],
    defaultData: { url: "", caption: "" },
    preview: (d) => str(d.url, "No image set"),
  },
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch on a rule",
    icon: GitBranch,
    accent: "#F59E0B",
    hasTarget: true,
    sources: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
    fields: [
      {
        key: "field",
        label: "If contact",
        type: "select",
        options: ["is a follower", "has tag", "replied before", "opened a DM"],
      },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. tag name" },
    ],
    defaultData: { field: "is a follower", value: "" },
    preview: (d) => `If ${str(d.field, "…")}${str(d.value) ? ` · ${str(d.value)}` : ""}`,
  },
  action: {
    type: "action",
    label: "Action",
    description: "Tag or update the contact",
    icon: Tag,
    accent: "#10B981",
    hasTarget: true,
    sources: [{ id: "out" }],
    fields: [
      { key: "action", label: "Action", type: "select", options: ["Add tag", "Remove tag", "Set field", "Subscribe to sequence"] },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. lead" },
    ],
    defaultData: { action: "Add tag", value: "lead" },
    preview: (d) => `${str(d.action, "Action")}${str(d.value) ? ` · ${str(d.value)}` : ""}`,
  },
  delay: {
    type: "delay",
    label: "Delay",
    description: "Wait before the next step",
    icon: Clock,
    accent: "#64748B",
    hasTarget: true,
    sources: [{ id: "out" }],
    fields: [
      { key: "amount", label: "Wait", type: "number", placeholder: "5" },
      { key: "unit", label: "Unit", type: "select", options: ["minutes", "hours", "days"] },
    ],
    defaultData: { amount: 5, unit: "minutes" },
    preview: (d) => `Wait ${d.amount ?? 0} ${str(d.unit, "minutes")}`,
  },
};

export const BLOCK_LIST = Object.values(BLOCKS);

// Blocks a user can drop from the palette (Start is auto-created, not draggable).
export const PALETTE_BLOCKS = BLOCK_LIST.filter((b) => b.type !== "start");

export interface FlowNodeData extends Record<string, unknown> {
  type: BlockType;
}

export const DND_MIME = "application/dmgenie-block";
