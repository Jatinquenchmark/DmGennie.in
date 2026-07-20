import type { Edge, Node } from "@xyflow/react";
import { BLOCKS, type FlowNodeData } from "./flowTypes";

// Graph reasoning for the flow builder: handle availability, orphan-connection
// suggestions, one-click auto-connect, and validation warnings.
// ponytail: all heuristics are intentionally simple (nearest-below, y-sort chaining).
// Good enough for the guided UX; swap for a real layout/graph pass only if flows get big.

const nodeType = (n: Node) => (n.data as FlowNodeData).type;

export function freeSourceHandles(node: Node, edges: Edge[]): string[] {
  const spec = BLOCKS[nodeType(node)];
  if (!spec) return [];
  const used = new Set(edges.filter((e) => e.source === node.id).map((e) => e.sourceHandle || spec.sources[0]?.id));
  return spec.sources.filter((s) => !used.has(s.id)).map((s) => s.id);
}

export function hasIncoming(node: Node, edges: Edge[]): boolean {
  return edges.some((e) => e.target === node.id);
}

export interface Suggestion {
  id: string; // stable id for the suggested edge
  source: string;
  sourceHandle: string;
  target: string;
}

// Suggest connecting each block with a free output to the nearest block below it
// that has no incoming connection yet. Bounded to keep the canvas quiet.
export function suggestConnections(nodes: Node[], edges: Edge[]): Suggestion[] {
  const out: Suggestion[] = [];
  const taken = new Set<string>(); // target ids already claimed by a suggestion
  for (const node of nodes) {
    if (nodeType(node) !== "start" && !hasIncoming(node, edges)) continue; // only extend reachable chains + start
    const free = freeSourceHandles(node, edges);
    if (!free.length) continue;
    const candidates = nodes
      .filter((n) => n.id !== node.id && !hasIncoming(n, edges) && !taken.has(n.id) && nodeType(n) !== "start" && n.position.y > node.position.y - 20)
      .sort((a, b) => dist(node, a) - dist(node, b));
    const target = candidates[0];
    if (!target) continue;
    taken.add(target.id);
    out.push({ id: `sugg-${node.id}-${target.id}`, source: node.id, sourceHandle: free[0], target: target.id });
    if (out.length >= 4) break;
  }
  return out;
}

function dist(a: Node, b: Node) {
  return Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
}

// One-click: chain nodes top-to-bottom, returning only the NEW edges to add (the
// caller applies its own marker/style). Adds an edge where an output is free and the
// next node has no incoming connection.
export function autoConnect(nodes: Node[], edges: Edge[]): { source: string; sourceHandle: string; target: string }[] {
  const ordered = [...nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const working = [...edges];
  const additions: { source: string; sourceHandle: string; target: string }[] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i];
    const to = ordered[i + 1];
    if (hasIncoming(to, working)) continue;
    const free = freeSourceHandles(from, working);
    if (!free.length) continue;
    const add = { source: from.id, sourceHandle: free[0], target: to.id };
    additions.push(add);
    working.push({ id: `e-${from.id}-${to.id}`, ...add } as Edge);
  }
  return additions;
}

// Non-blocking validation warnings surfaced in the header.
export function flowIssues(nodes: Node[], edges: Edge[]): string[] {
  const issues: string[] = [];
  const outputs = nodes.filter((n) => ["message", "buttons", "image"].includes(nodeType(n)));
  if (!outputs.length) issues.push("This flow has no message to send — add a Send Message, Buttons, or Image block.");
  const start = nodes.find((n) => nodeType(n) === "start");
  if (start && !edges.some((e) => e.source === start.id)) {
    issues.push("Connect your Start block to the next step.");
  }
  return issues;
}
