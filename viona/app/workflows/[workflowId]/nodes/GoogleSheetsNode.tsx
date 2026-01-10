import { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import { WorkflowNodeBase, GoogleSheetsAppendRowData } from "../../types";

export default function GoogleSheetsNode({ data, id }: NodeProps<GoogleSheetsAppendRowData>) {
  const node: WorkflowNodeBase<GoogleSheetsAppendRowData> = {
    id,
    type: "action.googleSheets.appendRow",
    category: "action",
    position: { x: 0, y: 0 },
    data,
  };

  return (
    <BaseNode node={node}>
      <div className="space-y-0.5">
        <div className="font-medium truncate">
          Sheet: {data.sheetName || "Sheet1"}
        </div>
        <div className="text-muted-foreground">
          {data.spreadsheetId ? `ID: ${data.spreadsheetId.slice(0, 12)}...` : "No spreadsheet set"}
        </div>
      </div>
    </BaseNode>
  );
}