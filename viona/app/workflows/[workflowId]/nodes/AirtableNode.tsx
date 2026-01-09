// nodes/AirtableNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, AirtableCreateRecordData } from "../../types";

export default function AirtableNode({ data, id }: NodeProps<AirtableCreateRecordData>) {
  const node: WorkflowNodeBase<AirtableCreateRecordData> = {
    id,
    type: "action.airtable.createRecord",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

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
