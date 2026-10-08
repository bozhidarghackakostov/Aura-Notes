import React, { useState } from 'react';
import { 
  FileText, 
  Folder as FolderIcon, 
  Hash, 
  Plus, 
  Archive, 
  Trash2, 
  Pin, 
  Settings, 
  Download, 
  X,
  Edit2,
  Check,
  BookOpen
} from 'lucide-react';
import { Folder, Note } from '../types/note';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  currentFolderId: string;
  currentTag: string | null;
  onSelectFolder: (folderId: string) => void;
  onSelectTag: (tag: string | null) => void;
  onCreateNote: () => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenExportModal: () => void;
  onCloseMobileDrawer?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  notes,
  currentFolderId,
  currentTag,
  onSelectFolder,
  onSelectTag,
  onCreateNote,
  onAddFolder,
  onDeleteFolder,
  onOpenExportModal,
  onCloseMobileDrawer,
  isMobile = false,
}) => {
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Calculate counts
  const activeNotes = notes.filter((n) => !n.isTrash && !n.isArchived);
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length;
  const archivedCount = notes.filter((n) => n.isArchived && !n.isTrash).length;
  const trashCount = notes.filter((n) => n.isTrash).length;

  // Extract all unique tags from active notes
  const tagCounts: Record<string, number> = {};
  activeNotes.forEach((n) => {
    n.tags.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const uniqueTags = Object.keys(tagCounts).sort();

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#ffffff] border-r border-[#c0c7d4]/40 select-none">
      {/* Top Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#c0c7d4]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#005ea5] flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[16px] tracking-tight text-[#171c20]">
            Aura Notes
          </span>
        </div>

        {isMobile && onCloseMobileDrawer && (
          <button
            onClick={onCloseMobileDrawer}
            className="p-1 rounded-md text-[#404752] hover:bg-[#f0f4f9]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Action: New Note Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onCreateNote();
            if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="w-full h-9.5 px-3 rounded-lg bg-[#005ea5] hover:bg-[#004881] text-white flex items-center justify-center gap-2 text-sm font-medium shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
          <span className="ml-auto text-[11px] font-mono text-[#d3e4ff] bg-[#004881]/70 px-1.5 py-0.5 rounded hidden sm:inline">
            Ctrl+N
          </span>
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar py-1">
        {/* Core Views */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectFolder('all');
              onSelectTag(null);
              if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              currentFolderId === 'all' && !currentTag
                ? 'bg-[#f0f4f9] text-[#005ea5] font-medium'
                : 'text-[#404752] hover:bg-[#f6fafe] hover:text-[#171c20]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#005ea5]" />
              <span>All Notes</span>
            </div>
            <span className="text-xs text-[#717783] bg-[#eaeef3] px-1.5 py-0.5 rounded font-mono">
              {activeNotes.length}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectFolder('pinned');
              onSelectTag(null);
              if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              currentFolderId === 'pinned' && !currentTag
                ? 'bg-[#f0f4f9] text-[#005ea5] font-medium'
                : 'text-[#404752] hover:bg-[#f6fafe] hover:text-[#171c20]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Pin className="w-4 h-4 text-[#006591]" />
              <span>Pinned Notes</span>
            </div>
            <span className="text-xs text-[#717783] bg-[#eaeef3] px-1.5 py-0.5 rounded font-mono">
              {pinnedCount}
            </span>
          </button>
        </div>

        {/* Notebooks / Folders Section */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#717783] uppercase">
              Notebooks
            </span>
            <button
              onClick={() => setIsAddingFolder(true)}
              className="p-1 rounded text-[#717783] hover:text-[#005ea5] hover:bg-[#f0f4f9] transition-colors"
              title="Add Notebook"
              aria-label="Add Notebook"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Folder Inline Input */}
          {isAddingFolder && (
            <form onSubmit={handleCreateFolder} className="px-2 mb-2">
              <div className="flex items-center gap-1 bg-[#f0f4f9] rounded-lg p-1 border border-[#005ea5]">
                <FolderIcon className="w-3.5 h-3.5 text-[#005ea5] ml-1" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Notebook name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#171c20] focus:outline-none px-1 py-0.5"
                />
                <button
                  type="submit"
                  className="p-1 text-[#005ea5] hover:bg-white rounded"
                  title="Confirm"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFolder(false);
                    setNewFolderName('');
                  }}
                  className="p-1 text-[#717783] hover:bg-white rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {folders.map((folder) => {
              const count = activeNotes.filter((n) => n.folderId === folder.id).length;
              const isSelected = currentFolderId === folder.id && !currentTag;

              return (
                <div
                  key={folder.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#f0f4f9] text-[#005ea5] font-medium'
                      : 'text-[#404752] hover:bg-[#f6fafe] hover:text-[#171c20]'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectFolder(folder.id);
                      onSelectTag(null);
                      if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
                    }}
                    className="flex-1 flex items-center gap-2.5 text-left truncate"
                  >
                    <FolderIcon className="w-4 h-4 text-[#717783] group-hover:text-[#005ea5] transition-colors" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#717783] font-mono">{count}</span>
                    {!folder.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete notebook "${folder.name}"? Notes will move to Quick Notes.`)) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#717783] hover:text-[#ba1a1a] transition-opacity"
                        title="Delete notebook"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags Cloud Section */}
        {uniqueTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-[#717783] uppercase flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Tags
              </span>
              {currentTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-[11px] text-[#005ea5] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 px-1">
              {uniqueTags.map((tag) => {
                const isSelected = currentTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      onSelectTag(isSelected ? null : tag);
                      if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
                    }}
                    className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#005ea5] text-white font-medium'
                        : 'bg-[#f0f4f9] text-[#404752] hover:bg-[#eaeef3] hover:text-[#171c20]'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className="opacity-70 text-[10px] font-mono">{tagCounts[tag]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* System Sections: Archive & Trash */}
        <div className="pt-2 border-t border-[#c0c7d4]/30 space-y-0.5">
          <button
            onClick={() => {
              onSelectFolder('archive');
              onSelectTag(null);
              if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              currentFolderId === 'archive' && !currentTag
                ? 'bg-[#f0f4f9] text-[#005ea5] font-medium'
                : 'text-[#404752] hover:bg-[#f6fafe] hover:text-[#171c20]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-[#717783]" />
              <span>Archive</span>
            </div>
            {archivedCount > 0 && (
              <span className="text-xs text-[#717783] font-mono">{archivedCount}</span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectFolder('trash');
              onSelectTag(null);
              if (isMobile && onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              currentFolderId === 'trash' && !currentTag
                ? 'bg-[#f0f4f9] text-[#ba1a1a] font-medium'
                : 'text-[#404752] hover:bg-[#f6fafe] hover:text-[#171c20]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-[#717783]" />
              <span>Trash</span>
            </div>
            {trashCount > 0 && (
              <span className="text-xs text-[#ba1a1a] font-mono">{trashCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-[#c0c7d4]/40 bg-[#f0f4f9]/50 flex items-center justify-between text-xs text-[#404752]">
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 text-xs text-[#404752] hover:text-[#005ea5] transition-colors"
          title="Backup and Export options"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup & Export</span>
        </button>

        <span className="text-[11px] text-[#717783] font-mono">
          {activeNotes.length} notes
        </span>
      </div>
    </aside>
  );
};
