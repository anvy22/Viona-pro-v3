// nodes/EventTriggerNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, EventTriggerData } from "../../types";

export default function EventTriggerNode({ data, id }: NodeProps<EventTriggerData>) {
  const node: WorkflowNodeBase<EventTriggerData> = {
    id,
    type: "trigger.event",
    category: "trigger",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">Event Type</div>
        <div className="text-muted-foreground text-[10px]">
          {data.event}
        </div>
      </div>
    </BaseNode>
  );
}
