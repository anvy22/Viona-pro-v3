import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNode } from "../../types";

export default function AirtableNode(
  props: NodeProps<{ node: WorkflowNode<"action.airtable.createRecord"> }>
) {
  const node = props.data.node;
  const data = node.data;

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Base: {data.baseId || "Not configured"}
        </div>
        <div className="text-muted-foreground truncate text-[10px]">
          Table: {data.tableId || "Not set"}
        </div>
      </div>
    </BaseNode>
  );
}
