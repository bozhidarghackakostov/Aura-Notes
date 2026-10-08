export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  isPinned: boolean;
  isTrash: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  lineEndings?: 'crlf' | 'lf';
  fontPreference?: 'sans' | 'mono' | 'serif';
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  isSystem?: boolean;
}

export type ViewMode = 'edit' | 'preview' | 'split';
export type FontStyle = 'sans' | 'mono' | 'serif';

export type NoteSortOption = 'updated-desc' | 'updated-asc' | 'created-desc' | 'title-asc';

export interface FilterState {
  folderId: string; // 'all' | folderId | 'pinned' | 'trash' | 'archive'
  tag: string | null;
  searchQuery: string;
  typeFilter: 'all' | 'checklist' | 'code' | 'text';
  sortBy: NoteSortOption;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  notes: Note[];
  folders: Folder[];
}
