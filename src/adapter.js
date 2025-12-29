// adapter.js
const isFirefox = (typeof browser !== 'undefined');

// If Firefox, we just alias the browser object
if (isFirefox) {
  window.DockAPI = browser;
} 
// If Chrome, we create the wrapper
else {
  window.DockAPI = {
    runtime: {
      getURL: (path) => chrome.runtime.getURL(path),
      openOptionsPage: () => chrome.runtime.openOptionsPage(),
      sendMessage: (msg) => new Promise(r => chrome.runtime.sendMessage(msg, r)),
      onMessage: {
        addListener: (callback) => {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const result = callback(request, sender);
            if (result && typeof result.then === 'function') {
              result.then(sendResponse);
              return true; // Keep channel open for Chrome
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