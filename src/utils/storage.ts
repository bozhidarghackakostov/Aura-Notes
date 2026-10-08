import { Note, Folder, BackupPayload } from '../types/note';
import { extractTags } from './markdown';

const NOTES_STORAGE_KEY = 'aura_notes_collection_v1';
const FOLDERS_STORAGE_KEY = 'aura_notes_folders_v1';

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'inbox', name: 'Quick Notes', isSystem: true },
  { id: 'work', name: 'Work & Projects' },
  { id: 'ideas', name: 'Ideas & Drafts' },
  { id: 'personal', name: 'Personal Log' },
];

export const STARTER_NOTES: Note[] = [
  {
    id: 'note-welcome-1',
    title: 'Welcome to Aura Notes',
    content: `# Welcome to Aura Notes

A clean, calm, and distraction-free note-taking space designed to keep you in flow.

### Key Capabilities
- **Effortless Capture**: Press \`Ctrl+N\` (or \`Cmd+N\`) anytime to create a note instantly.
- **Fast Search**: Press \`Ctrl+F\` to filter across titles, content, and #tags.
- **Auto-Saving**: Every keystroke is saved immediately to your browser's local storage.
- **Markdown & Interactive Lists**: Use standard markdown formatting, or click the toolbar above.

### Quick Checklist
- [x] Explore folders in the left sidebar
- [x] Try clicking this interactive task item
- [ ] Write your first personal note
- [ ] Export your notes to plain text (.txt) or markdown (.md)

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

You can organize notes with #tags anywhere in your text, like #ideas or #productivity.`,
    folderId: 'inbox',
    tags: ['#ideas', '#productivity'],
    isPinned: true,
    isTrash: false,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 15, // 15 mins ago
    lineEndings: 'crlf',
    fontPreference: 'sans',
  },
  {
    id: 'note-sprint-2',
    title: 'Daily Sprint & Action Items',
    content: `### Immediate Action Items

- [x] Review pull request #142 (Markdown parser normalization)
- [x] Draft API keys rotation memo for production team
- [x] Sync offline scratchpad buffer with local cache
- [ ] Test voice memo transcriber latency and audio compression
- [ ] Finalize responsive touch navigation layout

### Meeting Recap
Discussed performance benchmarks with the core team. Target is zero-latency keystroke rendering even on documents exceeding 20,000 words.

#todo #work #engineering`,
    folderId: 'work',
    tags: ['#todo', '#work', '#engineering'],
    isPinned: true,
    isTrash: false,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
    updatedAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
    lineEndings: 'crlf',
    fontPreference: 'sans',
  },
  {
    id: 'note-server-3',
    title: 'server-init.sh (Production Cluster)',
    content: `# Server Provisioning & Initialization Script

\`\`\`bash
# Install docker & prepare production cluster
curl -sSL https://get.docker.com | sh
systemctl enable --now docker
usermod -aG docker ubuntu
ufw allow 80,443,8080/tcp
\`\`\`

Run this script on all freshly provisioned Ubuntu 24.04 LTS worker nodes. Remember to copy the generated SSH keys to the vault.

#devops #setup #infrastructure`,
    folderId: 'work',
    tags: ['#devops', '#setup', '#infrastructure'],
    isPinned: false,
    isTrash: false,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    lineEndings: 'lf',
    fontPreference: 'mono',
  },
  {
    id: 'note-roadmap-4',
    title: 'Q4 Architecture Strategy & Roadmap',
    content: `## Synchronous Feed Sync Engine

Refactoring the local storage scratchpad buffer. All incoming keystrokes stream directly to zero-latency key-value blocks with an instantaneous checksum check.

### Migration Milestones
1. Transition local memory buffer to optimized IndexedDB fallback
2. Enforce end-to-end payload compression for full-vault export
3. Unify cross-platform keybindings with desktop defaults (\`Ctrl+N\`, \`Ctrl+S\`, \`Ctrl+F\`)

### Target Specifications
\`\`\`rust
pub struct MemoFrame {
    pub id: String,
    pub content: Vec<u8>,
    pub pinned: bool,
}
\`\`\`

Next patch release target: Friday EOD. Preserve clean plain-text ASCII formatting.

#architecture #roadmap`,
    folderId: 'ideas',
    tags: ['#architecture', '#roadmap'],
    isPinned: false,
    isTrash: false,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    lineEndings: 'crlf',
    fontPreference: 'sans',
  },
  {
    id: 'note-journal-5',
    title: 'Personal Reflections & Philosophy',
    content: `Reflecting on the product launch: focus, quiet aesthetics, and tactile simplicity always win over visual noise.

> "A designer knows he has achieved perfection not when there is nothing left to add, but when there is nothing left to take away." — Antoine de Saint-Exupéry

Thoughts for this week:
- Keep the writing canvas uncluttered
- Write every morning for 15 minutes before opening notifications
- Books to re-read: The Design of Everyday Things, Zen and the Art of Motorcycle Maintenance

#journal #reading`,
    folderId: 'personal',
    tags: ['#journal', '#reading'],
    isPinned: false,
    isTrash: false,
    isArchived: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    lineEndings: 'crlf',
    fontPreference: 'serif',
  }
];

export function getStoredNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(STARTER_NOTES));
      return STARTER_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return STARTER_NOTES;
  } catch (err) {
    console.error('Failed to load notes from localStorage', err);
    return STARTER_NOTES;
  }
}

export function saveNotesToStorage(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to localStorage', err);
  }
}

export function getStoredFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(DEFAULT_FOLDERS));
      return DEFAULT_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_FOLDERS;
  } catch (err) {
    console.error('Failed to load folders from localStorage', err);
    return DEFAULT_FOLDERS;
  }
}

export function saveFoldersToStorage(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders to localStorage', err);
  }
}

/**
 * Creates a new blank note
 */
export function createNewNote(folderId = 'inbox', title = 'Untitled Note'): Note {
  const now = Date.now();
  return {
    id: 'note_' + now + '_' + Math.random().toString(36).substring(2, 7),
    title,
    content: '',
    folderId,
    tags: [],
    isPinned: false,
    isTrash: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    lineEndings: 'crlf',
    fontPreference: 'sans',
  };
}

/**
 * Formats a timestamp into human-readable relative/absolute string
 */
export function formatNoteDate(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;

  const date = new Date(timestamp);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeString}`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Normalizes text to specific line endings
 */
export function normalizeLineEndings(text: string, type: 'crlf' | 'lf' = 'crlf'): string {
  const unified = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (type === 'crlf') {
    return unified.replace(/\n/g, '\r\n');
  }
  return unified;
}

/**
 * Exports note to a downloadable file in browser
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates full backup JSON
 */
export function generateBackupPayload(notes: Note[], folders: Folder[]): string {
  const payload: BackupPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    notes,
    folders,
  };
  return JSON.stringify(payload, null, 2);
}
