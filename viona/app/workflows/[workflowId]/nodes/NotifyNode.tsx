// nodes/NotifyNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, NotifyActionData } from "../../types";

export default function NotifyNode({ data, id }: NodeProps<NotifyActionData>) {
  const node: WorkflowNodeBase<NotifyActionData> = {
    id,
    type: "action.notify",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

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
