import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function NotionNode(
  props: NodeProps<{ node: WorkflowNode }>
) {
  const node = props.data.node;
  const data = node.data as any;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Database:{" "}
          {data.databaseId
            ? `${data.databaseId.slice(0, 12)}...`
            : "Not set"}
        </div>

        <div className="text-muted-foreground text-[10px]">
          {Object.keys(data.properties || {}).length} properties
        </div>
      </div>
    </BaseNode>
  );
}
