"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { Node, Edge, MarkerType } from "reactflow";
import { Loader2, GitBranch } from "lucide-react";
import { getSgnxGoldTree } from "@/actions/sgnxgold";

interface GoldTreeNode {
  userId: string;
  fullName: string;
  enrollmentStatus: string | null;
  planType: string | null;
  monthlyAmountUsd: number | null;
  completedMonths: number | null;
  totalMonths: number | null;
  children: GoldTreeNode[];
}

const NODE_W = 220;
const NODE_H = 100;

function statusColor(status: string | null): string {
  switch (status) {
    case "ACTIVE": return "#C41E3A";
    case "COMPLETED": case "MATURED": return "#8b6b1f";
    case "PAUSED": return "#6b7280";
    case "FAILED": return "#6b7280";
    default: return "#6b7280";
  }
}

function findNode(root: GoldTreeNode, userId: string): GoldTreeNode | null {
  const queue: GoldTreeNode[] = [root];
  while (queue.length) {
    const n = queue.shift()!;
    if (n.userId === userId) return n;
    if (n.children?.length) queue.push(...n.children);
  }
  return null;
}

function transformTree(tree: GoldTreeNode): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 90 });

  function traverse(node: GoldTreeNode) {
    g.setNode(node.userId, { width: NODE_W, height: NODE_H });
    if (node.children?.length) {
      for (const child of node.children) {
        g.setEdge(node.userId, child.userId);
        traverse(child);
      }
    }
  }
  traverse(tree);
  dagre.layout(g);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  g.nodes().forEach((nodeId: string) => {
    const pos = g.node(nodeId) as { x: number; y: number } | undefined;
    if (!pos) return;
    const user = findNode(tree, nodeId);
    if (!user) return;

    const sc = statusColor(user.enrollmentStatus);
    const isRoot = nodeId === tree.userId;

    nodes.push({
      id: user.userId,
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: {
        label: (
          <div className="p-2.5 text-left">
            <div className="flex items-center justify-between">
              <strong className="truncate text-[13px] text-[#111827]">{user.fullName}</strong>
              {user.enrollmentStatus && (
                <span
                  className="ml-1.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                  style={{ background: sc + "20", color: sc }}
                >
                  {user.enrollmentStatus}
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">ID: {user.userId}</div>
            {user.planType && (
              <div className="mt-0.5 text-[11px] text-zinc-400">
                {user.planType === "gold" ? "Gold" : "Cash"} Plan
                {user.monthlyAmountUsd ? ` \u00b7 \u20b9${user.monthlyAmountUsd}/mo` : ""}
              </div>
            )}
            {user.completedMonths != null && user.totalMonths != null && (
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#E8E8E8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(user.completedMonths / user.totalMonths) * 100}%`,
                    background: sc,
                  }}
                />
              </div>
            )}
          </div>
        ),
      },
      style: {
        border: isRoot ? "1.5px solid #C41E3A" : "1px solid #E8E8E8",
        borderRadius: 14,
        background: isRoot ? "#C41E3A10" : "#ffffff",
        width: NODE_W,
      },
    });
  });

  g.edges().forEach((e) => {
    const edge = e as { v: string; w: string };
    edges.push({
      id: `${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#C41E3A" },
      style: { stroke: "#C41E3A", strokeWidth: 1.5, opacity: 0.45 },
    });
  });

  return { nodes, edges };
}

export default function SgnxGoldTree() {
  const [tree, setTree] = useState<GoldTreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Lazy-load: only fetch when section scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSgnxGoldTree();
      if (result?.error) { setError(result.error); }
      else { setTree(result.tree ?? null); }
    } catch { setError("Failed to load tree."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (visible) fetchTree(); }, [visible, fetchTree]);

  const { nodes, edges } = useMemo(
    () => (tree ? transformTree(tree) : { nodes: [], edges: [] }),
    [tree],
  );

  const hasChildren = tree && tree.children && tree.children.length > 0;

  return (
    <div ref={sentinelRef}>
      <div className="rounded-[20px] border border-[#E8E8E8] bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[#E8E8E8] px-5 py-4">
          <GitBranch className="h-4.5 w-4.5 text-[#C41E3A]" />
          <span className="text-sm font-bold text-[#111827]">SGNX Gold Referral Tree</span>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#C41E3A]" />
          </div>
        )}

        {error && (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">{error}</div>
        )}

        {!loading && !error && tree && !hasChildren && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-zinc-500">No referrals yet in your SGNX Gold tree.</p>
            <p className="mt-1 text-xs text-zinc-400">Share your referral code to build your network.</p>
          </div>
        )}

        {!loading && !error && hasChildren && (
          <div style={{ height: "55vh", width: "100%" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable
              nodesConnectable={false}
              proOptions={{ hideAttribution: true }}
            >
              <Controls
                style={{ background: "#ffffff", borderColor: "#E8E8E8", borderRadius: 10 }}
              />
              <Background color="#E8E8E8" gap={20} />
            </ReactFlow>
          </div>
        )}

        {!visible && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 rounded-full bg-[#E8E8E8] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
