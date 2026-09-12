// Copyright 2026 @flancian et al
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Part of N-Agora Phase 2: Spatial Knowledge Workbench (Multi-Column Layout)
// "For the benefit of all beings" 🌿

import { CLIENT_DEFAULTS, safeJsonParse } from './util';

declare const NODENAME: string | undefined;

export type ActiveColumn = 'left' | 'center' | 'right';
export type NagoraColumns = '1' | '2' | '3';
export type CandidateType = 'backlink' | 'history' | 'related' | 'outlink' | 'random';

export interface NagoraCandidate {
  name: string;
  type: CandidateType;
}

const SYSTEM_ROUTES = new Set([
  'starred', 'latest', 'users', 'journals', 'today', 'random',
  'nodes', 'federation', 'settings', 'search', 'go', 'pull',
  'embed', 'context', 'graph', 'api', 'static'
]);

const HISTORY_STORAGE_KEY = 'agora-session-history';
const MAX_HISTORY = 30;

let isInitialized = false;
let activeColumn: ActiveColumn = 'center';

let incomingCandidates: NagoraCandidate[] = [];
let incomingIndex = 0;

let outgoingCandidates: NagoraCandidate[] = [];
let outgoingIndex = 0;

let leftPaneVisible = false;
let rightPaneVisible = false;

/**
 * Checks if N-Agora spatial columns are enabled in user settings and supported by screen size.
 */
export function isNagoraEnabled(): boolean {
  const setting = safeJsonParse(localStorage.getItem('enable-nagora') ?? '', CLIENT_DEFAULTS.enableNagora);
  return Boolean(setting) && window.innerWidth >= 1280;
}

/**
 * Returns configured column count ('1' | '2' | '3'). Defaults to '3'.
 */
export function getNagoraColumns(): NagoraColumns {
  const stored = localStorage.getItem('nagora-columns');
  if (stored === '1' || stored === '2' || stored === '3') {
    return stored;
  }
  return '3';
}

/**
 * Updates column layout count ('1', '2', or '3') and refreshes UI.
 */
export function setNagoraColumns(cols: NagoraColumns): void {
  localStorage.setItem('nagora-columns', cols);
  updateLayoutSwitcherUI();
  updateNagoraPanes();
}

/**
 * Updates active state on the action-bar layout buttons.
 */
export function updateLayoutSwitcherUI(): void {
  const current = getNagoraColumns();
  document.querySelectorAll<HTMLButtonElement>('.nagora-layout-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cols === current);
  });
}

/**
 * Returns currently focused column ('left' | 'center' | 'right').
 */
export function getActiveColumn(): ActiveColumn {
  return activeColumn;
}

/**
 * Sets active column focus and applies styling.
 */
export function setActiveColumn(col: ActiveColumn): void {
  activeColumn = col;
  const leftPane = document.getElementById('nagora-left-pane');
  const rightPane = document.getElementById('nagora-right-pane');

  leftPane?.classList.toggle('nagora-pane-focused', col === 'left');
  rightPane?.classList.toggle('nagora-pane-focused', col === 'right');
}

/**
 * Checks if a specific satellite pane is currently visible.
 */
export function hasVisiblePane(side: 'left' | 'right'): boolean {
  return side === 'left' ? leftPaneVisible : rightPaneVisible;
}

/**
 * Smoothly scrolls the active satellite pane's inner window up or down.
 */
export function scrollActivePane(direction: 'up' | 'down'): void {
  if (activeColumn === 'center') return;
  const paneId = activeColumn === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  const iframe = pane?.querySelector('iframe') as HTMLIFrameElement | null;
  if (iframe && iframe.contentWindow) {
    const delta = direction === 'down' ? 220 : -220;
    try {
      iframe.contentWindow.scrollBy({ top: delta, behavior: 'smooth' });
    } catch {
      // Ignore cross-origin issues if any
    }
  }
}

/**
 * Promotes the currently active satellite column to become the center node.
 */
export function promoteActivePane(): void {
  if (activeColumn === 'left') {
    promotePane('left');
  } else if (activeColumn === 'right') {
    promotePane('right');
  }
}

/**
 * Promotes a specific pane (navigates top window to that node).
 */
export function promotePane(side: 'left' | 'right'): void {
  const candidates = side === 'left' ? incomingCandidates : outgoingCandidates;
  const index = side === 'left' ? incomingIndex : outgoingIndex;
  const target = candidates[index]?.name;
  if (target) {
    window.location.href = '/' + encodeURIComponent(target);
  }
}

/**
 * Closes a satellite pane and resets layout if both are closed.
 */
export function closePane(side: 'left' | 'right'): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (pane) {
    pane.style.display = 'none';
    pane.classList.remove('nagora-pane-focused');
  }

  if (side === 'left') {
    leftPaneVisible = false;
  } else {
    rightPaneVisible = false;
  }

  if (activeColumn === side) {
    setActiveColumn('center');
  }

  if (!leftPaneVisible && !rightPaneVisible) {
    document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3');
  }
}

/**
 * Steps to the next or previous candidate node in a satellite pane.
 */
export function stepPane(side: 'left' | 'right', delta: number): void {
  if (side === 'left') {
    if (incomingCandidates.length <= 1) return;
    incomingIndex = (incomingIndex + delta + incomingCandidates.length) % incomingCandidates.length;
    renderPane('left', incomingCandidates, incomingIndex);
  } else {
    if (outgoingCandidates.length <= 1) return;
    outgoingIndex = (outgoingIndex + delta + outgoingCandidates.length) % outgoingCandidates.length;
    renderPane('right', outgoingCandidates, outgoingIndex);
  }
}

/**
 * Selects a specific candidate by index in a satellite pane.
 */
export function selectCandidate(side: 'left' | 'right', index: number): void {
  if (side === 'left') {
    if (index >= 0 && index < incomingCandidates.length) {
      incomingIndex = index;
      renderPane('left', incomingCandidates, incomingIndex);
    }
  } else {
    if (index >= 0 && index < outgoingCandidates.length) {
      outgoingIndex = index;
      renderPane('right', outgoingCandidates, outgoingIndex);
    }
  }
}

/**
 * Propagates current theme to all embedded N-Agora iframes.
 */
export function syncTheme(theme: string): void {
  document.querySelectorAll<HTMLIFrameElement>('.nagora-pane-iframe').forEach(iframe => {
    try {
      iframe.contentDocument?.documentElement.setAttribute('data-theme', theme);
    } catch {
      // Ignore if not yet loaded
    }
  });
}

/**
 * Records current node visit into session history buffer (time horizon).
 */
function recordSessionVisit(node: string): void {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    let history: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history)) history = [];
    if (history.length > 0 && history[history.length - 1].toLowerCase() === node.toLowerCase()) {
      return;
    }
    history.push(node);
    if (history.length > MAX_HISTORY) {
      history = history.slice(history.length - MAX_HISTORY);
    }
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // SessionStorage disabled
  }
}

/**
 * Retrieves session history stack excluding the current node.
 */
function getSessionHistory(currentNode: string): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    const history: string[] = raw ? JSON.parse(raw) : [];
    const current = currentNode.toLowerCase();
    return history.filter(n => n.toLowerCase() !== current).reverse();
  } catch {
    return [];
  }
}

function cleanNodeName(raw: string): string | null {
  let clean = raw.trim();
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  if (clean.endsWith('/')) {
    clean = clean.substring(0, clean.length - 1);
  }
  if (!clean || clean.includes(':') || clean.includes('#') || clean.startsWith('http')) {
    return null;
  }
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Keep as is
  }
  if (SYSTEM_ROUTES.has(clean.toLowerCase())) {
    return null;
  }
  const current = (typeof NODENAME !== 'undefined' ? NODENAME : '').toLowerCase();
  if (clean.toLowerCase() === current) {
    return null;
  }
  return clean;
}

function extractIncomingCandidates(): NagoraCandidate[] {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();
  const currentNode = typeof NODENAME !== 'undefined' ? NODENAME : '';

  // 1. Natural backlinks from .context
  const backlinkElements = document.querySelectorAll('.context-column.backlinks .link-list a, .backlinks .link-list a');
  backlinkElements.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'backlink' });
    }
  });

  // 2. Session history (time of visiting horizon: where did I come from?)
  const historyNodes = getSessionHistory(currentNode);
  historyNodes.forEach(node => {
    if (!seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'history' });
    }
  });

  // 3. Related nodes from DOM as conceptual neighbors
  const relatedElements = document.querySelectorAll('.node.related a .node-name, .node.related a, .related .link-item a');
  relatedElements.forEach(el => {
    const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'related' });
    }
  });

  return result;
}

function extractOutgoingCandidates(): NagoraCandidate[] {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();

  // 1. First priority: wikilinks explicitly written in the subnode text (appearance order!)
  const contentWikilinks = document.querySelectorAll('.content .subnode a.wikilink, .content a.wikilink');
  contentWikilinks.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'outlink' });
    }
  });

  // 2. Second priority: context outlinks
  const outlinkElements = document.querySelectorAll('.context-column.outlinks .link-list a, .outlinks .link-list a');
  outlinkElements.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'outlink' });
    }
  });

  // 3. Third priority: related conceptual neighbors
  const relatedElements = document.querySelectorAll('.node.related a .node-name, .node.related a, .related .link-item a');
  relatedElements.forEach(el => {
    const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push({ name: node, type: 'related' });
    }
  });

  return result;
}

function renderPane(side: 'left' | 'right', candidates: NagoraCandidate[], index: number): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (!pane || candidates.length === 0) return;

  const current = candidates[index];
  const total = candidates.length;

  let badgeIcon = side === 'left' ? '←' : '→';
  let badgeTitle = side === 'left' ? 'Incoming backlink' : 'Outgoing forward link';
  if (current.type === 'history') {
    badgeIcon = '⏳';
    badgeTitle = 'Session history: previously visited node';
  } else if (current.type === 'related') {
    badgeIcon = '⥅';
    badgeTitle = 'Related conceptual neighbor';
  } else if (current.type === 'random') {
    badgeIcon = '🎲';
    badgeTitle = 'Serendipitous exploration';
  }

  const optionsHtml = candidates.map((c, i) => {
    const prefix = c.type === 'history' ? '⏳ ' : c.type === 'related' ? '⥅ ' : '';
    const label = `${i + 1}/${total}: ${prefix}[[${c.name}]]`;
    return `<option value="${i}" ${i === index ? 'selected' : ''}>${label}</option>`;
  }).join('');

  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-info">
        <span class="nagora-pane-badge" title="${badgeTitle}">${badgeIcon}</span>
        <select class="nagora-pane-select" aria-label="Select node to view in ${side} pane">
          ${optionsHtml}
        </select>
      </div>
      <div class="nagora-pane-actions">
        <button class="nagora-pane-btn nagora-btn-prev" title="Previous node (‹)" ${total <= 1 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>‹</button>
        <button class="nagora-pane-btn nagora-btn-next" title="Next node (›)" ${total <= 1 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>›</button>
        <button class="nagora-pane-btn nagora-btn-promote" title="Promote: Open this node in main view (Enter)">⬈</button>
        <button class="nagora-pane-btn nagora-btn-close" title="Close this column (Esc)">✕</button>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div class="nagora-pane-loader">
        <div class="spinner"><img src="/static/img/agora.png" class="logo" alt="Loading..."></div>
      </div>
      <iframe class="nagora-pane-iframe" loading="lazy" src="/embed/${encodeURIComponent(current.name)}"></iframe>
    </div>
  `;

  // Attach controls
  const select = pane.querySelector('.nagora-pane-select') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    const idx = parseInt(select.value, 10);
    if (!isNaN(idx)) selectCandidate(side, idx);
  });

  const prevBtn = pane.querySelector('.nagora-btn-prev');
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    stepPane(side, -1);
  });

  const nextBtn = pane.querySelector('.nagora-btn-next');
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    stepPane(side, 1);
  });

  const promoteBtn = pane.querySelector('.nagora-btn-promote');
  promoteBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    promotePane(side);
  });

  const closeBtn = pane.querySelector('.nagora-btn-close');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePane(side);
  });

  pane.addEventListener('click', () => {
    setActiveColumn(side);
  });

  const loader = pane.querySelector('.nagora-pane-loader') as HTMLElement | null;
  const iframe = pane.querySelector('.nagora-pane-iframe') as HTMLIFrameElement | null;

  if (iframe && loader) {
    iframe.addEventListener('load', () => {
      loader.classList.add('hidden');
      const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
      try {
        iframe.contentDocument?.documentElement.setAttribute('data-theme', theme);
      } catch {
        // Cross-origin fallback
      }
    });
  }

  pane.style.display = 'flex';
  if (side === 'left') {
    leftPaneVisible = true;
  } else {
    rightPaneVisible = true;
  }
}

/**
 * Discovers links and initializes/updates the satellite panes according to active column mode.
 */
export function updateNagoraPanes(): void {
  if (!isNagoraEnabled()) {
    closePane('left');
    closePane('right');
    return;
  }

  const cols = getNagoraColumns();
  if (cols === '1') {
    closePane('left');
    closePane('right');
    document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3');
    return;
  }

  const incoming = extractIncomingCandidates();
  const outgoing = extractOutgoingCandidates();

  // Mode 2: Center + Right (or Left if right is empty)
  if (cols === '2') {
    closePane('left');
    if (outgoing.length > 0) {
      outgoingCandidates = outgoing;
      if (outgoingIndex >= outgoingCandidates.length) outgoingIndex = 0;
      renderPane('right', outgoingCandidates, outgoingIndex);
    } else if (incoming.length > 0) {
      // Fallback: show left pane if no outgoing links exist
      incomingCandidates = incoming;
      if (incomingIndex >= incomingCandidates.length) incomingIndex = 0;
      renderPane('left', incomingCandidates, incomingIndex);
    }
    document.body.classList.add('nagora-active', 'nagora-cols-2');
    document.body.classList.remove('nagora-cols-3');
    return;
  }

  // Mode 3: 3-column layout (Incoming + Center + Outgoing)
  if (cols === '3') {
    if (incoming.length > 0) {
      incomingCandidates = incoming;
      if (incomingIndex >= incomingCandidates.length) incomingIndex = 0;
      renderPane('left', incomingCandidates, incomingIndex);
    } else {
      closePane('left');
    }

    if (outgoing.length > 0) {
      outgoingCandidates = outgoing;
      if (outgoingIndex >= outgoingCandidates.length) outgoingIndex = 0;
      renderPane('right', outgoingCandidates, outgoingIndex);
    } else {
      closePane('right');
    }

    if (leftPaneVisible || rightPaneVisible) {
      document.body.classList.add('nagora-active', 'nagora-cols-3');
      document.body.classList.remove('nagora-cols-2');
    } else {
      document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3');
    }
  }
}

/**
 * Initializes N-Agora Spatial Columns module.
 */
export function initNagora(): void {
  if (isInitialized) return;
  if (window.self !== window.top) return; // Never run inside embeds
  if (typeof NODENAME === 'undefined' || !NODENAME) return; // Only on node pages

  isInitialized = true;

  // Record session history
  recordSessionVisit(NODENAME);

  // Wire up layout switcher buttons in action bar
  document.querySelectorAll<HTMLButtonElement>('.nagora-layout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCols = (btn.dataset.cols as NagoraColumns) || '3';
      setNagoraColumns(targetCols);
    });
  });
  updateLayoutSwitcherUI();

  // 1. Initial attempt on DOM ready
  if (isNagoraEnabled()) {
    setTimeout(() => updateNagoraPanes(), 100);
  }

  // 2. Main node async loaded event
  window.addEventListener('agora-node-loaded', () => {
    if (isNagoraEnabled()) {
      updateNagoraPanes();
    }
  });

  // 3. Asynchronous context loaded event (backlinks & outlinks)
  window.addEventListener('agora-context-loaded', () => {
    if (isNagoraEnabled()) {
      updateNagoraPanes();
    }
  });

  // 4. Responsive window resize handling (debounced)
  let resizeTimer: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth < 1280) {
        if (leftPaneVisible || rightPaneVisible) {
          document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3');
        }
      } else if (isNagoraEnabled()) {
        updateNagoraPanes();
      }
    }, 200);
  });
}
