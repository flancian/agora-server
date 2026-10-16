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
// Part of N-Agora: Spatial Knowledge Workbench (Multi-Column Layout)
// "For the benefit of all beings" 🌿

import { CLIENT_DEFAULTS, safeJsonParse } from './util';
import { renderGraph } from './graph';

declare const NODENAME: string | undefined;

export type ActiveColumn = 'left' | 'center' | 'right';
export type NagoraColumns = '1' | '2' | '3';
export type LeftPaneMode = 'backlinks' | 'history' | 'related' | 'commons';
export type RightPaneMode = 'outlinks' | 'ambient' | 'commons';
export type CandidateType = 'backlink' | 'history' | 'related' | 'outlink' | 'commons' | 'random';

export interface NagoraCandidate {
  name: string;
  type: CandidateType;
}

const SYSTEM_ROUTES = new Set([
  'starred', 'latest', 'users', 'journals', 'today', 'random',
  'nodes', 'federation', 'settings', 'search', 'go', 'pull',
  'embed', 'context', 'graph', 'api', 'static', 'top',
  'stats', 'activities', 'annotations', 'now', 'tonight', 'tomorrow',
  'regexsearch', 'ctzn-login', 'lucky', 'wander', 'feed', 'export'
]);

const DEFAULT_COMMONS_NODES = [
  'node club',
  'agora',
  'flancia',
  'digital garden',
  'stoa',
  'federation',
  'free software',
  'go',
  'social coop',
  'open source'
];

const HISTORY_STORAGE_KEY = 'agora-session-history';
const MAX_HISTORY = 30;

let isInitialized = false;
let activeColumn: ActiveColumn = 'center';
let monocleSide: 'left' | 'right' | null = null;

let currentLeftMode: LeftPaneMode = 'backlinks';
let currentRightMode: RightPaneMode = 'outlinks';

let backlinksCandidates: NagoraCandidate[] = [];
let backlinksIndex = 0;

let historyCandidates: NagoraCandidate[] = [];
let historyIndex = 0;

let relatedCandidates: NagoraCandidate[] = [];
let relatedIndex = 0;

let commonsCandidates: NagoraCandidate[] = [];
let commonsIndex = 0;

let outlinksCandidates: NagoraCandidate[] = [];
let outlinksIndex = 0;

let dynamicStarredNodes: string[] = [];

let leftPaneVisible = false;
let rightPaneVisible = false;

/**
 * Checks if N-Agora spatial columns are enabled in user settings and supported by screen size.
 */
export function isNagoraEnabled(): boolean {
  return getNagoraColumns() !== '1';
}

/**
 * Returns configured column preference ('1' | '2' | '3').
 * Default: '1' (classic single column).
 */
export function getNagoraColumns(): NagoraColumns {
  const stored = localStorage.getItem('nagora-columns');
  if (stored === '1' || stored === '2' || stored === '3') {
    return stored;
  }
  return '1';
}

/**
 * Resolves the active column count ('1' | '2' | '3').
 */
export function getResolvedColumns(): '1' | '2' | '3' {
  return getNagoraColumns();
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
 * Exits monocle (zoom) mode and restores the tiled layout.
 */
export function exitMonocle(): void {
  if (!monocleSide) return;
  const paneId = monocleSide === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  document.getElementById(paneId)?.classList.remove('nagora-pane-monocle');
  document.body.classList.remove('nagora-monocle');
  document.querySelectorAll('.nagora-btn-monocle').forEach(btn => btn.classList.remove('active'));
  monocleSide = null;
}

/**
 * Toggles monocle mode for a specific satellite pane (maximizing it or restoring tiled layout).
 */
export function toggleMonocle(side: 'left' | 'right'): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (!pane) return;

  if (monocleSide === side) {
    exitMonocle();
  } else {
    if (monocleSide) {
      exitMonocle();
    }
    monocleSide = side;
    pane.classList.add('nagora-pane-monocle');
    document.body.classList.add('nagora-monocle');
    pane.querySelector('.nagora-btn-monocle')?.classList.add('active');
  }
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
 * Smoothly scrolls the active column or document up or down.
 */
export function scrollActivePane(direction: 'up' | 'down'): void {
  const delta = direction === 'down' ? 220 : -220;
  if (activeColumn === 'center') {
    window.scrollBy({ top: delta, behavior: 'smooth' });
    return;
  }
  const paneId = activeColumn === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  const iframe = pane?.querySelector('.nagora-pane-iframe') as HTMLIFrameElement | null;
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.scrollBy({ top: delta, behavior: 'smooth' });
      return;
    } catch {
      // Cross-origin fallback
    }
  }
  const body = pane?.querySelector('.nagora-pane-body') as HTMLElement | null;
  if (body) {
    body.scrollBy({ top: delta, behavior: 'smooth' });
  } else {
    window.scrollBy({ top: delta, behavior: 'smooth' });
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
  const currentNode = typeof NODENAME !== 'undefined' ? NODENAME : '';
  if (side === 'right' && currentRightMode === 'ambient') {
    window.location.href = '/context/' + encodeURIComponent(currentNode);
    return;
  }
  const candidates = getActiveCandidates(side);
  const index = getActiveIndex(side);
  const target = candidates[index]?.name;
  if (target) {
    window.location.href = '/' + encodeURIComponent(target);
  }
}

/**
 * Closes a satellite pane and resets layout if both are closed.
 */
export function closePane(side: 'left' | 'right'): void {
  if (monocleSide === side) {
    exitMonocle();
  }
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (pane) {
    pane.style.display = 'none';
    pane.classList.remove('nagora-pane-focused', 'nagora-pane-monocle');
  }

  if (side === 'left') {
    leftPaneVisible = false;
    document.body.classList.remove('nagora-has-left');
  } else {
    rightPaneVisible = false;
    document.body.classList.remove('nagora-has-right');
  }

  if (activeColumn === side) {
    setActiveColumn('center');
  }

  if (!leftPaneVisible && !rightPaneVisible) {
    document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3', 'nagora-monocle', 'nagora-has-left', 'nagora-has-right');
  }
}

/**
 * Gets candidate list for the current mode of a given pane side.
 */
export function getActiveCandidates(side: 'left' | 'right'): NagoraCandidate[] {
  if (side === 'left') {
    switch (currentLeftMode) {
      case 'backlinks': return backlinksCandidates;
      case 'history': return historyCandidates;
      case 'related': return relatedCandidates;
      case 'commons': return commonsCandidates;
    }
  } else {
    switch (currentRightMode) {
      case 'outlinks': return outlinksCandidates;
      case 'commons': return commonsCandidates;
      case 'ambient': return [];
    }
  }
}

/**
 * Gets active candidate index for the current mode of a given pane side.
 */
export function getActiveIndex(side: 'left' | 'right'): number {
  if (side === 'left') {
    switch (currentLeftMode) {
      case 'backlinks': return backlinksIndex;
      case 'history': return historyIndex;
      case 'related': return relatedIndex;
      case 'commons': return commonsIndex;
    }
  } else {
    switch (currentRightMode) {
      case 'outlinks': return outlinksIndex;
      case 'commons': return commonsIndex;
      case 'ambient': return 0;
    }
  }
}

/**
 * Sets active candidate index for the current mode of a given pane side.
 */
function setActiveIndex(side: 'left' | 'right', index: number): void {
  if (side === 'left') {
    switch (currentLeftMode) {
      case 'backlinks': backlinksIndex = index; break;
      case 'history': historyIndex = index; break;
      case 'related': relatedIndex = index; break;
      case 'commons': commonsIndex = index; break;
    }
  } else {
    switch (currentRightMode) {
      case 'outlinks': outlinksIndex = index; break;
      case 'commons': commonsIndex = index; break;
    }
  }
}

/**
 * Switches the viewing mode of a satellite pane.
 */
export function setPaneMode(side: 'left' | 'right', mode: LeftPaneMode | RightPaneMode): void {
  if (side === 'left') {
    currentLeftMode = mode as LeftPaneMode;
    renderPane('left');
  } else {
    currentRightMode = mode as RightPaneMode;
    renderPane('right');
  }
}

/**
 * Steps to the next or previous candidate node in a satellite pane.
 */
export function stepPane(side: 'left' | 'right', delta: number): void {
  if (side === 'left') {
    const candidates = getActiveCandidates('left');
    if (candidates.length <= 1) return;
    let idx = getActiveIndex('left');
    idx = (idx + delta + candidates.length) % candidates.length;
    setActiveIndex('left', idx);
    renderPane('left');
  } else {
    if (currentRightMode === 'ambient') return;
    const candidates = getActiveCandidates('right');
    if (candidates.length <= 1) return;
    let idx = getActiveIndex('right');
    idx = (idx + delta + candidates.length) % candidates.length;
    setActiveIndex('right', idx);
    renderPane('right');
  }
}

/**
 * Selects a specific candidate by index in a satellite pane.
 */
export function selectCandidate(side: 'left' | 'right', index: number): void {
  const candidates = getActiveCandidates(side);
  if (index >= 0 && index < candidates.length) {
    setActiveIndex(side, index);
    renderPane(side);
  }
}

/**
 * Opens a specific node inside a side pane. Automatically expands layout to 2 columns if in 1-column view.
 */
export function openInPane(side: 'left' | 'right', nodeName: string): void {
  const clean = cleanNodeName(nodeName) || nodeName.trim();
  if (!clean) return;

  // 1. If currently in 1-column mode, graduate to 2-column mode
  const currentCols = getNagoraColumns();
  if (currentCols === '1') {
    setNagoraColumns('2');
  }

  // 2. Insert target node into active candidate stack
  if (side === 'right') {
    currentRightMode = 'outlinks';
    const existingIdx = outlinksCandidates.findIndex(c => c.name.toLowerCase() === clean.toLowerCase());
    if (existingIdx !== -1) {
      outlinksIndex = existingIdx;
    } else {
      outlinksCandidates.unshift({ name: clean, type: 'outlink' });
      outlinksIndex = 0;
    }
    renderPane('right');
  } else {
    currentLeftMode = 'backlinks';
    const existingIdx = backlinksCandidates.findIndex(c => c.name.toLowerCase() === clean.toLowerCase());
    if (existingIdx !== -1) {
      backlinksIndex = existingIdx;
    } else {
      backlinksCandidates.unshift({ name: clean, type: 'backlink' });
      backlinksIndex = 0;
    }
    renderPane('left');
  }

  setActiveColumn(side);

  // 3. User feedback
  if (typeof (window as any).showToast === 'function') {
    (window as any).showToast(`🌱 Opened <strong>[[${clean}]]</strong> in ${side} pane`);
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

export function cleanNodeName(raw: string): string | null {
  let clean = raw.trim();
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  if (clean.startsWith('node/')) {
    clean = clean.substring(5);
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
  if (current && clean.toLowerCase() === current) {
    return null;
  }
  return clean;
}

function extractBacklinksCandidates(): NagoraCandidate[] {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();
  const currentNode = (typeof NODENAME !== 'undefined' ? NODENAME : '').toLowerCase();
  if (currentNode) seen.add(currentNode);

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

  return result;
}

function extractHistoryCandidates(): NagoraCandidate[] {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();
  const currentNode = typeof NODENAME !== 'undefined' ? NODENAME : '';
  const historyNodes = getSessionHistory(currentNode);
  historyNodes.forEach(node => {
    const clean = cleanNodeName(node);
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      result.push({ name: clean, type: 'history' });
    }
  });
  return result;
}

function extractRelatedCandidates(): NagoraCandidate[] {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();
  const currentNode = (typeof NODENAME !== 'undefined' ? NODENAME : '').toLowerCase();
  if (currentNode) seen.add(currentNode);

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
  const currentNode = (typeof NODENAME !== 'undefined' ? NODENAME : '').toLowerCase();
  if (currentNode) seen.add(currentNode);

  // 1. First priority: wikilinks written in subnode text (appearance order)
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

  return result;
}

export function refreshCommonsCandidates(): void {
  const result: NagoraCandidate[] = [];
  const seen = new Set<string>();
  const currentNode = (typeof NODENAME !== 'undefined' ? NODENAME : '').toLowerCase();
  if (currentNode) seen.add(currentNode);

  for (const raw of [...DEFAULT_COMMONS_NODES, ...dynamicStarredNodes]) {
    const clean = cleanNodeName(raw) || (raw.trim() && !raw.includes(':') && !raw.includes('#') ? raw.trim() : null);
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      result.push({ name: clean, type: 'commons' });
    }
  }
  commonsCandidates = result;
}

export async function fetchStarredCommons(): Promise<void> {
  try {
    const res = await fetch('/api/starred_nodes', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        dynamicStarredNodes = data.filter((item): item is string => typeof item === 'string');
        refreshCommonsCandidates();
        if (leftPaneVisible && currentLeftMode === 'commons') {
          renderPane('left');
        }
        if (rightPaneVisible && currentRightMode === 'commons') {
          renderPane('right');
        }
      }
    }
  } catch {
    // Graceful fallback
  }
}

function renderModePills(side: 'left' | 'right'): string {
  if (side === 'left') {
    return `
      <button class="nagora-mode-btn ${currentLeftMode === 'backlinks' ? 'active' : ''}" data-side="left" data-mode="backlinks" title="Incoming backlinks">👈 In</button>
      <button class="nagora-mode-btn ${currentLeftMode === 'history' ? 'active' : ''}" data-side="left" data-mode="history" title="Session history trail">⏳ Trail</button>
      <button class="nagora-mode-btn ${currentLeftMode === 'related' ? 'active' : ''}" data-side="left" data-mode="related" title="Related conceptual neighbors">⥅ Related</button>
      <button class="nagora-mode-btn ${currentLeftMode === 'commons' ? 'active' : ''}" data-side="left" data-mode="commons" title="Agora Commons & Node Club">🏛️ Commons</button>
    `;
  } else {
    return `
      <button class="nagora-mode-btn ${currentRightMode === 'outlinks' ? 'active' : ''}" data-side="right" data-mode="outlinks" title="Outgoing forward links">👉 Out</button>
      <button class="nagora-mode-btn ${currentRightMode === 'ambient' ? 'active' : ''}" data-side="right" data-mode="ambient" title="Ambient Agora context & dynamic graph">✨ Ambient</button>
      <button class="nagora-mode-btn ${currentRightMode === 'commons' ? 'active' : ''}" data-side="right" data-mode="commons" title="Agora Commons & Node Club">🏛️ Commons</button>
    `;
  }
}

function showPane(side: 'left' | 'right', pane: HTMLElement): void {
  pane.style.display = 'flex';
  if (side === 'left') {
    leftPaneVisible = true;
    document.body.classList.add('nagora-has-left');
  } else {
    rightPaneVisible = true;
    document.body.classList.add('nagora-has-right');
  }
}

function renderLoadingPane(side: 'left' | 'right', title: string): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (!pane) return;

  if (pane.querySelector('.nagora-pane-loader') && !pane.querySelector('iframe')) {
    showPane(side, pane);
    return;
  }

  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-top-row">
        <div class="nagora-pane-info">
          <span style="font-size: 0.84rem; opacity: 0.75; font-style: italic;">${title}</span>
        </div>
        <div class="nagora-pane-actions">
          <button class="nagora-pane-btn nagora-btn-close" title="Un-tile: Close this column (Esc)">✕</button>
        </div>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div class="nagora-pane-loader">
        <div class="spinner"><img src="/static/img/agora.png" class="logo" alt="Loading..."></div>
        <p class="nagora-loader-text"><em>Loading Agora node…</em></p>
      </div>
    </div>
  `;

  pane.querySelector('.nagora-btn-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePane(side);
  });

  showPane(side, pane);
}

function renderEmptyPane(pane: HTMLElement, side: 'left' | 'right'): void {
  const currentMode = side === 'left' ? currentLeftMode : currentRightMode;
  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-top-row">
        <div class="nagora-pane-modes">
          ${renderModePills(side)}
        </div>
        <div class="nagora-pane-actions">
          <button class="nagora-pane-btn nagora-btn-monocle ${monocleSide === side ? 'active' : ''}" title="Monocle: Toggle maximize pane (z)">⛶</button>
          <button class="nagora-pane-btn nagora-btn-promote" title="Promote: Open this node in main view (Enter)">⬈</button>
          <button class="nagora-pane-btn nagora-btn-close" title="Un-tile: Close this column (Esc)">✕</button>
        </div>
      </div>
      <div class="nagora-pane-bottom-row">
        <span style="opacity: 0.6; font-size: 0.82rem; font-style: italic;">(0 candidates)</span>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div style="padding: 2.5rem 1rem; text-align: center; opacity: 0.8; font-size: 0.9rem;">
        <p><em>No ${currentMode === 'backlinks' ? 'backlinks' : 'nodes'} found in this mode.</em></p>
        <button class="nagora-mode-btn active nagora-empty-commons-btn" style="margin-top: 0.75rem; padding: 4px 10px; display: inline-block;">Browse Commons 🏛️</button>
      </div>
    </div>
  `;

  attachPaneEvents(pane, side);
  pane.querySelector('.nagora-empty-commons-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPaneMode(side, 'commons');
  });
  showPane(side, pane);
}

function renderAmbientPane(pane: HTMLElement, currentNode: string): void {
  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-top-row">
        <div class="nagora-pane-modes">
          ${renderModePills('right')}
        </div>
        <div class="nagora-pane-actions">
          <button class="nagora-pane-btn nagora-btn-monocle ${monocleSide === 'right' ? 'active' : ''}" title="Monocle: Toggle maximize pane (z)">⛶</button>
          <button class="nagora-pane-btn nagora-btn-promote" title="Promote: Open this node in main view (Enter)">⬈</button>
          <button class="nagora-pane-btn nagora-btn-close" title="Un-tile: Close this column (Esc)">✕</button>
        </div>
      </div>
      <div class="nagora-pane-bottom-row">
        <span class="nagora-pane-ambient-title" style="flex: 1; font-size: 0.82rem; font-weight: 500; opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          🌌 Agora context for <strong>[[${currentNode}]]</strong>
        </span>
        <button class="nagora-pane-btn nagora-btn-ambient-refresh" title="Refresh context">🔄</button>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div class="nagora-pane-loader">
        <div class="spinner"><img src="/static/img/agora.png" class="logo" alt="Loading..."></div>
        <p class="nagora-loader-text"><em>Loading Agora context…</em></p>
      </div>
      <div class="nagora-pane-ambient-container context" style="padding: 0.8rem; height: 100%; overflow-y: auto; box-sizing: border-box; display: none;"></div>
    </div>
  `;

  attachPaneEvents(pane, 'right');

  const loader = pane.querySelector('.nagora-pane-loader') as HTMLElement | null;
  const container = pane.querySelector('.nagora-pane-ambient-container') as HTMLElement | null;
  const refreshBtn = pane.querySelector('.nagora-btn-ambient-refresh');

  const loadAmbient = async () => {
    if (loader) loader.style.display = 'flex';
    if (container) container.style.display = 'none';
    try {
      const res = await fetch('/context/' + encodeURIComponent(currentNode), { credentials: 'same-origin' });
      if (res.ok && container) {
        const text = await res.text();
        container.innerHTML = text;
        if (loader) loader.style.display = 'none';
        container.style.display = 'block';

        const graphEl = container.querySelector('#graph');
        if (graphEl) {
          graphEl.id = 'nagora-ambient-graph';
          renderGraph('nagora-ambient-graph', '/graph/json/' + currentNode);
        }
      }
    } catch {
      if (loader) loader.innerHTML = '<p style="padding:1rem;"><em>Could not load context.</em></p>';
    }
  };

  refreshBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    loadAmbient();
  });

  loadAmbient();
  showPane('right', pane);
}

function updatePaneControls(pane: HTMLElement, side: 'left' | 'right', optionsHtml: string, index: number, total: number): void {
  const select = pane.querySelector('.nagora-pane-select') as HTMLSelectElement | null;
  if (select) {
    select.innerHTML = optionsHtml;
    select.value = String(index);
  }
  const prevBtn = pane.querySelector('.nagora-btn-prev') as HTMLButtonElement | null;
  const nextBtn = pane.querySelector('.nagora-btn-next') as HTMLButtonElement | null;
  if (prevBtn) {
    prevBtn.disabled = total <= 1;
    prevBtn.style.opacity = total <= 1 ? '0.35' : '';
    prevBtn.style.cursor = total <= 1 ? 'default' : '';
  }
  if (nextBtn) {
    nextBtn.disabled = total <= 1;
    nextBtn.style.opacity = total <= 1 ? '0.35' : '';
    nextBtn.style.cursor = total <= 1 ? 'default' : '';
  }
  // Update mode pills active state
  const currentMode = side === 'left' ? currentLeftMode : currentRightMode;
  pane.querySelectorAll<HTMLButtonElement>('.nagora-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });
}

function attachPaneEvents(pane: HTMLElement, side: 'left' | 'right'): void {
  // Mode switcher buttons
  pane.querySelectorAll<HTMLButtonElement>('.nagora-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetMode = btn.dataset.mode;
      if (targetMode) {
        setPaneMode(side, targetMode as any);
      }
    });
  });

  // Candidate select dropdown
  const select = pane.querySelector('.nagora-pane-select') as HTMLSelectElement | null;
  select?.addEventListener('change', () => {
    const idx = parseInt(select.value, 10);
    if (!isNaN(idx)) selectCandidate(side, idx);
  });

  // Prev / next buttons
  pane.querySelector('.nagora-btn-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stepPane(side, -1);
  });

  pane.querySelector('.nagora-btn-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stepPane(side, 1);
  });

  // Monocle toggle
  pane.querySelector('.nagora-btn-monocle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMonocle(side);
  });

  // Promote
  pane.querySelector('.nagora-btn-promote')?.addEventListener('click', (e) => {
    e.stopPropagation();
    promotePane(side);
  });

  // Close / un-tile
  pane.querySelector('.nagora-btn-close')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closePane(side);
  });

  // Pane focus on click
  pane.addEventListener('click', () => {
    setActiveColumn(side);
  });

  // Iframe load listener
  const loader = pane.querySelector('.nagora-pane-loader') as HTMLElement | null;
  const iframe = pane.querySelector('.nagora-pane-iframe') as HTMLIFrameElement | null;
  if (iframe) {
    iframe.addEventListener('load', () => {
      if (loader) {
        loader.classList.add('hidden');
      }
      const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
      try {
        iframe.contentDocument?.documentElement.setAttribute('data-theme', theme);
        // Attach Shift+click handler inside iframe
        iframe.contentDocument?.addEventListener('click', (e: MouseEvent) => {
          if (!e.shiftKey && !e.altKey) return;
          if (e.defaultPrevented || e.button !== 0) return;
          const target = (e.target as HTMLElement | null)?.closest('a');
          if (!target) return;
          const href = target.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
          if (href.startsWith('http://') || href.startsWith('https://')) {
            try {
              const url = new URL(href);
              if (url.origin !== window.location.origin) return;
            } catch {
              return;
            }
          }
          const clean = cleanNodeName(href);
          if (clean) {
            e.preventDefault();
            e.stopPropagation();
            openInPane('right', clean);
          }
        }, true);
      } catch {
        // Cross-origin fallback
      }
    });
  }
}

export function renderPane(side: 'left' | 'right'): void {
  const paneId = side === 'left' ? 'nagora-left-pane' : 'nagora-right-pane';
  const pane = document.getElementById(paneId);
  if (!pane) return;

  const currentNode = typeof NODENAME !== 'undefined' ? NODENAME : '';

  // 1. Right pane Ambient mode
  if (side === 'right' && currentRightMode === 'ambient') {
    renderAmbientPane(pane, currentNode);
    return;
  }

  // 2. Node-based modes
  const candidates = getActiveCandidates(side);
  const rawIndex = getActiveIndex(side);
  const total = candidates.length;

  if (total === 0) {
    renderEmptyPane(pane, side);
    return;
  }

  const index = (rawIndex >= 0 && rawIndex < total) ? rawIndex : 0;
  setActiveIndex(side, index);
  const current = candidates[index];

  const optionsHtml = candidates.map((c, i) => {
    let prefix = '';
    if (c.type === 'history') prefix = '⏳ ';
    else if (c.type === 'related') prefix = '⥅ ';
    else if (c.type === 'commons') prefix = '🏛️ ';
    else if (c.type === 'random') prefix = '✨ ';
    else if (side === 'left') prefix = '👈 ';
    else prefix = '👉 ';
    const label = `${i + 1}/${total}: ${prefix}[[${c.name}]]`;
    return `<option value="${i}" ${i === index ? 'selected' : ''}>${label}</option>`;
  }).join('');

  const targetSrc = `/embed/${encodeURIComponent(current.name)}`;
  const existingIframe = pane.querySelector('.nagora-pane-iframe') as HTMLIFrameElement | null;

  // If iframe is already rendering this exact node, update controls without reloading iframe
  if (existingIframe && existingIframe.getAttribute('src') === targetSrc) {
    updatePaneControls(pane, side, optionsHtml, index, total);
    showPane(side, pane);
    return;
  }

  // Build full pane markup
  pane.innerHTML = `
    <div class="nagora-pane-header">
      <div class="nagora-pane-top-row">
        <div class="nagora-pane-modes">
          ${renderModePills(side)}
        </div>
        <div class="nagora-pane-actions">
          <button class="nagora-pane-btn nagora-btn-monocle ${monocleSide === side ? 'active' : ''}" title="Monocle: Toggle maximize pane (z)">⛶</button>
          <button class="nagora-pane-btn nagora-btn-promote" title="Promote: Open this node in main view (Enter)">⬈</button>
          <button class="nagora-pane-btn nagora-btn-close" title="Un-tile: Close this column (Esc)">✕</button>
        </div>
      </div>
      <div class="nagora-pane-bottom-row">
        <button class="nagora-pane-btn nagora-btn-prev" title="Previous node in stack (‹ or [)" ${total <= 1 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>‹</button>
        <div class="nagora-pane-info">
          <select class="nagora-pane-select" aria-label="Select node to view in ${side} pane">
            ${optionsHtml}
          </select>
        </div>
        <button class="nagora-pane-btn nagora-btn-next" title="Next node in stack (› or ])" ${total <= 1 ? 'disabled style="opacity:0.35;cursor:default;"' : ''}>›</button>
      </div>
    </div>
    <div class="nagora-pane-body">
      <div class="nagora-pane-loader">
        <div class="spinner"><img src="/static/img/agora.png" class="logo" alt="Loading..."></div>
        <p class="nagora-loader-text"><em>Loading Agora node…</em></p>
      </div>
      <iframe class="nagora-pane-iframe" loading="lazy" src="${targetSrc}"></iframe>
    </div>
  `;

  attachPaneEvents(pane, side);
  showPane(side, pane);
}

/**
 * Discovers links and initializes/updates the satellite panes according to active column mode.
 */
export function updateNagoraPanes(): void {
  if (!isNagoraEnabled()) {
    closePane('left');
    closePane('right');
    document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3', 'nagora-monocle');
    return;
  }

  const cols = getResolvedColumns();
  if (cols === '1') {
    closePane('left');
    closePane('right');
    document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3', 'nagora-monocle');
    return;
  }

  const isMainLoading = Boolean(document.getElementById('async-content'));

  // If central content is still loading, show column loading skeletons without spawning iframes
  if (isMainLoading) {
    if (cols === '2') {
      closePane('left');
      renderLoadingPane('right', 'Outgoing links…');
      document.body.classList.add('nagora-active', 'nagora-cols-2');
      document.body.classList.remove('nagora-cols-3');
      document.body.classList.remove('nagora-has-left');
      document.body.classList.add('nagora-has-right');
    } else if (cols === '3') {
      renderLoadingPane('left', 'Incoming links…');
      renderLoadingPane('right', 'Outgoing links…');
      document.body.classList.add('nagora-active', 'nagora-cols-3');
      document.body.classList.remove('nagora-cols-2');
      document.body.classList.add('nagora-has-left', 'nagora-has-right');
    }
    return;
  }

  // Central node has loaded. Discover actual graph links.
  backlinksCandidates = extractBacklinksCandidates();
  historyCandidates = extractHistoryCandidates();
  relatedCandidates = extractRelatedCandidates();
  outlinksCandidates = extractOutgoingCandidates();
  refreshCommonsCandidates();

  // Mode 2: Main + Outgoing (or Ambient/Commons fallback)
  if (cols === '2') {
    closePane('left');
    if (currentRightMode === 'outlinks' && outlinksCandidates.length === 0) {
      currentRightMode = 'ambient';
    }
    renderPane('right');
    document.body.classList.add('nagora-active', 'nagora-cols-2');
    document.body.classList.remove('nagora-cols-3');
    document.body.classList.remove('nagora-has-left');
    document.body.classList.add('nagora-has-right');
    return;
  }

  // Mode 3: 3-column layout (Incoming + Main + Outgoing)
  if (cols === '3') {
    if (currentLeftMode === 'backlinks' && backlinksCandidates.length === 0) {
      currentLeftMode = historyCandidates.length > 0 ? 'history' : 'commons';
    }
    renderPane('left');

    if (currentRightMode === 'outlinks' && outlinksCandidates.length === 0) {
      currentRightMode = 'ambient';
    }
    renderPane('right');

    document.body.classList.add('nagora-active', 'nagora-cols-3');
    document.body.classList.remove('nagora-cols-2');
    document.body.classList.add('nagora-has-left', 'nagora-has-right');
  }
}

/**
 * Initializes N-Agora Spatial Columns module.
 */
export function initNagora(): void {
  if (isInitialized) return;
  if (window.self !== window.top) return; // Never run inside embeds
  isInitialized = true;

  // Wire up layout switcher buttons in action bar
  document.querySelectorAll<HTMLButtonElement>('.nagora-layout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCols = btn.dataset.cols as NagoraColumns | undefined;
      if (targetCols === '1' || targetCols === '2' || targetCols === '3') {
        setNagoraColumns(targetCols);
      }
    });
  });
  updateLayoutSwitcherUI();

  // Initialize Commons and fetch starred items
  refreshCommonsCandidates();
  fetchStarredCommons();

  // Global click interception for Shift+Click / Alt+Click on internal links
  document.addEventListener('click', (e: MouseEvent) => {
    if (!e.shiftKey && !e.altKey) return;
    if (e.defaultPrevented || e.button !== 0) return;

    const target = (e.target as HTMLElement | null)?.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
      return;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin) return;
      } catch {
        return;
      }
    }

    const clean = cleanNodeName(href);
    if (clean) {
      e.preventDefault();
      e.stopPropagation();
      openInPane('right', clean);
    }
  }, true);

  if (typeof NODENAME === 'undefined' || !NODENAME) return; // Only populate satellite panes on node pages

  // Record session history
  recordSessionVisit(NODENAME);

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
      updateLayoutSwitcherUI();
      if (isNagoraEnabled()) {
        updateNagoraPanes();
      } else {
        closePane('left');
        closePane('right');
        document.body.classList.remove('nagora-active', 'nagora-cols-2', 'nagora-cols-3', 'nagora-monocle');
      }
    }, 200);
  });
}
