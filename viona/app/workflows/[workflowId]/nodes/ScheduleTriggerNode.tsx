// nodes/ScheduleTriggerNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, ScheduleTriggerData } from "../../types";

export default function ScheduleTriggerNode({ data, id }: NodeProps<ScheduleTriggerData>) {
  const node: WorkflowNodeBase<ScheduleTriggerData> = {
    id,
    type: "trigger.schedule",
    category: "trigger",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">Schedule</div>
        <div className="text-muted-foreground text-[10px] font-mono">
          {data.cron}
        </div>
      </div>
    </BaseNode>
  );
}
