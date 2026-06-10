/* ══════════════════════════════════════════════
   MINICOMMAND — APP
   Sections: DB · State · RPG · Shelf · Hand · Search
            Modals · Export/Import · Utils · Init
   ══════════════════════════════════════════════ */

/* ════════════════════════════════
   DB
   ════════════════════════════════ */
const DB_NAME = 'cmdVaultDB';
const DB_VER  = 1;
const S_DECKS = 'decks';
const S_CMDS  = 'commands';
const S_STATE = 'state';

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(S_DECKS))
        d.createObjectStore(S_DECKS, { keyPath: 'id' });
      if (!d.objectStoreNames.contains(S_CMDS))
        d.createObjectStore(S_CMDS, { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains(S_STATE))
        d.createObjectStore(S_STATE, { keyPath: 'key' });
    };

    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror   = reject;
  });
}

function idbGetAll(store) {
  return new Promise(resolve => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

function idbGet(store, key) {
  return new Promise(resolve => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
  });
}

function idbPut(store, val) {
  return new Promise(resolve => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(val);
    tx.oncomplete = resolve;
  });
}

function idbAdd(store, val) {
  return new Promise(resolve => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(val);
    tx.oncomplete = () => resolve(req.result);
  });
}

function idbDelete(store, key) {
  return new Promise(resolve => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = resolve;
  });
}

/* ════════════════════════════════
   STATE
   ════════════════════════════════ */
let decks        = [];
let cmds         = [];
let activeId     = null;
let editingCmdId = null;
let currentView  = 'hand'; // 'hand' | 'grid'

/* ════════════════════════════════
   VIEW TOGGLE
   ════════════════════════════════ */
function setView(v) {
  currentView = v;
  document.getElementById('btn-hand').classList.toggle('active', v === 'hand');
  document.getElementById('btn-grid').classList.toggle('active', v === 'grid');
  if (activeId) renderHand();
}

/* ════════════════════════════════
   LOAD
   ════════════════════════════════ */
async function loadAll() {
  decks = await idbGetAll(S_DECKS);
  cmds  = await idbGetAll(S_CMDS);

  // Seed starter deck if empty
  if (!decks.length) {
    const starter = { id: 'starter', name: '⚙ General', color: '#7eb8f7' };
    await idbPut(S_DECKS, starter);
    decks = [starter];
  }

  renderShelf();
  renderPortfolio();
}

/* ════════════════════════════════
   SHELF
   ════════════════════════════════ */
function renderShelf() {
  const el = document.getElementById('shelf');
  el.innerHTML = '';

  for (const deck of decks) {
    const count = cmds.filter(c => c.deckId === deck.id).length;
    const item  = document.createElement('div');
    item.className = 'deck-item' + (activeId === deck.id ? ' active' : '');
    item.style.setProperty('--deck-color', deck.color || '#7eb8f7');
    item.innerHTML = `
      <div class="deck-spine">
        <span class="deck-label">${esc(deck.name)}</span>
        <span class="deck-count">${count}</span>
      </div>
      <div class="deck-shadow"></div>
      <div class="deck-shadow2"></div>
    `;
    item.onclick = () => selectDeck(deck.id);
    el.appendChild(item);
  }
}

function selectDeck(id) {
  activeId = id;

  const deck  = decks.find(d => d.id === id);
  const count = cmds.filter(c => c.deckId === id).length;

  document.getElementById('stage-title').textContent = deck?.name || '';
  document.getElementById('stage-sub').textContent   = `${count} spell${count !== 1 ? 's' : ''}`;

  const addBtn = document.getElementById('add-cmd-btn');
  addBtn.removeAttribute('disabled');

  renderShelf();
  renderHand();
}

function updateStageSub() {
  if (!activeId) return;
  const count = cmds.filter(c => c.deckId === activeId).length;
  document.getElementById('stage-sub').textContent = `${count} spell${count !== 1 ? 's' : ''}`;
}

/* ════════════════════════════════
   HAND (fan view)
   ════════════════════════════════ */
const RARITY_COLORS = {
  Standard:      '#7a91b8',
  Elevated:      '#6ee7b7',
  Dangerous:     '#fb923c',
  Destructive:   '#f87171',
  Restricted:    '#c084fc',
  Administrator: '#e8c76a',
};

/* type order for Sorting  */
const TYPE_ORDER = {
  Standard: 0,
  Elevated: 1,
  Dangerous: 2,
  Restricted: 3,
  Administrator: 4,
  Destructive: 5
};


function getSortedCards() {
  const query = (document.getElementById('command-search')?.value || '').toLowerCase().trim();
  const sort  = document.getElementById('card-sort')?.value || 'newest';

  let cards = cmds.filter(c => c.deckId === activeId);

  if (query) {
    cards = cards.filter(c =>
      [c.title, c.command, c.description, (c.tags || []).join(' ')]
        .join(' ').toLowerCase().includes(query)
    );
  }

  if      (sort === 'title')    cards.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  else if (sort === 'oldest')   cards.sort((a, b) => (a.created || 0) - (b.created || 0));
  else if (sort === 'mostused') cards.sort((a, b) => (b.uses || 0)    - (a.uses || 0));
  else if (sort === 'manual')   cards.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  else if (sort === 'elevation') {cards.sort((a, b) => {
  const aRank = TYPE_ORDER[a.type] ?? 0;
  const bRank = TYPE_ORDER[b.type] ?? 0;
  // highest danger first
  return aRank - bRank;
  });
}
  else                          cards.sort((a, b) => (b.created || 0) - (a.created || 0)); // newest

  return cards;
}

function renderHand() {
  const wrap = document.getElementById('hand-wrap');

  if (!activeId) {
    wrap.classList.remove('grid-mode');
    wrap.innerHTML = emptyState('⚙', 'No collection selected', 'Choose a collection from the shelf');
    return;
  }

  const cards = getSortedCards();

  if (!cards.length) {
    wrap.classList.remove('grid-mode');
    wrap.innerHTML = emptyState('✦', 'Empty collection', 'Add your first command with ✦ Add Command');
    return;
  }

  if (currentView === 'grid') {
    renderGrid(wrap, cards);
    return;
  }

  wrap.classList.remove('grid-mode');
  wrap.innerHTML = '<div class="hand" id="hand"></div>';
  const hand = document.getElementById('hand');
  const n    = cards.length;

  const spread = Math.min(30, n * 8);
  const xStep  = n <= 4 ? 260 : n <= 8 ? 220 : n <= 12 ? 180 : 140;

  cards.forEach((cmd, i) => {
    const frac  = n === 1 ? 0 : i / (n - 1) - 0.5;
    const angle = frac * spread;
    const tx    = frac * xStep * (n - 1) * 0.5;
    const ty    = Math.abs(frac) * 18;
    const col   = RARITY_COLORS[cmd.type] || RARITY_COLORS.Standard;
    const deck  = decks.find(d => d.id === activeId) || {};

    const el = buildCardElement(cmd, col, deck.cardBg || '');
    el.style.cssText = `transform:translateX(${tx}px) translateY(${ty}px) rotate(${angle}deg);z-index:${i};--rarity-color:${col};`;

    el.addEventListener('mouseenter', () => {
      el.style.transform = `translateX(${tx}px) translateY(${ty - 44}px) rotate(0deg) scale(1.08)`;
      el.style.zIndex    = 999;
      el.style.boxShadow = `0 24px 60px rgba(0,0,0,0.7), 0 0 30px ${col}33`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${angle}deg)`;
      el.style.zIndex    = i;
      el.style.boxShadow = '';
    });

    el.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cmd.command);
      cmd.uses = (cmd.uses || 0) + 1;
      await idbPut(S_CMDS, cmd);
      renderHand();
      updateStageSub();
      /*toast('⎘', 'Copied to clipboard!');*/
      toast('📋', `${cmd.name ?? ''}: ${cmd.command}`);
    });

    attachDragEvents(el, cmd);
    hand.appendChild(el);
  });
}

function renderGrid(wrap, cards) {
  wrap.classList.add('grid-mode');
  wrap.innerHTML = '<div class="cmd-grid" id="cmd-grid"></div>';
  const grid = document.getElementById('cmd-grid');

  for (const cmd of cards) {
    const col  = RARITY_COLORS[cmd.type] || RARITY_COLORS.Standard;
    const deck = decks.find(d => d.id === activeId) || {};
    const el   = buildCardElement(cmd, col, deck.cardBg || '');
    el.style.cssText = `position:relative;--rarity-color:${col};`;

    el.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cmd.command);
      cmd.uses = (cmd.uses || 0) + 1;
      await idbPut(S_CMDS, cmd);
      renderHand();
      updateStageSub();
      /*toast('⎘', 'Copied to clipboard!');*/
      toast('📋', `${cmd.name ?? ''}: ${cmd.command}`);
    });

    attachDragEvents(el, cmd);
    grid.appendChild(el);
  }
}

function buildCardElement(cmd, col, cardBg, deckName = null) {
  const el = document.createElement('div');
  el.className = 'cmd-card';
  el.draggable = true;

  if (cardBg) el.style.background = cardBg;

  const deckBadge = deckName
    ? `<div class="card-deck-ref">${esc(deckName)}</div>`
    : '';

  el.innerHTML = `
    <span class="card-type-badge">${esc(cmd.type || 'Standard')}</span>
    ${deckBadge}
    <div class="card-title">${esc(cmd.title)}</div>
    <div class="card-command">${esc(cmd.command)}</div>
    <div class="card-desc">${esc(cmd.description || '')}</div>
    <div class="card-tags">${(cmd.tags || []).map(esc).join(' • ')}</div>
    <div class="card-footer">
      <span class="card-uses">⎘ ${cmd.uses || 0} uses</span>
      <div class="card-footer-actions">
        <button class="btn btn-primary btn-sm"
          onclick="event.stopPropagation(); openEditCmd(${cmd.id})">Edit</button>
        <button class="btn btn-danger btn-sm"
          onclick="event.stopPropagation(); deleteCard(${cmd.id})">🗑</button>
      </div>
    </div>
  `;

  return el;
}

function attachDragEvents(el, cmd) {
  el.addEventListener('dragstart', () => {
    window.draggedCardId = cmd.id;
    el.classList.add('dragging');
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
  });

  el.addEventListener('dragover', e => {
    e.preventDefault();
    el.classList.add('drop-target');
  });

  el.addEventListener('dragleave', () => el.classList.remove('drop-target'));

  el.addEventListener('drop', async e => {
    e.preventDefault();
    el.classList.remove('drop-target');

    const draggedId = window.draggedCardId;
    if (!draggedId || draggedId === cmd.id) return;

    const deckCards = cmds
      .filter(c => c.deckId === activeId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const fromIdx = deckCards.findIndex(c => c.id === draggedId);
    const toIdx   = deckCards.findIndex(c => c.id === cmd.id);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = deckCards.splice(fromIdx, 1);
    deckCards.splice(toIdx, 0, moved);

    for (let i = 0; i < deckCards.length; i++) {
      deckCards[i].sortOrder = i + 1;
      await idbPut(S_CMDS, deckCards[i]);
      const idx = cmds.findIndex(c => c.id === deckCards[i].id);
      if (idx >= 0) cmds[idx] = deckCards[i];
    }

    document.getElementById('card-sort').value = 'manual';
    renderHand();
    toast('↕', 'Card moved');
  });
}

/* ════════════════════════════════
   PORTFOLIO
   ════════════════════════════════ */
function renderPortfolio() {
  const wrap = document.getElementById('hand-wrap');

  activeId = null;
  document.getElementById('add-cmd-btn').setAttribute('disabled', '');
  document.getElementById('stage-title').textContent = 'Collection Portfolio';
  document.getElementById('stage-sub').textContent   = `${decks.length} collections`;

  const grid = document.createElement('div');
  grid.className = 'portfolio-grid';

  for (const deck of decks) {
    const count = cmds.filter(c => c.deckId === deck.id).length;
    const card  = document.createElement('div');
    card.className = 'portfolio-card';
    card.style.setProperty('--deck-color', deck.color || 'var(--accent)');
    card.innerHTML = `
      <button class="portfolio-card-delete"
        onclick="event.stopPropagation(); deleteDeck('${deck.id}')">✕</button>
      <div class="portfolio-card-name">${esc(deck.name)}</div>
      <div class="portfolio-card-count">${count} cards</div>
      <div class="portfolio-card-preview"></div>
    `;
    card.style.setProperty('--deck-color-alpha', hexToRgba(deck.color || '#7eb8f7', 0.13));
    card.onclick = () => selectDeck(deck.id);
    grid.appendChild(card);
  }

  wrap.innerHTML = '';
  wrap.classList.remove('grid-mode');
  wrap.appendChild(grid);
  renderShelf();
}

/* ════════════════════════════════
   SEARCH  (single unified handler)
   ════════════════════════════════ */
function handleSearch(query) {
  query = query.trim().toLowerCase();

  // If a deck is active, filter within it
  if (activeId) {
    renderHand();
    return;
  }

  // Global search across all decks
  if (!query) {
    renderPortfolio();
    return;
  }

  const results = cmds.filter(cmd =>
    [cmd.title, cmd.command, cmd.description, (cmd.tags || []).join(' ')]
      .join(' ').toLowerCase().includes(query)
  );

  renderGlobalSearchResults(results);
}

function renderGlobalSearchResults(cards) {
  const wrap = document.getElementById('hand-wrap');

  document.getElementById('stage-title').textContent = 'Search Results';
  document.getElementById('stage-sub').textContent   = `${cards.length} result${cards.length !== 1 ? 's' : ''}`;

  if (!cards.length) {
    wrap.innerHTML = emptyState('🔍', 'No results', 'Try a different search term');
    return;
  }

  wrap.innerHTML = '<div class="search-hand" id="search-hand"></div>';
  const hand = document.getElementById('search-hand');

  for (const cmd of cards) {
    const deck = decks.find(d => d.id === cmd.deckId) || {};
    const col  = RARITY_COLORS[cmd.type] || RARITY_COLORS.Standard;
    const el   = buildCardElement(cmd, col, deck.cardBg || '', deck.name);
    el.style.setProperty('--rarity-color', col);

    el.addEventListener('click', async () => {
      await navigator.clipboard.writeText(cmd.command);
      cmd.uses = (cmd.uses || 0) + 1;
      await idbPut(S_CMDS, cmd);
      toast('⎘', 'Copied to clipboard!');
    });

    hand.appendChild(el);
  }
}

/* ════════════════════════════════
   MODALS — Commands
   ════════════════════════════════ */
function openCmdModal() {
  if (!activeId) return;
  document.getElementById('c-title').value       = '';
  document.getElementById('c-cmd').value         = '';
  document.getElementById('c-description').value = '';
  document.getElementById('c-tags').value        = '';
  pickType(document.querySelector('.type-opt[data-t="Standard"]'));
  document.getElementById('cmd-modal').classList.add('open');
  setTimeout(() => document.getElementById('c-title').focus(), 80);
}

function closeCmdModal() {
  document.getElementById('cmd-modal').classList.remove('open');
}

async function saveCmd() {
  const title   = document.getElementById('c-title').value.trim();
  const command = document.getElementById('c-cmd').value.trim();

  if (!title || !command) { toast('⚠', 'Title and command required'); return; }

  const type        = document.querySelector('.type-opt.sel')?.dataset.t || 'Standard';
  const description = document.getElementById('c-description').value.trim();
  const tags        = document.getElementById('c-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const now         = Date.now();
  const record      = { deckId: activeId, title, command, type, description, tags, uses: 0, created: now, sortOrder: now };

  const id = await idbAdd(S_CMDS, record);
  cmds.push({ ...record, id });

  closeCmdModal();
  renderShelf();
  renderHand();
  updateStageSub();
}

function openEditCmd(id) {
  const cmd = cmds.find(c => c.id === id);
  if (!cmd) return;

  editingCmdId = id;
  document.getElementById('e-title').value       = cmd.title       || '';
  document.getElementById('e-cmd').value         = cmd.command     || '';
  document.getElementById('e-description').value = cmd.description || '';
  document.getElementById('e-tags').value        = (cmd.tags || []).join(', ');
  pickType(document.querySelector(`.type-opt[data-t="${cmd.type || 'Standard'}"]`));
  document.getElementById('edit-cmd-modal').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-cmd-modal').classList.remove('open');
}

async function saveEditCmd() {
  const cmd = cmds.find(c => c.id === editingCmdId);
  if (!cmd) return;

  cmd.title       = document.getElementById('e-title').value.trim();
  cmd.command     = document.getElementById('e-cmd').value.trim();
  cmd.description = document.getElementById('e-description').value.trim();
  cmd.tags        = document.getElementById('e-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  cmd.type = document.querySelector('#edit-cmd-modal .type-opt.sel')?.dataset.t || 'Standard';

  await idbPut(S_CMDS, cmd);
  closeEditModal();
  renderHand();
  toast('✎', 'Command updated');
}

async function deleteCard(id) {
  const card = cmds.find(c => c.id === id);
  if (!card) return;
  if (!confirm(`Delete "${card.title}"?`)) return;

  await idbDelete(S_CMDS, id);
  cmds = cmds.filter(c => c.id !== id);

  renderHand();
  renderShelf();
  updateStageSub();
  toast('🗑', 'Card deleted');
}

/* ════════════════════════════════
   MODALS — Collections
   ════════════════════════════════ */
function openDeckModal() {
  document.getElementById('d-name').value = '';
  pickColor(document.querySelector('.color-swatch[data-c="#7eb8f7"]'));
  document.getElementById('deck-modal').classList.add('open');
  setTimeout(() => document.getElementById('d-name').focus(), 80);
}

function closeDeckModal() {
  document.getElementById('deck-modal').classList.remove('open');
}

async function saveDeck() {
  const name = document.getElementById('d-name').value.trim();
  if (!name) { toast('⚠', 'Name required'); return; }

  const color = document.querySelector('.color-swatch.sel')?.dataset.c || '#7eb8f7';
  const id    = 'd' + Date.now();

  await idbPut(S_DECKS, { id, name, color });
  decks.push({ id, name, color });

  closeDeckModal();
  renderShelf();
}

async function deleteDeck(id) {
  const deck = decks.find(d => d.id === id);
  if (!deck) return;
  if (!confirm(`Delete collection "${deck.name}" and all its cards?`)) return;

  for (const c of cmds.filter(c => c.deckId === id))
    await idbDelete(S_CMDS, c.id);

  await idbDelete(S_DECKS, id);

  cmds  = cmds.filter(c => c.deckId !== id);
  decks = decks.filter(d => d.id    !== id);

  if (activeId === id) {
    activeId = null;
    renderPortfolio();
  } else {
    renderHand();
  }

  renderShelf();
  toast('🗑', 'Collection deleted');
}

/* ════════════════════════════════
   MODALS — Customize
   ════════════════════════════════ */
function openCustomizeModal() {
  if (!activeId) { alert('Select a collection first'); return; }

  const deck = decks.find(d => d.id === activeId);
  document.getElementById('cust-deck-name').value   = deck?.name     || '';
  document.getElementById('cust-deck-color').value  = deck?.color    || '#7eb8f7';
  document.getElementById('cust-card-bg').value     = deck?.cardBg   || '#1a2236';
  document.getElementById('cust-card-accent').value = deck?.cardAccent|| '#7eb8f7';
  document.getElementById('customize-modal').classList.add('open');
}

function closeCustomizeModal() {
  document.getElementById('customize-modal').classList.remove('open');
}

async function saveCustomization() {
  const deck = decks.find(d => d.id === activeId);
  if (!deck) return;

  deck.name        = document.getElementById('cust-deck-name').value.trim()   || deck.name;
  deck.color       = document.getElementById('cust-deck-color').value;
  deck.cardBg      = document.getElementById('cust-card-bg').value;
  deck.cardAccent  = document.getElementById('cust-card-accent').value;

  await idbPut(S_DECKS, deck);
  const idx = decks.findIndex(d => d.id === deck.id);
  if (idx >= 0) decks[idx] = deck;

  closeCustomizeModal();
  renderShelf();
  renderHand();
  renderPortfolio();
  toast('🎨', 'Customization saved');
}

/* ════════════════════════════════
   EXPORT / IMPORT
   ════════════════════════════════ */
async function exportDB() {
  const blob = new Blob(
    [JSON.stringify({ version: 4, decks, commands: cmds }, null, 2)],
    { type: 'application/json' }
  );
  triggerDownload(blob, 'command-vault-backup.json');
  toast('↓', 'Backup exported!');
}

async function importDB() {
  readFile('.json', async text => {
    try {
      const p = JSON.parse(text);
      if (p.decks) for (const d of p.decks) await idbPut(S_DECKS, d);
      const arr = p.commands || p;
      for (const c of arr) { const cln = { ...c }; delete cln.id; await idbAdd(S_CMDS, cln); }
      await loadAll();
      toast('↑', `${arr.length} commands imported!`);
    } catch {
      toast('⚠', 'Import failed: invalid file');
    }
  });
}

function buildDeckPackage(deckId) {
  const deck  = decks.find(d => d.id === deckId);
  const cards = cmds.filter(c => c.deckId === deckId);
  return {
    version:    1,
    exportedAt: new Date().toISOString(),
    deck: {
      name:       deck.name,
      color:      deck.color,
      cardBg:     deck.cardBg    || null,
      cardAccent: deck.cardAccent || null,
    },
    cards: cards.map(c => ({
      title:       c.title,
      command:     c.command,
      description: c.description || '',
      type:        c.type        || 'Standard',
      tags:        c.tags        || [],
    })),
  };
}

function exportDeckCode() {
  if (!activeId) { alert('Select a collection first'); return; }

  const payload  = buildDeckPackage(activeId);
  const deck     = decks.find(d => d.id === activeId);
  const filename = (deck.name || 'deck').replace(/[^\w\-]+/g, '_') + '.deck.json';
  const blob     = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

  triggerDownload(blob, filename);
  toast('📦', 'Deck exported');
}

/*async function importDeckCode() {
  readFile('.json,.deck.json', async text => {
    try {
      const data   = JSON.parse(text);
      const deckId = 'd' + Date.now();
      const deck   = {
        id:         deckId,
        name:       data.deck?.name       || 'Imported Deck',
        color:      data.deck?.color      || '#7eb8f7',
        cardBg:     data.deck?.cardBg,
        cardAccent: data.deck?.cardAccent,
      };

      await idbPut(S_DECKS, deck);
      decks.push(deck);

      for (const card of (data.cards || [])) {
        const record = {
          deckId,
          title:       card.title       || 'Untitled',
          command:     card.command     || '',
          description: card.description || '',
          type:        card.type        || 'Standard',
          tags:        card.tags        || [],
          uses:        0,
          created:     Date.now(),
          sortOrder:   Date.now() + Math.random(),
        };
        const id = await idbAdd(S_CMDS, record);
        cmds.push({ ...record, id });
      }

      renderShelf();
      renderPortfolio();
      toast('📥', 'Deck imported successfully');
    } catch {
      toast('⚠', 'Invalid deck file');
    }
  });
}*/


async function importDeckCode() {
  readFile('.json,.deck.json', async text => {
    try {
      const data = JSON.parse(text);

      await openBoosterPack(data);

    /*} catch {
      toast('⚠', 'Invalid deck file');
    }*/

} catch(err) {
  console.error(err);
  toast('⚠', err.message);
}



  });
}

async function openBoosterPack(data) {

  return new Promise(resolve => {

    const overlay = document.createElement('div');
    const theme = getPackTheme(data.deck?.name || '');
    overlay.className = 'pack-overlay';

    /*overlay.innerHTML = `
      <div class="pack-wrapper">
        <div class="booster-pack" id="booster-pack">
          <div class="booster-title">
            📦 Imported Pack
          </div>

          <div class="booster-sub">
            Click To Open
          </div>
        </div>
      </div>
    `;*/

    overlay.innerHTML = `
    <div class="pack-wrapper">

    <div
  class="booster-pack"
  id="booster-pack"
  style="
    background-image:url('${theme.image}');
    --pack-glow:${theme.glow};
  "
>

    <div class="booster-title">
      ${theme.label}
    </div>

    <div class="booster-sub">
      Click To Open
    </div>

  </div>

</div>
`;

    document.body.appendChild(overlay);

    document
      .getElementById('booster-pack')
      .onclick = async () => {

      const pack =
        document.getElementById('booster-pack');

      pack.classList.add('pack-open');

      await sleep(900);

      let index = 0;

      showCard();

      function showCard() {

        if (index >= data.cards.length) {
          finishImport();
          return;
        }

        const card = data.cards[index];

        const rarity =
          RARITY_COLORS[card.type] ||
          RARITY_COLORS.Standard;

        overlay.innerHTML = `
          <div class="pack-card-stage">

            <div>
              <div id="reveal-card"></div>

              <button
                class="btn btn-primary pack-next"
                id="next-pack-card">

                ${index === data.cards.length - 1
                  ? 'Finish'
                  : 'Next Card'}
              </button>
            </div>

          </div>
        `;

        const preview =
          buildCardElement(
            card,
            rarity,
            ''
          );

        preview.classList.add('pack-card');

        preview.style.boxShadow =
          `0 0 60px ${rarity}`;

        document
          .getElementById('reveal-card')
          .appendChild(preview);

        document
          .getElementById('next-pack-card')
          .onclick = () => {

          index++;
          showCard();
        };
      }

      async function finishImport() {

        await actuallyImportDeck(data);

        const rarityCounts = {};

        for (const c of data.cards) {
          rarityCounts[c.type] =
            (rarityCounts[c.type] || 0) + 1;
        }

        overlay.innerHTML = `
          <div class="pack-summary">

            <h2>
              ✨ Pack Opened
            </h2>

            <p>
              ${data.cards.length}
              cards added
            </p>

            <ul>
              ${
                Object.entries(rarityCounts)
                  .map(([k,v]) =>
                    `<li>${k}: ${v}</li>`
                  )
                  .join('')
              }
            </ul>

            <button
              class="btn btn-primary"
              id="close-pack">

              Continue
            </button>

          </div>
        `;

        document
          .getElementById('close-pack')
          .onclick = () => {

          overlay.remove();
          resolve();
        };
      }
    };
  });
}

async function actuallyImportDeck(data) {

  const deckId =
    'd' + Date.now();

  const deck = {
    id: deckId,
    name:
      data.deck?.name ||
      'Imported Deck',

    color:
      data.deck?.color ||
      '#7eb8f7',

    cardBg:
      data.deck?.cardBg,

    cardAccent:
      data.deck?.cardAccent
  };

  await idbPut(
    S_DECKS,
    deck
  );

  decks.push(deck);

  for (const card of (data.cards || [])) {

    const record = {
      deckId,

      title:
        card.title || 'Untitled',

      command:
        card.command || '',

      description:
        card.description || '',

      type:
        card.type || 'Standard',

      tags:
        card.tags || [],

      uses:0,

      created:Date.now(),

      sortOrder:
        Date.now() + Math.random()
    };

    const id =
      await idbAdd(
        S_CMDS,
        record
      );

    cmds.push({
      ...record,
      id
    });
  }

  renderShelf();
  renderPortfolio();

  toast(
    '📦',
    `${data.cards.length} cards imported`
  );
}

/* ════════════════════════════════
   UTILS
   ════════════════════════════════ */

function sleep(ms) {
  return new Promise(r =>
    setTimeout(r, ms)
  );
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function emptyState(sigil, title, sub) {
  return `
    <div class="empty">
      <div class="empty-sigil">${sigil}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
    </div>`;
}

function triggerDownload(blob, filename) {
  const a  = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function readFile(accept, onLoad) {
  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = accept;
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader    = new FileReader();
    reader.onload   = () => onLoad(reader.result);
    reader.readAsText(file);
  };
  input.click();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function toast(icon, msg, variant = '') {
  const shelf = document.getElementById('toasts');
  const t     = document.createElement('div');
  t.className = 'toast';
  if (variant === 'gold') t.style.borderColor = 'var(--gold)';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  shelf.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 220); }, 2400);
}

function pickType(el) {
  document.querySelectorAll('.type-opt').forEach(x => x.classList.remove('sel'));
  el.classList.add('sel');
}

function pickColor(el) {
  document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('sel'));
  if (el) el.classList.add('sel');
}

/* ════════════════════════════════
   EVENT LISTENERS
   ════════════════════════════════ */

// Single unified search input handler
document.addEventListener('input', e => {
  if (e.target.id === 'command-search') handleSearch(e.target.value);
});

// Sort change
document.addEventListener('change', e => {
  if (e.target.id === 'card-sort' && activeId) renderHand();
});

// Color swatch picker
document.getElementById('color-grid').addEventListener('click', e => {
  const sw = e.target.closest('.color-swatch');
  if (sw) pickColor(sw);
});

// Close modals on backdrop click
['cmd-modal', 'deck-modal', 'edit-cmd-modal', 'customize-modal'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
});

// Escape key closes all modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
});

/* ════════════════════════════════
   PWA
   ════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

/* ════════════════════════════════
   INIT
   ════════════════════════════════ */
openDB().then(loadAll);
