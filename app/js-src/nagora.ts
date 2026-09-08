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

const SYSTEM_ROUTES = new Set([
  'starred', 'latest', 'users', 'journals', 'today', 'random',
  'nodes', 'federation', 'settings', 'search', 'go', 'pull',
  'embed', 'context', 'graph', 'api', 'static'
]);

let isInitialized = false;
let activeColumn: ActiveColumn = 'center';

let incomingNodes: string[] = [];
let incomingIndex = 0;

let outgoingNodes: string[] = [];
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
  const target = side === 'left' ? incomingNodes[incomingIndex] : outgoingNodes[outgoingIndex];
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
    document.body.classList.remove('nagora-active');
  }
}

/**
 * Cycles to the next candidate node in a satellite pane.
 */
export function cyclePane(side: 'left' | 'right'): void {
  if (side === 'left') {
    if (incomingNodes.length <= 1) return;
    incomingIndex = (incomingIndex + 1) % incomingNodes.length;
    renderPane('left', incomingNodes[incomingIndex], incomingIndex, incomingNodes.length);
  } else {
    if (outgoingNodes.length <= 1) return;
    outgoingIndex = (outgoingIndex + 1) % outgoingNodes.length;
    renderPane('right', outgoingNodes[outgoingIndex], outgoingIndex, outgoingNodes.length);
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

function extractIncomingNodes(): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  const backlinkElements = document.querySelectorAll('.context-column.backlinks .link-list a, .backlinks .link-list a');
  backlinkElements.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push(node);
    }
  });

  return result;
}

function extractOutgoingNodes(): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  // 1. From context outlinks
  const outlinkElements = document.querySelectorAll('.context-column.outlinks .link-list a, .outlinks .link-list a');
  outlinkElements.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push(node);
    }
  });

  // 2. From wikilinks in main content
  const contentWikilinks = document.querySelectorAll('.content .subnode a.wikilink, .content a.wikilink');
  contentWikilinks.forEach(el => {
    const href = el.getAttribute('href');
    if (!href) return;
    const node = cleanNodeName(href);
    if (node && !seen.has(node.toLowerCase())) {
      seen.add(node.toLowerCase());
      result.push(node);
    }
  });

  return result;
}

function renderPane(side: 'left' | 'right', node: string, index: number, total: number): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (!pane) return;

  const badgeText = side === 'left' ? '← Incoming' : 'Outgoing →';
  const cycleBtnStyle = total > 1 ? '' : 'display: none;';

  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-info">
        <span class="nagora-pane-badge">${badgeText}</span>
        <span class="nagora-pane-title" title="[[${node}]]">[[${node}]]</span>
      </div>
      <div class="nagora-pane-actions">
        <button class="nagora-pane-btn nagora-btn-cycle" title="Cycle to next link (${total} available)" style="${cycleBtnStyle}">
          ⟳ <span class="nagora-cycle-count">${index + 1}/${total}</span>
        </button>
        <button class="nagora-pane-btn nagora-btn-promote" title="Promote: Open this node in main view (Enter)">⬈</button>
        <button class="nagora-pane-btn nagora-btn-close" title="Close this panel (Esc)">✕</button>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div class="nagora-pane-loader">
        <div class="spinner"><img src="/static/img/agora.png" class="logo" alt="Loading..."></div>
      </div>
      <iframe class="nagora-pane-iframe" loading="lazy" src="/embed/${encodeURIComponent(node)}"></iframe>
    </div>
  `;

  // Attach controls
  const cycleBtn = pane.querySelector('.nagora-btn-cycle');
  cycleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    cyclePane(side);
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

  document.body.classList.add('nagora-active');
}

/**
 * Discovers links and initializes/updates the satellite panes.
 */
export function updateNagoraPanes(): void {
  if (!isNagoraEnabled()) {
    closePane('left');
    closePane('right');
    return;
  }

  const incoming = extractIncomingNodes();
  if (incoming.length > 0) {
    const isNew = incomingNodes.length === 0 || incoming[0] !== incomingNodes[0];
    incomingNodes = incoming;
    if (isNew || !leftPaneVisible) {
      incomingIndex = 0;
      renderPane('left', incomingNodes[0], 0, incomingNodes.length);
    } else {
      // Update cycle counter in case new nodes arrived
      const countEl = document.querySelector('#nagora-left-pane .nagora-cycle-count');
      if (countEl) countEl.textContent = `${incomingIndex + 1}/${incomingNodes.length}`;
    }
  }

  const outgoing = extractOutgoingNodes();
  if (outgoing.length > 0) {
    const isNew = outgoingNodes.length === 0 || outgoing[0] !== outgoingNodes[0];
    outgoingNodes = outgoing;
    if (isNew || !rightPaneVisible) {
      outgoingIndex = 0;
      renderPane('right', outgoingNodes[0], 0, outgoingNodes.length);
    } else {
      // Update cycle counter in case new nodes arrived
      const countEl = document.querySelector('#nagora-right-pane .nagora-cycle-count');
      if (countEl) countEl.textContent = `${outgoingIndex + 1}/${outgoingNodes.length}`;
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

  // 1. Initial attempt on DOM ready (forward links from subnodes may already exist)
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
          document.body.classList.remove('nagora-active');
        }
      } else if (isNagoraEnabled()) {
        updateNagoraPanes();
      }
    }, 200);
  });
}
