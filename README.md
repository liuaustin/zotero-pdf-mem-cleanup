# Zotero PDF Memory Cleanup

[中文说明](README_CN.md)

A Zotero 8 plugin that fixes the PDF reader memory leak — reclaims memory when you close PDF tabs.

## Problem

Zotero's built-in PDF reader leaks memory. When you close a PDF tab, the `ReaderInstance.uninit()` method only does minimal cleanup — it doesn't release pdf.js resources, GPU texture memory, or break cross-compartment references. This means:

- **Memory keeps growing** as you open and close PDFs
- Closing a tab does **not** free the memory it used
- After several PDFs, Zotero can consume hundreds of MB or even GBs of RAM

| Metric | Before | After |
|--------|--------|-------|
| Memory after closing PDF | 699 MB (never released) | 399 MB → drops to 34–47 MB within 25s |
| Memory reclamation | None | Full recovery to baseline |

*Tested on Zotero 8.0.4, macOS*

## How It Works

The plugin registers a Notifier observer on `tab` close events. When a PDF tab is closed, it intervenes before the reader is fully destroyed and performs three cleanup steps:

1. **Calls `PDFViewerApplication.cleanup()` and `.close()`** — destroys the pdf.js document instance, web workers, and font caches
2. **Zeros all canvas elements (`width = 0, height = 0`)** — forces the browser to release GPU texture memory
3. **Nullifies cross-compartment references** (`_internalReader`, `_iframeWindow`, `_primaryView`, `_secondaryView`) — breaks reference cycles so the garbage collector can reclaim everything

The plugin is lightweight (~160 lines), has no UI, and works silently in the background.

## Installation

1. Download the latest `.xpi` from [Releases](https://github.com/liuaustin/zotero-pdf-mem-cleanup/releases)
2. In Zotero: **Tools → Add-ons → ⚙ → Install Add-on From File**
3. Select the `.xpi` file
4. Restart Zotero

## Build from Source

```bash
git clone https://github.com/liuaustin/zotero-pdf-mem-cleanup.git
cd zotero-pdf-mem-cleanup
./build.sh
```

This creates `zotero-pdf-mem-cleanup.xpi` in the project root.

## Compatibility

- Zotero 8.0.0+
- All platforms (macOS, Windows, Linux)

## License

[MIT](LICENSE)
