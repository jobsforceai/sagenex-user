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
    case "ACTIVE": return "#34d399";
    case "COMPLETED": case "MATURED": return "#D7AF35";
    case "PAUSED": return "#fbbf24";
    case "FAILED": return "#f87171";
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
              <strong className="text-[13px] text-[#ECEFF8] truncate">{user.fullName}</strong>
              {user.enrollmentStatus && (
                <span
                  className="ml-1.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                  style={{ background: sc + "20", color: sc }}
                >
                  {user.enrollmentStatus}
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-[#8B92AA]">ID: {user.userId}</div>
            {user.planType && (
              <div className="mt-0.5 text-[11px] text-[#8B92AA]">
                {user.planType === "gold" ? "Gold" : "Cash"} Plan
                {user.monthlyAmountUsd ? ` \u00b7 $${user.monthlyAmountUsd}/mo` : ""}
              </div>
            )}
            {user.completedMonths != null && user.totalMonths != null && (
              <div className="mt-1 h-1 w-full rounded-full bg-[#3c4256] overflow-hidden">
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
        border: isRoot ? "1.5px solid #D7AF35" : "1px solid #3c4256",
        borderRadius: 14,
        background: isRoot ? "#D7AF35" + "10" : "#1B1F2D",
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
      markerEnd: { type: MarkerType.ArrowClosed, color: "#D7AF35" },
      style: { stroke: "#D7AF35", strokeWidth: 1.5, opacity: 0.5 },
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
      <div className="rounded-[20px] border border-[#3c4256] bg-[#1B1F2D] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[#3c4256] px-5 py-4">
          <GitBranch className="h-4.5 w-4.5 text-[#D7AF35]" />
          <span className="text-sm font-bold text-[#ECEFF8]">SGNX Gold Referral Tree</span>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#D7AF35]" />
          </div>
        )}

        {error && (
          <div className="px-5 py-10 text-center text-sm text-[#8B92AA]">{error}</div>
        )}

        {!loading && !error && tree && !hasChildren && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[#8B92AA]">No referrals yet in your SGNX Gold tree.</p>
            <p className="mt-1 text-xs text-[#4a5068]">Share your referral code to build your network.</p>
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
                style={{ background: "#252A3A", borderColor: "#3c4256", borderRadius: 10 }}
              />
              <Background color="#3c4256" gap={20} />
            </ReactFlow>
          </div>
        )}

        {!visible && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 rounded-full bg-[#252A3A] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
