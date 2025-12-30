let dockContainer = null;
let isDockVisible = false;
let hideTimer = null;
let settings = {
  dockPosition: 'left', dockSize: 48, edgeTrigger: false, handlerIcon: '',
  accentColor: '#007aff', showTooltips: true, separatorStyle: 'glass',
  enableShadow: true, enableGlow: true, enableAccent: true, showSettings: true,
  backdropBlur: 10, iconShape: '12px', idleOpacity: 100
};

// --- INITIALIZATION ---
function initDock() {
  // Prevent duplicates
  if (document.getElementById('my-mac-dock')) return;
  
  dockContainer = document.createElement('div');
  dockContainer.id = 'my-mac-dock';
  dockContainer.classList.add('left-side', 'dock-idle'); 
  
  const handler = document.createElement('div');
  handler.className = 'dock-handler';
  handler.title = "Hover to open Dock";
  
  handler.addEventListener('mouseenter', () => openDock());
  handler.addEventListener('click', (e) => { e.stopPropagation(); openDock(); });
  
  dockContainer.appendChild(handler);
  document.body.appendChild(dockContainer);
  
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dock-stack') && !e.target.closest('.dock-item') && !e.target.closest('.dock-handler')) {
      closeAllStacks();
      if(isDockVisible) toggleDock(false);
    }
    closeContextMenu();
  });
  
  // Mouse Enter/Leave Logic
  dockContainer.addEventListener('mouseenter', () => { 
      clearTimeout(hideTimer); 
      dockContainer.classList.remove('dock-idle'); 
  });
  dockContainer.addEventListener('mouseleave', () => { 
      dockContainer.classList.add('dock-idle'); 
      resetIcons(); 
      startHideTimer(); 
  });

  // Fisheye Animation
  dockContainer.addEventListener('mousemove', (e) => {
    if (!isDockVisible) return;
    clearTimeout(hideTimer);
    const items = dockContainer.querySelectorAll('.dock-item');
    if(items.length === 0) return;

    const baseSize = settings.dockSize;
    const maxScale = 1.8; 
    const range = 150;    
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

  refreshSettings();
}

function startHideTimer() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        // Don't close if a menu is open
        if (!document.querySelector('.dock-stack') && !document.querySelector('.dock-context-menu')) {
            toggleDock(false);
        }
    }, 600); 
}

function resetIcons() {
  if (!dockContainer) return;
  const items = dockContainer.querySelectorAll('.dock-item');
  items.forEach(item => { item.style.width = `${settings.dockSize}px`; item.style.height = `${settings.dockSize}px`; });
}

function openDock() {
  clearTimeout(hideTimer);
  if (dockContainer.querySelectorAll('.dock-item').length === 0) {
    DockAPI.runtime.sendMessage({ action: "get_bookmarks_for_mouse" }).then((response) => {
      if (response && response.data) { renderBookmarks(response.data); toggleDock(true); }
    });
  } else { toggleDock(true); }
}

function refreshSettings() {
  DockAPI.storage.sync.get([
    'dockPosition', 'dockSize', 'edgeTrigger', 'verticalPos', 'handlerIcon', 
    'accentColor', 'showTooltips', 'separatorStyle', 'enableShadow', 
    'enableGlow', 'enableAccent', 'showSettings', 'backdropBlur', 'iconShape', 'idleOpacity'
  ]).then((res) => {
    // Load
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
    settings.backdropBlur = (res.backdropBlur !== undefined) ? res.backdropBlur : 10;
    settings.iconShape = res.iconShape || '12px';
    settings.idleOpacity = (res.idleOpacity !== undefined) ? res.idleOpacity : 100;

    const vPos = res.verticalPos || 50;
    
    // Apply
    if(dockContainer) {
        dockContainer.style.setProperty('--dock-icon-size', settings.dockSize + 'px');
        dockContainer.style.setProperty('--dock-offset', vPos + '%');
        dockContainer.style.setProperty('--accent-color', settings.accentColor);
        dockContainer.style.setProperty('--dock-blur', settings.backdropBlur + 'px');
        dockContainer.style.setProperty('--icon-radius', settings.iconShape);
        dockContainer.style.setProperty('--idle-opacity', settings.idleOpacity / 100);
        
        dockContainer.classList.remove('left-side', 'right-side', 'top-side', 'bottom-side');
        if(settings.dockPosition === 'right') dockContainer.classList.add('right-side');
        else if(settings.dockPosition === 'bottom') dockContainer.classList.add('bottom-side');
        else if(settings.dockPosition === 'top') dockContainer.classList.add('top-side');
        else dockContainer.classList.add('left-side');

        if (settings.showTooltips) dockContainer.classList.add('tooltips-enabled'); else dockContainer.classList.remove('tooltips-enabled');
        if (settings.enableShadow) dockContainer.classList.add('shadow-enabled'); else dockContainer.classList.remove('shadow-enabled');
        if (settings.enableGlow) dockContainer.classList.add('glow-enabled'); else dockContainer.classList.remove('glow-enabled');
        if (settings.enableAccent) dockContainer.classList.add('theme-enabled'); else dockContainer.classList.remove('theme-enabled');

        dockContainer.classList.remove('style-glass', 'style-neon', 'style-minimal', 'style-classic');
        dockContainer.classList.add('style-' + settings.separatorStyle);

        const handler = dockContainer.querySelector('.dock-handler');
        if (handler) {
            handler.classList.add('has-icon');
            if (settings.handlerIcon && settings.handlerIcon.trim() !== '') handler.style.backgroundImage = `url('${settings.handlerIcon}')`;
            else handler.style.backgroundImage = `url('${DockAPI.runtime.getURL("icon.png")}')`;
        }
        resetIcons();
    }
  });
}

// Listeners
DockAPI.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "toggle_dock") { refreshSettings(); renderBookmarks(request.data); toggleDock(!isDockVisible); }
  if (request.action === "refresh_dock") { renderBookmarks(request.data); refreshSettings(); }
});

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      refreshSettings();
      if (changes.customIcons || changes.enableAccent) {
         DockAPI.runtime.sendMessage({ action: "get_bookmarks_for_mouse" }).then((response) => { if (response && response.data) renderBookmarks(response.data); });
      }
    }
  });
}

// Auto-Open/Close Logic
document.addEventListener('mousemove', (e) => {
  if (!dockContainer) return;
  
  if (settings.edgeTrigger && !isDockVisible) {
    const edgeThreshold = 15;
    let hitEdge = false;
    if (settings.dockPosition === 'left' && e.clientX < edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'right' && e.clientX > window.innerWidth - edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'top' && e.clientY < edgeThreshold) hitEdge = true;
    if (settings.dockPosition === 'bottom' && e.clientY > window.innerHeight - edgeThreshold) hitEdge = true;
    if (hitEdge) openDock();
  } 
  
  if (isDockVisible) {
    if (document.querySelector('.dock-stack') || document.querySelector('.dock-context-menu')) return;
    let dist = 0; const buffer = 150;
    if (settings.dockPosition === 'left') dist = e.clientX - settings.dockSize;
    if (settings.dockPosition === 'right') dist = (window.innerWidth - settings.dockSize) - e.clientX;
    if (settings.dockPosition === 'top') dist = e.clientY - settings.dockSize;
    if (settings.dockPosition === 'bottom') dist = (window.innerHeight - settings.dockSize) - e.clientY;
    if (dist > buffer) { toggleDock(false); }
  }
});

function toggleDock(show) {
  isDockVisible = show;
  if(!dockContainer) return;
  if (show) dockContainer.classList.add('dock-visible');
  else { dockContainer.classList.remove('dock-visible'); closeAllStacks(); closeContextMenu(); dockContainer.classList.add('dock-idle'); resetIcons(); }
}

function closeAllStacks() { document.querySelectorAll('.dock-stack').forEach(s => s.remove()); }
function closeContextMenu() { const existing = document.querySelector('.dock-context-menu'); if (existing) existing.remove(); }

// Keyboard Nav
let selectedIndex = -1;
document.addEventListener('keydown', (e) => {
  if (!isDockVisible || !dockContainer) return;
  const items = Array.from(dockContainer.querySelectorAll('.dock-item'));
  if (items.length === 0) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); selectedIndex = (selectedIndex + 1) % items.length; highlightItem(items[selectedIndex]); } 
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); selectedIndex = (selectedIndex - 1 + items.length) % items.length; highlightItem(items[selectedIndex]); } 
  else if (e.key === 'Enter') { e.preventDefault(); if (selectedIndex > -1 && items[selectedIndex]) { items[selectedIndex].click(); toggleDock(false); } }
  else if (e.key === 'Escape') { toggleDock(false); }
});

function highlightItem(item) {
  dockContainer.querySelectorAll('.dock-item').forEach(i => { i.style.transform = 'scale(1)'; i.style.zIndex = '1'; i.style.filter = 'none'; });
  item.style.transform = 'scale(1.5)'; item.style.zIndex = '100';
  const img = item.querySelector('img');
  if(img && settings.enableGlow) img.style.filter = `drop-shadow(0 0 10px ${settings.accentColor})`;
}

// Rendering
function renderBookmarks(bookmarks) {
  if(!dockContainer) return;
  const handler = dockContainer.querySelector('.dock-handler');
  dockContainer.innerHTML = ''; 
  if(handler) dockContainer.appendChild(handler);
  if(!bookmarks || bookmarks.length === 0) return;

  bookmarks.forEach((bm) => {
    if (bm.title === "-") { const spacer = document.createElement('div'); spacer.className = 'dock-spacer'; dockContainer.appendChild(spacer); return; }
    const cleanTitle = bm.title.trim();
    if (cleanTitle.startsWith("---") && cleanTitle.endsWith("---") && cleanTitle.length > 6) { const header = document.createElement('div'); header.className = `dock-section-header style-${settings.separatorStyle}`; header.innerText = cleanTitle.replace(/---/g, '').trim(); dockContainer.appendChild(header); return; }
    const item = document.createElement(bm.children ? 'div' : 'a');
    item.className = 'dock-item'; item.title = bm.title;
    if (bm.iconUrl && !bm.iconUrl.startsWith('_default')) item.style.setProperty('--bg-image', `url('${bm.iconUrl}')`);
    let iconEl;
    if (bm.children) {
      item.classList.add('is-folder'); iconEl = document.createElement('img'); iconEl.src = bm.iconUrl; 
      item.onclick = (e) => { e.stopPropagation(); toggleStack(bm, item); };
      item.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); e.stopPropagation(); bm.children.forEach(child => { if(child.url) DockAPI.runtime.sendMessage({ action: "open_new_window", url: child.url }); }); } });
      item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else if (bm.id === 'dock_settings_item') {
       item.classList.add('settings-item'); item.href = "#"; item.onclick = (e) => { e.preventDefault(); DockAPI.runtime.sendMessage({ action: "open_settings" }); toggleDock(false); }; iconEl = document.createElement('img'); iconEl.src = bm.iconUrl; item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else {
       item.href = bm.url; item.target = "_blank"; item.addEventListener('contextmenu', (e) => showContextMenu(e, bm)); iconEl = document.createElement('img'); iconEl.src = bm.iconUrl;
    }
    item.ondragstart = () => false; item.appendChild(iconEl); dockContainer.appendChild(item);
  });
}

function toggleStack(bookmark, anchorElement) {
  const existing = document.querySelector(`.dock-stack[data-parent="${bookmark.id}"]`);
  if (existing) { existing.remove(); return; }
  closeAllStacks(); clearTimeout(hideTimer); 
  const stack = document.createElement('div'); stack.className = 'dock-stack'; stack.dataset.parent = bookmark.id; stack.style.setProperty('--accent-color', settings.accentColor);
  stack.addEventListener('mouseenter', () => clearTimeout(hideTimer)); stack.addEventListener('mouseleave', () => startHideTimer());
  if (bookmark.children && bookmark.children.length > 0) {
    bookmark.children.forEach(child => {
       const link = document.createElement('a'); link.className = 'stack-item'; link.href = child.url || '#'; link.target = "_blank"; link.title = child.title;
       const icon = document.createElement('img'); icon.src = child.iconUrl; const span = document.createElement('span'); span.innerText = child.title; link.appendChild(icon); link.appendChild(span); stack.appendChild(link);
    });
  } else { stack.innerText = "Empty Folder"; stack.style.color = "#555"; stack.style.padding = "10px"; stack.style.fontSize = "12px"; }
  const rect = anchorElement.getBoundingClientRect();
  if (settings.dockPosition === 'left') { stack.style.top = (rect.top - (bookmark.children.length * 2)) + 'px'; stack.style.left = (rect.right + 15) + 'px'; }
  else if (settings.dockPosition === 'right') { stack.style.top = (rect.top - (bookmark.children.length * 2)) + 'px'; stack.style.right = (window.innerWidth - rect.left + 15) + 'px'; }
  else if (settings.dockPosition === 'bottom') { stack.style.bottom = (window.innerHeight - rect.top + 15) + 'px'; stack.style.left = (rect.left - 50) + 'px'; }
  else if (settings.dockPosition === 'top') { stack.style.top = (rect.bottom + 15) + 'px'; stack.style.left = (rect.left - 50) + 'px'; }
  document.body.appendChild(stack);
}

// Start
if (document.body) { initDock(); } 
else { 
    const observer = new MutationObserver((mutations, obs) => { 
        if (document.body) { initDock(); obs.disconnect(); } 
    }); 
    observer.observe(document.documentElement, { childList: true, subtree: true }); 
}
