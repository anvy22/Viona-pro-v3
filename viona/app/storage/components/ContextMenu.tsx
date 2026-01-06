import { useEffect, useRef } from "react";
import { Download, Link as LinkIcon, Share2, Edit2, Trash2, FolderInput, Info } from "lucide-react";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    isTrashed?: boolean;
}

export default function ContextMenu({ x, y, onClose, onAction, isTrashed }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-[#1a1b1e] border border-[#2e3035] rounded-xl shadow-2xl py-2 flex flex-col"
            style={{ top: y, left: x }}
        >
            {!isTrashed && (
                <>
                    <button onClick={() => onAction('preview')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <FolderInput className="w-4 h-4" /> Open
                    </button>
                    <div className="h-px bg-[#2e3035] my-1" />
                    <button onClick={() => onAction('rename')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <Edit2 className="w-4 h-4" /> Rename
                    </button>
                    <button onClick={() => onAction('share')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={() => onAction('link')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <LinkIcon className="w-4 h-4" /> Get Link
                    </button>
                    <button onClick={() => onAction('download')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <Download className="w-4 h-4" /> Download
                    </button>
                    <div className="h-px bg-[#2e3035] my-1" />
                    <button onClick={() => onAction('details')} className="px-4 py-2 text-sm text-gray-300 hover:bg-[#25262b] hover:text-white flex items-center gap-3 text-left">
                        <Info className="w-4 h-4" /> Details
                    </button>
                    <div className="h-px bg-[#2e3035] my-1" />
                </>
            )}

            {isTrashed && (
                <>
                    <button onClick={() => onAction('restore')} className="px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-400/10 flex items-center gap-3 text-left">
                        <Share2 className="w-4 h-4 -scale-x-100 rotate-180" /> Restore
                    </button>
                    <div className="h-px bg-[#2e3035] my-1" />
                </>
            )}

            <button onClick={() => onAction('delete')} className="px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-3 text-left">
                <Trash2 className="w-4 h-4" /> {isTrashed ? "Delete Forever" : "Delete"}
            </button>
        </div>
    );
}
