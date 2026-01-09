import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function NotifyNode(
  props: NodeProps<{ node: WorkflowNode<"action.notify"> }>
) {
  const node = props.data.node;
  const data = node.data;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">
          {data.channel} → {data.recipients}
        </div>
        <div className="text-muted-foreground truncate text-[10px]">
          {data.message ? `${data.message.slice(0, 35)}...` : "No message"}
        </div>
      </div>
    </BaseNode>
  );
}
