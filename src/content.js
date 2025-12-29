let dockContainer = null;
let isDockVisible = false;
let settings = {
  dockPosition: 'left', dockSize: 48, edgeTrigger: false, handlerIcon: '',
  accentColor: '#007aff', showTooltips: true, separatorStyle: 'glass',
  enableShadow: true, enableGlow: true, enableAccent: true, showSettings: true
};

function initDock() {
  if (document.getElementById('my-mac-dock')) return;
  dockContainer = document.createElement('div');
  dockContainer.id = 'my-mac-dock';
  dockContainer.classList.add('left-side', 'dock-idle'); // Start idle
  
  const handler = document.createElement('div');
  handler.className = 'dock-handler';
  handler.title = "Hover to open Dock";
  handler.addEventListener('mouseenter', () => openDock());
  handler.addEventListener('click', (e) => { e.stopPropagation(); openDock(); });
  
  dockContainer.appendChild(handler);
  document.body.appendChild(dockContainer);
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dock-stack') && !e.target.closest('.dock-item')) {
      closeAllStacks();
    }
    closeContextMenu();
  });
  
  // 1. MOUSE ENTER: Remove smooth transition for snappy fisheye
  dockContainer.addEventListener('mouseenter', () => {
    dockContainer.classList.remove('dock-idle');
  });

  // 2. MOUSE MOVE: Fisheye Logic
  dockContainer.addEventListener('mousemove', (e) => {
    if (!isDockVisible) return;
    const items = dockContainer.querySelectorAll('.dock-item');
    const baseSize = settings.dockSize;
    const maxScale = 1.8; const range = 150;    
    const isVertical = (settings.dockPosition === 'left' || settings.dockPosition === 'right');
    const mousePos = isVertical ? e.clientY : e.clientX;

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenter = isVertical ? (rect.top + rect.height / 2) : (rect.left + rect.width / 2);
      const distance = Math.abs(mousePos - itemCenter);
      let scale = 1;
      if (distance < range) {
        const val = 1 - (distance / range);
        scale = 1 + (maxScale - 1) * Math.sin(val * Math.PI / 2);
      }
      item.style.width = `${baseSize * scale}px`;
      item.style.height = `${baseSize * scale}px`;
    });
  });

  // 3. MOUSE LEAVE: Restore smooth transition and reset sizes
  dockContainer.addEventListener('mouseleave', () => {
    dockContainer.classList.add('dock-idle'); // Enable smooth shrink
    resetIcons();
  });

  refreshSettings();
}

// Helper to force icons back to normal size
function resetIcons() {
  if (!dockContainer) return;
  const items = dockContainer.querySelectorAll('.dock-item');
  items.forEach(item => { 
    item.style.width = `${settings.dockSize}px`; 
    item.style.height = `${settings.dockSize}px`; 
  });
}

function openDock() {
  if (dockContainer.querySelectorAll('.dock-item').length === 0) {
    DockAPI.runtime.sendMessage({ action: "get_bookmarks_for_mouse" }).then((response) => {
      if (response && response.data) { renderBookmarks(response.data); toggleDock(true); }
    });
  } else { toggleDock(true); }
}

function refreshSettings() {
  DockAPI.storage.sync.get(['dockPosition', 'dockSize', 'edgeTrigger', 'verticalPos', 'handlerIcon', 'accentColor', 'showTooltips', 'separatorStyle', 'enableShadow', 'enableGlow', 'enableAccent', 'showSettings']).then((res) => {
    settings.dockPosition = res.dockPosition || 'left';
    settings.dockSize = parseInt(res.dockSize) || 48;
    settings.edgeTrigger = res.edgeTrigger === true;
    settings.handlerIcon = res.handlerIcon || ''; 
    settings.accentColor = res.accentColor || '#007aff';
    settings.showTooltips = (res.showTooltips !== false); 
    settings.separatorStyle = res.separatorStyle || 'glass';
    settings.enableShadow = (res.enableShadow !== false);
    settings.enableGlow = (res.enableGlow !== false);
    settings.enableAccent = (res.enableAccent !== false);
    settings.showSettings = (res.showSettings !== false);

    const vPos = res.verticalPos || 50;
    dockContainer.style.setProperty('--dock-icon-size', settings.dockSize + 'px');
    dockContainer.style.setProperty('--dock-offset', vPos + '%');
    dockContainer.style.setProperty('--accent-color', settings.accentColor);
    
    dockContainer.classList.remove('left-side', 'right-side', 'top-side', 'bottom-side');
    if(settings.dockPosition === 'right') dockContainer.classList.add('right-side');
    else if(settings.dockPosition === 'bottom') dockContainer.classList.add('bottom-side');
    else if(settings.dockPosition === 'top') dockContainer.classList.add('top-side');
    else dockContainer.classList.add('left-side');

    if (settings.showTooltips) dockContainer.classList.add('tooltips-enabled'); else dockContainer.classList.remove('tooltips-enabled');
    if (settings.enableShadow) dockContainer.classList.add('shadow-enabled'); else dockContainer.classList.remove('shadow-enabled');
    if (settings.enableGlow) dockContainer.classList.add('glow-enabled'); else dockContainer.classList.remove('glow-enabled');
    if (settings.enableAccent) dockContainer.classList.add('theme-enabled'); else dockContainer.classList.remove('theme-enabled');

    const handler = dockContainer.querySelector('.dock-handler');
    if (handler) {
      handler.classList.add('has-icon');
      if (settings.handlerIcon && settings.handlerIcon.trim() !== '') handler.style.backgroundImage = `url('${settings.handlerIcon}')`;
      else handler.style.backgroundImage = `url('${DockAPI.runtime.getURL("icon.png")}')`;
    }
    
    // Safety reset when settings change
    resetIcons();
  });
}

DockAPI.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "toggle_dock") { refreshSettings(); renderBookmarks(request.data); toggleDock(!isDockVisible); }
  if (request.action === "refresh_dock") { renderBookmarks(request.data); refreshSettings(); }
});

// GLOBAL MOUSE TRACKER (Safety Net)
document.addEventListener('mousemove', (e) => {
  if (!dockContainer || !isDockVisible) return;

  const edgeThreshold = 15; const hideThreshold = 250; 
  
  // 1. Auto-Open Logic (if edgeTrigger is on)
  if (settings.edgeTrigger && !isDockVisible) {
    let hitEdge = false;
    if (settings.dockPosition === 'left' && e.clientX < edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'right' && e.clientX > window.innerWidth - edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'top' && e.clientY < edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'bottom' && e.clientY > window.innerHeight - edgeThreshold) hitEdge = true;
    if (hitEdge) openDock();
  } 

  // 2. Auto-Hide & Reset Logic
  let shouldHide = false;
  let dist = 0;
  
  // Calculate distance from dock edge to mouse
  if (settings.dockPosition === 'left') dist = e.clientX - settings.dockSize;
  if (settings.dockPosition === 'right') dist = (window.innerWidth - settings.dockSize) - e.clientX;
  if (settings.dockPosition === 'top') dist = e.clientY - settings.dockSize;
  if (settings.dockPosition === 'bottom') dist = (window.innerHeight - settings.dockSize) - e.clientY;

  // Safety Reset: If mouse is 100px away, force reset icons (fixes stuck fisheye)
  if (dist > 100) {
     if (!dockContainer.classList.contains('dock-idle')) {
         dockContainer.classList.add('dock-idle');
         resetIcons();
     }
  }

  // Hide logic
  if (settings.edgeTrigger && dist > hideThreshold) {
      toggleDock(false);
  }
});

function toggleDock(show) {
  isDockVisible = show;
  if (show) dockContainer.classList.add('dock-visible');
  else { dockContainer.classList.remove('dock-visible'); closeAllStacks(); closeContextMenu(); }
}

function closeAllStacks() { const stacks = document.querySelectorAll('.dock-stack'); stacks.forEach(s => s.remove()); }
function closeContextMenu() { const existing = document.querySelector('.dock-context-menu'); if (existing) existing.remove(); }

function showContextMenu(e, bm) {
  e.preventDefault(); closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'dock-context-menu';
  menu.style.setProperty('--accent-color', settings.accentColor);

  const addItem = (text, onClick, isDestructive = false) => {
    const item = document.createElement('div');
    item.className = 'ctx-item'; item.innerText = text;
    if (isDestructive) item.style.color = '#ff4d4d'; 
    item.onclick = (ev) => { ev.stopPropagation(); onClick(); closeContextMenu(); };
    menu.appendChild(item);
  };

  addItem("Add Current Page to Dock", () => DockAPI.runtime.sendMessage({ action: "add_current_tab" }));
  const sep1 = document.createElement('div'); sep1.className = 'ctx-sep'; menu.appendChild(sep1);

  if (bm.id === 'dock_settings_item') {
      addItem("Open Settings", () => DockAPI.runtime.sendMessage({ action: "open_settings" }));
  } else {
      addItem("Open in New Window", () => DockAPI.runtime.sendMessage({ action: "open_new_window", url: bm.url }));
      addItem("Open in Incognito", () => DockAPI.runtime.sendMessage({ action: "open_incognito", url: bm.url }));
      const sep2 = document.createElement('div'); sep2.className = 'ctx-sep'; menu.appendChild(sep2);
      addItem("Edit Name", () => {
        const newTitle = prompt("Enter new name:", bm.title);
        if (newTitle && newTitle !== bm.title) DockAPI.runtime.sendMessage({ action: "rename_bookmark", id: bm.id, title: newTitle });
      });
      addItem("Change Icon URL", () => {
        const newIcon = prompt("Enter new image URL (leave empty to reset):", "");
        if (newIcon !== null) DockAPI.runtime.sendMessage({ action: "update_icon", id: bm.id, url: newIcon });
      });
      const sep3 = document.createElement('div'); sep3.className = 'ctx-sep'; menu.appendChild(sep3);
      addItem("Remove from Dock", () => {
        if (confirm(`Delete "${bm.title}" from your bookmarks?`)) DockAPI.runtime.sendMessage({ action: "delete_bookmark", id: bm.id });
      }, true);
  }

  const sepGlobal = document.createElement('div'); sepGlobal.className = 'ctx-sep'; menu.appendChild(sepGlobal);
  addItem(settings.showSettings ? "Hide Settings Icon" : "Show Settings Icon", () => {
      const newState = !settings.showSettings;
      DockAPI.storage.sync.set({ showSettings: newState }).then(() => DockAPI.runtime.sendMessage({ action: "request_refresh" }));
  });
  addItem(settings.enableGlow ? "Disable Glow & Highlight" : "Enable Glow & Highlight", () => {
      const newState = !settings.enableGlow;
      DockAPI.storage.sync.set({ enableGlow: newState, enableShadow: newState }).then(() => {
          settings.enableGlow = newState; settings.enableShadow = newState; refreshSettings();
      });
  });

  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();
  const winWidth = window.innerWidth; const winHeight = window.innerHeight;
  let posX = e.clientX + 5; let posY = e.clientY + 5;
  if (posY + menuRect.height > winHeight) posY = e.clientY - menuRect.height - 5;
  if (posX + menuRect.width > winWidth) posX = e.clientX - menuRect.width - 5;
  if (posY < 0) posY = 5;
  menu.style.left = `${posX}px`; menu.style.top = `${posY}px`;
}

function renderBookmarks(bookmarks) {
  const handler = dockContainer.querySelector('.dock-handler');
  dockContainer.innerHTML = ''; dockContainer.appendChild(handler);
  if(!bookmarks || bookmarks.length === 0) {}

  bookmarks.forEach((bm) => {
    if (bm.title === "-") { const spacer = document.createElement('div'); spacer.className = 'dock-spacer'; dockContainer.appendChild(spacer); return; }
    const cleanTitle = bm.title.trim();
    if (cleanTitle.startsWith("---") && cleanTitle.endsWith("---") && cleanTitle.length > 6) {
        const header = document.createElement('div'); header.className = `dock-section-header style-${settings.separatorStyle}`;
        header.innerText = cleanTitle.replace(/---/g, '').trim(); dockContainer.appendChild(header); return;
    }
    const item = document.createElement(bm.children ? 'div' : 'a');
    item.className = 'dock-item'; item.title = bm.title;
    if (bm.iconUrl && !bm.iconUrl.startsWith('_default')) item.style.setProperty('--bg-image', `url('${bm.iconUrl}')`);

    let iconEl;
    if (bm.children) {
      item.classList.add('is-folder'); iconEl = document.createElement('img'); iconEl.src = bm.iconUrl; 
      item.onclick = (e) => { e.stopPropagation(); toggleStack(bm, item); };
      item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else if (bm.id === 'dock_settings_item') {
       item.classList.add('settings-item'); item.href = "#";
       item.onclick = (e) => { e.preventDefault(); DockAPI.runtime.sendMessage({ action: "open_settings" }); toggleDock(false); };
       iconEl = document.createElement('img'); iconEl.src = bm.iconUrl; 
       item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else {
       item.href = bm.url; item.target = "_blank";
       item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
       iconEl = document.createElement('img'); iconEl.src = bm.iconUrl;
    }
    item.ondragstart = () => false; item.appendChild(iconEl); dockContainer.appendChild(item);
  });
}

function toggleStack(bookmark, anchorElement) {
  const existing = document.querySelector(`.dock-stack[data-parent="${bookmark.id}"]`);
  if (existing) { existing.remove(); return; }
  closeAllStacks(); 
  const stack = document.createElement('div'); stack.className = 'dock-stack';
  stack.dataset.parent = bookmark.id; stack.style.setProperty('--accent-color', settings.accentColor);
  
  if (bookmark.children && bookmark.children.length > 0) {
    bookmark.children.forEach(child => {
       const link = document.createElement('a'); link.className = 'stack-item';
       link.href = child.url || '#'; link.target = "_blank"; link.title = child.title;
       const icon = document.createElement('img'); icon.src = child.iconUrl;
       const span = document.createElement('span'); span.innerText = child.title;
       link.appendChild(icon); link.appendChild(span); stack.appendChild(link);
    });
  } else {
    stack.innerText = "Empty Folder"; stack.style.color = "#555"; stack.style.padding = "10px"; stack.style.fontSize = "12px";
  }

  const rect = anchorElement.getBoundingClientRect();
  if (settings.dockPosition === 'left') { stack.style.top = (rect.top - (bookmark.children.length * 2)) + 'px'; stack.style.left = (rect.right + 15) + 'px'; }
  else if (settings.dockPosition === 'right') { stack.style.top = (rect.top - (bookmark.children.length * 2)) + 'px'; stack.style.right = (window.innerWidth - rect.left + 15) + 'px'; }
  else if (settings.dockPosition === 'bottom') { stack.style.bottom = (window.innerHeight - rect.top + 15) + 'px'; stack.style.left = (rect.left - 50) + 'px'; }
  else if (settings.dockPosition === 'top') { stack.style.top = (rect.bottom + 15) + 'px'; stack.style.left = (rect.left - 50) + 'px'; }
  document.body.appendChild(stack);
}

if (document.body) { initDock(); } 
else { const observer = new MutationObserver((mutations, obs) => { if (document.body) { initDock(); obs.disconnect(); } }); observer.observe(document.documentElement, { childList: true, subtree: true }); }
