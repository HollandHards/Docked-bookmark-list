const isFirefox = typeof browser !== 'undefined';
const DockAPI = isFirefox ? browser : {};

// If we are in Chrome (or Edge/Brave), we need to wrap the API calls
// to return Promises instead of using Callbacks.
if (!isFirefox && typeof chrome !== 'undefined') {
  
  // Helper: Wraps a Chrome API function into a Promise
  const promisify = (fn, context) => (...args) => {
    return new Promise((resolve, reject) => {
      // Chrome APIs expect the callback as the last argument
      fn.call(context, ...args, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  };

  // 1. Storage API
  DockAPI.storage = {
    sync: {
      get: promisify(chrome.storage.sync.get, chrome.storage.sync),
      set: promisify(chrome.storage.sync.set, chrome.storage.sync),
    },
    onChanged: chrome.storage.onChanged
  };

  // 2. Bookmarks API
  DockAPI.bookmarks = {
    getTree: promisify(chrome.bookmarks.getTree, chrome.bookmarks),
    getChildren: promisify(chrome.bookmarks.getChildren, chrome.bookmarks),
    create: promisify(chrome.bookmarks.create, chrome.bookmarks),
    update: promisify(chrome.bookmarks.update, chrome.bookmarks),
    remove: promisify(chrome.bookmarks.remove, chrome.bookmarks),
    removeTree: promisify(chrome.bookmarks.removeTree, chrome.bookmarks),
    move: promisify(chrome.bookmarks.move, chrome.bookmarks)
  };

  // 3. Tabs & Windows API
  DockAPI.tabs = {
    create: promisify(chrome.tabs.create, chrome.tabs),
    query: promisify(chrome.tabs.query, chrome.tabs),
    sendMessage: promisify(chrome.tabs.sendMessage, chrome.tabs)
  };

  DockAPI.windows = {
    create: promisify(chrome.windows.create, chrome.windows)
  };

  // 4. Commands API
  DockAPI.commands = {
    getAll: promisify(chrome.commands.getAll, chrome.commands),
    onCommand: chrome.commands.onCommand
  };

  // 5. Runtime API
  DockAPI.runtime = {
    openOptionsPage: promisify(chrome.runtime.openOptionsPage, chrome.runtime),
    sendMessage: promisify(chrome.runtime.sendMessage, chrome.runtime),
    getURL: (path) => chrome.runtime.getURL(path),
    onMessage: chrome.runtime.onMessage,
    lastError: chrome.runtime.lastError
  };
  
  // 6. Scripting (Optional)
  if (chrome.scripting) {
      DockAPI.scripting = {
          executeScript: promisify(chrome.scripting.executeScript, chrome.scripting)
      };
  }
}

// FIX: Use globalThis to work in both Background (Service Worker) and Content Script
globalThis.DockAPI = DockAPI;
if (typeof window !== 'undefined') {
  window.DockAPI = DockAPI;
}
