/**
 * Markdown utilities for Aura Notes
 */

export interface NoteStats {
  lines: number;
  words: number;
  chars: number;
  readingTimeMinutes: number;
}

export function calculateStats(text: string): NoteStats {
  if (!text) {
    return { lines: 1, words: 0, chars: 0, readingTimeMinutes: 0 };
  }
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
  return { lines, words, chars, readingTimeMinutes };
}

/**
 * Extracts hashtag words (e.g. #ideas, #todo, #devops) from text
 */
export function extractTags(text: string): string[] {
  if (!text) return [];
  const regex = /#([a-zA-Z0-9_\-]+)/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add('#' + match[1].toLowerCase());
  }
  return Array.from(matches);
}

/**
 * Toggles a checklist item at given index within the markdown string
 */
export function toggleChecklistAtOccurrence(content: string, occurrenceIndex: number): string {
  let count = 0;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const uncheckedMatch = line.match(/^(\s*[-*]\s+)\[ \](.*)$/);
    const checkedMatch = line.match(/^(\s*[-*]\s+)\[[xX]\](.*)$/);

    if (uncheckedMatch || checkedMatch) {
      if (count === occurrenceIndex) {
        if (uncheckedMatch) {
          lines[i] = `${uncheckedMatch[1]}[x]${uncheckedMatch[2]}`;
        } else if (checkedMatch) {
          lines[i] = `${checkedMatch[1]}[ ]${checkedMatch[2]}`;
        }
        break;
      }
      count++;
    }
  }

  return lines.join('\n');
}

/**
 * Inserts markdown formatting around selected text in a textarea
 */
export function applyFormatting(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix = '',
  placeholder = ''
): { newContent: string; newCursorStart: number; newCursorEnd: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selectedText = value.substring(start, end);

  let replacement = '';
  let newStart = start;
  let newEnd = end;

  if (selectedText.length > 0) {
    replacement = `${prefix}${selectedText}${suffix}`;
    newStart = start + prefix.length;
    newEnd = newStart + selectedText.length;
  } else {
    replacement = `${prefix}${placeholder}${suffix}`;
    newStart = start + prefix.length;
    newEnd = newStart + placeholder.length;
  }

  const newContent = value.substring(0, start) + replacement + value.substring(end);
  return { newContent, newCursorStart: newStart, newCursorEnd: newEnd };
}

/**
 * Inserts line-level formatting (e.g. list, heading, quote)
 */
export function applyLinePrefix(
  textarea: HTMLTextAreaElement,
  linePrefix: string
): { newContent: string; newCursor: number } {
  const start = textarea.selectionStart;
  const value = textarea.value;

  // Find start of current line
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const newContent = value.substring(0, lineStart) + linePrefix + value.substring(lineStart);
  const newCursor = start + linePrefix.length;

  return { newContent, newCursor };
}

/**
 * Escapes HTML characters for safe rendering
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parses markdown into clean HTML string
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '<p class="text-[#717783] italic">Empty note. Start writing...</p>';

  const lines = markdown.split('\n');
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let checklistCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Check code blocks ```
    if (rawLine.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        const codeText = escapeHtml(codeBlockContent.join('\n'));
        const langDisplay = codeBlockLang ? escapeHtml(codeBlockLang) : 'plaintext';
        htmlParts.push(`
          <div class="my-3 rounded-lg overflow-hidden border border-[#c0c7d4]/60 bg-[#eaeef3] text-[#171c20]">
            <div class="flex items-center justify-between px-3 py-1.5 bg-[#dfe3e7] text-xs font-mono text-[#404752] border-b border-[#c0c7d4]/40">
              <span class="font-medium">${langDisplay}</span>
              <button class="copy-code-btn flex items-center gap-1 hover:text-[#005ea5] transition-colors" data-code="${encodeURIComponent(codeBlockContent.join('\n'))}">
                <span>Copy</span>
              </button>
            </div>
            <pre class="p-3 font-mono text-[13px] leading-relaxed overflow-x-auto select-all"><code>${codeText}</code></pre>
          </div>
        `);
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockContent = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLang = rawLine.trim().substring(3).trim();
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Horizontal rule ---
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(rawLine.trim())) {
      htmlParts.push('<hr class="my-4 border-t border-[#c0c7d4]" />');
      continue;
    }

    // Headings
    if (rawLine.startsWith('# ')) {
      htmlParts.push(`<h1 class="text-2xl font-bold text-[#171c20] mt-4 mb-2 tracking-tight">${parseInline(rawLine.substring(2))}</h1>`);
      continue;
    }
    if (rawLine.startsWith('## ')) {
      htmlParts.push(`<h2 class="text-xl font-semibold text-[#171c20] mt-3 mb-1.5 tracking-tight">${parseInline(rawLine.substring(3))}</h2>`);
      continue;
    }
    if (rawLine.startsWith('### ')) {
      htmlParts.push(`<h3 class="text-lg font-semibold text-[#171c20] mt-2.5 mb-1 tracking-tight">${parseInline(rawLine.substring(4))}</h3>`);
      continue;
    }

    // Blockquote >
    if (rawLine.startsWith('>')) {
      const quoteText = rawLine.replace(/^>\s?/, '');
      htmlParts.push(`
        <blockquote class="my-2 pl-3.5 py-1 border-l-3 border-[#005ea5] bg-[#f0f4f9] rounded-r-md text-[#404752] italic text-sm leading-relaxed">
          ${parseInline(quoteText)}
        </blockquote>
      `);
      continue;
    }

    // Interactive Checklist: - [ ] or - [x]
    const checklistMatch = rawLine.match(/^(\s*)[-*]\s+\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      const isChecked = checklistMatch[2].toLowerCase() === 'x';
      const text = checklistMatch[3];
      const currentIndex = checklistCounter++;
      htmlParts.push(`
        <div class="flex items-start gap-2.5 py-1 text-sm group">
          <input type="checkbox" ${isChecked ? 'checked' : ''} data-checklist-index="${currentIndex}" class="checklist-toggle mt-0.5 w-4 h-4 rounded text-[#005ea5] focus:ring-[#005ea5] border-[#c0c7d4] cursor-pointer" />
          <span class="flex-1 select-text ${isChecked ? 'line-through text-[#717783]' : 'text-[#171c20]'}">${parseInline(text)}</span>
        </div>
      `);
      continue;
    }

    // Unordered List - or *
    if (/^\s*[-*]\s+/.test(rawLine)) {
      const itemText = rawLine.replace(/^\s*[-*]\s+/, '');
      htmlParts.push(`
        <li class="ml-4 list-disc text-sm text-[#171c20] leading-relaxed my-0.5">
          ${parseInline(itemText)}
        </li>
      `);
      continue;
    }

    // Numbered List 1.
    const numMatch = rawLine.match(/^\s*(\d+)\.\s+(.*)$/);
    if (numMatch) {
      htmlParts.push(`
        <li class="ml-4 list-decimal text-sm text-[#171c20] leading-relaxed my-0.5">
          ${parseInline(numMatch[2])}
        </li>
      `);
      continue;
    }

    // Empty lines
    if (rawLine.trim() === '') {
      htmlParts.push('<div class="h-2"></div>');
      continue;
    }

    // Standard Paragraph
    htmlParts.push(`<p class="text-sm text-[#171c20] leading-relaxed my-1">${parseInline(rawLine)}</p>`);
  }

  // Close unclosed code block if any
  if (inCodeBlock && codeBlockContent.length > 0) {
    const codeText = escapeHtml(codeBlockContent.join('\n'));
    htmlParts.push(`
      <pre class="my-3 p-3 rounded-lg border border-[#c0c7d4] bg-[#eaeef3] font-mono text-[13px] overflow-x-auto"><code>${codeText}</code></pre>
    `);
  }

  return htmlParts.join('\n');
}

/**
 * Parses inline formatting: bold, italic, strikethrough, inline code, links, tags
 */
function parseInline(text: string): string {
  let escaped = escapeHtml(text);

  // Inline Code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#dfe3e7] text-[#005ea5] font-mono text-[12px]">$1</code>');

  // Bold: **text** or __text__
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-[#171c20]">$1</strong>');
  escaped = escaped.replace(/__([^_]+)__/g, '<strong class="font-semibold text-[#171c20]">$1</strong>');

  // Italic: *text* or _text_
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  escaped = escaped.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Strikethrough: ~~text~~
  escaped = escaped.replace(/~~([^~]+)~~/g, '<span class="line-through text-[#717783]">$1</span>');

  // Links: [label](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#005ea5] hover:underline font-medium inline-flex items-center gap-0.5">$1</a>');

  // Tags: #tagname (highlighted with quiet pill)
  escaped = escaped.replace(/#([a-zA-Z0-9_\-]+)/g, '<span class="inline-flex items-center px-1.5 py-0.2 text-[12px] font-medium text-[#006591] bg-[#c9e6ff]/50 rounded">#$1</span>');

  return escaped;
}
