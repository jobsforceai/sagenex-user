"use client";

import { useMemo } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import { transformDataToFlow } from "@/lib/utils";
import { UserNode, ParentNode } from "@/types";

interface TreeClientProps {
  tree: UserNode;
  parent: ParentNode | null;
}

const TreeClient = ({ tree, parent }: TreeClientProps) => {
  const { nodes, edges } = useMemo(
    () => transformDataToFlow(tree, parent),
    [tree, parent]
  );

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable
        nodesConnectable={false}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default TreeClient;
