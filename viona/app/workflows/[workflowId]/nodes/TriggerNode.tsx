// workflows/[workflowId]/nodes/TriggerNode.tsx (REPLACE existing)

import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, ManualTriggerData } from "../../types";

export default function TriggerNode({ data, id }: NodeProps<ManualTriggerData>) {
  // Reconstruct the full node (you'll need to pass this differently, see Step 5)
  const node: WorkflowNodeBase<ManualTriggerData> = {
    id,
    type: "trigger.manual",
    category: "trigger",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="text-muted-foreground">
        {data.label || "Click to start"}
      </div>
    </BaseNode>
  );
}
