importScripts('adapter.js');

const DOCK_FOLDER_NAME = "Vertical-bookmark-list";

// --- HELPERS ---
async function getDockFolderId() {
  const tree = await DockAPI.bookmarks.getTree();
  let dockFolder = findFolder(tree, DOCK_FOLDER_NAME);
  if (!dockFolder) {
    // Try to find "Other Bookmarks" or root
    const parent = tree[0].children.find(c => c.id === '2') || tree[0];
    dockFolder = await DockAPI.bookmarks.create({ parentId: parent.id, title: DOCK_FOLDER_NAME });
  }
  return dockFolder.id;
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

function getFaviconUrl(u) {
  try {
    const urlObj = new URL(u);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
  } catch (e) {
    return '_default';
  }
}

async function getBookmarksForDock() {
  const folderId = await getDockFolderId();
  const children = await DockAPI.bookmarks.getChildren(folderId);
  const settings = await DockAPI.storage.sync.get(['customIcons', 'showSettings', 'settingsIcon']);
  const customIcons = settings.customIcons || {};
  
  const processNode = (node) => {
    const isFolder = !node.url;
    let iconUrl = customIcons[node.id];
    
    if (!iconUrl) {
      if (isFolder) iconUrl = '_default_folder'; // Handled in CSS
      else iconUrl = getFaviconUrl(node.url);
    }
    
    return {
      id: node.id,
      title: node.title,
      url: node.url,
      iconUrl: iconUrl,
      children: isFolder ? [] : null 
    };
  };

  const processed = [];
  for (const child of children) {
    const pChild = processNode(child);
    if (pChild.children) {
        // Fetch one level deep for stacks
        const subChildren = await DockAPI.bookmarks.getChildren(child.id);
        pChild.children = subChildren.map(sub => processNode(sub));
    }
    processed.push(pChild);
  }

  // Add Settings Icon if enabled
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
DockAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Fetch Data
  if (request.action === "get_bookmarks_for_mouse") {
    getBookmarksForDock().then(data => sendResponse({ data }));
    return true; // Keep channel open for async response
  }
  
  // 2. Actions
  if (request.action === "open_settings") {
    DockAPI.runtime.openOptionsPage();
  }
  if (request.action === "add_current_tab") {
    DockAPI.tabs.query({active: true, currentWindow: true}, async (tabs) => {
       if(tabs[0]) {
           const folderId = await getDockFolderId();
           await DockAPI.bookmarks.create({ parentId: folderId, title: tabs[0].title, url: tabs[0].url });
           broadcastRefresh();
       }
    });
  }
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
  if (request.action === "request_refresh") {
      broadcastRefresh();
  }
});

// --- COMMAND LISTENER (Shortcuts) ---
DockAPI.commands.onCommand.addListener(async (command) => {
  if (command === "toggle_dock") {
    const data = await getBookmarksForDock();
    DockAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) DockAPI.tabs.sendMessage(tabs[0].id, { action: "toggle_dock", data: data });
    });
  }
});

// --- BROADCAST TO TABS ---
async function broadcastRefresh() {
  const data = await getBookmarksForDock();
  DockAPI.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
        DockAPI.tabs.sendMessage(tab.id, { action: "refresh_dock", data: data }).catch(() => {});
    });
  });
}
