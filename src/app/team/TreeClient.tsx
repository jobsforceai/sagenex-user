"use client";

import { useMemo } from "react";
import ReactFlow, { Edge, Node, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

interface UserNode {
  userId: string;
  fullName: string;
  packageUSD: number;
  children: UserNode[];
}

interface TreeClientProps {
  initialTreeData: UserNode;
}

const transformDataToFlow = (userNode: UserNode) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 20, ranksep: 80 });

  const traverse = (node: UserNode, parentId?: string) => {
    const id = node.userId;

    dagreGraph.setNode(id, {
      label: node.fullName,
      width: 180,
      height: 80,
    });

    if (parentId) {
      dagreGraph.setEdge(parentId, id);
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child, id));
    }
  };

  traverse(userNode);
  dagre.layout(dagreGraph);

  dagreGraph.nodes().forEach((nodeId) => {
    const node = dagreGraph.node(nodeId);
    const user = findUser(userNode, nodeId); // Find user data for the label
    if (node && user) {
      nodes.push({
        id: nodeId,
        position: { x: node.x, y: node.y },
        data: {
          label: (
            <div className="text-center">
              <p className="font-bold">{user.fullName}</p>
              <p className="text-sm text-gray-600">ID: {user.userId}</p>
              <p className="text-sm text-green-600">
                Package: ${user.packageUSD}
              </p>
            </div>
          ),
        },
        style: {
          width: 180,
          padding: 10,
          background: "#f0f0f0",
          border: "1px solid #ddd",
          borderRadius: "8px",
        },
      });
    }
  });

  dagreGraph.edges().forEach((edge) => {
    edges.push({
      id: `e-${edge.v}-${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
    });
  });

  return { nodes, edges };
};

// Helper function to find a user in the tree
const findUser = (node: UserNode, userId: string): UserNode | null => {
  if (node.userId === userId) {
    return node;
  }
  for (const child of node.children) {
    const found = findUser(child, userId);
    if (found) {
      return found;
    }
  }
  return null;
};

const TreeClient = ({ initialTreeData }: TreeClientProps) => {
  const { nodes, edges } = useMemo(
    () => transformDataToFlow(initialTreeData),
    [initialTreeData]
  );

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable
        nodesConnectable={false}
      />
    </div>
  );
};

export default TreeClient;
