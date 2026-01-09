// nodes/DiscordNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, DiscordSendMessageData } from "../../types";

export default function DiscordNode({ data, id }: NodeProps<DiscordSendMessageData>) {
  const node: WorkflowNodeBase<DiscordSendMessageData> = {
    id,
    type: "action.discord.sendMessage",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Webhook: {data.webhookUrl ? `${data.webhookUrl.slice(0, 30)}...` : "Not configured"}
        </div>
        <div className="text-muted-foreground truncate">
          {data.message ? `${data.message.slice(0, 40)}...` : "No message"}
        </div>
      </div>
    </BaseNode>
  );
}
