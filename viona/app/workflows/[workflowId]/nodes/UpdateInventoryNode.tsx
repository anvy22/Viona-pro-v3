// nodes/UpdateInventoryNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, UpdateInventoryActionData } from "../../types";

export default function UpdateInventoryNode({ data, id }: NodeProps<UpdateInventoryActionData>) {
  const node: WorkflowNodeBase<UpdateInventoryActionData> = {
    id,
    type: "action.update_inventory",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          SKU: {data.sku || "Not set"}
        </div>
        <div className="text-muted-foreground">
          Quantity: {data.delta > 0 ? `+${data.delta}` : data.delta}
        </div>
      </div>
    </BaseNode>
  );
}
