// workflows/[workflowId]/nodes/TriggerNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function TriggerNode(props: NodeProps) {
  // Use the type provided by React Flow props directly
  const node: WorkflowNode = {
    id: props.id,
    type: props.type as any, 
    category: "trigger",
    position: props.dragging ? props.dragHandle ?? { x: 0, y: 0 } : { x: 0, y: 0 },
    data: props.data,
  };

  return (
    <BaseNode node={node}>
      <div className="text-muted-foreground text-xs">
        {props.data.label || "Manual Trigger"}
      </div>
    </BaseNode>
  );
}