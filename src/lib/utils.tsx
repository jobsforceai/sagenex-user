import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Node, Edge, MarkerType } from 'reactflow';
import dagre from 'dagre';
import Image from 'next/image';
import { UserNode, ParentNode } from '@/types'; // your project types

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// React Flow node "data" type
type FlowData = {
  label: React.ReactNode;
};

const nodeWidth = 200;
const nodeHeight = 90;

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
  tree: UserNode,
  parent: ParentNode | null
): { nodes: Node<FlowData>[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 25, ranksep: 80 });

  const nodes: Node<FlowData>[] = [];
  const edges: Edge[] = [];

  // 1) Add parent → root edge (if parent exists)
  if (parent) {
    dagreGraph.setNode(parent.userId, { width: nodeWidth, height: nodeHeight });
    dagreGraph.setEdge(parent.userId, tree.userId);
  }

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
  if (parent) {
    const parentGraphNode = dagreGraph.node(parent.userId) as DagrePos | undefined;
    if (parentGraphNode) {
      const isCompany = parent.userId === 'SAGENEX-GOLD';
      nodes.push({
        id: parent.userId,
        position: {
          x: parentGraphNode.x - nodeWidth / 2,
          y: parentGraphNode.y - nodeHeight / 2,
        },
        data: {
          label: isCompany ? (
            <div className="flex items-center justify-start gap-3 w-full text-white">
              <Image src="/logo5.png" alt="Sagenex Logo" width={40} height={40} className="rounded-md" />
              <div>
                <strong className="text-base">SAGENEX</strong>
                <br />
                <small className="text-gray-400">(Parent)</small>
              </div>
            </div>
          ) : (
            <div className="text-left text-white">
              <strong>{parent.fullName}</strong>
              <br />
              <small className="text-gray-400">ID: {parent.userId}</small>
              <br />
              <small className="text-gray-400">(Parent)</small>
            </div>
          ),
        },
        style: {
          border: isCompany ? '1px solid #ca8a04' : '1px dashed #4a5568',
          padding: 10,
          borderRadius: 8,
          background: isCompany ? '#3a301c' : '#2d3748', // Dark gold vs. standard dark gray
          width: nodeWidth,
        },
      });
    }
  }

  // Downline nodes
  dagreGraph.nodes().forEach((nodeId: string) => {
    if (parent && nodeId === parent.userId) return; // skip parent

    const graphNode = dagreGraph.node(nodeId) as DagrePos | undefined;
    if (!graphNode) return;

    const user = findUserNode(tree, nodeId);
    if (!user) return;

    nodes.push({
      id: user.userId,
      position: { x: graphNode.x - nodeWidth / 2, y: graphNode.y - nodeHeight / 2 },
      data: {
        label: (
          <div className="p-2 text-left text-white">
            <strong>{user.fullName}</strong>
            <br />
            <small className="text-gray-400">ID: {user.userId}</small>
            <br />
            <small className="text-gray-400">Package: ${Number(user.packageUSD || 0).toLocaleString()}</small>
            {user.isSplitSponsor && (
              <>
                <br />
                <small className="text-amber-400 font-semibold">
                  Sponsor: {user.originalSponsorId}
                </small>
              </>
            )}
          </div>
        ),
      },
      style: {
        border: '1px solid #4a5568', // gray-600
        padding: 10,
        borderRadius: 5,
        background: '#2d3748', // gray-800
        width: nodeWidth,
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
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' }, // gray-400
      style: { stroke: '#9ca3af' },
    });
  });

  return { nodes, edges };
};
