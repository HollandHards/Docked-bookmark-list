const isFirefox = typeof browser !== 'undefined';
let DockAPI;

if (isFirefox) {
  DockAPI = browser;
} else {
  // Chrome / Edge / Brave Logic
  if (typeof chrome !== 'undefined') {
    const promisify = (fn, context) => (...args) => {
      return new Promise((resolve, reject) => {
        fn.call(context, ...args, (result) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(result);
        });
      });
    };

    DockAPI = {
      storage: {
        sync: {
          get: promisify(chrome.storage.sync.get, chrome.storage.sync),
          set: promisify(chrome.storage.sync.set, chrome.storage.sync),
        },
        onChanged: chrome.storage.onChanged
      },
      bookmarks: {
        getTree: promisify(chrome.bookmarks.getTree, chrome.bookmarks),
        getChildren: promisify(chrome.bookmarks.getChildren, chrome.bookmarks),
        create: promisify(chrome.bookmarks.create, chrome.bookmarks),
        update: promisify(chrome.bookmarks.update, chrome.bookmarks),
        remove: promisify(chrome.bookmarks.remove, chrome.bookmarks),
        removeTree: promisify(chrome.bookmarks.removeTree, chrome.bookmarks),
        move: promisify(chrome.bookmarks.move, chrome.bookmarks)
      },
      tabs: {
        create: promisify(chrome.tabs.create, chrome.tabs),
        query: promisify(chrome.tabs.query, chrome.tabs),
        sendMessage: promisify(chrome.tabs.sendMessage, chrome.tabs)
      },
      windows: {
        create: promisify(chrome.windows.create, chrome.windows)
      },
      commands: {
        getAll: promisify(chrome.commands.getAll, chrome.commands),
        onCommand: chrome.commands.onCommand
      },
      runtime: {
        openOptionsPage: promisify(chrome.runtime.openOptionsPage, chrome.runtime),
        sendMessage: promisify(chrome.runtime.sendMessage, chrome.runtime),
        getURL: (path) => chrome.runtime.getURL(path),
        onMessage: chrome.runtime.onMessage,
        lastError: chrome.runtime.lastError
      },
      scripting: chrome.scripting ? {
          executeScript: promisify(chrome.scripting.executeScript, chrome.scripting)
      } : {}
    };
  } else {
    DockAPI = {};
  }
}

// EXPORT to Window (Content Scripts) and Global (Service Workers)
if (typeof self !== 'undefined') self.DockAPI = DockAPI;
if (typeof window !== 'undefined') window.DockAPI = DockAPI;
if (typeof globalThis !== 'undefined') globalThis.DockAPI = DockAPI;
