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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { BLOCKS, DND_MIME, type BlockType, type FlowNodeData } from "./flowTypes";
import { FlowNode } from "./FlowNode";
import { BlockPalette } from "./BlockPalette";
import { NodeInspector } from "./NodeInspector";

// Every block type renders through the one generic FlowNode component.
const nodeTypes: NodeTypes = Object.fromEntries(
  Object.keys(BLOCKS).map((type) => [type, FlowNode]),
) as NodeTypes;

const makeNode = (type: BlockType, position: { x: number; y: number }): Node => ({
  id: crypto.randomUUID(),
  type,
  position,
  data: { type, ...structuredClone(BLOCKS[type].defaultData) } as FlowNodeData,
});

const initialNodes = (): Node[] => [makeNode("start", { x: 240, y: 40 })];

function Builder() {
  const navigate = useNavigate();
  const { id = "new" } = useParams();
  const authFetch = useAuthFetch();
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled flow");
  const [enabled, setEnabled] = useState(false);
  const [flowId, setFlowId] = useState(id === "new" ? null : id);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(id !== "new");

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
    return () => {
      cancelled = true;
    };
  }, [id, authFetch, setNodes, setEdges]);

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

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const updateNodeData = useCallback(
    (key: string, value: unknown) => {
      setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, [key]: value } } : n)));
    },
    [selectedId, setNodes],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges]);

  const save = useCallback(async () => {
    setSaving(true);
    // Strip transient selection flags from the persisted graph.
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
      if (!res.ok) {
        toast.error(body?.message || "Couldn't save the flow.");
        return;
      }
      if (!flowId && body.id) {
        setFlowId(body.id);
        window.history.replaceState(null, "", `/dashboard/flows/${body.id}`);
      }
      toast.success("Flow saved.");
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, name, enabled, flowId, authFetch]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-bold text-foreground outline-none transition hover:border-border focus:border-border"
        />
        <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          {enabled ? "Live" : "Draft"}
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[#C13584] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ad2a75] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 border-r border-border bg-muted/30">
          <BlockPalette />
        </aside>

        <ResizablePanelGroup direction="horizontal" className="min-w-0 flex-1">
          <ResizablePanel defaultSize={72} minSize={40}>
            <div ref={wrapperRef} className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => setSelectedId(node.id)}
                  onPaneClick={() => setSelectedId(null)}
                  nodeTypes={nodeTypes}
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
              <NodeInspector node={selectedNode} onChange={updateNodeData} onDelete={deleteSelected} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
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
