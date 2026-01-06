"use client";
import { useState, useRef, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import DesktopSidebar from "@/components/DesktopSidebar";
import Toolbar from "@/app/storage/components/Toolbar";
import FolderCard from "@/app/storage/components/FolderCard";
import FileCard from "@/app/storage/components/FileCard";
import FileList from "@/app/storage/components/FileList";
import DetailsDialog from "@/app/storage/components/DetailsDialog";
import NewFolderDialog from "@/app/storage/components/NewFolderDialog";
import RenameDialog from "@/app/storage/components/RenameDialog";
import DeleteDialog from "@/app/storage/components/DeleteDialog";
import ContextMenu from "@/app/storage/components/ContextMenu";
import Breadcrumbs from "./components/Breadcrumbs";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { BreadcrumbHeader } from "@/components/BreadcrumbHeader";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Separator } from "@/components/ui/separator";

import { folders, files, FileItem } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentView, setCurrentView] = useState<"drive" | "trash">("drive");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);


  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{ id: string | null, name: string }[]>([
    { id: null, name: "My Drive" }
  ]);

  // Data State
  const [items, setItems] = useState<FileItem[]>([...folders, ...files]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modals, setModals] = useState({
    newFolder: false,
    rename: false,
    delete: false,
    details: false
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentItems = currentView === 'trash'
    ? items.filter(item => item.isTrashed && (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))
    : items.filter(item => {
      if (searchQuery) {
        return !item.isTrashed && item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.parentId === currentFolderId && !item.isTrashed;
    });
  const currentFolders = currentItems.filter(item => item.type === "folder");
  const currentFiles = currentItems.filter(item => item.type !== "folder");

  const handleSelect = (file: FileItem) => {
    setSelectedFile(file === selectedFile ? null : file);
  };

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolderId(folder.id);
    setSearchQuery(""); // Clear search when navigating
    setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedFile(null);
  };

  const navigateToBreadcrumb = (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    setSearchQuery(""); // Clear search when navigating
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFile(null);
  };

  const handleBack = () => {
    if (searchQuery) {
      setSearchQuery(""); // Clear search on back if active (optional UX choice, usually good)
      return;
    }

    if (currentView === 'trash') {
      setCurrentView('drive');
      setFolderHistory([{ id: null, name: "My Drive" }]); // Reset history or just go back to previous? Reset is safer for now.
      setCurrentFolderId(null);
      return;
    }
    if (folderHistory.length <= 1) return;
    const newHistory = folderHistory.slice(0, -1);
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
    setSelectedFile(null);
  };

  // --- Actions ---

  const handleCreateFolder = (name: string) => {
    const newFolder: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      type: "folder",
      size: "0 items",
      modified: "Just now",
      owner: "me",
      parentId: currentFolderId
    };
    setItems(prev => [...prev, newFolder]);
  };

  const handleRename = (newName: string) => {
    if (!selectedFile) return;
    setItems(prev => prev.map(item =>
      item.id === selectedFile.id ? { ...item, name: newName } : item
    ));
    setSelectedFile(null);
  };

  const handleDelete = () => {
    if (!selectedFile) return;

    if (currentView === 'trash') {
      // Permanent delete
      setItems(prev => prev.filter(item => item.id !== selectedFile.id));
    } else {
      // Soft delete
      setItems(prev => prev.map(item =>
        item.id === selectedFile.id ? { ...item, isTrashed: true } : item
      ));
    }
    setSelectedFile(null);
    setModals(prev => ({ ...prev, delete: false }));
  };

  const handleRestore = () => {
    if (!selectedFile) return;
    setItems(prev => prev.map(item =>
      item.id === selectedFile.id ? { ...item, isTrashed: false } : item
    ));
    setSelectedFile(null);
  };

  const handleEmptyTrash = () => {
    if (confirm("Are you sure you want to permanently delete all items in Trash?")) {
      setItems(prev => prev.filter(item => !item.isTrashed));
    }
  };

  const handleRestoreAll = () => {
    if (confirm("Restore all items from Trash?")) {
      setItems(prev => prev.map(item => ({ ...item, isTrashed: false })));
    }
  };

  const handleCopyLink = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(`https://drive.example.com/file/${selectedFile.id}`);
    console.log("Link copied to clipboard");
  };

  const handleContextCopyLink = (item: FileItem) => {
    navigator.clipboard.writeText(`https://drive.example.com/file/${item.id}`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newItem: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.includes("image") ? "image" :
        file.type.includes("pdf") ? "pdf" : "document",
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      modified: "Just now",
      owner: "me",
      parentId: currentFolderId
    };
    setItems(prev => [...prev, newItem]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setSelectedFile(item);
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { item } = contextMenu;

    switch (action) {
      case 'open':
        if (item.type === 'folder') handleFolderClick(item);
        break;
      case 'rename':
        setModals(prev => ({ ...prev, rename: true }));
        break;
      case 'share':
        // refined-simulation: would open share dialog
        console.log("Share action triggered for", item.name);
        break;
      case 'link':
        handleContextCopyLink(item);
        // refined-simulation: toast "Link copied"
        break;
      case 'download':
        // refined-simulation: trigger download
        console.log("Download action triggered for", item.name);
        break;
      case 'delete':
        setModals(prev => ({ ...prev, delete: true }));
        break;
      case 'info':
      case 'details':
        setModals(prev => ({ ...prev, details: true }));
        break;
      case 'restore':
        handleRestore();
        break;
    }
    setContextMenu(null);
  };

  const handleTrashClick = () => {
    setCurrentView('trash');
    setFolderHistory([{ id: 'trash', name: 'Trash' }]);
    setSelectedFile(null);
    setSearchQuery(""); // Clear search when switching to trash
  };


  return (
      <SignedIn>
    <div className="flex h-screen">
      <DesktopSidebar />

      <div className="flex flex-col flex-1 min-h-0">
        <header className="flex items-center justify-between px-6 py-4 h-[50px] w-full gap-4 flex-shrink-0">
  <BreadcrumbHeader />
  <SearchBar />
  <NotificationDropdown />
  <div className="gap-4 flex items-center">
    <ModeToggle />
    <UserButton />
  </div>
</header>

<Separator />

<div className="flex-1 overflow-y-auto">
  <div className="p-4 md:p-6">

       {/* ... inputs/nav ... */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex flex-col gap-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <button
              onClick={handleBack}
              disabled={folderHistory.length <= 1 && currentView !== 'trash' && !searchQuery}
              className={cn("p-1 rounded-full hover:bg-white/5 transition-colors", (folderHistory.length <= 1 && currentView !== 'trash' && !searchQuery) ? "opacity-30 cursor-not-allowed" : "text-gray-200")}
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-px h-4 bg-sidebar-border" />
            {folderHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => navigateToBreadcrumb(index)}
                className={cn(
                  "hover:text-white transition-colors px-1",
                  index === folderHistory.length - 1 ? "text-white font-medium" : ""
                )}
              >
                {item.name} {index < folderHistory.length - 1 && " / "}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {searchQuery ? `Search results for "${searchQuery}"` : folderHistory[folderHistory.length - 1].name}
            </h1>
            <span className="text-sm text-gray-500">{currentItems.length} items</span>
          </div>
        </div>

        <Toolbar
          viewMode={viewMode}
          onViewChange={setViewMode}
          onNewFolder={() => setModals(prev => ({ ...prev, newFolder: true }))}
          onUpload={handleUploadClick}
          onToggleDetails={() => setModals(prev => ({ ...prev, details: true }))}
          isDetailsOpen={false}
          onRename={() => setModals(prev => ({ ...prev, rename: true }))}
          onDelete={() => setModals(prev => ({ ...prev, delete: true }))}
          onCopyLink={handleCopyLink}
          onTrashClick={handleTrashClick}
          hasSelection={!!selectedFile}
          pageView={currentView}
          onEmptyTrash={handleEmptyTrash}
          onRestore={handleRestore}
          onRestoreAll={handleRestoreAll}
          onDeleteForever={handleDelete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {
          viewMode === "grid" ? (
            <div className="flex-1 overflow-y-auto min-h-0 space-y-8 pb-10" onContextMenu={(e) => { e.preventDefault(); }}>
              {currentFolders.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                    Folders
                    <span className="bg-white/5 text-xs px-2 py-0.5 rounded-full text-gray-500">{currentFolders.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        selected={selectedFile?.id === folder.id}
                        onClick={() => handleSelect(folder)}
                        onDoubleClick={() => handleFolderClick(folder)}
                        onContextMenu={(e) => handleContextMenu(e, folder)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {currentFiles.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                    Files
                    <span className="bg-white/5 text-xs px-2 py-0.5 rounded-full text-gray-500">{currentFiles.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        selected={selectedFile?.id === file.id}
                        onClick={() => handleSelect(file)}
                        onContextMenu={(e) => handleContextMenu(e, file)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {currentItems.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
                  <div className="text-lg font-medium">This folder is empty</div>
                  <div className="text-sm">Use the "New Folder" button to create one</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pb-10 bg-card rounded-xl border border-card-border">
              <FileList
                items={currentItems}
                selectedId={selectedFile?.id}
                onSelect={handleSelect}
                onContextMenu={handleContextMenu}
              />
            </div>
          )
        }

        {/* Modals and Overlays */}
        <NewFolderDialog
          isOpen={modals.newFolder}
          onClose={() => setModals(prev => ({ ...prev, newFolder: false }))}
          onCreate={handleCreateFolder}
        />

        <RenameDialog
          isOpen={modals.rename}
          onClose={() => setModals(prev => ({ ...prev, rename: false }))}
          onRename={handleRename}
          currentName={selectedFile?.name || ""}
        />

        <DeleteDialog
          isOpen={modals.delete}
          onClose={() => setModals(prev => ({ ...prev, delete: false }))}
          onDelete={handleDelete}
          itemName={selectedFile?.name || ""}
        />

        <DetailsDialog
          isOpen={modals.details}
          onClose={() => setModals(prev => ({ ...prev, details: false }))}
          file={selectedFile}
        />

        {
          contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onAction={handleContextMenuAction}
              isTrashed={contextMenu.item.isTrashed}
            />
          )
        }

        {/* Storage Indicator Widget Removed - Moved to Toolbar */}
      </div>
    </div>
      </div>
</div>
        </SignedIn>
  );
}