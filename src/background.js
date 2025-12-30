// Universal Import: Works in Chrome (Service Worker) and handles Firefox (Background Page)
try {
  // Chrome/Edge/Brave need this to load the adapter
  if (typeof importScripts === 'function') {
    importScripts('adapter.js');
  }
} catch (e) {
  // Firefox loads adapter.js via the manifest, so we ignore the error here.
}

const DOCK_FOLDER_NAME = "Vertical-bookmark-list";

// --- HELPERS ---

/**
 * Finds or creates the special folder for the Dock.
 */
async function getDockFolderId() {
  const tree = await DockAPI.bookmarks.getTree();
  let dockFolder = findFolder(tree, DOCK_FOLDER_NAME);
  
  if (!dockFolder) {
    // Attempt to find "Other Bookmarks" (ID usually '2' in Chrome) or use root
    const parent = tree[0].children.find(c => c.id === '2') || tree[0];
    dockFolder = await DockAPI.bookmarks.create({ 
      parentId: parent.id, 
      title: DOCK_FOLDER_NAME 
    });
  }
  return dockFolder.id;
}

/**
 * Recursively finds a folder by title.
 */
function findFolder(nodes, name) {
  for (const node of nodes) {
    if (node.title === name && !node.url) {
      return node;
    }
    if (node.children) {
      const found = findFolder(node.children, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Generates a high-res favicon URL using Google's service (Chrome/Edge only).
 * Firefox might need a local fallback or different service in production.
 */
function getFaviconUrl(u) {
  try {
    const urlObj = new URL(u);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
  } catch (e) {
    return '_default';
  }
}

/**
 * Main function to prepare data for the Dock.
 * Reads bookmarks, applies custom icons, and checks settings.
 */
async function getBookmarksForDock() {
  const folderId = await getDockFolderId();
  const children = await DockAPI.bookmarks.getChildren(folderId);
  
  // Load user settings for icons
  const settings = await DockAPI.storage.sync.get(['customIcons', 'showSettings', 'settingsIcon']);
  const customIcons = settings.customIcons || {};
  
  const processNode = (node) => {
    const isFolder = !node.url;
    let iconUrl = customIcons[node.id];
    
    // Fallback if no custom icon set
    if (!iconUrl) {
      if (isFolder) iconUrl = '_default_folder'; // Will be styled via CSS
      else iconUrl = getFaviconUrl(node.url);
    }
    
    return {
      id: node.id,
      title: node.title,
      url: node.url,
      iconUrl: iconUrl,
      // Retrieve one level deep for Folder Stacks
      children: isFolder ? [] : null 
    };
  };

  const processed = [];
  for (const child of children) {
    const pChild = processNode(child);
    if (pChild.children) {
        // Fetch sub-children for stacks
        const subChildren = await DockAPI.bookmarks.getChildren(child.id);
        pChild.children = subChildren.map(sub => processNode(sub));
    }
    processed.push(pChild);
  }

  // Append the "Settings" gear icon if enabled
  if (settings.showSettings !== false) {
    processed.push({
        id: 'dock_settings_item',
        title: 'Dock Settings',
        url: '',
        iconUrl: settings.settingsIcon || DockAPI.runtime.getURL("icon.png"),
        children: null
    });
  }

  return processed;
}

// --- MESSAGE LISTENER ---
// Handles communication from content.js (the webpage) and options.js
DockAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // 1. Fetch Data request from content.js (Mouse hover)
  if (request.action === "get_bookmarks_for_mouse") {
    getBookmarksForDock().then(data => sendResponse({ data }));
    return true; // Keep message channel open for async response
  }
  
  // 2. Open Settings Page
  if (request.action === "open_settings") {
    DockAPI.runtime.openOptionsPage();
  }

  // 3. "Add Current Page" Context Menu Action
  if (request.action === "add_current_tab") {
    DockAPI.tabs.query({active: true, currentWindow: true}, async (tabs) => {
       if(tabs[0]) {
           const folderId = await getDockFolderId();
           await DockAPI.bookmarks.create({ 
             parentId: folderId, 
             title: tabs[0].title, 
             url: tabs[0].url 
           });
           broadcastRefresh();
       }
    });
  }

  // 4. Utility Actions
  if (request.action === "open_new_window") {
      DockAPI.tabs.create({ url: request.url });
  }
  if (request.action === "open_incognito") {
      DockAPI.windows.create({ url: request.url, incognito: true });
  }
  if (request.action === "rename_bookmark") {
      DockAPI.bookmarks.update(request.id, { title: request.title }).then(broadcastRefresh);
  }
  if (request.action === "delete_bookmark") {
      DockAPI.bookmarks.remove(request.id).then(broadcastRefresh);
  }
  if (request.action === "update_icon") {
      DockAPI.storage.sync.get(['customIcons']).then((res) => {
          const icons = res.customIcons || {};
          if (request.url) icons[request.id] = request.url;
          else delete icons[request.id];
          
          DockAPI.storage.sync.set({ customIcons: icons }).then(broadcastRefresh);
      });
  }
  
  // 5. Force Refresh (e.g. after changing settings)
  if (request.action === "request_refresh") {
      broadcastRefresh();
  }
});

// --- KEYBOARD SHORTCUTS ---
DockAPI.commands.onCommand.addListener(async (command) => {
  if (command === "toggle_dock") {
    const data = await getBookmarksForDock();
    // Send toggle command only to the active tab
    DockAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
            DockAPI.tabs.sendMessage(tabs[0].id, { action: "toggle_dock", data: data });
        }
    });
  }
});

// --- BROADCAST HELPER ---
// Tells all open tabs to refresh their dock (e.g. after adding a bookmark)
async function broadcastRefresh() {
  const data = await getBookmarksForDock();
  DockAPI.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
        DockAPI.tabs.sendMessage(tab.id, { action: "refresh_dock", data: data }).catch(() => {
            // Ignore errors for tabs where content script isn't loaded
        });
    });
  });
}
