"use client";

import { X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { WorkflowNode } from "../types";
import { getNodeDefinition } from "../action";

interface SidebarProps {
  selectedNode: WorkflowNode | null;
  readOnly: boolean;
  onUpdateNode: (node: WorkflowNode) => void;
  onClose: () => void;
}

export default function Sidebar({
  selectedNode,
  readOnly,
  onUpdateNode,
  onClose,
}: SidebarProps) {
  // Nothing selected → nothing rendered
  if (!selectedNode) return null;

  const definition = getNodeDefinition(selectedNode.type);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed lg:relative right-0 top-0 bottom-0 w-[320px] border-l bg-background flex flex-col z-50 shadow-lg lg:shadow-none animate-in slide-in-from-right duration-200">
        {/* Header */}
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
          {/* Node meta */}
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

          {/* Settings */}
          {!readOnly && (
            <>
              {!definition?.settings || definition.settings.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  This node has no configurable settings.
                </p>
              ) : (
                <Card className="p-3 space-y-4">
                  {definition.settings.map(field => {
                    const value = (selectedNode.data as any)[field.name];

                    /* ---------------- TEXT ---------------- */
                    if (field.kind === "text") {
                      return (
                        <div key={field.name} className="space-y-2">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            value={value ?? ""}
                            placeholder={field.placeholder}
                            onChange={e =>
                              onUpdateNode({
                                ...selectedNode,
                                data: {
                                  ...selectedNode.data,
                                  [field.name]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      );
                    }

                    /* ---------------- TEXTAREA ---------------- */
                    if (field.kind === "textarea") {
                      return (
                        <div key={field.name} className="space-y-2">
                          <Label className="text-xs">{field.label}</Label>
                          <Textarea
                            rows={field.rows ?? 4}
                            value={value ?? ""}
                            onChange={e =>
                              onUpdateNode({
                                ...selectedNode,
                                data: {
                                  ...selectedNode.data,
                                  [field.name]: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      );
                    }

                    /* ---------------- SELECT ---------------- */
                    if (field.kind === "select") {
                      return (
                        <div key={field.name} className="space-y-2">
                          <Label className="text-xs">{field.label}</Label>
                          <select
                            className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            value={value ?? ""}
                            onChange={e =>
                              onUpdateNode({
                                ...selectedNode,
                                data: {
                                  ...selectedNode.data,
                                  [field.name]: e.target.value,
                                },
                              })
                            }
                          >
                            {field.options.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return null;
                  })}
                </Card>
              )}
            </>
          )}

          {/* Read-only message */}
          {readOnly && (
            <p className="text-xs text-muted-foreground">
              You have read-only access to this workflow.
            </p>
          )}
        </div>

        <Separator />
      </aside>
    </>
  );
}
