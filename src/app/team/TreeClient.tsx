"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { transformDataToFlow } from "@/lib/utils";
import { UserNode } from "@/types";
import { Expand, Lock, Maximize2, Minus, Plus, Search, Unlock } from "lucide-react";
import { getTeamNodeSubtree, findUserInDownline } from "@/actions/user";
import { toast } from "sonner";

interface TreeClientProps {
  tree: UserNode;
}

const TreeClient = ({ tree: initialTree }: TreeClientProps) => {
  const [tree, setTree] = useState<UserNode>(initialTree);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const [locked, setLocked] = useState(false);
  const [expanding, setExpanding] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);

  const { nodes, edges } = useMemo(() => transformDataToFlow(tree), [tree]);

  // Merge a freshly-fetched subtree into the in-memory tree at the matching node.
  const mergeSubtree = useCallback((subtree: UserNode) => {
    setTree((prev) => mergeNodeInTree(prev, subtree));
  }, []);

  const expandNode = useCallback(async (userId: string) => {
    if (expanding.has(userId)) return;
    setExpanding((s) => new Set(s).add(userId));
    try {
      const { subtree } = await getTeamNodeSubtree(userId, 2);
      if (subtree) mergeSubtree(subtree);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to expand node";
      toast.error(msg);
    } finally {
      setExpanding((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    }
  }, [expanding, mergeSubtree]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      const target = findNodeInTree(tree, node.id);
      if (!target) return;
      const loadedKids = target.children?.length ?? 0;
      const totalKids = target.childrenCount ?? loadedKids;
      if (totalKids > loadedKids) {
        void expandNode(node.id);
      }
    },
    [tree, expandNode]
  );

  const handleSearch = useCallback(async () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setSearching(true);
    try {
      const result = await findUserInDownline(trimmed);
      const path: string[] = result?.ancestorPath ?? [];
      // Expand every ancestor along the path so the target becomes visible.
      for (const ancestorId of path) {
        const node = findNodeInTree(tree, ancestorId);
        if (!node) {
          // Ancestor not yet loaded — fetch it. Then re-resolve.
          await expandNode(ancestorId);
        } else if ((node.childrenCount ?? 0) > (node.children?.length ?? 0)) {
          await expandNode(ancestorId);
        }
      }
      // Center on target if it ended up in view.
      setTimeout(() => flow?.fitView({ padding: 0.3, duration: 500, nodes: [{ id: trimmed }] as never }), 250);
      toast.success(`Found ${trimmed} in your downline`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "User not found in your downline";
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  }, [searchInput, tree, expandNode, flow]);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">Team Structure</h2>
          <p className="mt-1 text-xs text-[#64748B]">Click any node to expand the next 2 levels.</p>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-300" />Inactive</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C8103E]" />Left</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#C8103E] focus-within:ring-2 focus-within:ring-[#C8103E]/20">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Find user ID e.g. U3458"
              className="w-44 bg-transparent text-sm font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !searchInput.trim()}
              className="rounded-md bg-[#C8103E] px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              {searching ? "…" : "Go"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => flow?.fitView({ padding: 0.2, duration: 500 })}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F172A] shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
          >
            <Expand className="h-4 w-4" />
            Fit View
          </button>
        </div>
      </div>

      <div className="relative mt-5 h-[640px] overflow-hidden rounded-3xl border border-slate-100 bg-[radial-gradient(circle_at_50%_0%,rgba(236,253,245,0.65),transparent_34%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.25}
          maxZoom={1.6}
          nodesDraggable={!locked}
          nodesConnectable={false}
          panOnDrag={!locked}
          zoomOnScroll={!locked}
          zoomOnPinch={!locked}
          onInit={setFlow}
          onNodeClick={handleNodeClick}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#E2E8F0" gap={22} size={1} />
        </ReactFlow>

        <div className="absolute bottom-8 left-7 z-10 flex flex-col gap-2">
          {[
            { label: "Zoom in", icon: Plus, onClick: () => flow?.zoomIn({ duration: 220 }) },
            { label: "Zoom out", icon: Minus, onClick: () => flow?.zoomOut({ duration: 220 }) },
            { label: "Fit view", icon: Maximize2, onClick: () => flow?.fitView({ padding: 0.2, duration: 500 }) },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLocked((value) => !value)}
            aria-label={locked ? "Unlock tree" : "Lock tree"}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F172A] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
          >
            {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        </div>

        <div className="absolute bottom-8 right-7 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 text-xs text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="space-y-2">
            <p><span className="mr-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">Green</span> Active Members</p>
            <p><span className="mr-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Gray</span> Inactive Members</p>
            <p><span className="mr-2 inline-block rounded-full bg-[#FFF1F4] px-2 py-1 text-[10px] font-bold text-[#C8103E]">Red</span> Left Members</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TreeClient;

// Recursively find a node in the tree by userId.
function findNodeInTree(root: UserNode, userId: string): UserNode | null {
  if (root.userId === userId) return root;
  for (const child of root.children || []) {
    const hit = findNodeInTree(child, userId);
    if (hit) return hit;
  }
  return null;
}

// Replace the matching node in the tree with the freshly-fetched subtree.
function mergeNodeInTree(root: UserNode, subtree: UserNode): UserNode {
  if (root.userId === subtree.userId) {
    return { ...root, ...subtree };
  }
  return {
    ...root,
    children: (root.children || []).map((c) => mergeNodeInTree(c, subtree)),
  };
}
