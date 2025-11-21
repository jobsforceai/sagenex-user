"use client";

import { useMemo } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import { transformDataToFlow } from "@/lib/utils";
import { UserNode } from "@/types";

interface TreeClientProps {
  tree: UserNode;
}

const TreeClient = ({ tree }: TreeClientProps) => {
  const { nodes, edges } = useMemo(
    () => transformDataToFlow(tree),
    [tree]
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
