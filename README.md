# Aura Notes

> *A calm, distraction-free sanctuary for thought. Built for speed, clarity, and the quiet dignity of the written word.*

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Local-First](https://img.shields.io/badge/Architecture-Local--First-005ea5.svg)](#the-local-first-promise)
[![Zero Distraction](https://img.shields.io/badge/Design-Calm%20%26%20Quiet-16a34a.svg)](#the-philosophy)

## The Philosophy

Modern note-taking tools have lost their way.

They were meant to be digital scratchpads for the human mind. Instead, they evolved into sluggish database engines, bloated relational spreadsheets, and hyperactive dashboards demanding upkeep, plugins, and constant reorganization. Somewhere between configuring metadata properties and debugging custom workflows, the act of writing was forgotten.

**Aura Notes was born from a singular conviction:**

> **The tool should disappear, leaving only your thinking.**

When an idea strikes, the interval between conception and capture must be zero seconds. No loading spinners. No modal dialogues asking you to choose a workspace or select a schema. Just open, write, and breathe.

---

### 1. The Quiet Canvas

Notice the light, contemplative tones in the workspace. Aura Notes rejects the blinding starkness of pure white and the visual agitation of high-contrast dark modes in favor of soft, natural ambient daylight (`#f6fafe` and `#ffffff`). 

The interface chrome is intentionally subdued into delicate hairline boundaries. Every control sits quietly at the periphery, ready when you reach for it, invisible when you write.

- **Content First, Always**: The text column is measured for human ocular comfort (65–75 characters per line), ensuring you never strain to track your thoughts across wide viewports.
- **Typography with Intent**: Switch between clean geometric **Sans** for sprints, warm **Serif** for contemplative journals, or tactile **Mono** for architecture and engineering logs.
- **Focus / Zen Sanctuary**: One click (or shortcut) strips away both sidebars, centering your prose in pure, uninterrupted isolation.

---

### 2. Live Split View: Thought into Structure

Writing is messy; reading demands structure. Aura Notes bridges both with a synchronous live split canvas.

<p align="center">
  <img src="./Screenshot%202026-10-08%20at%2019.18.25.png" alt="Aura Notes — Live Split View & Interactive Task Architecture" width="100%" style="border-radius: 12px; border: 1px solid #c0c7d4; box-shadow: 0 10px 30px rgba(0,0,0,0.06);" />
</p>

On the left sits your raw, uncompromising plain-text Markdown buffer. On the right, your prose springs to life with typographic rhythm.

- **Living Checklists**: Checkboxes aren't decorative static HTML. Tapping a task in the preview window instantly toggles the underlying `- [ ]` into `- [x]` in your raw source and saves it to disk in real time.
- **Inline Code & Syntax Blocks**: Monospace fences with one-click copy buttons give engineers a native scratchpad for shell scripts, structs, and payloads.
- **Subtle Formatting Ribbon**: Format bold, italics, headings, blockquotes, timestamps, and hashtags directly without memorizing every syntax quirk, while keeping standard keybindings (`Ctrl+B`, `Ctrl+I`, `Ctrl+S`) active.

---

### 3. Effortless Stream & Ambient Organization

Filing notes into folders shouldn't feel like filling out tax forms. Aura Notes provides an ambient hierarchy that matches how brains actually work:

- **Quick Jot Composer**: A docked capture bar directly inside your active stream allows you to jot down an ephemeral thought and press `Enter`. It is filed instantly into your active notebook.
- **Living Tags**: You don't have to manage a tag ontology. Just type `#todo`, `#ideas`, or `#devops` anywhere in your text. Aura Notes detects your tags on the fly, populating a quick-filtering rail in the left sidebar.
- **Instant Search with Highlighting**: Press `Ctrl+F` and start typing. Aura Notes queries across titles, bodies, and tags instantaneously, illuminating every match in context.
- **Pinned Drafts**: Priority memos, sprint tasks, and server keys stay pinned to the top of your stream so you never have to search for what matters right now.

---

### 4. The Local-First Promise

Your thoughts belong to you. Not to an algorithm, not to an enterprise server that might shut down next quarter, and not to a proprietary file format.

| Principle | Aura Notes Approach | Traditional Cloud Tools |
| :--- | :--- | :--- |
| **Data Ownership** | 100% Client-side local storage & instant raw file export | Stored on proprietary remote servers |
| **Speed** | 0ms keystroke latency, offline by default | Dependent on network ping and WebSocket sync |
| **Portability** | Export to universal `.txt` (Windows CRLF or Unix LF) & `.md` | Complex proprietary database exports |
| **Backups** | Instant 1-click complete JSON vault snapshots | Gated behind export waitlists |
| **Longevity** | Plain text written today will be readable in 50 years | Locked into obsolete software versions |

---

## Keyboard Flow

Designed for typists who prefer to keep their fingers on the home row:

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> / <kbd>Cmd</kbd> + <kbd>N</kbd> | Create new note immediately |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> / <kbd>Cmd</kbd> + <kbd>F</kbd> | Focus global search & tag query |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Force save & verify local cache integrity |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Wrap selection in bold (`**text**`) |
| <kbd>Ctrl</kbd> + <kbd>I</kbd> | Wrap selection in italics (`*text*`) |
| <kbd>Tab</kbd> | Soft 2-space indentation (never loses focus) |
| <kbd>Enter</kbd> (in tasks) | Auto-continues task checkbox list (`- [ ] `) |
| <kbd>Esc</kbd> | Dismiss modals, clear search, or close drawer |

---

## Universal Export & Archival

Aura Notes bridges the raw utility of classic desktop text editors with the elegance of modern typography. 

When you export:
1. **Windows Plain Text (`.txt`)**: Choose between **CRLF (`\r\n`)** for authentic Windows Notepad compatibility or **LF (`\n`)** for Unix/macOS environments, with optional metadata headers.
2. **Standard Markdown (`.md`)**: Preserves all structural headings, checklists, code blocks, and tags for migration to any static site generator or knowledge base.
3. **Full Vault Backup (`.json`)**: Export every note, notebook, and tag into an encrypted, standalone JSON bundle for cold storage or device transfer.

---

<p align="center">
  <sub>Aura Notes — Built for those who write to understand.</sub>
</p>
