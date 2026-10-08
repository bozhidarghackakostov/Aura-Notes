import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Archive, 
  Check, 
  Upload, 
  Copy, 
  Settings,
  HardDrive
} from 'lucide-react';
import { Note, Folder, BackupPayload } from '../types/note';
import { 
  downloadTextFile, 
  generateBackupPayload, 
  normalizeLineEndings 
} from '../utils/storage';

interface ExportModalProps {
  currentNote: Note | null;
  allNotes: Note[];
  folders: Folder[];
  isOpen: boolean;
  onClose: () => void;
  onRestoreBackup: (importedNotes: Note[], importedFolders: Folder[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  currentNote,
  allNotes,
  folders,
  isOpen,
  onClose,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'vault'>('note');
  const [lineEndings, setLineEndings] = useState<'crlf' | 'lf'>('crlf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [copiedNote, setCopiedNote] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Single note export generator
  const getNoteExportContent = () => {
    if (!currentNote) return '';
    let result = '';
    if (includeMetadata) {
      const createdStr = new Date(currentNote.createdAt).toLocaleString();
      const updatedStr = new Date(currentNote.updatedAt).toLocaleString();
      const tagsStr = currentNote.tags.join(' ');
      result += `Title: ${currentNote.title}\n`;
      result += `Created: ${createdStr}\n`;
      result += `Modified: ${updatedStr}\n`;
      if (tagsStr) result += `Tags: ${tagsStr}\n`;
      result += `----------------------------------------\n\n`;
    }
    result += currentNote.content;
    return normalizeLineEndings(result, lineEndings);
  };

  const handleDownloadTxt = () => {
    if (!currentNote) return;
    const content = getNoteExportContent();
    const safeTitle = (currentNote.title || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadTextFile(`${safeTitle}.txt`, content, 'text/plain');
  };

  const handleDownloadMd = () => {
    if (!currentNote) return;
    const content = `# ${currentNote.title}\n\n${currentNote.content}`;
    const safeTitle = (currentNote.title || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadTextFile(`${safeTitle}.md`, content, 'text/markdown');
  };

  const handleCopyText = () => {
    const content = getNoteExportContent();
    navigator.clipboard.writeText(content);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleDownloadVaultJson = () => {
    const jsonStr = generateBackupPayload(allNotes, folders);
    const dateStr = new Date().toISOString().substring(0, 10);
    downloadTextFile(`aura_notes_backup_${dateStr}.json`, jsonStr, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as BackupPayload;
        if (parsed && Array.isArray(parsed.notes)) {
          onRestoreBackup(parsed.notes, parsed.folders || folders);
          onClose();
        } else {
          setImportError('Invalid backup file format. Must contain notes list.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#171c20]/40 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl border border-[#c0c7d4]/60 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#c0c7d4]/40 flex items-center justify-between bg-[#f0f4f9]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d3e4ff] text-[#005ea5] flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[16px] text-[#171c20] tracking-tight">
                Export & Backup
              </h3>
              <p className="text-xs text-[#717783] font-mono">
                {currentNote ? currentNote.title || 'Untitled Note' : 'Aura Notes Vault'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#717783] hover:bg-[#eaeef3] hover:text-[#171c20] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#c0c7d4]/40 bg-[#f6fafe] px-5 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('note')}
            disabled={!currentNote}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              activeTab === 'note'
                ? 'border-[#005ea5] text-[#005ea5]'
                : 'border-transparent text-[#717783] hover:text-[#171c20]'
            } disabled:opacity-40`}
          >
            Current Note
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              activeTab === 'vault'
                ? 'border-[#005ea5] text-[#005ea5]'
                : 'border-transparent text-[#717783] hover:text-[#171c20]'
            }`}
          >
            Full Vault Backup ({allNotes.length} notes)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-sm">
          {activeTab === 'note' && currentNote ? (
            <>
              {/* Plain Text (.txt) Block */}
              <div className="p-4 rounded-xl border border-[#c0c7d4]/60 bg-[#f0f4f9]/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-white border border-[#c0c7d4] flex items-center justify-center font-mono text-xs font-bold text-[#005ea5]">
                      .TXT
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#171c20]">
                        Plain Text Document
                      </div>
                      <div className="text-[11px] text-[#717783] font-mono">
                        ASCII / UTF-8 Plain Text
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono bg-[#eaeef3] text-[#404752] px-2 py-0.5 rounded">
                    Universal Portability
                  </span>
                </div>

                {/* Line Endings Selector */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[#717783]">Line endings:</span>
                  <button
                    onClick={() => setLineEndings('crlf')}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      lineEndings === 'crlf'
                        ? 'bg-[#005ea5] text-white font-medium'
                        : 'bg-white border border-[#c0c7d4] text-[#404752]'
                    }`}
                  >
                    CRLF (Windows)
                  </button>
                  <button
                    onClick={() => setLineEndings('lf')}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      lineEndings === 'lf'
                        ? 'bg-[#005ea5] text-white font-medium'
                        : 'bg-white border border-[#c0c7d4] text-[#404752]'
                    }`}
                  >
                    LF (Unix/macOS)
                  </button>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={handleDownloadTxt}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#005ea5] hover:bg-[#004881] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt File</span>
                  </button>
                  <button
                    onClick={handleCopyText}
                    className="py-2 px-3 rounded-lg bg-white hover:bg-[#f0f4f9] border border-[#c0c7d4] text-xs font-medium text-[#171c20] flex items-center gap-1.5 transition-colors"
                  >
                    {copiedNote ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Markdown (.md) Block */}
              <div className="p-4 rounded-xl border border-[#c0c7d4]/60 bg-[#f0f4f9]/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-white border border-[#c0c7d4] flex items-center justify-center font-mono text-xs font-bold text-[#006591]">
                    .MD
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#171c20]">
                      Markdown Document
                    </div>
                    <div className="text-[11px] text-[#717783]">
                      Includes headers, checklists, and code fences
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadMd}
                  className="py-1.5 px-3 rounded-lg bg-white hover:bg-[#f0f4f9] border border-[#c0c7d4] text-xs font-medium text-[#171c20] flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#005ea5]" />
                  <span>Download .md</span>
                </button>
              </div>

              {/* Options */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#404752]">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="w-4 h-4 rounded text-[#005ea5] focus:ring-[#005ea5] border-[#c0c7d4]"
                  />
                  <span>Include note header metadata (Title, Timestamp, Tags)</span>
                </label>
              </div>
            </>
          ) : (
            /* Full Vault Backup View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#c0c7d4]/60 bg-[#f0f4f9]/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#d3e4ff] text-[#005ea5] flex items-center justify-center">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#171c20]">
                      Export All Notes as JSON
                    </div>
                    <div className="text-xs text-[#717783]">
                      Creates a complete snapshot of all {allNotes.length} notes, folders, and tags.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadVaultJson}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#005ea5] hover:bg-[#004881] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Backup (.json)</span>
                </button>
              </div>

              {/* Restore / Import Section */}
              <div className="p-4 rounded-xl border border-[#c0c7d4]/60 bg-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#eaeef3] text-[#404752] flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#171c20]">
                      Restore from JSON Backup
                    </div>
                    <div className="text-xs text-[#717783]">
                      Upload a previously exported .json snapshot.
                    </div>
                  </div>
                </div>

                {importError && (
                  <p className="text-xs text-[#ba1a1a] bg-[#ffdad6]/40 p-2 rounded">
                    {importError}
                  </p>
                )}

                <label className="w-full py-2 px-3 rounded-lg bg-[#f0f4f9] hover:bg-[#eaeef3] border border-[#c0c7d4] text-xs font-medium text-[#171c20] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#005ea5]" />
                  <span>Choose Backup File (.json)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-[#f0f4f9]/50 border-t border-[#c0c7d4]/40 flex items-center justify-between text-xs text-[#717783]">
          <span className="font-mono text-[11px]">
            {allNotes.length} notes in local storage
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white hover:bg-[#eaeef3] border border-[#c0c7d4] text-xs font-medium text-[#171c20] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
