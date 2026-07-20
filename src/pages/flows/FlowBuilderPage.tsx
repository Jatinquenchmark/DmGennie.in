import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Save, Loader2, Sparkles, Link2, AlertTriangle, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { usePageTour, startTour } from "@/lib/usePageTour";
import { BLOCKS, DND_MIME, type BlockType, type FlowNodeData } from "./flowTypes";
import { freeSourceHandles, suggestConnections, autoConnect, flowIssues } from "./flowGraph";
import { FlowNode } from "./FlowNode";
import { BlockPalette } from "./BlockPalette";
import { NodeInspector, type BuilderMedia } from "./NodeInspector";
import { FlowContextMenu, type MenuState } from "./FlowContextMenu";
import { SuggestedEdge } from "./SuggestedEdge";
import type { MediaItem } from "./ContentPicker";

const nodeTypes: NodeTypes = Object.fromEntries(
  Object.keys(BLOCKS).map((type) => [type, FlowNode]),
) as NodeTypes;

const edgeTypes: EdgeTypes = { suggested: SuggestedEdge };

const makeNode = (type: BlockType, position: { x: number; y: number }): Node => ({
  id: crypto.randomUUID(),
  type,
  position,
  data: { type, ...structuredClone(BLOCKS[type].defaultData) } as FlowNodeData,
});

const initialNodes = (): Node[] => [makeNode("start", { x: 240, y: 40 })];

const emptyMedia: BuilderMedia = { connected: false, loading: true, posts: [], stories: [] };

function Builder() {
  const navigate = useNavigate();
  const { id = "new" } = useParams();
  const authFetch = useAuthFetch();
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clipboard = useRef<{ type: BlockType; data: FlowNodeData } | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled flow");
  const [enabled, setEnabled] = useState(false);
  const [flowId, setFlowId] = useState(id === "new" ? null : id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(id !== "new");
  const [media, setMedia] = useState<BuilderMedia>(emptyMedia);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  // Load an existing flow.
  useEffect(() => {
    if (id === "new") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`/api/flows?id=${id}`);
        if (!res.ok) throw new Error("not found");
        const flow = await res.json();
        if (cancelled) return;
        setName(flow.name || "Untitled flow");
        setEnabled(Boolean(flow.enabled));
        setNodes(flow.graph?.nodes?.length ? flow.graph.nodes : initialNodes());
        setEdges(flow.graph?.edges || []);
      } catch {
        if (!cancelled) toast.error("Couldn't load that flow.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, authFetch, setNodes, setEdges]);

  // Load the account's posts/stories for the Start-node content picker.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/instagram/media");
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        setMedia({
          connected: Boolean(body.connected),
          loading: false,
          posts: (body.posts || []) as MediaItem[],
          stories: (body.stories || []) as MediaItem[],
        });
      } catch {
        if (!cancelled) setMedia((m) => ({ ...m, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [authFetch]);

  // Cancel linking / close menu on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLinkingFrom(null); setMenu(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const connectNodes = useCallback(
    (source: string, target: string, sourceHandle?: string) =>
      setEdges((eds) => addEdge({ id: `e-${source}-${target}-${Date.now()}`, source, target, sourceHandle, markerEnd: { type: MarkerType.ArrowClosed }, animated: true }, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed }, animated: true }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(DND_MIME) as BlockType;
      if (!type || !BLOCKS[type]) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setNodes((nds) => nds.concat(makeNode(type, position)));
    },
    [screenToFlowPosition, setNodes],
  );

  // ── Node click: in linking mode, wire up; otherwise select. ──
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (linkingFrom && node.id !== linkingFrom) {
        const fromNode = nodes.find((n) => n.id === linkingFrom);
        const handle = fromNode ? freeSourceHandles(fromNode, edges)[0] : undefined;
        connectNodes(linkingFrom, node.id, handle);
        setLinkingFrom(null);
        return;
      }
      setSelectedId(node.id);
    },
    [linkingFrom, nodes, edges, connectNodes],
  );

  // ── Context-menu actions ──
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedId((cur) => (cur === nodeId ? null : cur));
  }, [setNodes, setEdges]);

  const copyNode = useCallback((nodeId: string) => {
    const n = nodes.find((x) => x.id === nodeId);
    if (n) clipboard.current = { type: (n.data as FlowNodeData).type, data: structuredClone(n.data) as FlowNodeData };
  }, [nodes]);

  const cutNode = useCallback((nodeId: string) => { copyNode(nodeId); deleteNode(nodeId); }, [copyNode, deleteNode]);

  const pasteAt = useCallback((clientX: number, clientY: number) => {
    const clip = clipboard.current;
    if (!clip) return;
    const position = screenToFlowPosition({ x: clientX + 24, y: clientY + 24 });
    const newNode: Node = { id: crypto.randomUUID(), type: clip.type, position, data: structuredClone(clip.data) };
    setNodes((nds) => nds.concat(newNode));
    setSelectedId(newNode.id);
  }, [screenToFlowPosition, setNodes]);

  const deleteSelected = useCallback(() => { if (selectedId) deleteNode(selectedId); }, [selectedId, deleteNode]);

  const runAutoConnect = useCallback(() => {
    const adds = autoConnect(nodes, edges);
    if (!adds.length) { toast("Everything is already connected."); return; }
    setEdges((eds) => [
      ...eds,
      ...adds.map((a) => ({ id: `e-${a.source}-${a.target}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, source: a.source, target: a.target, sourceHandle: a.sourceHandle, markerEnd: { type: MarkerType.ArrowClosed }, animated: true }) as Edge),
    ]);
    toast.success(`Connected ${adds.length} step${adds.length > 1 ? "s" : ""}.`);
  }, [nodes, edges, setEdges]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const updateNodeData = useCallback(
    (key: string, value: unknown) => {
      setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, [key]: value } } : n)));
    },
    [selectedId, setNodes],
  );

  // ── Smart-connect suggestions (dashed, pulsing, accept-to-connect) ──
  const suggestions = useMemo(() => suggestConnections(nodes, edges), [nodes, edges]);
  const suggestionEdges: Edge[] = suggestions.map((s) => ({
    id: s.id,
    source: s.source,
    target: s.target,
    sourceHandle: s.sourceHandle,
    type: "suggested",
    data: { onAccept: () => connectNodes(s.source, s.target, s.sourceHandle) },
  }));
  const displayEdges = [...edges, ...suggestionEdges];

  const issues = useMemo(() => flowIssues(nodes, edges), [nodes, edges]);

  usePageTour(loading ? null : "flows");

  const save = useCallback(async () => {
    setSaving(true);
    const graph = {
      nodes: nodes.map(({ id: nid, type, position, data }) => ({ id: nid, type, position, data })),
      edges: edges.map(({ id: eid, source, target, sourceHandle, targetHandle }) => ({ id: eid, source, target, sourceHandle, targetHandle })),
    };
    const startNode = nodes.find((n) => (n.data as FlowNodeData).type === "start");
    const triggerType = (startNode?.data as FlowNodeData | undefined)?.triggerType as string | undefined;
    const payload = { name, enabled, triggerType, graph };
    try {
      const res = flowId
        ? await authFetch(`/api/flows?id=${flowId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await authFetch("/api/flows", { method: "POST", body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body?.message || "Couldn't save the flow."); return; }
      if (!flowId && body.id) {
        setFlowId(body.id);
        window.history.replaceState(null, "", `/dashboard/flows/${body.id}`);
      }
      if (issues.length) toast.warning(issues[0]);
      else toast.success("Flow saved.");
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, name, enabled, flowId, authFetch, issues]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <button onClick={() => navigate("/dashboard")} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Back to dashboard">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-bold text-foreground outline-none transition hover:border-border focus:border-border"
        />

        {issues.length > 0 && (
          <span title={issues.join("\n")} className="hidden items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-600 sm:inline-flex">
            <AlertTriangle className="h-3.5 w-3.5" /> {issues.length} warning{issues.length > 1 ? "s" : ""}
          </span>
        )}

        <button onClick={() => startTour("flows", true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Replay tutorial" aria-label="Replay tutorial">
          <CircleHelp className="h-4.5 w-4.5" />
        </button>

        <button data-tour="fb-autoconnect" onClick={runAutoConnect} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground transition hover:bg-muted" title="Auto-connect the blocks top-to-bottom">
          <Sparkles className="h-4 w-4" /> Auto-connect
        </button>

        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          {enabled ? "Live" : "Draft"}
        </label>
        <button data-tour="fb-save" onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#C13584] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ad2a75] disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </header>

      {/* Linking hint */}
      {linkingFrom && (
        <div className="flex items-center justify-center gap-2 bg-[#C13584] px-4 py-1.5 text-xs font-bold text-white">
          <Link2 className="h-3.5 w-3.5" /> Click a block to link to it · press Esc to cancel
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <aside data-tour="fb-palette" className="w-60 shrink-0 border-r border-border bg-muted/30">
          <BlockPalette />
        </aside>

        <ResizablePanelGroup direction="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize={72} minSize={40}>
            <div ref={wrapperRef} data-tour="fb-canvas" className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={displayEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onNodeDragStart={(_, node) => setSelectedId(node.id)}
                  onNodeContextMenu={(e, node) => { e.preventDefault(); setSelectedId(node.id); setMenu({ x: e.clientX, y: e.clientY, nodeId: node.id }); }}
                  onPaneContextMenu={(e) => { e.preventDefault(); setMenu(null); }}
                  onPaneClick={() => { setSelectedId(null); setMenu(null); }}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={16} color="var(--border)" />
                  <Controls className="!border-border" />
                  <MiniMap pannable zoomable className="!bg-card" nodeColor={(n) => BLOCKS[(n.data as FlowNodeData).type]?.accent || "#94a3b8"} />
                </ReactFlow>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <div className="h-full border-l border-border bg-card">
              <NodeInspector node={selectedNode} media={media} onChange={updateNodeData} onDelete={deleteSelected} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {menu && (
        <FlowContextMenu
          menu={menu}
          canPaste={Boolean(clipboard.current)}
          onCut={() => cutNode(menu.nodeId)}
          onCopy={() => copyNode(menu.nodeId)}
          onPaste={() => pasteAt(menu.x, menu.y)}
          onLink={() => setLinkingFrom(menu.nodeId)}
          onDelete={() => deleteNode(menu.nodeId)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

export default function FlowBuilderPage() {
  return (
    <ReactFlowProvider>
      <Builder />
    </ReactFlowProvider>
  );
}
