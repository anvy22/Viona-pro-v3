"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeMouseHandler,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import { WorkflowDefinition, WorkflowNode } from "../types";

// Custom nodes
import TriggerNode from "./nodes/TriggerNode";

/* ------------------ Node Type Registry ------------------ */

const nodeTypes = {
  trigger: TriggerNode,
};

/* ------------------ Props ------------------ */

interface Props {
  definition: WorkflowDefinition;
  readOnly: boolean;
  onSelectNode: (node: WorkflowNode | null) => void;
  onConnect: (connection: Connection) => void;
}

/* ------------------ Canvas ------------------ */

export default function Canvas({
  definition,
  readOnly,
  onSelectNode,
  onConnect,
}: Props) {
  /* ------------------ Nodes ------------------ */
  const nodes: Node[] = useMemo(() => {
    return definition.nodes.map(n => ({
      id: n.id,
      type: n.category === "trigger" ? "trigger" : "default",
      position: n.position,
      data: n.data,
    }));
  }, [definition.nodes]);

  /* ------------------ Edges ------------------ */
  const edges: Edge[] = useMemo(() => {
    return definition.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));
  }, [definition.edges]);

  /* ------------------ Node Selection ------------------ */
  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const found =
      definition.nodes.find(n => n.id === node.id) ?? null;
    onSelectNode(found);
  };

  /* ------------------ Empty State ------------------ */
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        This workflow has no nodes yet.
      </div>
    );
  }

  /* ------------------ Render ------------------ */
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      onNodeClick={handleNodeClick}
      onConnect={onConnect}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      elementsSelectable={!readOnly}
      nodeTypes={nodeTypes}
    >
      {/* n8n-style grid background */}
      <Background gap={24} size={1} />

      {/* Zoom / fit controls */}
      <Controls position="bottom-right" />

      {/* Overview map */}
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
