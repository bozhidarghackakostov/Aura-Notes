import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Pin, 
  Plus, 
  ArrowUpDown, 
  CheckSquare, 
  Code, 
  FileText, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Tag
} from 'lucide-react';
import { Note, Folder, NoteSortOption } from '../types/note';
import { formatNoteDate } from '../utils/storage';

interface NoteListProps {
  notes: Note[];
  folders: Folder[];
  currentNoteId: string | null;
  currentFolderId: string;
  currentTag: string | null;
  searchQuery: string;
  sortBy: NoteSortOption;
  typeFilter: 'all' | 'checklist' | 'code' | 'text';
  onSelectNote: (noteId: string) => void;
  onCreateNote: (title?: string) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: NoteSortOption) => void;
  onTypeFilterChange: (type: 'all' | 'checklist' | 'code' | 'text') => void;
  onTogglePin: (noteId: string, e: React.MouseEvent) => void;
  onDeleteNote: (noteId: string, e: React.MouseEvent) => void;
  onRestoreNote: (noteId: string, e: React.MouseEvent) => void;
  onEmptyTrash: () => void;
  onResetStarterNotes: () => void;
  onSelectTag: (tag: string | null) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  folders,
  currentNoteId,
  currentFolderId,
  currentTag,
  searchQuery,
  sortBy,
  typeFilter,
  onSelectNote,
  onCreateNote,
  onSearchChange,
  onSortChange,
  onTypeFilterChange,
  onTogglePin,
  onDeleteNote,
  onRestoreNote,
  onEmptyTrash,
  onResetStarterNotes,
  onSelectTag,
}) => {
  const [quickTitle, setQuickTitle] = useState('');

  // Determine current view folder title
  const getHeaderTitle = () => {
    if (currentTag) return `Tag: ${currentTag}`;
    if (currentFolderId === 'all') return 'All Notes';
    if (currentFolderId === 'pinned') return 'Pinned Notes';
    if (currentFolderId === 'archive') return 'Archive';
    if (currentFolderId === 'trash') return 'Trash';
    const folder = folders.find((f) => f.id === currentFolderId);
    return folder ? folder.name : 'Notes';
  };

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTitle.trim()) {
      onCreateNote(quickTitle.trim());
      setQuickTitle('');
    }
  };

  // Helper to highlight matching search words
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-[#c9e6ff] text-[#001e2f] px-0.5 rounded font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Pinned items in the current view
  const pinnedNotes = notes.filter((n) => n.isPinned && !n.isTrash && !n.isArchived);

  return (
    <div className="w-full h-full flex flex-col bg-[#f6fafe] border-r border-[#c0c7d4]/40 select-none">
      {/* Header with Title and Search */}
      <div className="p-3 bg-[#ffffff] border-b border-[#c0c7d4]/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[17px] font-bold text-[#171c20] tracking-tight">
              {getHeaderTitle()}
            </h2>
            <span className="text-xs text-[#717783] font-mono">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          {currentFolderId === 'trash' && notes.length > 0 && (
            <button
              onClick={onEmptyTrash}
              className="text-xs text-[#ba1a1a] hover:underline font-medium"
            >
              Empty Trash
            </button>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#717783]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search notes, content, or #tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-16 py-1.5 bg-[#f0f4f9] focus:bg-[#ffffff] text-sm text-[#171c20] placeholder:text-[#717783] rounded-lg border border-transparent focus:border-[#005ea5] focus:outline-none transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-[#717783] hover:text-[#171c20] rounded-full"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] font-mono text-[#717783] bg-[#dfe3e7] px-1.5 py-0.5 rounded hidden sm:inline">
                Ctrl+F
              </span>
            )}
          </div>
        </div>

        {/* Quick Capture Inline Bar */}
        {currentFolderId !== 'trash' && currentFolderId !== 'archive' && (
          <form onSubmit={handleQuickCapture} className="flex items-center gap-1.5 pt-0.5">
            <input
              type="text"
              placeholder="Quick jot a thought... (Press Enter)"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-[#f0f4f9] text-[#171c20] placeholder:text-[#717783] rounded-md border border-[#c0c7d4]/40 focus:border-[#005ea5] focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="px-2.5 py-1 bg-[#005ea5] text-white rounded-md text-xs font-medium hover:bg-[#004881] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Add
            </button>
          </form>
        )}

        {/* Filter Pills & Sort Selector */}
        <div className="flex items-center justify-between pt-1 text-xs">
          {/* Type Filter segmented pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onTypeFilterChange('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-[#005ea5] text-white'
                  : 'bg-[#f0f4f9] text-[#404752] hover:bg-[#eaeef3]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onTypeFilterChange('checklist')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                typeFilter === 'checklist'
                  ? 'bg-[#005ea5] text-white'
                  : 'bg-[#f0f4f9] text-[#404752] hover:bg-[#eaeef3]'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>Tasks</span>
            </button>
            <button
              onClick={() => onTypeFilterChange('code')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                typeFilter === 'code'
                  ? 'bg-[#005ea5] text-white'
                  : 'bg-[#f0f4f9] text-[#404752] hover:bg-[#eaeef3]'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-[#404752]">
            <ArrowUpDown className="w-3 h-3 text-[#717783]" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as NoteSortOption)}
              className="bg-transparent text-[11px] text-[#404752] focus:outline-none cursor-pointer"
            >
              <option value="updated-desc">Recent</option>
              <option value="updated-asc">Oldest</option>
              <option value="title-asc">Title A-Z</option>
              <option value="created-desc">Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pinned Notes Quick Rail (when viewing All and not searching) */}
      {!searchQuery && currentFolderId === 'all' && pinnedNotes.length > 0 && (
        <div className="px-3 py-2 border-b border-[#c0c7d4]/30 bg-[#f0f4f9]/40">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#717783] uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1 text-[#005ea5]">
              <Pin className="w-3 h-3 fill-current" />
              Pinned
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {pinnedNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`flex-shrink-0 w-36 p-2 rounded-lg border text-left transition-all ${
                  currentNoteId === note.id
                    ? 'border-[#005ea5] bg-white shadow-xs'
                    : 'border-[#c0c7d4]/60 bg-white hover:border-[#717783]'
                }`}
              >
                <div className="font-semibold text-xs text-[#171c20] truncate">
                  {note.title || 'Untitled Note'}
                </div>
                <div className="text-[11px] text-[#717783] truncate mt-0.5">
                  {note.content.replace(/^#+\s/gm, '').trim() || 'No additional text'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes Stream / List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {notes.length === 0 ? (
          /* Empty States */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#717783]">
            {searchQuery ? (
              <>
                <Search className="w-8 h-8 mb-2 text-[#c0c7d4]" />
                <p className="text-sm font-medium text-[#171c20]">No notes found</p>
                <p className="text-xs text-[#717783] mt-1 max-w-[220px]">
                  No notes match "{searchQuery}".
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onSearchChange('')}
                    className="px-3 py-1.5 bg-[#eaeef3] text-xs font-medium text-[#171c20] rounded-md hover:bg-[#dfe3e7] transition-colors"
                  >
                    Clear search
                  </button>
                  <button
                    onClick={() => {
                      onCreateNote(searchQuery);
                      onSearchChange('');
                    }}
                    className="px-3 py-1.5 bg-[#005ea5] text-xs font-medium text-white rounded-md hover:bg-[#004881] transition-colors"
                  >
                    Create this note
                  </button>
                </div>
              </>
            ) : currentFolderId === 'trash' ? (
              <>
                <Trash2 className="w-8 h-8 mb-2 text-[#c0c7d4]" />
                <p className="text-sm font-medium text-[#171c20]">Trash is empty</p>
                <p className="text-xs text-[#717783] mt-1">Deleted notes will appear here.</p>
              </>
            ) : currentFolderId === 'archive' ? (
              <>
                <FileText className="w-8 h-8 mb-2 text-[#c0c7d4]" />
                <p className="text-sm font-medium text-[#171c20]">Archive is empty</p>
                <p className="text-xs text-[#717783] mt-1">Archived notes will be stored here.</p>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 mb-2 text-[#c0c7d4]" />
                <p className="text-sm font-medium text-[#171c20]">No notes yet</p>
                <p className="text-xs text-[#717783] mt-1 max-w-[200px]">
                  Capture an idea, write a checklist, or draft a memo.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => onCreateNote()}
                    className="px-3 py-1.5 bg-[#005ea5] text-xs font-medium text-white rounded-lg hover:bg-[#004881] transition-colors shadow-xs"
                  >
                    + Create First Note
                  </button>
                  <button
                    onClick={onResetStarterNotes}
                    className="text-xs text-[#005ea5] hover:underline"
                  >
                    Restore starter examples
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = currentNoteId === note.id;
            const plainTextPreview = note.content
              .replace(/```[\s\S]*?```/g, '[Code snippet]')
              .replace(/#+\s/g, '')
              .replace(/[-*]\s\[[ xX]\]/g, '•')
              .replace(/[>*_`~#]/g, '')
              .trim();

            return (
              <article
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ffffff] border-[#005ea5] shadow-xs'
                    : 'bg-[#ffffff] border-[#c0c7d4]/50 hover:border-[#717783]/60'
                }`}
              >
                {/* Note Header: Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {note.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-[#005ea5] fill-current flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm text-[#171c20] truncate">
                      {highlightMatch(note.title || 'Untitled Note', searchQuery)}
                    </h3>
                  </div>

                  {/* Actions on Hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {note.isTrash ? (
                      <>
                        <button
                          onClick={(e) => onRestoreNote(note.id, e)}
                          className="p-1 text-[#005ea5] hover:bg-[#f0f4f9] rounded"
                          title="Restore note"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => onDeleteNote(note.id, e)}
                          className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded"
                          title="Permanently delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => onTogglePin(note.id, e)}
                          className={`p-1 rounded hover:bg-[#f0f4f9] transition-colors ${
                            note.isPinned ? 'text-[#005ea5]' : 'text-[#717783] hover:text-[#005ea5]'
                          }`}
                          title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => onDeleteNote(note.id, e)}
                          className="p-1 text-[#717783] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors"
                          title="Move to trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Body Snippet */}
                <p className="text-xs text-[#404752] line-clamp-2 leading-relaxed mb-2">
                  {highlightMatch(plainTextPreview || 'No additional content...', searchQuery)}
                </p>

                {/* Card Footer: Tags & Date */}
                <div className="flex items-center justify-between text-[11px] text-[#717783] pt-1 border-t border-[#eaeef3]">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {note.tags.slice(0, 2).map((t) => (
                      <button
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTag(t);
                        }}
                        className="px-1.5 py-0.2 rounded bg-[#f0f4f9] text-[#006591] hover:bg-[#d3e4ff] transition-colors truncate max-w-[90px]"
                      >
                        {t}
                      </button>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-[#717783]">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[11px] whitespace-nowrap ml-2">
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
