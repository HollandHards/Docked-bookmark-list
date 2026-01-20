let dockContainer = null;
let isDockVisible = false;
let hideTimer = null;
let settings = {
  dockPosition: 'left', dockSize: 48, edgeTrigger: false, handlerIcon: '',
  accentColor: '#007aff', showTooltips: true, separatorStyle: 'glass',
  enableShadow: true, enableGlow: true, enableAccent: true, showSettings: true,
  backdropBlur: 10, iconShape: '12px', idleOpacity: 100,
  userVerticalPos: 50 
};

// --- LAZY LOAD OBSERVER ---
const iconObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.onload = () => { img.style.opacity = '1'; };
        observer.unobserve(img);
      }
    }
  });
}, { root: null, rootMargin: "50px" });

function initDock() {
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
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dock-stack') && !e.target.closest('.dock-item') && !e.target.closest('.dock-handler')) {
      closeAllStacks();
      if(isDockVisible) toggleDock(false);
    }
    closeContextMenu();
  });
  
  dockContainer.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer); 
    dockContainer.classList.remove('dock-idle');
  });

  dockContainer.addEventListener('mousemove', (e) => {
    if (!isDockVisible) return;
    clearTimeout(hideTimer);
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

  dockContainer.addEventListener('mouseleave', () => {
    dockContainer.classList.add('dock-idle'); 
    resetIcons();
    startHideTimer();
  });
  
  dockContainer.addEventListener('transitionend', (e) => {
      if (e.target === dockContainer) clampDockPosition();
  });

  refreshSettings();
  window.addEventListener('resize', clampDockPosition);
}

function startHideTimer() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (!document.querySelector('.dock-stack') && !document.querySelector('.dock-context-menu')) {
            toggleDock(false);
        }
    }, 600);
}

function resetIcons() {
  if (!dockContainer) return;
  const items = dockContainer.querySelectorAll('.dock-item');
  items.forEach(item => { 
    item.style.width = `${settings.dockSize}px`; 
    item.style.height = `${settings.dockSize}px`; 
  });
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
    'enableGlow', 'enableAccent', 'showSettings',
    'backdropBlur', 'iconShape', 'idleOpacity'
  ]).then((res) => {
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
    
    settings.userVerticalPos = res.verticalPos || 50; 

    // Apply styles
    dockContainer.style.setProperty('--dock-icon-size', settings.dockSize + 'px');
    dockContainer.style.setProperty('--accent-color', settings.accentColor);
    dockContainer.style.setProperty('--dock-blur', settings.backdropBlur + 'px');
    dockContainer.style.setProperty('--icon-radius', settings.iconShape);
    dockContainer.style.setProperty('--idle-opacity', settings.idleOpacity / 100);
    
    dockContainer.classList.remove('left-side', 'right-side', 'top-side', 'bottom-side');
    if(settings.dockPosition === 'right') dockContainer.classList.add('right-side');
    else if(settings.dockPosition === 'bottom') dockContainer.classList.add('bottom-side');
    else if(settings.dockPosition === 'top') dockContainer.classList.add('top-side');
    else dockContainer.classList.add('left-side');

    dockContainer.classList.toggle('tooltips-enabled', settings.showTooltips);
    dockContainer.classList.toggle('shadow-enabled', settings.enableShadow);
    dockContainer.classList.toggle('glow-enabled', settings.enableGlow);
    dockContainer.classList.toggle('theme-enabled', settings.enableAccent);

    dockContainer.classList.remove('style-glass', 'style-neon', 'style-minimal', 'style-classic');
    dockContainer.classList.add('style-' + settings.separatorStyle);

    const handler = dockContainer.querySelector('.dock-handler');
    if (handler) {
      handler.classList.add('has-icon');
      if (settings.handlerIcon && settings.handlerIcon.trim() !== '') handler.style.backgroundImage = `url('${settings.handlerIcon}')`;
      else handler.style.backgroundImage = `url('${DockAPI.runtime.getURL("icon.png")}')`;
    }
    
    resetIcons();
    clampDockPosition();
    setTimeout(clampDockPosition, 350); 
  });
}

function clampDockPosition() {
    if (!dockContainer) return;
    const handler = dockContainer.querySelector('.dock-handler');

    const vPos = settings.userVerticalPos;
    const isVertical = (settings.dockPosition === 'left' || settings.dockPosition === 'right');
    const winHeight = window.innerHeight;
    const winWidth = window.innerWidth;
    const padding = 10;

    if (isVertical) handler.style.transform = 'translateY(-50%)';
    else handler.style.transform = 'translateX(-50%)';

    dockContainer.style.setProperty('--dock-offset', vPos + '%');
    dockContainer.style.removeProperty('top');
    dockContainer.style.removeProperty('left');

    const rect = dockContainer.getBoundingClientRect();

    if (isVertical) {
        let shiftY = 0;
        if (rect.bottom > winHeight - padding) {
            const overflow = rect.bottom - (winHeight - padding);
            const computedStyle = window.getComputedStyle(dockContainer);
            const currentTop = parseFloat(computedStyle.top);
            dockContainer.style.top = (currentTop - overflow) + 'px';
            shiftY = -overflow; 
        } 
        else if (rect.top < padding) {
             const underflow = padding - rect.top;
             const computedStyle = window.getComputedStyle(dockContainer);
             const currentTop = parseFloat(computedStyle.top);
             dockContainer.style.top = (currentTop + underflow) + 'px';
             shiftY = underflow; 
        }

        if (shiftY !== 0) {
            handler.style.transform = `translateY(calc(-50% + ${-shiftY}px))`;
        }
    } 
    else {
        let shiftX = 0;
        if (rect.right > winWidth - padding) {
            const overflow = rect.right - (winWidth - padding);
            const computedStyle = window.getComputedStyle(dockContainer);
            const currentLeft = parseFloat(computedStyle.left);
            dockContainer.style.left = (currentLeft - overflow) + 'px';
            shiftX = -overflow;
        } 
        else if (rect.left < padding) {
            const underflow = padding - rect.left;
            const computedStyle = window.getComputedStyle(dockContainer);
            const currentLeft = parseFloat(computedStyle.left);
            dockContainer.style.left = (currentLeft + underflow) + 'px';
            shiftX = underflow;
        }

        if (shiftX !== 0) {
            handler.style.transform = `translateX(calc(-50% + ${-shiftX}px))`;
        }
    }
}

DockAPI.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "toggle_dock") { refreshSettings(); renderBookmarks(request.data); toggleDock(!isDockVisible); }
  if (request.action === "refresh_dock") { renderBookmarks(request.data); refreshSettings(); }
});

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
  if (show) { 
      dockContainer.classList.add('dock-visible'); 
      requestAnimationFrame(() => {
          clampDockPosition();
          setTimeout(clampDockPosition, 300);
      });
  } 
  else { 
      dockContainer.classList.remove('dock-visible'); 
      closeAllStacks(); 
      closeContextMenu(); 
      dockContainer.classList.add('dock-idle');
      resetIcons();
  }
}

function closeAllStacks() { const stacks = document.querySelectorAll('.dock-stack'); stacks.forEach(s => s.remove()); }
function closeContextMenu() { const existing = document.querySelector('.dock-context-menu'); if (existing) existing.remove(); }

function showContextMenu(e, bm) {
  e.preventDefault(); closeContextMenu();
  clearTimeout(hideTimer); 
  
  const menu = document.createElement('div');
  menu.className = 'dock-context-menu';
  menu.style.setProperty('--accent-color', settings.accentColor);
  menu.addEventListener('mouseleave', () => { startHideTimer(); });
  menu.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  
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
      addItem("Edit Name", () => { const newTitle = prompt("Enter new name:", bm.title); if (newTitle && newTitle !== bm.title) DockAPI.runtime.sendMessage({ action: "rename_bookmark", id: bm.id, title: newTitle }); });
      addItem("Change Icon URL", () => { const newIcon = prompt("Enter new image URL (leave empty to reset):", ""); if (newIcon !== null) DockAPI.runtime.sendMessage({ action: "update_icon", id: bm.id, url: newIcon }); });
      const sep3 = document.createElement('div'); sep3.className = 'ctx-sep'; menu.appendChild(sep3);
      addItem("Remove from Dock", () => { if (confirm(`Delete "${bm.title}" from your bookmarks?`)) DockAPI.runtime.sendMessage({ action: "delete_bookmark", id: bm.id }); }, true);
  }
  
  const sepGlobal = document.createElement('div'); sepGlobal.className = 'ctx-sep'; menu.appendChild(sepGlobal);
  addItem(settings.showSettings ? "Hide Settings Icon" : "Show Settings Icon", () => {
      const newState = !settings.showSettings;
      DockAPI.storage.sync.set({ showSettings: newState }).then(() => DockAPI.runtime.sendMessage({ action: "request_refresh" }));
  });

  menu.style.visibility = 'hidden';
  document.body.appendChild(menu);

  const menuHeight = menu.offsetHeight;
  const menuWidth = menu.offsetWidth;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  let posX = e.clientX + 5;
  let posY = e.clientY + 5;

  if (posY + menuHeight > winHeight) posY = e.clientY - menuHeight - 5;
  if (posX + menuWidth > winWidth) posX = e.clientX - menuWidth - 5;
  if (posY < 5) posY = 5;

  menu.style.left = `${posX}px`;
  menu.style.top = `${posY}px`;
  menu.style.visibility = 'visible';
}

function createLazyImage(src) {
    const img = document.createElement('img');
    img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==";
    img.dataset.src = src;
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';
    iconObserver.observe(img);
    return img;
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
      item.classList.add('is-folder'); 
      iconEl = createLazyImage(bm.iconUrl);
      item.onclick = (e) => { e.stopPropagation(); toggleStack(bm, item); };
      item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else if (bm.id === 'dock_settings_item') {
       item.classList.add('settings-item'); item.href = "#";
       item.onclick = (e) => { e.preventDefault(); DockAPI.runtime.sendMessage({ action: "open_settings" }); toggleDock(false); };
       iconEl = createLazyImage(bm.iconUrl);
       item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
    } else {
       item.href = bm.url; item.target = "_blank";
       item.addEventListener('contextmenu', (e) => showContextMenu(e, bm));
       iconEl = createLazyImage(bm.iconUrl);
    }
    item.ondragstart = () => false; item.appendChild(iconEl); dockContainer.appendChild(item);
  });
  
  requestAnimationFrame(() => {
      clampDockPosition();
      setTimeout(clampDockPosition, 300);
  });
}

function toggleStack(bookmark, anchorElement) {
  const existing = document.querySelector(`.dock-stack[data-parent="${bookmark.id}"]`);
  if (existing) { existing.remove(); return; }
  
  closeAllStacks(); 
  clearTimeout(hideTimer); 

  const stack = document.createElement('div'); stack.className = 'dock-stack';
  stack.dataset.parent = bookmark.id; stack.style.setProperty('--accent-color', settings.accentColor);
  stack.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  stack.addEventListener('mouseleave', () => startHideTimer());
  
  stack.style.maxHeight = (window.innerHeight - 40) + 'px';
  stack.style.overflowY = 'auto';

  if (bookmark.children && bookmark.children.length > 0) {
    bookmark.children.forEach(child => {
       const link = document.createElement('a'); link.className = 'stack-item';
       link.href = child.url || '#'; link.target = "_blank"; link.title = child.title;
       const icon = createLazyImage(child.iconUrl);
       const span = document.createElement('span'); span.innerText = child.title;
       link.appendChild(icon); link.appendChild(span); stack.appendChild(link);
    });
  } else {
    stack.innerText = "Empty Folder"; stack.style.color = "#555"; stack.style.padding = "10px"; stack.style.fontSize = "12px";
  }

  stack.style.visibility = 'hidden';
  stack.style.animation = 'none';
  stack.style.transform = 'none';
  
  document.body.appendChild(stack);
  
  const stackRect = stack.getBoundingClientRect(); 
  const anchorRect = anchorElement.getBoundingClientRect();
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  const padding = 10; 

  let finalTop = 0;
  let finalLeft = 0;

  if (settings.dockPosition === 'left' || settings.dockPosition === 'right') {
      let idealTop = anchorRect.top + (anchorRect.height / 2) - (stackRect.height / 2);
      if (idealTop < padding) idealTop = padding;
      if (idealTop + stackRect.height > winHeight - padding) {
          idealTop = winHeight - stackRect.height - padding;
      }
      finalTop = idealTop;
      if (settings.dockPosition === 'left') finalLeft = anchorRect.right + 15;
      else finalLeft = anchorRect.left - stackRect.width - 15;
  } 
  else {
      let idealLeft = anchorRect.left + (anchorRect.width / 2) - (stackRect.width / 2);
      if (idealLeft < padding) idealLeft = padding;
      if (idealLeft + stackRect.width > winWidth - padding) {
          idealLeft = winWidth - stackRect.width - padding;
      }
      finalLeft = idealLeft;
      if (settings.dockPosition === 'bottom') finalTop = anchorRect.top - stackRect.height - 15;
      else finalTop = anchorRect.bottom + 15;
  }

  stack.style.top = finalTop + 'px';
  stack.style.left = finalLeft + 'px';
  stack.style.right = 'auto'; 
  stack.style.bottom = 'auto';
  
  stack.offsetHeight; 
  stack.style.animation = '';
  stack.style.transform = '';
  stack.style.visibility = 'visible';
}

if (DockAPI.storage.onChanged) {
    DockAPI.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        const visualKeys = [
          'dockPosition', 'dockSize', 'edgeTrigger', 'verticalPos', 
          'handlerIcon', 'accentColor', 'showTooltips', 'separatorStyle', 
          'enableShadow', 'enableGlow', 'enableAccent', 
          'backdropBlur', 'iconShape', 'idleOpacity'
        ];
  
        const needsStyleUpdate = visualKeys.some(key => changes[key]);
  
        if (needsStyleUpdate) {
          refreshSettings();
          if (changes.dockPosition) {
             closeAllStacks();
             closeContextMenu();
          }
        }
      }
    });
}

if (document.body) { initDock(); } 
else { const observer = new MutationObserver((mutations, obs) => { if (document.body) { initDock(); obs.disconnect(); } }); observer.observe(document.documentElement, { childList: true, subtree: true }); }
