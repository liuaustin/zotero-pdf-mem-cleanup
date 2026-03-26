"use strict";
/* global Zotero, Components, Services */

var PDFMemCleanup;

function log(msg) {
  Zotero.debug(`[PDF-Mem-Cleanup] ${msg}`);
}

// eslint-disable-next-line no-unused-vars
function install(data, reason) {
}

// eslint-disable-next-line no-unused-vars
function uninstall(data, reason) {
}

function startup(data, reason) {
  PDFMemCleanup = {
    id: data.id,
    version: data.version,
    rootURI: data.rootURI,
    notifierID: null,

    init() {
      log(`Starting v${this.version}`);
      this._registerNotifier();
    },

    _registerNotifier() {
      const self = this;
      const callback = {
        notify(event, type, ids, _extraData) {
          if (event === 'close' && type === 'tab') {
            for (const id of ids) {
              const reader = Zotero.Reader.getByTabID(id);
              if (reader) {
                self._cleanupReader(reader);
              }
            }
          }
        }
      };
      this.notifierID = Zotero.Notifier.registerObserver(callback, ['tab'], 'pdfMemCleanup', 1);
      log(`Notifier registered (ID: ${this.notifierID})`);
    },

    _cleanupReader(reader) {
      try {
        const internalReader = reader._internalReader;
        if (!internalReader) {
          log('No _internalReader found, skipping');
          return;
        }

        this._cleanupView(internalReader._primaryView, 'primary');

        if (internalReader._secondaryView) {
          this._cleanupView(internalReader._secondaryView, 'secondary');
        }

        internalReader._primaryView = null;
        internalReader._secondaryView = null;
        reader._internalReader = null;
        reader._iframeWindow = null;

        log(`Cleaned up reader for item ${reader.itemID}`);
      }
      catch (e) {
        log(`Error during cleanup: ${e.message}`);
        Zotero.logError(e);
      }
    },

    _cleanupView(view, label) {
      if (!view) return;

      try {
        const iframeWindow = view._iframeWindow;
        if (!iframeWindow) {
          log(`${label} view: no _iframeWindow`);
          return;
        }

        const pdfApp = iframeWindow.PDFViewerApplication;
        if (pdfApp) {
          try {
            if (typeof pdfApp.cleanup === 'function') {
              pdfApp.cleanup();
              log(`${label} view: PDFViewerApplication.cleanup() called`);
            }
            if (typeof pdfApp.close === 'function') {
              pdfApp.close().catch(function(e) {
                log(`${label} view: close() error (non-fatal): ${e.message}`);
              });
              log(`${label} view: PDFViewerApplication.close() called`);
            }
          }
          catch (e) {
            log(`${label} view: PDFViewerApplication cleanup error: ${e.message}`);
          }
        }

        try {
          const canvases = iframeWindow.document.querySelectorAll('canvas');
          let canvasCount = 0;
          for (const canvas of canvases) {
            canvas.width = 0;
            canvas.height = 0;
            canvasCount++;
          }
          if (canvasCount > 0) {
            log(`${label} view: zeroed ${canvasCount} canvas elements`);
          }
        }
        catch (e) {
          log(`${label} view: canvas cleanup error: ${e.message}`);
        }

        if (view._overlayPopupDelayer) {
          try {
            view._overlayPopupDelayer.close(function() {});
          }
          catch (_e) { /* ignore */ }
          view._overlayPopupDelayer = null;
        }

        view._iframeWindow = null;
        view._iframe = null;

        log(`${label} view: cleanup complete`);
      }
      catch (e) {
        log(`${label} view: cleanup error: ${e.message}`);
        Zotero.logError(e);
      }
    },

    cleanup() {
      if (this.notifierID) {
        Zotero.Notifier.unregisterObserver(this.notifierID);
        this.notifierID = null;
      }
      log('Shutdown complete');
    }
  };

  PDFMemCleanup.init();
}

function onMainWindowLoad({ window }) {
}

function onMainWindowUnload({ window }) {
}

function shutdown(data, reason) {
  if (PDFMemCleanup) {
    PDFMemCleanup.cleanup();
    PDFMemCleanup = null;
  }
}
