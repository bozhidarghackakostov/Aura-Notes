import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Pin, 
  Eye, 
  Edit3, 
  Columns, 
  Bold, 
  Italic, 
  Code, 
  CheckSquare, 
  Quote, 
  Heading1, 
  Heading2, 
  List, 
  Link as LinkIcon, 
  Clock, 
  Download, 
  Maximize2, 
  Minimize2, 
  Type, 
  Hash, 
  MoreVertical,
  Check,
  Folder as FolderIcon,
  Archive,
  Trash2,
  Copy
} from 'lucide-react';
import { Note, Folder, ViewMode, FontStyle } from '../types/note';
import { 
  calculateStats, 
  extractTags, 
  applyFormatting, 
  applyLinePrefix, 
  renderMarkdownToHtml, 
  toggleChecklistAtOccurrence 
} from '../utils/markdown';
import { normalizeLineEndings } from '../utils/storage';

interface NoteEditorProps {
  note: Note;
  folders: Folder[];
  onUpdateNote: (updated: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onArchiveNote: (noteId: string) => void;
  onOpenExportModal: () => void;
  onBackToList?: () => void;
  isMobile?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  onUpdateNote,
  onDeleteNote,
  onArchiveNote,
  onOpenExportModal,
  onBackToList,
  isMobile = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [fontStyle, setFontStyle] = useState<FontStyle>(note.fontPreference || 'sans');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute stats
  const stats = calculateStats(note.content);

  // Auto-sync tags whenever content changes
  const handleContentChange = (newContent: string) => {
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const updatedTags = extractTags(newContent + ' ' + note.title);

    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNote({
        content: newContent,
        tags: updatedTags,
        updatedAt: Date.now(),
      });
      setSaveStatus('saved');
    }, 250);
  };

  const handleTitleChange = (newTitle: string) => {
    setSaveStatus('saving');
    const updatedTags = extractTags(note.content + ' ' + newTitle);
    onUpdateNote({
      title: newTitle,
      tags: updatedTags,
      updatedAt: Date.now(),
    });
    setTimeout(() => setSaveStatus('saved'), 200);
  };

  // Cursor tracker
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    setCursorPos({ line: currentLine, col: currentCol });
  };

  // Formatting actions
  const applyInline = (prefix: string, suffix: string, placeholder: string) => {
    if (!textareaRef.current) return;
    const { newContent, newCursorStart, newCursorEnd } = applyFormatting(
      textareaRef.current,
      prefix,
      suffix,
      placeholder
    );
    handleContentChange(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
      }
    }, 0);
  };

  const applyPrefix = (linePrefix: string) => {
    if (!textareaRef.current) return;
    const { newContent, newCursor } = applyLinePrefix(textareaRef.current, linePrefix);
    handleContentChange(newContent);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  const insertTimestamp = () => {
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
    applyInline(dateStr + ' ', '', '');
  };

  // Smart keyboard handler inside textarea:
  // Tab key indents 2 spaces; Enter key auto-continues checklists & bullet lists
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      applyInline('  ', '', '');
      return;
    }

    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const value = textarea.value;
      const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
      const currentLine = value.substring(lineStart, cursor);

      // Check if current line is an empty task or bullet
      if (/^\s*[-*]\s+\[ \]\s*$/.test(currentLine) || /^\s*[-*]\s+$/.test(currentLine)) {
        // Erase bullet on enter if line has no content
        e.preventDefault();
        const newContent = value.substring(0, lineStart) + value.substring(cursor);
        handleContentChange(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(lineStart, lineStart);
        }, 0);
        return;
      }

      // Check if current line is a task
      const taskMatch = currentLine.match(/^(\s*[-*]\s+\[[ xX]\]\s+)/);
      if (taskMatch) {
        e.preventDefault();
        const prefix = taskMatch[1].replace(/\[[xX]\]/, '[ ]');
        const newContent = value.substring(0, cursor) + '\n' + prefix + value.substring(cursor);
        handleContentChange(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(cursor + 1 + prefix.length, cursor + 1 + prefix.length);
        }, 0);
        return;
      }

      // Check if current line is bullet
      const bulletMatch = currentLine.match(/^(\s*[-*]\s+)/);
      if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[1];
        const newContent = value.substring(0, cursor) + '\n' + prefix + value.substring(cursor);
        handleContentChange(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(cursor + 1 + prefix.length, cursor + 1 + prefix.length);
        }, 0);
        return;
      }
    }

    // Ctrl+B (Bold)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyInline('**', '**', 'bold text');
    }

    // Ctrl+I (Italic)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyInline('*', '*', 'italic text');
    }

    // Ctrl+S (Manual Save)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      setSaveStatus('saving');
      onUpdateNote({ updatedAt: Date.now() });
      setTimeout(() => setSaveStatus('saved'), 150);
    }
  };

  // Handle interactive preview checkbox click
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check if clicked element or parent is copy-code-btn
    const copyBtn = target.closest('.copy-code-btn') as HTMLElement;
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
      if (code) {
        navigator.clipboard.writeText(code);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 1500);
      }
      return;
    }

    // Check if clicked element is a checklist checkbox
    if (target.classList.contains('checklist-toggle')) {
      const indexAttr = target.getAttribute('data-checklist-index');
      if (indexAttr !== null) {
        const occurrenceIndex = parseInt(indexAttr, 10);
        const newContent = toggleChecklistAtOccurrence(note.content, occurrenceIndex);
        handleContentChange(newContent);
      }
    }
  };

  const handleCopyNote = () => {
    const fullText = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(fullText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleLineEndingToggle = () => {
    const nextEnding = note.lineEndings === 'crlf' ? 'lf' : 'crlf';
    onUpdateNote({
      lineEndings: nextEnding,
      content: normalizeLineEndings(note.content, nextEnding),
    });
  };

  const handleFontChange = (font: FontStyle) => {
    setFontStyle(font);
    onUpdateNote({ fontPreference: font });
  };

  const fontClass =
    fontStyle === 'mono'
      ? 'font-mono text-[13px]'
      : fontStyle === 'serif'
      ? 'font-serif text-[15px]'
      : 'font-sans text-[14px]';

  return (
    <div
      className={`w-full h-full flex flex-col bg-[#ffffff] transition-all ${
        isFocusMode ? 'fixed inset-0 z-50 bg-[#ffffff]' : ''
      }`}
    >
      {/* Top Header Bar */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-[#c0c7d4]/40 bg-[#ffffff] gap-3">
        {/* Left: Back (Mobile) & Title Input & Status */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isMobile && onBackToList && (
            <button
              onClick={onBackToList}
              className="p-1.5 rounded-lg text-[#404752] hover:bg-[#f0f4f9] active:scale-95 transition-transform"
              aria-label="Back to notes list"
            >
              <ArrowLeft className="w-5 h-5 text-[#005ea5]" />
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Note"
              className="font-bold text-[17px] text-[#171c20] bg-transparent border-0 focus:outline-none focus:ring-0 truncate flex-1 min-w-0 tracking-tight"
            />

            {/* Save Status Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f0f4f9] border border-[#c0c7d4]/30 flex-shrink-0 text-xs text-[#005ea5]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saving'
                    ? 'bg-[#d97706] animate-pulse'
                    : 'bg-[#16a34a]'
                }`}
              />
              <span className="hidden sm:inline font-medium">
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Pin Button */}
          <button
            onClick={() => onUpdateNote({ isPinned: !note.isPinned })}
            className={`p-1.5 rounded-lg hover:bg-[#f0f4f9] transition-colors active:scale-95 ${
              note.isPinned ? 'text-[#005ea5]' : 'text-[#717783] hover:text-[#005ea5]'
            }`}
            title={note.isPinned ? 'Pinned to top' : 'Pin note to top'}
            aria-label="Pin note"
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Mode Switcher (Desktop) */}
          <div className="hidden sm:flex items-center bg-[#f0f4f9] p-0.5 rounded-lg border border-[#c0c7d4]/30">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white text-[#005ea5] shadow-xs'
                  : 'text-[#404752] hover:text-[#171c20]'
              }`}
              title="Edit mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white text-[#005ea5] shadow-xs'
                  : 'text-[#404752] hover:text-[#171c20]'
              }`}
              title="Preview mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-[#005ea5] shadow-xs'
                  : 'text-[#404752] hover:text-[#171c20]'
              }`}
              title="Side-by-side split view"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-1.5 rounded-lg hover:bg-[#f0f4f9] transition-colors active:scale-95 ${
              isFocusMode ? 'text-[#005ea5] bg-[#f0f4f9]' : 'text-[#404752]'
            }`}
            title={isFocusMode ? 'Exit focus mode' : 'Distraction-free focus mode'}
            aria-label="Toggle focus mode"
          >
            {isFocusMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="p-1.5 rounded-lg text-[#404752] hover:bg-[#f0f4f9] hover:text-[#005ea5] transition-colors active:scale-95"
            title="Export / Download"
            aria-label="Export note"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-lg text-[#404752] hover:bg-[#f0f4f9] transition-colors active:scale-95"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#c0c7d4]/60 py-1 z-50 text-xs"
                onClick={() => setShowMoreMenu(false)}
              >
                <button
                  onClick={handleCopyNote}
                  className="w-full px-3 py-2 text-left hover:bg-[#f0f4f9] flex items-center gap-2 text-[#171c20]"
                >
                  <Copy className="w-3.5 h-3.5 text-[#005ea5]" />
                  <span>Copy Note Text</span>
                </button>

                <div className="border-t border-[#c0c7d4]/30 my-1" />

                <div className="px-3 py-1 text-[10px] font-semibold text-[#717783] uppercase">
                  Move to Notebook
                </div>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateNote({ folderId: f.id })}
                    className={`w-full px-3 py-1.5 text-left hover:bg-[#f0f4f9] flex items-center justify-between text-[#404752] ${
                      note.folderId === f.id ? 'text-[#005ea5] font-medium' : ''
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {note.folderId === f.id && <Check className="w-3 h-3 text-[#005ea5]" />}
                  </button>
                ))}

                <div className="border-t border-[#c0c7d4]/30 my-1" />

                <button
                  onClick={() => onArchiveNote(note.id)}
                  className="w-full px-3 py-2 text-left hover:bg-[#f0f4f9] flex items-center gap-2 text-[#404752]"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Note</span>
                </button>

                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="w-full px-3 py-2 text-left hover:bg-[#ffdad6] flex items-center gap-2 text-[#ba1a1a]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Note</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Formatting Ribbon Toolbar (Shown in edit or split mode) */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className="px-4 py-1.5 border-b border-[#c0c7d4]/30 bg-[#f0f4f9]/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Text Style */}
          <button
            onClick={() => applyInline('**', '**', 'bold')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyInline('*', '*', 'italic')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyInline('`', '`', 'code')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] font-mono text-xs transition-colors"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#c0c7d4]/40 mx-1" />

          {/* Headings */}
          <button
            onClick={() => applyPrefix('# ')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyPrefix('## ')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#c0c7d4]/40 mx-1" />

          {/* Lists */}
          <button
            onClick={() => applyPrefix('- [ ] ')}
            className="px-2 py-1 rounded hover:bg-white text-[#005ea5] hover:text-[#004881] text-xs font-medium flex items-center gap-1 transition-colors"
            title="Checklist Item"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Task</span>
          </button>
          <button
            onClick={() => applyPrefix('- ')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyPrefix('> ')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyInline('```\n', '\n```', 'code here')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] font-mono text-xs transition-colors"
            title="Code Block"
          >
            ```
          </button>

          <div className="w-[1px] h-4 bg-[#c0c7d4]/40 mx-1" />

          {/* Utilities */}
          <button
            onClick={() => applyInline('[', '](https://)', 'Link')}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertTimestamp}
            className="p-1.5 rounded hover:bg-white text-[#404752] hover:text-[#171c20] transition-colors"
            title="Insert Timestamp"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyInline('#', '', 'tag')}
            className="p-1.5 rounded hover:bg-white text-[#006591] hover:text-[#004881] transition-colors"
            title="Add Tag"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          {/* Typography Selector & Gutter Toggle */}
          <div className="ml-auto flex items-center gap-1.5 pl-2">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                showLineNumbers ? 'bg-[#005ea5] text-white' : 'text-[#717783] hover:bg-white'
              }`}
              title="Toggle line numbers"
            >
              #ln
            </button>

            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-[#c0c7d4]/30 text-[11px]">
              <button
                onClick={() => handleFontChange('sans')}
                className={`px-1 rounded ${
                  fontStyle === 'sans' ? 'font-bold text-[#005ea5]' : 'text-[#717783]'
                }`}
              >
                Sans
              </button>
              <span className="text-[#c0c7d4]">|</span>
              <button
                onClick={() => handleFontChange('serif')}
                className={`px-1 rounded font-serif ${
                  fontStyle === 'serif' ? 'font-bold text-[#005ea5]' : 'text-[#717783]'
                }`}
              >
                Serif
              </button>
              <span className="text-[#c0c7d4]">|</span>
              <button
                onClick={() => handleFontChange('mono')}
                className={`px-1 rounded font-mono ${
                  fontStyle === 'mono' ? 'font-bold text-[#005ea5]' : 'text-[#717783]'
                }`}
              >
                Mono
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`h-full flex overflow-hidden ${
              viewMode === 'split' ? 'w-1/2 border-r border-[#c0c7d4]/40' : 'w-full'
            }`}
          >
            {/* Optional Line Numbers Gutter */}
            {showLineNumbers && (
              <div className="w-10 select-none py-4 pr-2 text-right font-mono text-[11px] text-[#717783]/60 bg-[#f0f4f9]/50 border-r border-[#c0c7d4]/30 flex flex-col leading-[24px]">
                {Array.from({ length: Math.max(1, stats.lines) }, (_, i) => (
                  <span key={i}>{String(i + 1).padStart(2, '0')}</span>
                ))}
              </div>
            )}

            {/* Writing Area */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 flex justify-center">
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onSelect={updateCursorPosition}
                onClick={updateCursorPosition}
                onKeyUp={updateCursorPosition}
                placeholder="Start typing your note... Use Markdown (# heading, - [ ] task, `code`)"
                className={`w-full max-w-[760px] h-full resize-none border-0 focus:outline-none focus:ring-0 leading-[24px] text-[#171c20] placeholder:text-[#717783] bg-transparent ${fontClass}`}
                autoFocus={!isMobile}
              />
            </div>
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            onClick={handlePreviewClick}
            className={`h-full overflow-y-auto custom-scrollbar p-6 flex justify-center ${
              viewMode === 'split' ? 'w-1/2 bg-[#fafbfc]' : 'w-full bg-[#ffffff]'
            }`}
          >
            <div
              className={`w-full max-w-[760px] prose prose-slate select-text leading-relaxed ${fontClass}`}
              dangerouslySetInnerHTML={{
                __html: renderMarkdownToHtml(note.content),
              }}
            />
          </div>
        )}

        {/* Copy Notification Toast */}
        {copiedNotification && (
          <div className="absolute bottom-6 right-6 bg-[#171c20] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Check className="w-3.5 h-3.5 text-[#16a34a]" />
            <span>Note copied to clipboard</span>
          </div>
        )}
      </div>

      {/* Notepad Minimalist Status Bar Footer */}
      <footer className="h-8 px-4 border-t border-[#c0c7d4]/40 bg-[#f0f4f9]/40 flex items-center justify-between text-xs text-[#717783] select-none">
        {/* Left: Position & Word Counts */}
        <div className="flex items-center gap-2.5 font-mono text-[11px] overflow-x-auto no-scrollbar">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="text-[#c0c7d4]">|</span>
          <span>{stats.words} words</span>
          <span className="text-[#c0c7d4]">|</span>
          <span>{stats.chars} chars</span>
          <span className="text-[#c0c7d4] hidden sm:inline">|</span>
          <span className="hidden sm:inline">~{stats.readingTimeMinutes} min read</span>
        </div>

        {/* Right: Line Endings & Encoding */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <button
            onClick={handleLineEndingToggle}
            className="hover:text-[#005ea5] transition-colors"
            title="Click to toggle CRLF / LF line endings"
          >
            {note.lineEndings === 'crlf' ? 'Windows (CRLF)' : 'Unix (LF)'}
          </button>
          <span className="text-[#c0c7d4]">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
};
