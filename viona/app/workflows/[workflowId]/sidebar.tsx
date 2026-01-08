// workflows/[workflowId]/sidebar.tsx - UPDATE component

"use client";

import { Info, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { WorkflowNode } from "../types";

interface SidebarProps {
  selectedNode: WorkflowNode | null;
  readOnly: boolean;
  onUpdateNode: (node: WorkflowNode) => void;
  onClose: () => void; // NEW: callback to deselect
}

export default function Sidebar({
  selectedNode,
  readOnly,
  onUpdateNode,
  onClose,
}: SidebarProps) {
  // Don't render at all if no node selected
  if (!selectedNode) return null;

  return (
    <>
      {/* Backdrop (optional - click to close) */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className="fixed lg:relative right-0 top-0 bottom-0 w-[320px] border-l bg-background flex flex-col z-50 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-200"
      >
        {/* Header with close button */}
        <div className="h-[48px] px-4 flex items-center justify-between border-b">
          <h3 className="text-sm font-semibold">Node Settings</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Meta */}
          <Card className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Type</span>
              <Badge>{selectedNode.type}</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Category</span>
              <Badge variant="outline">{selectedNode.category}</Badge>
            </div>
          </Card>

          <Separator />

          {/* Dynamic Settings */}
          {!readOnly && (
            <Card className="p-3 space-y-4">
              {/* Manual Trigger */}
              {selectedNode.type === "trigger.manual" && (
                <div className="space-y-2">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedNode.data.label ?? ""}
                    onChange={e =>
                      onUpdateNode({
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          label: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}

              {/* HTTP Action */}
              {selectedNode.type === "action.http" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">URL</Label>
                    <Input
                      placeholder="https://api.example.com"
                      value={selectedNode.data.url}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            url: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Method</Label>
                    <Input
                      value={selectedNode.data.method}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            method: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* AI Prompt */}
              {selectedNode.type === "ai.prompt" && (
                <div className="space-y-2">
                  <Label className="text-xs">Prompt</Label>
                  <Textarea
                    rows={6}
                    value={selectedNode.data.prompt}
                    onChange={e =>
                      onUpdateNode({
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          prompt: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}

              {/* Slack */}
              {selectedNode.type === "action.slack.sendMessage" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Channel</Label>
                    <Input
                      placeholder="#general"
                      value={selectedNode.data.channel}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            channel: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      rows={4}
                      value={selectedNode.data.message}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            message: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* Google Sheets */}
              {selectedNode.type === "action.googleSheets.appendRow" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Spreadsheet ID</Label>
                    <Input
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={selectedNode.data.spreadsheetId}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            spreadsheetId: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Sheet Name</Label>
                    <Input
                      value={selectedNode.data.sheetName}
                      onChange={e =>
                        onUpdateNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            sheetName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Read only */}
          {readOnly && (
            <p className="text-xs text-muted-foreground">
              You have read-only access to this workflow
            </p>
          )}
        </div>

        <Separator />
      </aside>
    </>
  );
}
