const list = document.getElementById('list');
const posSelect = document.getElementById('dockPosition');
const sizeSlider = document.getElementById('dockSize');
const sizeValue = document.getElementById('sizeValue');
const edgeCheck = document.getElementById('edgeTrigger');
const tooltipCheck = document.getElementById('showTooltips');
const settingsCheck = document.getElementById('showSettings');
const separatorSelect = document.getElementById('separatorStyle');
const shadowCheck = document.getElementById('enableShadow');
const glowCheck = document.getElementById('enableGlow');
const accentCheck = document.getElementById('enableAccent');
const colorContainer = document.getElementById('colorContainer');
const vPosSlider = document.getElementById('verticalPos');
const vPosValue = document.getElementById('vPosValue');
const handlerIconInput = document.getElementById('handlerIcon');
const currentShortcut = document.getElementById('currentShortcut'); 
const settingsIconInput = document.getElementById('settingsIcon');
const accentColorInput = document.getElementById('accentColor');

// NEW ELEMENTS
const blurSlider = document.getElementById('backdropBlur');
const shapeSelect = document.getElementById('iconShape');
const opacitySlider = document.getElementById('idleOpacity');

const itemTypeSelect = document.getElementById('itemType');
const newTitleInput = document.getElementById('newTitle');
const newUrlInput = document.getElementById('newUrl');
const addBtn = document.getElementById('addBtn');

const DOCK_FOLDER_NAME = "Vertical-bookmark-list";
let dragSrcId = null;

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', async () => {
  const storage = await DockAPI.storage.sync.get([
    'dockPosition', 'dockSize', 'customIcons', 'edgeTrigger', 
    'showTooltips', 'showSettings', 'verticalPos', 'handlerIcon', 
    'settingsIcon', 'accentColor', 'separatorStyle', 'enableShadow', 
    'enableGlow', 'enableAccent', 
    // NEW KEYS
    'backdropBlur', 'iconShape', 'idleOpacity'
  ]);
  
  if(posSelect) posSelect.value = storage.dockPosition || 'left';
  if(sizeSlider) { sizeSlider.value = storage.dockSize || 48; if(sizeValue) sizeValue.textContent = sizeSlider.value + 'px'; }
  if(edgeCheck) edgeCheck.checked = storage.edgeTrigger === true;
  if(tooltipCheck) tooltipCheck.checked = (storage.showTooltips !== false);
  if(settingsCheck) settingsCheck.checked = (storage.showSettings !== false);
  if(separatorSelect) separatorSelect.value = storage.separatorStyle || 'glass';
  if(shadowCheck) shadowCheck.checked = (storage.enableShadow !== false);
  if(glowCheck) glowCheck.checked = (storage.enableGlow !== false);

  // NEW VISUALS
  if(blurSlider) blurSlider.value = (storage.backdropBlur !== undefined) ? storage.backdropBlur : 10;
  if(shapeSelect) shapeSelect.value = storage.iconShape || '12px';
  if(opacitySlider) opacitySlider.value = (storage.idleOpacity !== undefined) ? storage.idleOpacity : 100;

  const isAccentEnabled = (storage.enableAccent !== false);
  if(accentCheck) accentCheck.checked = isAccentEnabled;
  toggleColorInput(isAccentEnabled);

  if(vPosSlider) { vPosSlider.value = storage.verticalPos || 50; if(vPosValue) vPosValue.textContent = vPosSlider.value + '%'; }
  
  if(handlerIconInput) handlerIconInput.value = storage.handlerIcon || ''; 
  if(settingsIconInput) settingsIconInput.value = storage.settingsIcon || '';
  if(accentColorInput) accentColorInput.value = storage.accentColor || '#007aff';
  document.body.style.setProperty('--accent-color', accentColorInput.value);

  updateShortcutDisplay(); refreshList(); 
});

function toggleColorInput(enabled) { if (colorContainer) { colorContainer.style.opacity = enabled ? '1' : '0.5'; colorContainer.style.pointerEvents = enabled ? 'auto' : 'none'; } }

// --- SETTINGS LISTENERS ---
if(posSelect) posSelect.addEventListener('change', () => DockAPI.storage.sync.set({ dockPosition: posSelect.value }));
if(sizeSlider) sizeSlider.addEventListener('input', (e) => { sizeValue.textContent = e.target.value + 'px'; DockAPI.storage.sync.set({ dockSize: e.target.value }); });
if(edgeCheck) edgeCheck.addEventListener('change', () => DockAPI.storage.sync.set({ edgeTrigger: edgeCheck.checked }));
if(tooltipCheck) tooltipCheck.addEventListener('change', () => DockAPI.storage.sync.set({ showTooltips: tooltipCheck.checked }));
if(settingsCheck) settingsCheck.addEventListener('change', () => DockAPI.storage.sync.set({ showSettings: settingsCheck.checked }));
if(separatorSelect) separatorSelect.addEventListener('change', () => DockAPI.storage.sync.set({ separatorStyle: separatorSelect.value }));
if(shadowCheck) shadowCheck.addEventListener('change', () => DockAPI.storage.sync.set({ enableShadow: shadowCheck.checked }));
if(glowCheck) glowCheck.addEventListener('change', () => DockAPI.storage.sync.set({ enableGlow: glowCheck.checked }));
if(accentCheck) accentCheck.addEventListener('change', () => { DockAPI.storage.sync.set({ enableAccent: accentCheck.checked }); toggleColorInput(accentCheck.checked); });
if(vPosSlider) vPosSlider.addEventListener('input', (e) => { vPosValue.textContent = e.target.value + '%'; DockAPI.storage.sync.set({ verticalPos: e.target.value }); });

// NEW LISTENERS
if(blurSlider) blurSlider.addEventListener('input', (e) => DockAPI.storage.sync.set({ backdropBlur: e.target.value }));
if(shapeSelect) shapeSelect.addEventListener('change', (e) => DockAPI.storage.sync.set({ iconShape: e.target.value }));
if(opacitySlider) opacitySlider.addEventListener('input', (e) => DockAPI.storage.sync.set({ idleOpacity: e.target.value }));

if(handlerIconInput) handlerIconInput.addEventListener('input', (e) => { DockAPI.storage.sync.set({ handlerIcon: e.target.value }); });
if(settingsIconInput) settingsIconInput.addEventListener('input', (e) => { DockAPI.storage.sync.set({ settingsIcon: e.target.value }); });
if(accentColorInput) accentColorInput.addEventListener('input', (e) => { DockAPI.storage.sync.set({ accentColor: e.target.value }); document.body.style.setProperty('--accent-color', e.target.value); });

// --- REMAINDER OF FILE IS IDENTICAL TO BEFORE (Drag Drop, Add, Edit, Delete) ---
// (Copy the Add Item, Delete Bookmark, and Render List functions from the previous working version here)
// For brevity, I am assuming you kept the logic from the previous step. 
// If you need the FULL file again with these merged, just ask!

if (itemTypeSelect) {
  itemTypeSelect.addEventListener('change', () => {
    const type = itemTypeSelect.value;
    newTitleInput.value = ''; newUrlInput.value = '';
    newTitleInput.classList.remove('hidden'); newUrlInput.classList.remove('hidden');
    if (type === 'spacer') { newTitleInput.classList.add('hidden'); newUrlInput.classList.add('hidden'); } 
    else if (type === 'label' || type === 'folder') { newUrlInput.classList.add('hidden'); newTitleInput.placeholder = type === 'label' ? "Label Text (e.g. WORK)" : "Folder Name"; } 
    else { newTitleInput.placeholder = "Title"; }
  });
}

async function getDockFolderId() {
  const tree = await DockAPI.bookmarks.getTree();
  let dockFolder = findFolder(tree, DOCK_FOLDER_NAME);
  if (!dockFolder) {
    const parent = tree[0].children.find(c => c.id === '2') || tree[0];
    dockFolder = await DockAPI.bookmarks.create({ parentId: parent.id, title: DOCK_FOLDER_NAME });
  }
  return dockFolder.id;
}

if (addBtn) {
  addBtn.addEventListener('click', async () => {
    const type = itemTypeSelect.value;
    let title = newTitleInput.value.trim(); let url = newUrlInput.value.trim();
    const folderId = await getDockFolderId();
    try {
        if (type === 'spacer') await DockAPI.bookmarks.create({ parentId: folderId, title: '-', url: 'data:text/plain,spacer' });
        else if (type === 'label') {
            if (!title) return alert("Please enter text for the label.");
            const formattedTitle = `--- ${title.toUpperCase()} ---`;
            await DockAPI.bookmarks.create({ parentId: folderId, title: formattedTitle, url: 'data:text/plain,label' });
        }
        else if (type === 'folder') {
            if (!title) return alert("Please enter a folder name.");
            await DockAPI.bookmarks.create({ parentId: folderId, title: title });
        }
        else {
            if (!title || !url) return alert("Please enter both Title and URL.");
            if (!url.match(/^[a-zA-Z]+:\/\//)) url = 'https://' + url;
            await DockAPI.bookmarks.create({ parentId: folderId, title: title, url: url });
        }
        newTitleInput.value = ''; newUrlInput.value = ''; refreshList();
    } catch (error) { alert("Error creating bookmark: " + error.message); }
  });
}

async function deleteBookmark(id) {
  if (confirm("Delete this item?")) {
    try { await DockAPI.bookmarks.remove(id); } catch (e) { await DockAPI.bookmarks.removeTree(id); }
    refreshList();
  }
}

async function editBookmark(id, currentTitle, currentUrl) {
  const newTitle = prompt("Edit Title:", currentTitle); if (newTitle === null) return;
  const updates = { title: newTitle };
  if (currentUrl && !currentTitle.startsWith('---') && currentTitle !== '-') {
    let newUrl = prompt("Edit URL:", currentUrl); if (newUrl === null) return;
    if (newUrl && !newUrl.match(/^[a-zA-Z]+:\/\//)) newUrl = 'https://' + newUrl;
    updates.url = newUrl;
  }
  try { await DockAPI.bookmarks.update(id, updates); refreshList(); } catch (e) { alert("Invalid URL."); }
}

async function refreshList() {
  const bookmarks = await getDockBookmarks();
  const storage = await DockAPI.storage.sync.get(['customIcons']);
  renderList(bookmarks, storage.customIcons || {});
}

function updateShortcutDisplay() {
  DockAPI.commands.getAll().then((commands) => {
    const command = commands.find(c => c.name === 'toggle_dock');
    if (command && command.shortcut) { if(currentShortcut) currentShortcut.textContent = command.shortcut; } 
    else { if(currentShortcut) currentShortcut.textContent = 'Not Set'; }
  });
}

if(document.getElementById('openShortcutsBtn')) document.getElementById('openShortcutsBtn').addEventListener('click', () => { DockAPI.tabs.create({ url: 'about:addons' }); });
window.addEventListener('focus', () => { updateShortcutDisplay(); });

async function getDockBookmarks() {
  const tree = await DockAPI.bookmarks.getTree();
  let dockFolder = findFolder(tree, DOCK_FOLDER_NAME);
  if (!dockFolder) return [];
  return await DockAPI.bookmarks.getChildren(dockFolder.id);
}

function findFolder(nodes, name) {
  for (const node of nodes) {
    if (node.title === name && !node.url) return node;
    if (node.children) { const found = findFolder(node.children, name); if (found) return found; }
  }
  return null;
}

function renderList(bookmarks, customIcons) {
  list.innerHTML = '';
  if (bookmarks.length === 0) { list.innerHTML = `<div style="padding:20px;">Folder <strong>"${DOCK_FOLDER_NAME}"</strong> empty. Add items above!</div>`; }

  bookmarks.forEach(bm => {
    const isFolder = !bm.url;
    let defaultIcon = isFolder ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ0Y2NmZiI+PHBhdGggZD0iTTEwIDRINmMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmMxLjEgMCAyLS45IDItMlY4YzAtMS4xLS45LTItMi0yaC04bC0yLTJ6Ii8+PC9zdmc+" : `https://www.google.com/s2/favicons?domain=${new URL(bm.url || 'http://google.com').hostname}&sz=64`;
    const currentIcon = customIcons[bm.id] || defaultIcon;
    const div = document.createElement('div');
    div.className = 'bm-item'; div.draggable = true; div.dataset.id = bm.id; div.dataset.index = bm.index;

    div.addEventListener('dragstart', (e) => { dragSrcId = bm.id; div.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', bm.id); });
    div.addEventListener('dragend', () => { div.classList.remove('dragging'); document.querySelectorAll('.bm-item').forEach(item => item.classList.remove('drag-over')); });
    div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over'); return false; });
    div.addEventListener('dragleave', () => { div.classList.remove('drag-over'); });
    div.addEventListener('drop', (e) => { e.stopPropagation(); e.preventDefault(); const targetId = bm.id; const targetIndex = bm.index; if (dragSrcId !== targetId) { DockAPI.bookmarks.move(dragSrcId, { index: targetIndex }).then(() => refreshList()); } return false; });

    let displayTitle = bm.title; let isHeader = false;
    if(displayTitle === "-") { displayTitle = "--- Spacer ---"; isHeader = true; }
    if(displayTitle.startsWith("---") && displayTitle.endsWith("---") && displayTitle.length > 6) { displayTitle = `[HEADER] ${displayTitle.replace(/---/g, '').trim()}`; isHeader = true; }

    div.innerHTML = `
      <div class="bm-row-main">
        <div class="bm-info">
          <span style="color:#ccc; font-size:18px;">&#9776;</span>
          ${!isHeader ? `<img src="${currentIcon}" id="img-${bm.id}">` : ''}
          <div><strong>${displayTitle}</strong>${isFolder ? '<div style="font-size:10px; color:#888;">(Folder)</div>' : ''}</div>
        </div>
        <div><button class="btn-orange edit-btn">Edit</button><button class="btn-red del-btn">Delete</button></div>
      </div>
      ${!isHeader ? `<div class="bm-row-icon"><span style="font-size:11px; color:#666;">Custom Icon:</span><input type="text" placeholder="Image URL" id="input-${bm.id}" style="flex:1;"><button class="btn-blue save-icon-btn">Save</button>${customIcons[bm.id] ? `<button class="btn-grey reset-icon-btn">Reset</button>` : ''}</div>` : ''}
    `;
    div.querySelector('.del-btn').addEventListener('click', () => deleteBookmark(bm.id));
    div.querySelector('.edit-btn').addEventListener('click', () => editBookmark(bm.id, bm.title, isFolder ? null : bm.url));
    const saveBtn = div.querySelector('.save-icon-btn');
    if(saveBtn) saveBtn.addEventListener('click', () => { const url = div.querySelector(`#input-${bm.id}`).value; if(url) saveIcon(bm.id, url); });
    const resetBtn = div.querySelector('.reset-icon-btn');
    if(resetBtn) resetBtn.addEventListener('click', () => resetIcon(bm.id));
    list.appendChild(div);
  });
}

function saveIcon(id, url) { DockAPI.storage.sync.get(['customIcons']).then((res) => { const icons = res.customIcons || {}; icons[id] = url; DockAPI.storage.sync.set({ customIcons: icons }).then(() => refreshList()); }); }
window.resetIcon = function(id) { DockAPI.storage.sync.get(['customIcons']).then((res) => { const icons = res.customIcons || {}; delete icons[id]; DockAPI.storage.sync.set({ customIcons: icons }).then(() => refreshList()); }); };
