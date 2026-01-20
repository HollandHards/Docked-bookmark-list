const isFirefox = (typeof browser !== 'undefined');
const apiScope = (typeof self !== 'undefined') ? self : this;

if (isFirefox) {
  apiScope.DockAPI = browser;
} 
else {
  apiScope.DockAPI = {
    runtime: {
      getURL: (path) => chrome.runtime.getURL(path),
      openOptionsPage: () => chrome.runtime.openOptionsPage(),
      
      sendMessage: (msg) => new Promise(resolve => {
        try {
          chrome.runtime.sendMessage(msg, response => {
            if (chrome.runtime.lastError) {
              resolve(null); 
            } else {
              resolve(response);
            }
          });
        } catch (e) {
          resolve(null);
        }
      }),

      onMessage: {
        addListener: (callback) => {
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const result = callback(request, sender);
            if (result && typeof result.then === 'function') {
              result.then(sendResponse);
              return true; 
            }
          });
        }
      }
    },
    tabs: {
      query: (q) => new Promise(r => chrome.tabs.query(q, r)),
      sendMessage: (id, msg) => new Promise(resolve => {
        try {
            chrome.tabs.sendMessage(id, msg, response => {
              if (chrome.runtime.lastError) resolve(null);
              else resolve(response);
            });
        } catch(e) { resolve(null); }
      }),
      create: (props) => new Promise(r => chrome.tabs.create(props, r))
    },
    storage: {
      onChanged: {
        addListener: (cb) => chrome.storage.onChanged.addListener(cb)
      },
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
      onCreated: { addListener: (cb) => chrome.bookmarks.onCreated.addListener(cb) },
      onRemoved: { addListener: (cb) => chrome.bookmarks.onRemoved.addListener(cb) },
      onChanged: { addListener: (cb) => chrome.bookmarks.onChanged.addListener(cb) },
      onMoved:   { addListener: (cb) => chrome.bookmarks.onMoved.addListener(cb) },
      
      getTree: () => new Promise(r => chrome.bookmarks.getTree(r)),
      getChildren: (id) => new Promise(r => chrome.bookmarks.getChildren(id, r)),
      create: (d) => new Promise(r => chrome.bookmarks.create(d, r)),
      update: (id, d) => new Promise(r => chrome.bookmarks.update(id, d, r)),
      remove: (id) => new Promise(r => chrome.bookmarks.remove(id, r)),
      removeTree: (id) => new Promise(r => chrome.bookmarks.removeTree(id, r)),
      move: (id, dest) => new Promise(r => chrome.bookmarks.move(id, dest, r))
    },
    windows: {
      create: (d) => new Promise(r => chrome.windows.create(d, r))
    },
    commands: chrome.commands
  };
}
