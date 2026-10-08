import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, BookOpen } from 'lucide-react';
import { Note, Folder, FilterState, NoteSortOption } from './types/note';
import { 
  getStoredNotes, 
  saveNotesToStorage, 
  getStoredFolders, 
  saveFoldersToStorage, 
  createNewNote, 
  STARTER_NOTES 
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => getStoredNotes());
  const [folders, setFolders] = useState<Folder[]>(() => getStoredFolders());
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  // Filters
  const [filterState, setFilterState] = useState<FilterState>({
    folderId: 'all',
    tag: null,
    searchQuery: '',
    typeFilter: 'all',
    sortBy: 'updated-desc',
  });

  // UI States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 768);
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'list' | 'editor'>('list');

  // Handle Window Resize for Responsive Layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save notes whenever they change
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Save folders whenever they change
  useEffect(() => {
    saveFoldersToStorage(folders);
  }, [folders]);

  // Select initial note if none selected
  useEffect(() => {
    if (!currentNoteId && notes.length > 0) {
      const active = notes.filter((n) => !n.isTrash && !n.isArchived);
      if (active.length > 0) {
        setCurrentNoteId(active[0].id);
      } else {
        setCurrentNoteId(notes[0].id);
      }
    }
  }, [notes, currentNoteId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N: New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      }

      // Ctrl+F or Cmd+F: Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        // Only if not in a textarea or input
        const activeElem = document.activeElement;
        const isWriting = activeElem?.tagName === 'TEXTAREA' || activeElem?.tagName === 'INPUT';
        if (!isWriting) {
          e.preventDefault();
          const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      }

      // Escape: Close mobile sidebar or modal
      if (e.key === 'Escape') {
        setIsMobileSidebarOpen(false);
        setIsExportModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, filterState]);

  // Filtered & Sorted Notes calculation
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Folder / System view filter
        if (filterState.folderId === 'all') {
          if (note.isTrash || note.isArchived) return false;
        } else if (filterState.folderId === 'pinned') {
          if (note.isTrash || note.isArchived || !note.isPinned) return false;
        } else if (filterState.folderId === 'archive') {
          if (note.isTrash || !note.isArchived) return false;
        } else if (filterState.folderId === 'trash') {
          if (!note.isTrash) return false;
        } else {
          // Specific custom folder
          if (note.isTrash || note.isArchived) return false;
          if (note.folderId !== filterState.folderId) return false;
        }

        // Tag filter
        if (filterState.tag) {
          if (!note.tags.includes(filterState.tag)) return false;
        }

        // Type filter (all, checklist, code, text)
        if (filterState.typeFilter === 'checklist') {
          if (!/[-*]\s+\[[ xX]\]/.test(note.content)) return false;
        } else if (filterState.typeFilter === 'code') {
          if (!/```/.test(note.content)) return false;
        }

        // Search Query filter
        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.toLowerCase();
          const matchesTitle = note.title.toLowerCase().includes(q);
          const matchesContent = note.content.toLowerCase().includes(q);
          const matchesTag = note.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesContent && !matchesTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes bubble to top if not in trash
        if (!a.isTrash && !b.isTrash && a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }

        if (filterState.sortBy === 'updated-desc') {
          return b.updatedAt - a.updatedAt;
        }
        if (filterState.sortBy === 'updated-asc') {
          return a.updatedAt - b.updatedAt;
        }
        if (filterState.sortBy === 'created-desc') {
          return b.createdAt - a.createdAt;
        }
        if (filterState.sortBy === 'title-asc') {
          return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, filterState]);

  // Current Active Note
  const currentNote = useMemo(() => {
    return notes.find((n) => n.id === currentNoteId) || null;
  }, [notes, currentNoteId]);

  // Create Note Action
  const handleCreateNote = (initialTitle?: string) => {
    // Determine target folder
    let targetFolder = 'inbox';
    if (
      filterState.folderId !== 'all' &&
      filterState.folderId !== 'pinned' &&
      filterState.folderId !== 'archive' &&
      filterState.folderId !== 'trash'
    ) {
      targetFolder = filterState.folderId;
    }

    const newNote = createNewNote(targetFolder, initialTitle || 'Untitled Note');
    if (filterState.tag) {
      newNote.tags = [filterState.tag];
      newNote.content = `${filterState.tag} `;
    }

    setNotes((prev) => [newNote, ...prev]);
    setCurrentNoteId(newNote.id);
    if (isMobileView) {
      setMobileActiveScreen('editor');
    }
  };

  // Update Note Action
  const handleUpdateNote = (updatedFields: Partial<Note>) => {
    if (!currentNoteId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === currentNoteId ? { ...n, ...updatedFields } : n))
    );
  };

  // Delete Note Action
  const handleDeleteNote = (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    if (target.isTrash) {
      // Permanent deletion
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (currentNoteId === noteId) {
        const remaining = notes.filter((n) => n.id !== noteId);
        setCurrentNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    } else {
      // Soft delete: move to trash
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isTrash: true, isPinned: false } : n))
      );
      if (currentNoteId === noteId) {
        const remaining = notes.filter((n) => n.id !== noteId && !n.isTrash);
        setCurrentNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    }

    if (isMobileView) {
      setMobileActiveScreen('list');
    }
  };

  // Restore Note from Trash
  const handleRestoreNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isTrash: false } : n))
    );
  };

  // Archive Note Action
  const handleArchiveNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isArchived: !n.isArchived, isPinned: false } : n
      )
    );
  };

  // Pin Toggle Action
  const handleTogglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Empty Trash Action
  const handleEmptyTrash = () => {
    if (confirm('Permanently delete all notes in trash? This cannot be undone.')) {
      setNotes((prev) => prev.filter((n) => !n.isTrash));
      setCurrentNoteId(null);
    }
  };

  // Reset Starter Notes
  const handleResetStarterNotes = () => {
    setNotes(STARTER_NOTES);
    setCurrentNoteId(STARTER_NOTES[0].id);
  };

  // Add Folder
  const handleAddFolder = (name: string) => {
    const newFolder: Folder = {
      id: 'folder_' + Date.now(),
      name,
    };
    setFolders((prev) => [...prev, newFolder]);
    setFilterState((prev) => ({ ...prev, folderId: newFolder.id, tag: null }));
  };

  // Delete Folder
  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Reassign notes to inbox
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: 'inbox' } : n))
    );
    if (filterState.folderId === folderId) {
      setFilterState((prev) => ({ ...prev, folderId: 'all' }));
    }
  };

  // Restore from Backup JSON
  const handleRestoreBackup = (importedNotes: Note[], importedFolders: Folder[]) => {
    setNotes(importedNotes);
    setFolders(importedFolders);
    if (importedNotes.length > 0) {
      setCurrentNoteId(importedNotes[0].id);
    }
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-[#f6fafe] text-[#171c20]">
      {/* Mobile Drawer Backdrop */}
      {isMobileView && isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#171c20]/30 backdrop-blur-[2px] transition-opacity"
        />
      )}

      {/* Desktop / Mobile Slide-Over Sidebar */}
      <div
        className={`${
          isMobileView
            ? `fixed inset-y-0 left-0 z-50 w-[270px] transform transition-transform duration-200 ease-in-out shadow-2xl ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-[250px] flex-shrink-0 h-full'
        }`}
      >
        <Sidebar
          folders={folders}
          notes={notes}
          currentFolderId={filterState.folderId}
          currentTag={filterState.tag}
          onSelectFolder={(folderId) =>
            setFilterState((prev) => ({ ...prev, folderId, tag: null }))
          }
          onSelectTag={(tag) =>
            setFilterState((prev) => ({ ...prev, tag }))
          }
          onCreateNote={() => handleCreateNote()}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onCloseMobileDrawer={() => setIsMobileSidebarOpen(false)}
          isMobile={isMobileView}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* On Mobile: Toggle between List and Editor */}
        {isMobileView ? (
          mobileActiveScreen === 'list' ? (
            <div className="w-full h-full flex flex-col">
              {/* Mobile Top Bar */}
              <div className="h-12 px-3 bg-white border-b border-[#c0c7d4]/40 flex items-center justify-between">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-[#404752] hover:bg-[#f0f4f9]"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-5 h-5 text-[#005ea5]" />
                </button>

                <span className="font-semibold text-sm text-[#171c20]">
                  Aura Notes
                </span>

                <button
                  onClick={() => handleCreateNote()}
                  className="px-2.5 py-1 bg-[#005ea5] text-white rounded-md text-xs font-medium"
                >
                  + Note
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <NoteList
                  notes={filteredNotes}
                  folders={folders}
                  currentNoteId={currentNoteId}
                  currentFolderId={filterState.folderId}
                  currentTag={filterState.tag}
                  searchQuery={filterState.searchQuery}
                  sortBy={filterState.sortBy}
                  typeFilter={filterState.typeFilter}
                  onSelectNote={(noteId) => {
                    setCurrentNoteId(noteId);
                    setMobileActiveScreen('editor');
                  }}
                  onCreateNote={(title) => handleCreateNote(title)}
                  onSearchChange={(searchQuery) =>
                    setFilterState((prev) => ({ ...prev, searchQuery }))
                  }
                  onSortChange={(sortBy) =>
                    setFilterState((prev) => ({ ...prev, sortBy }))
                  }
                  onTypeFilterChange={(typeFilter) =>
                    setFilterState((prev) => ({ ...prev, typeFilter }))
                  }
                  onTogglePin={handleTogglePin}
                  onDeleteNote={(id, e) => {
                    e.stopPropagation();
                    handleDeleteNote(id);
                  }}
                  onRestoreNote={(id, e) => {
                    e.stopPropagation();
                    handleRestoreNote(id);
                  }}
                  onEmptyTrash={handleEmptyTrash}
                  onResetStarterNotes={handleResetStarterNotes}
                  onSelectTag={(tag) =>
                    setFilterState((prev) => ({ ...prev, tag }))
                  }
                />
              </div>
            </div>
          ) : currentNote ? (
            <div className="w-full h-full flex flex-col">
              <NoteEditor
                note={currentNote}
                folders={folders}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onArchiveNote={handleArchiveNote}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onBackToList={() => setMobileActiveScreen('list')}
                isMobile={true}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-[#717783]">
              No note selected
            </div>
          )
        ) : (
          /* Desktop Split 2-pane / 3-pane layout */
          <>
            {/* Center Column: Note Stream / List (310px width) */}
            <div className="w-[310px] flex-shrink-0 h-full">
              <NoteList
                notes={filteredNotes}
                folders={folders}
                currentNoteId={currentNoteId}
                currentFolderId={filterState.folderId}
                currentTag={filterState.tag}
                searchQuery={filterState.searchQuery}
                sortBy={filterState.sortBy}
                typeFilter={filterState.typeFilter}
                onSelectNote={(noteId) => setCurrentNoteId(noteId)}
                onCreateNote={(title) => handleCreateNote(title)}
                onSearchChange={(searchQuery) =>
                  setFilterState((prev) => ({ ...prev, searchQuery }))
                }
                onSortChange={(sortBy) =>
                  setFilterState((prev) => ({ ...prev, sortBy }))
                }
                onTypeFilterChange={(typeFilter) =>
                  setFilterState((prev) => ({ ...prev, typeFilter }))
                }
                onTogglePin={handleTogglePin}
                onDeleteNote={(id, e) => {
                  e.stopPropagation();
                  handleDeleteNote(id);
                }}
                onRestoreNote={(id, e) => {
                  e.stopPropagation();
                  handleRestoreNote(id);
                }}
                onEmptyTrash={handleEmptyTrash}
                onResetStarterNotes={handleResetStarterNotes}
                onSelectTag={(tag) =>
                  setFilterState((prev) => ({ ...prev, tag }))
                }
              />
            </div>

            {/* Right Column: Writing Canvas (Flex-1) */}
            <div className="flex-1 h-full overflow-hidden bg-white">
              {currentNote ? (
                <NoteEditor
                  note={currentNote}
                  folders={folders}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onArchiveNote={handleArchiveNote}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  isMobile={false}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#717783]">
                  <div className="w-12 h-12 rounded-xl bg-[#f0f4f9] text-[#005ea5] flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[#171c20]">
                    Select a note or create a new one
                  </h3>
                  <p className="text-xs text-[#717783] mt-1 max-w-[260px]">
                    Choose from your list on the left, or press Ctrl+N to start drafting.
                  </p>
                  <button
                    onClick={() => handleCreateNote()}
                    className="mt-4 px-4 py-2 bg-[#005ea5] text-white rounded-lg text-xs font-medium hover:bg-[#004881] transition-colors shadow-xs"
                  >
                    + Create New Note
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Export & Backup Modal */}
      <ExportModal
        currentNote={currentNote}
        allNotes={notes}
        folders={folders}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onRestoreBackup={handleRestoreBackup}
      />
    </div>
  );
}
