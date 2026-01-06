"use client";

import { Search, Upload, FolderPlus, Download, Trash2, Link as LinkIcon, Share2, Grid, List as ListIcon, Info, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ToolbarProps {
    viewMode: "grid" | "list";
    onViewChange: (mode: "grid" | "list") => void;
    onNewFolder?: () => void;
    onUpload?: () => void;
    onToggleDetails?: () => void;
    isDetailsOpen?: boolean;
    onRename?: () => void;
    onDelete?: () => void;
    onCopyLink?: () => void;
    onTrashClick?: () => void;
    hasSelection?: boolean;
    pageView?: 'drive' | 'trash';
    onEmptyTrash?: () => void;
    onRestore?: () => void;
    onRestoreAll?: () => void;
    onDeleteForever?: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export default function Toolbar({
    viewMode,
    onViewChange,
    onNewFolder,
    onUpload,
    onToggleDetails,
    isDetailsOpen,
    onRename,
    onDelete,
    onCopyLink,
    onTrashClick,
    hasSelection,
    pageView = 'drive',
    onEmptyTrash,
    onRestore,
    onRestoreAll,
    onDeleteForever,
    searchQuery = "",
    onSearchChange
}: ToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#1a1b1e] rounded-xl border border-[#2e3035] gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {pageView === 'trash' ? (
                    <>
                        <button
                            onClick={onEmptyTrash}
                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[120px] md:min-w-[140px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Empty Trash</span>
                        </button>
                        <button
                            onClick={onRestoreAll}
                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[120px] md:min-w-[140px] bg-[#25262b] hover:bg-[#2c2d32] text-gray-200 border border-[#2e3035] rounded-lg text-sm font-medium transition-colors"
                        >
                            <div className="w-4 h-4 -scale-x-100 rotate-180">
                                <Share2 className="w-4 h-4" />
                            </div>
                            <span className="hidden sm:inline">Restore All</span>
                            <span className="sm:hidden">Restore</span>
                        </button>

                        <div className="hidden md:block w-px h-8 bg-[#2e3035] mx-2" />

                        <button
                            onClick={onRestore}
                            disabled={!hasSelection}
                            className={cn(
                                "flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[100px] md:min-w-[140px] border rounded-lg text-sm font-medium transition-colors",
                                hasSelection
                                    ? "bg-primary hover:bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-900/20"
                                    : "bg-[#25262b] text-gray-600 border-[#2e3035] cursor-not-allowed"
                            )}
                        >
                            <div className="w-4 h-4 -scale-x-100 rotate-180">
                                <Share2 className="w-4 h-4" />
                            </div>
                            <span>Restore</span>
                        </button>
                        <button
                            onClick={onDeleteForever}
                            disabled={!hasSelection}
                            className={cn(
                                "flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[100px] md:min-w-[140px] border rounded-lg text-sm font-medium transition-colors",
                                hasSelection
                                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                                    : "bg-[#25262b] text-gray-600 border-[#2e3035] cursor-not-allowed"
                            )}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onUpload}
                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[120px] md:min-w-[140px] bg-primary hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="whitespace-nowrap">Upload File</span>
                        </button>
                        <button
                            onClick={onNewFolder}
                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[120px] md:min-w-[140px] bg-[#25262b] hover:bg-[#2c2d32] text-gray-200 border border-[#2e3035] rounded-lg text-sm font-medium transition-colors"
                        >
                            <FolderPlus className="w-4 h-4 text-gray-400" />
                            <span className="whitespace-nowrap">New Folder</span>
                        </button>
                        <button
                            onClick={onTrashClick}
                            className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 flex-1 md:flex-initial min-w-[100px] md:min-w-[140px] bg-[#25262b] hover:bg-[#2c2d32] text-gray-200 border border-[#2e3035] rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                            <span>Trash</span>
                        </button>
                    </>
                )}
                <div className="hidden lg:block w-px h-8 bg-[#2e3035] mx-2" />


                <div className="hidden lg:flex items-center gap-4 px-2">
                    <div className="flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-300">Storage</span>
                            <span className="text-primary">45% used</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#25262b] rounded-full overflow-hidden border border-[#2e3035]">
                            <div className="h-full bg-primary w-[45%] rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-9 pr-4 py-1.5 bg-[#25262b] border border-[#2e3035] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-gray-500"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#141517] rounded-lg border border-[#2e3035] shrink-0">
                    <button
                        onClick={() => onViewChange("grid")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "grid" ? "bg-[#25262b] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewChange("list")}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            viewMode === "list" ? "bg-[#25262b] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
