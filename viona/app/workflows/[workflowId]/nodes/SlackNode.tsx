import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

type SlackWorkflowNode =
  WorkflowNode<"action.slack.sendMessage">;

export default function SlackNode(
  props: NodeProps<{ node: SlackWorkflowNode }>
) {
  const node = props.data.node;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">
          Channel: {node.data.channel || "Not set"}
        </div>
        <div className="text-muted-foreground line-clamp-2">
          {node.data.message || "No message"}
        </div>
      </div>
    </BaseNode>
  );
}
