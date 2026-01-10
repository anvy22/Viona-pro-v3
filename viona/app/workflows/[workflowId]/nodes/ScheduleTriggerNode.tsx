import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function ScheduleTriggerNode(
  props: NodeProps<{ node: WorkflowNode }>
) {
  const node = props.data.node;
  const data = node.data as any;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">Schedule</div>
        <div className="text-muted-foreground text-[10px] font-mono">
          {data.cron || "Not configured"}
        </div>
      </div>
    </BaseNode>
  );
}
