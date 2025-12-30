const isFirefox = typeof browser !== 'undefined';
let DockAPI;

if (isFirefox) {
  DockAPI = browser;
} else {
  // Chrome / Edge / Brave Logic
  if (typeof chrome !== 'undefined') {
    
    // Helper to turn callback-based APIs into Promises
    const promisify = (fn, context) => (...args) => {
      return new Promise((resolve, reject) => {
        if (!fn) {
            // Safety: If the API function doesn't exist in this context
            resolve(undefined); 
            return;
        }
        fn.call(context, ...args, (result) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(result);
        });
      });
    };

    DockAPI = {};

    // 1. Runtime (Always available)
    if (chrome.runtime) {
        DockAPI.runtime = {
            openOptionsPage: promisify(chrome.runtime.openOptionsPage, chrome.runtime),
            sendMessage: promisify(chrome.runtime.sendMessage, chrome.runtime),
            getURL: (path) => chrome.runtime.getURL(path),
            onMessage: chrome.runtime.onMessage,
            lastError: chrome.runtime.lastError
        };
    }

    // 2. Storage (Usually available)
    if (chrome.storage) {
        DockAPI.storage = {
            sync: {
                get: promisify(chrome.storage.sync.get, chrome.storage.sync),
                set: promisify(chrome.storage.sync.set, chrome.storage.sync),
            },
            onChanged: chrome.storage.onChanged
        };
    }

    // 3. Bookmarks (Background/Options ONLY - This crashed before)
    if (chrome.bookmarks) {
        DockAPI.bookmarks = {
            getTree: promisify(chrome.bookmarks.getTree, chrome.bookmarks),
            getChildren: promisify(chrome.bookmarks.getChildren, chrome.bookmarks),
            create: promisify(chrome.bookmarks.create, chrome.bookmarks),
            update: promisify(chrome.bookmarks.update, chrome.bookmarks),
            remove: promisify(chrome.bookmarks.remove, chrome.bookmarks),
            removeTree: promisify(chrome.bookmarks.removeTree, chrome.bookmarks),
            move: promisify(chrome.bookmarks.move, chrome.bookmarks)
        };
    }

    // 4. Tabs (Background/Options ONLY)
    if (chrome.tabs) {
        DockAPI.tabs = {
            create: promisify(chrome.tabs.create, chrome.tabs),
            query: promisify(chrome.tabs.query, chrome.tabs),
            sendMessage: promisify(chrome.tabs.sendMessage, chrome.tabs)
        };
    }

    // 5. Windows (Background/Options ONLY)
    if (chrome.windows) {
        DockAPI.windows = {
            create: promisify(chrome.windows.create, chrome.windows)
        };
    }

    // 6. Commands (Usually available)
    if (chrome.commands) {
        DockAPI.commands = {
            getAll: promisify(chrome.commands.getAll, chrome.commands),
            onCommand: chrome.commands.onCommand
        };
    }
    
    // 7. Scripting
    if (chrome.scripting) {
        DockAPI.scripting = {
            executeScript: promisify(chrome.scripting.executeScript, chrome.scripting)
        };
    }

  } else {
    // Fallback if chrome is not defined (rare)
    DockAPI = {};
  }
}

// Export to Global Scope
if (typeof self !== 'undefined') self.DockAPI = DockAPI;
if (typeof window !== 'undefined') window.DockAPI = DockAPI;
if (typeof globalThis !== 'undefined') globalThis.DockAPI = DockAPI;
