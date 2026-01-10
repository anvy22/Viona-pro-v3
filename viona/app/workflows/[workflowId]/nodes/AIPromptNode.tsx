import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function AIPromptNode(
  props: NodeProps<{ node: WorkflowNode<"ai.prompt"> }>
) {
  const node = props.data.node;
  const data = node.data;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium">
          Model: {data.model || "gpt-4"}
        </div>
        <div className="text-muted-foreground truncate text-[10px]">
          {data.prompt
            ? `${data.prompt.slice(0, 40)}...`
            : "No prompt"}
        </div>
      </div>
    </BaseNode>
  );
}
