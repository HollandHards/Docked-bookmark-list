// adapter.js
// Detect if we are in Firefox (browser namespace exists)
const isFirefox = (typeof browser !== 'undefined');

// In Service Workers, use 'self'. In pages, use 'this' or 'window'.
const apiScope = (typeof self !== 'undefined') ? self : this;

if (isFirefox) {
  // Firefox: Native Promise support, just pass it through
  apiScope.DockAPI = browser;
} 
else {
  // Chrome: Adapter to convert Callbacks to Promises
  apiScope.DockAPI = {
    runtime: {
      getURL: (path) => chrome.runtime.getURL(path),
      openOptionsPage: () => chrome.runtime.openOptionsPage(),
      
      // FIXED: Added error checking to suppress "Port closed" errors
      sendMessage: (msg) => new Promise(resolve => {
        chrome.runtime.sendMessage(msg, response => {
          // If the background script didn't reply (port closed), Chrome sets lastError.
          // We must check it to suppress the "Unchecked runtime.lastError" warning.
          if (chrome.runtime.lastError) {
            // resolve with null so the code continues without crashing
            resolve(null); 
          } else {
            resolve(response);
          }
        });
      }),

      onMessage: {
        addListener: (callback) => {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const result = callback(request, sender);
            // If the callback returns a Promise, keep the channel open
            if (result && typeof result.then === 'function') {
              result.then(sendResponse);
              return true; 
            }
            // If not a promise, we don't return true, allowing the port to close naturally.
          });
        }
      }
    },
    tabs: {
      query: (q) => new Promise(r => chrome.tabs.query(q, r)),
      sendMessage: (id, msg) => new Promise(resolve => {
        chrome.tabs.sendMessage(id, msg, response => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(response);
        });
      }),
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
