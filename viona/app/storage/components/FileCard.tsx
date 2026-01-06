import { MoreVertical } from "lucide-react";
import { FileItem, getIconForType } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface FileCardProps {
    file: FileItem;
    selected?: boolean;
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}

export default function FileCard({ file, selected, onClick, onContextMenu }: FileCardProps) {
    const Icon = getIconForType(file.type);
    const isImage = file.type === "image";

    return (
        <div
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={cn(
                "group relative bg-card border rounded-xl transition-all cursor-pointer overflow-hidden flex flex-col",
                selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-card-border hover:bg-white/5 hover:border-white/10"
            )}
        >
            <div className="relative aspect-[4/3] bg-background w-full flex items-center justify-center overflow-hidden">
                {isImage ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-gray-600" />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <Icon className={cn("w-12 h-12",
                            file.type === "pdf" ? "text-red-500" :
                                file.type === "video" ? "text-purple-500" :
                                    file.type === "audio" ? "text-yellow-500" :
                                        "text-blue-500"
                        )} />
                    </div>
                )}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onContextMenu?.(e);
                        }}
                        className="p-1 bg-black/50 hover:bg-black/70 text-white rounded backdrop-blur-sm"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className={cn("p-3 border-t transition-colors", selected ? "border-primary bg-primary/5" : "border-card-border group-hover:border-white/10")}>
                <h3 className={cn("text-sm font-medium truncate mb-1", selected ? "text-primary" : "text-gray-200")} title={file.name}>{file.name}</h3>
                <p className="text-xs text-gray-500">{file.size} • {file.modified}</p>
            </div>
        </div>
    );
}
