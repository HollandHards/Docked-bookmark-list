const DOCK_FOLDER_NAME = "Vertical-bookmark-list";

// 1. AUTO-SETUP ON INSTALL
// This runs once when the user installs the extension
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(async () => {
    await getOrCreateDockFolder();
  });
} 
else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onInstalled) {
  browser.runtime.onInstalled.addListener(async () => {
    await getOrCreateDockFolder();
  });
}

async function getOrCreateDockFolder() {
  const tree = await DockAPI.bookmarks.getTree();
  let dockFolder = findFolder(tree, DOCK_FOLDER_NAME);
  
  if (!dockFolder) {
    // "Other Bookmarks" usually has ID '2' in Chrome and 'unfiled_____' in Firefox
    const rootChildren = tree[0].children;
    const parent = rootChildren.find(c => c.id === '2' || c.id === 'unfiled_____') || rootChildren[rootChildren.length - 1]; 
    
    dockFolder = await DockAPI.bookmarks.create({
      parentId: parent.id,
      title: DOCK_FOLDER_NAME
    });
    
    // Default bookmark
    await DockAPI.bookmarks.create({
      parentId: dockFolder.id,
      title: "Welcome! Right-click to add pages",
      url: "https://github.com/HollandHards/Docked-bookmark-list/"
    });
  }
  return dockFolder;
}

async function getDockBookmarks() {
  const dockFolder = await getOrCreateDockFolder();
  const children = await DockAPI.bookmarks.getChildren(dockFolder.id);
  
  const syncStorage = await DockAPI.storage.sync.get(['customIcons', 'settingsIcon', 'showSettings']);
  const localStorage = await DockAPI.storage.local.get(['faviconCache']);
  
  const customIcons = syncStorage.customIcons || {};
  const faviconCache = localStorage.faviconCache || {};
  
  const settingsIcon = (syncStorage.settingsIcon && syncStorage.settingsIcon.trim() !== '') 
    ? syncStorage.settingsIcon 
    : DockAPI.runtime.getURL("gears.png");

  const itemsToCache = [];

  const processNode = async (bm) => {
    let iconUrl = '';
    
    if (customIcons[bm.id]) {
      iconUrl = customIcons[bm.id];
    } else if (faviconCache[bm.id]) {
      iconUrl = faviconCache[bm.id];
    } else if (bm.url) {
      if (!bm.url.startsWith('data:')) {
        try {
            const urlObj = new URL(bm.url);
            iconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            itemsToCache.push({ id: bm.id, url: iconUrl });
        } catch(e) { iconUrl = ""; }
      } else {
        iconUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ0Y2NmZiI+PHBhdGggZD0iTTEwIDRINmMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+";
      }
    } else {
      iconUrl = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ0Y2NmZiI+PHBhdGggZD0iTTEwIDRINmMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+"; 
    }

    const item = { 
      id: bm.id, 
      title: bm.title, 
      url: bm.url, 
      iconUrl: iconUrl,
      index: bm.index,
      parentId: bm.parentId
    };

    if (!bm.url) {
      const subChildren = await DockAPI.bookmarks.getChildren(bm.id);
      item.children = await Promise.all(subChildren.map(child => processNode(child)));
    }

    return item;
  };

  const bookmarks = await Promise.all(children.map(processNode));

  if (itemsToCache.length > 0) {
    cacheMissingIcons(itemsToCache);
  }

  if (syncStorage.showSettings !== false) {
    bookmarks.push({ title: "-", id: "spacer_settings" });
    bookmarks.push({
      id: "dock_settings_item",
      title: "Settings",
      url: "#settings",
      iconUrl: settingsIcon
    });
  }

  return bookmarks;
}

async function cacheMissingIcons(items) {
  const storage = await DockAPI.storage.local.get(['faviconCache']);
  const cache = storage.faviconCache || {};

  for (const item of items) {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        cache[item.id] = reader.result;
        DockAPI.storage.local.set({ faviconCache: cache });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      // console.log(`Failed to cache icon for ${item.id}`, err);
    }
  }
}

function findFolder(nodes, name) {
  for (const node of nodes) {
    if (node.title === name && !node.url) return node;
    if (node.children) {
      const found = findFolder(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

function broadcastRefresh() {
  getDockBookmarks().then(bookmarks => {
    DockAPI.tabs.query({}).then(tabs => {
      tabs.forEach(tab => {
          DockAPI.tabs.sendMessage(tab.id, { action: "refresh_dock", data: bookmarks })
            .catch(() => {}); // Ignore errors from tabs without the content script
      });
    });
  });
}

if (DockAPI.commands && DockAPI.commands.onCommand) {
  DockAPI.commands.onCommand.addListener(async (command) => {
    if (command === "toggle_dock") {
      const bookmarks = await getDockBookmarks();
      const tabs = await DockAPI.tabs.query({active: true, currentWindow: true});
      if (tabs[0]?.id) {
        DockAPI.tabs.sendMessage(tabs[0].id, { action: "toggle_dock", data: bookmarks });
      }
    }
  });
}

DockAPI.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "get_bookmarks_for_mouse") {
    return getDockBookmarks().then(bookmarks => {
      return { data: bookmarks };
    });
  }
  
  if (request.action === "request_refresh") {
    broadcastRefresh();
  }
  
  if (request.action === "add_current_tab") {
    DockAPI.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
            const dockFolder = await getOrCreateDockFolder();
            await DockAPI.bookmarks.create({
                parentId: dockFolder.id,
                title: tab.title,
                url: tab.url
            });
            // broadcastRefresh() is now handled by the event listeners below
        }
    });
  }

  if (request.action === "open_settings") { DockAPI.runtime.openOptionsPage(); }
  if (request.action === "open_new_window") { DockAPI.windows.create({ url: request.url }); }
  if (request.action === "open_incognito") { DockAPI.windows.create({ url: request.url, incognito: true }); }
  
  if (request.action === "rename_bookmark") {
    DockAPI.bookmarks.update(request.id, { title: request.title });
  }
  if (request.action === "delete_bookmark") {
    DockAPI.bookmarks.remove(request.id);
  }
  if (request.action === "update_icon") {
    DockAPI.storage.sync.get(['customIcons']).then((result) => {
      const icons = result.customIcons || {};
      if (request.url) { icons[request.id] = request.url; } 
      else { delete icons[request.id]; }
      DockAPI.storage.sync.set({ customIcons: icons }).then(() => broadcastRefresh());
    });
  }
  
  return false; 
});


// --- LIVE UPDATE LISTENERS ---

// 1. Watch for Bookmark Changes
// When you drag a bookmark in Options, or add one in the browser, the Dock updates instantly.
const handleBookmarkChange = () => broadcastRefresh();

if (DockAPI.bookmarks.onCreated) DockAPI.bookmarks.onCreated.addListener(handleBookmarkChange);
if (DockAPI.bookmarks.onRemoved) DockAPI.bookmarks.onRemoved.addListener(handleBookmarkChange);
if (DockAPI.bookmarks.onChanged) DockAPI.bookmarks.onChanged.addListener(handleBookmarkChange);
if (DockAPI.bookmarks.onMoved)   DockAPI.bookmarks.onMoved.addListener(handleBookmarkChange);

// 2. Watch for settings that change the LIST (not just CSS)
// e.g., Toggling the "Settings" gear icon requires re-rendering the list.
if (DockAPI.storage.onChanged) {
    DockAPI.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.showSettings || changes.customIcons || changes.settingsIcon) {
          broadcastRefresh();
        }
      }
    });
}
