import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, SlackSendMessageData } from "../../types";

export default function SlackNode({ data, id }: NodeProps<SlackSendMessageData>) {
  const node: WorkflowNodeBase<SlackSendMessageData> = {
    id,
    type: "action.slack.sendMessage",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">Channel: {data.channel || "Not set"}</div>
        <div className="text-muted-foreground line-clamp-2">
          {data.message || "No message"}
        </div>
      </div>
    </BaseNode>
  );
}