"use client";

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Node, Edge, MarkerType } from 'reactflow';
import dagre from 'dagre';
import { UserNode } from '@/types'; // your project types

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// React Flow node "data" type
type FlowData = {
  label: React.ReactNode;
};

const nodeWidth = 148;
const nodeHeight = 126;

// Small helpers to satisfy dagre's loose typings
type DagrePos = { x: number; y: number };
type DagreEdge = { v: string; w: string };

// Find a specific user within the nested tree data.
function findUserNode(root: UserNode, userId: string): UserNode | null {
  const queue: UserNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node && node.userId === userId) return node;
    if (node?.children?.length) {
      for (const child of node.children) queue.push(child);
    }
  }
  return null;
}

// Main transformation function.
export const transformDataToFlow = (
  tree: UserNode
): { nodes: Node<FlowData>[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 36, ranksep: 86 });

  const nodes: Node<FlowData>[] = [];
  const edges: Edge[] = [];

  // 1) Add parent → root edge (if parent exists)
  // if (parent) {
  //   dagreGraph.setNode(parent.userId, { width: nodeWidth, height: nodeHeight });
  //   dagreGraph.setEdge(parent.userId, tree.userId);
  // }

  // 2) Traverse user's downline to add nodes/edges
  function traverse(node: UserNode) {
    if (!node) {
      return;
    }
    dagreGraph.setNode(node.userId, { width: nodeWidth, height: nodeHeight });
    if (node.children?.length) {
      node.children.forEach((child) => {
        if (child) {
          dagreGraph.setEdge(node.userId, child.userId);
          traverse(child);
        }
      });
    }
  }
  traverse(tree);

  // 3) Compute layout
  dagre.layout(dagreGraph);

  // 4) Create React Flow nodes

  // Parent node (if any)
  // if (parent) {
  //   const parentGraphNode = dagreGraph.node(parent.userId) as DagrePos | undefined;
  //   if (parentGraphNode) {
  //     const isCompany = parent.userId === 'SAGENEX-GOLD';
  //     nodes.push({
  //       id: parent.userId,
  //       position: {
  //         x: parentGraphNode.x - nodeWidth / 2,
  //         y: parentGraphNode.y - nodeHeight / 2,
  //       },
  //       data: {
  //         label: isCompany ? (
  //           <div className="flex items-center justify-start gap-3 w-full text-white">
  //             <Image src="/logo5.png" alt="Sagenex Logo" width={40} height={40} className="rounded-md" />
  //             <div>
  //               <strong className="text-base">SAGENEX</strong>
  //               <br />
  //               <small className="text-gray-400">(Parent)</small>
  //             </div>
  //           </div>
  //         ) : (
  //           <div className="text-left text-white">
  //             <strong>{parent.fullName}</strong>
  //             <br />
  //             <small className="text-gray-400">ID: {parent.userId}</small>
  //             <br />
  //             <small className="text-gray-400">(Parent)</small>
  //           </div>
  //         ),
  //       },
  //       style: {
  //         border: isCompany ? '1px solid #ca8a04' : '1px dashed #4a5568',
  //         padding: 10,
  //         borderRadius: 8,
  //         background: isCompany ? '#3a301c' : '#2d3748', // Dark gold vs. standard dark gray
  //         width: nodeWidth,
  //       },
  //     });
  //   }
  // }

  // Downline nodes
  dagreGraph.nodes().forEach((nodeId: string) => {


    const graphNode = dagreGraph.node(nodeId) as DagrePos | undefined;
    if (!graphNode) return;

    const user = findUserNode(tree, nodeId);
    if (!user) return;
    const isRoot = user.userId === tree.userId;
    const isActive = Number(user.packageUSD || 0) > 0;
    const teamCount = countTeamMembers(user);
    const maskedName = maskName(user.fullName || user.userId);
    const initial = (user.fullName || user.userId || "S").charAt(0).toUpperCase();
    const borderColor = isRoot ? '#D4143F' : isActive ? '#6EE7B7' : '#CBD5E1';

    nodes.push({
      id: user.userId,
      position: { x: graphNode.x - nodeWidth / 2, y: graphNode.y - nodeHeight / 2 },
      data: {
        label: (
          <div className="relative flex h-full flex-col items-center justify-center px-3 py-3 text-center text-[#0F172A]">
            <span
              className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${
                isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <div
              className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full text-base font-black text-white ${
                isRoot ? "bg-[#D4143F]" : isActive ? "bg-emerald-500" : "bg-slate-400"
              }`}
            >
              {initial}
            </div>
            <strong className="max-w-full truncate text-sm font-black tracking-tight">
              {maskedName}
            </strong>
            <small className="mt-1 text-[11px] font-medium text-[#64748B]">ID: {user.userId}</small>
            <small className="mt-1 text-[11px] font-medium text-[#64748B]">
              Team: {teamCount.toLocaleString("en-IN")}
            </small>
            {isRoot && (
              <span className="mt-1 rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold text-[#C8103E]">
                You
              </span>
            )}
            {user.isSplitSponsor && (
              <small className="mt-1 max-w-full truncate text-[10px] font-semibold text-amber-600">
                Sponsor: {user.originalSponsorId}
              </small>
            )}
          </div>
        ),
      },
      style: {
        border: `1.5px solid ${borderColor}`,
        padding: 0,
        borderRadius: 12,
        background: '#ffffff',
        boxShadow: isRoot
          ? '0 16px 34px rgba(200, 16, 62, 0.14)'
          : '0 10px 24px rgba(15, 23, 42, 0.08)',
        width: nodeWidth,
        height: nodeHeight,
      },
    });
  });

  // 5) React Flow edges
  dagreGraph.edges().forEach((e) => {
    const edge = e as DagreEdge;
    edges.push({
      id: `${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
      style: { stroke: '#94A3B8', strokeWidth: 1.4 },
    });
  });

  return { nodes, edges };
};

function countTeamMembers(node: UserNode): number {
  return (node.children || []).reduce((total, child) => total + 1 + countTeamMembers(child), 0);
}

function maskName(value: string): string {
  const clean = value.trim();
  if (clean.length <= 2) return clean;
  return `${clean.charAt(0)}${"*".repeat(Math.min(5, Math.max(2, clean.length - 2)))}${clean.charAt(clean.length - 1)}`;
}
