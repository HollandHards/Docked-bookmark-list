// adapter.js
// Detect if we are in Firefox (browser namespace exists)
const isFirefox = (typeof browser !== 'undefined');

// SERVICE WORKER FIX: Use 'globalThis' instead of 'window'
// Chrome Service Workers do not have access to 'window'.
const scope = typeof globalThis !== 'undefined' ? globalThis : self;

if (isFirefox) {
  scope.DockAPI = browser;
} 
else {
  // Chrome Adapter
  scope.DockAPI = {
    runtime: {
      getURL: (path) => chrome.runtime.getURL(path),
      openOptionsPage: () => chrome.runtime.openOptionsPage(),
      sendMessage: (msg) => new Promise(r => chrome.runtime.sendMessage(msg, r)),
      onMessage: {
        addListener: (callback) => {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const result = callback(request, sender);
            // If the callback returns a Promise, handle it for Chrome's sendResponse
            if (result && typeof result.then === 'function') {
              result.then(sendResponse);
              return true; // Keep the message channel open for async response
            }
          });
        }
      }
    },
    tabs: {
      query: (q) => new Promise(r => chrome.tabs.query(q, r)),
      sendMessage: (id, msg) => new Promise(r => chrome.tabs.sendMessage(id, msg, r)),
      create: (props) => new Promise(r => chrome.tabs.create(props, r))
    },
    storage: {
      sync: {
        get: (k) => new Promise(r => chrome.storage.sync.get(k, r)),
        set: (v) => new Promise(r => chrome.storage.sync.set(v, r))
      },
      local: {
        get: (k) => new Promise(r => chrome.storage.local.get(k, r)),
        set: (v) => new Promise(r => chrome.storage.local.set(v, r))
      }
    },
    bookmarks: {
      getTree: () => new Promise(r => chrome.bookmarks.getTree(r)),
      getChildren: (id) => new Promise(r => chrome.bookmarks.getChildren(id, r)),
      create: (d) => new Promise(r => chrome.bookmarks.create(d, r)),
      update: (id, d) => new Promise(r => chrome.bookmarks.update(id, d, r)),
      remove: (id) => new Promise(r => chrome.bookmarks.remove(id, r)),
      move: (id, dest) => new Promise(r => chrome.bookmarks.move(id, dest, r))
    },
    windows: {
      create: (d) => new Promise(r => chrome.windows.create(d, r))
    },
    commands: chrome.commands
  };
}
