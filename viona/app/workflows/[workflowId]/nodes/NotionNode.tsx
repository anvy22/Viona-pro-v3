// nodes/NotionNode.tsx
import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, NotionCreatePageData } from "../../types";

export default function NotionNode({ data, id }: NodeProps<NotionCreatePageData>) {
  const node: WorkflowNodeBase<NotionCreatePageData> = {
    id,
    type: "action.notion.createPage",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Database: {data.databaseId ? `${data.databaseId.slice(0, 12)}...` : "Not set"}
        </div>
        <div className="text-muted-foreground text-[10px]">
          {Object.keys(data.properties || {}).length} properties
        </div>
      </div>
    </BaseNode>
  );
}
