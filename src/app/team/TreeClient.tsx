"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { transformDataToFlow } from "@/lib/utils";
import { UserNode } from "@/types";
import { Expand, Lock, Maximize2, Minus, Plus, Unlock } from "lucide-react";

interface TreeClientProps {
  tree: UserNode;
}

const TreeClient = ({ tree }: TreeClientProps) => {
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const [locked, setLocked] = useState(false);
  const [level, setLevel] = useState(4);
  const visibleTree = useMemo(() => pruneTree(tree, level), [tree, level]);
  const { nodes, edges } = useMemo(
    () => transformDataToFlow(visibleTree),
    [visibleTree]
  );

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">Team Structure</h2>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-300" />Inactive</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#C8103E]" />Left</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => flow?.fitView({ padding: 0.2, duration: 500 })}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F172A] shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
          >
            <Expand className="h-4 w-4" />
            Fit View
          </button>
          <select
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F172A] shadow-sm focus:border-[#C8103E] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
            aria-label="Select tree depth"
          >
            {[2, 3, 4, 5, 6].map((item) => (
              <option key={item} value={item}>Level {item}</option>
            ))}
          </select>
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

function pruneTree(node: UserNode, maxDepth: number, depth = 1): UserNode {
  return {
    ...node,
    children:
      depth >= maxDepth
        ? []
        : (node.children || []).map((child) => pruneTree(child, maxDepth, depth + 1)),
  };
}
