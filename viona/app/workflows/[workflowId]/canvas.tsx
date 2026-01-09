"use client";

import React, { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    ReactFlowInstance,
    Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import { WorkflowDefinition, WorkflowNode } from "../types";

import TriggerNode from "./nodes/TriggerNode";
import EventTriggerNode from "./nodes/EventTriggerNode";
import ScheduleTriggerNode from "./nodes/ScheduleTriggerNode";
import SlackNode from "./nodes/SlackNode";
import GoogleSheetsNode from "./nodes/GoogleSheetsNode";
import HttpNode from "./nodes/HttpNode";
import AIPromptNode from "./nodes/AIPromptNode";
import AIAgentNode from "./nodes/AIAgentNode";
import AirtableNode from "./nodes/AirtableNode";
import DiscordNode from "./nodes/DiscordNode";
import GitHubNode from "./nodes/GitHubNode";
import NotionNode from "./nodes/NotionNode";
import ConditionNode from "./nodes/ConditionNode";
import DelayNode from "./nodes/DelayNode";
import MemoryNode from "./nodes/MemoryNode";
import ChatModelNode from "./nodes/ChatModelNode";
import NotifyNode from "./nodes/NotifyNode";
import UpdateInventoryNode from "./nodes/UpdateInventoryNode";

import { useTheme } from "next-themes";


/* ---------------- Node Types ---------------- */

const nodeTypes = {
  // Triggers
  "trigger.manual": TriggerNode,
  "trigger.event": EventTriggerNode,
  "trigger.schedule": ScheduleTriggerNode,
  
  // Actions
  "action.slack.sendMessage": SlackNode,
  "action.googleSheets.appendRow": GoogleSheetsNode,
  "action.http": HttpNode,
  "action.discord.sendMessage": DiscordNode,
  "action.github.createIssue": GitHubNode,
  "action.notion.createPage": NotionNode,
  "action.airtable.createRecord": AirtableNode,
  "action.delay": DelayNode,
  "action.notify": NotifyNode,
  "action.update_inventory": UpdateInventoryNode,
  
  // AI & Logic
  "ai.prompt": AIPromptNode,
  "ai.agent": AIAgentNode,
  "ai.chat_model": ChatModelNode,
  "ai.memory": MemoryNode,
  "condition.if": ConditionNode,
};

/* ---------------- Props ---------------- */

interface Props {
    definition: WorkflowDefinition;
    readOnly: boolean;
    onSelectNode: (node: WorkflowNode | null) => void;
    onAddNode: (node: WorkflowNode) => void;
    onUpdateNode: (node: WorkflowNode) => void;
    onConnect: (connection: Connection) => void;
    selectedNode: WorkflowNode | null;
    onDeleteNodes?: (nodeIds: string[]) => void;
    onDeleteEdges?: (edgeIds: string[]) => void;
}

/* ---------------- Canvas ---------------- */

export default function Canvas({
    definition,
    readOnly,
    onSelectNode,
    onAddNode,
    onUpdateNode,
    onConnect,
    selectedNode,
    onDeleteNodes,
    onDeleteEdges,
}: Props) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const reactFlowRef = useRef<ReactFlowInstance | null>(null);
    const { resolvedTheme } = useTheme();

    /* ---------------- Nodes ---------------- */

    const nodes: Node[] = useMemo(
        () =>
            definition.nodes.map(n => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data,
            })),
        [definition.nodes]
    );

    const miniMapColors = useMemo(() => {
        const isDark = resolvedTheme === "dark";

        return {
            background: isDark ? "#060606ff" : "#ffffff", // shadcn bg
            node: isDark ? "#0a6f0eff" : "#0f8825d6",        // primary
            nodeBorder: isDark ? "#1b560cff" : "#e5e7eb",  // border
            mask: isDark
                ? "rgba(19, 20, 22, 0.75)"
                : "rgba(255, 255, 255, 0.75)",
        };
    }, [resolvedTheme]);

    /* ---------------- Edges ---------------- */

    const edges: Edge[] = useMemo(
        () =>
            definition.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        [definition.edges]
    );

    const handleNodesDelete = useCallback(
        (deleted: Node[]) => {
            if (readOnly || !onDeleteNodes) return;

            const deletedIds = deleted.map(n => n.id);
            onDeleteNodes(deletedIds);  // ✅ Call parent callback

            // Clear selection if deleted node was selected
            const selectedNodeElement = deleted.find(n => n.id === selectedNode?.id);
            if (selectedNodeElement) {
                onSelectNode(null);
            }
        },
        [readOnly, onDeleteNodes, onSelectNode]
    );

    const handleEdgesDelete = useCallback(
        (deleted: Edge[]) => {
            if (readOnly || !onDeleteEdges) return;

            const deletedIds = deleted.map(e => e.id);
            onDeleteEdges(deletedIds);
        },
        [readOnly, onDeleteEdges]
    );

    /* ---------------- Drop from Node Library ---------------- */

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();

            if (readOnly) return;
            if (!reactFlowRef.current || !wrapperRef.current) return;

            const raw = event.dataTransfer.getData("application/workflow-node");
            if (!raw) return;

            const def = JSON.parse(raw);

            const bounds = wrapperRef.current.getBoundingClientRect();
            const position = reactFlowRef.current.project({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });

            onAddNode({
                id: crypto.randomUUID(),
                type: def.type,
                category: def.category,
                position,
                data: def.defaultData,
            });
        },
        [onAddNode, readOnly]
    );

    /* ---------------- Render ---------------- */

    return (
        <div
            ref={wrapperRef}
            className="h-full w-full"
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}

                /* ---------- View ---------- */
                fitView={false}
                onInit={instance => {
                    reactFlowRef.current = instance;
                    instance.fitView({ padding: 0.2 });
                }}

                /* ---------- Interaction ---------- */
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                panOnDrag={[1, 2]}
                panOnScroll
                zoomOnScroll
                zoomOnDoubleClick={false}
                selectNodesOnDrag={false}
                onPaneClick={() => onSelectNode(null)}

                /* ---------- Smooth Drag ---------- */
                nodeDragThreshold={4}
                snapToGrid={false}
                elevateNodesOnSelect
                onlyRenderVisibleElements
                translateExtent={[
                    [-5000, -5000],
                    [5000, 5000],
                ]}

                defaultEdgeOptions={{
                    type: "smoothstep",
                    animated: true,
                    style: { strokeWidth: 2 },
                }}

                /* ---------- Selection ---------- */
                onNodeClick={(_, node) => {
                    const found =
                        definition.nodes.find(n => n.id === node.id) ?? null;
                    onSelectNode(found);
                }}

                /* ---------- Deletion ---------- */
                onNodesDelete={handleNodesDelete}
                onEdgesDelete={handleEdgesDelete}
                deleteKeyCode={readOnly ? [] : ["Backspace", "Delete"]}

                /* ---------- Persist position ONLY on drop ---------- */
                onNodeDragStop={(_, node) => {
                    if (readOnly) return;
                    if (typeof onUpdateNode !== "function") return;

                    const found = definition.nodes.find(n => n.id === node.id);
                    if (!found) return;

                    onUpdateNode({
                        ...found,
                        position: node.position,
                    });
                }}

                /* ---------- Edge connection ---------- */
                onConnect={onConnect}

                /* ---------- Performance ---------- */
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={24} size={1} />
                <MiniMap
                    pannable
                    zoomable
                    nodeColor={() => miniMapColors.node}
                    nodeStrokeColor={() => miniMapColors.nodeBorder}
                    nodeBorderRadius={2}
                    maskColor={miniMapColors.mask}
                    style={{
                        backgroundColor: miniMapColors.background,
                    }}
                />

                <Controls />
            </ReactFlow>
        </div>
    );
}
