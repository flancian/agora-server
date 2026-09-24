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
// Part of N-Agora Phase 1: Keyboard-First Traversal
// "For the benefit of all beings" 🌿

import { CLIENT_DEFAULTS, safeJsonParse } from './util';
import { closeLiveSearch } from './livesearch';
import {
  getActiveColumn,
  setActiveColumn,
  hasVisiblePane,
  scrollActivePane,
  promoteActivePane,
  toggleMonocle,
  exitMonocle,
} from './nagora';

declare const NODENAME: string | undefined;

let isInitialized = false;

/**
 * Checks if keyboard shortcuts are enabled in user settings (default: true).
 */
export function areShortcutsEnabled(): boolean {
  return safeJsonParse(localStorage.getItem('enable-shortcuts') ?? '', CLIENT_DEFAULTS.enableShortcuts);
}
let lastTargetElement: HTMLElement | null = null;
let lastTargetTime = 0;
let currentHighlightTimeout: number | null = null;
let currentHighlightedEl: HTMLElement | null = null;

/**
 * Checks if the user is actively typing or focused in an editable element.
 */
export function isEditingActive(target?: EventTarget | null): boolean {
  const active = document.activeElement;
  if (active && active instanceof HTMLElement && isEditableElement(active)) {
    return true;
  }
  if (target && target instanceof HTMLElement && isEditableElement(target)) {
    return true;
  }
  return false;
}

function isEditableElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return true;
  }
  if (tag === 'iframe') {
    return true;
  }
  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    return true;
  }
  if (el.closest('[contenteditable="true"]')) {
    return true;
  }
  return false;
}

/**
 * Checks if any modal or overlay is currently active.
 */
export function isOverlayOpen(): boolean {
  if (document.body.classList.contains('overlay-open')) {
    return true;
  }
  if (document.querySelector('.overlay.active') !== null) {
    return true;
  }
  const modal = document.getElementById('agora-shortcuts-modal');
  if (modal && modal.classList.contains('active')) {
    return true;
  }
  return false;
}

/**
 * Checks if any overlay other than our keyboard shortcuts modal is active.
 */
function isOtherOverlayOpen(): boolean {
  if (document.body.classList.contains('overlay-open')) {
    return true;
  }
  const activeOverlays = document.querySelectorAll('.overlay.active');
  for (let i = 0; i < activeOverlays.length; i++) {
    if (activeOverlays[i].id !== 'agora-shortcuts-modal') {
      return true;
    }
  }
  return false;
}

/**
 * Measures the top navigation bar height to ensure scrolled items
 * are never hidden behind the sticky navbar.
 */
export function getHeaderOffset(): number {
  const nav = document.querySelector('nav');
  if (nav) {
    const rect = nav.getBoundingClientRect();
    if (rect.height > 0) {
      return Math.round(rect.height) + 12;
    }
  }
  return 80;
}

/**
 * Returns all visible contributions and sections sorted by document flow.
 */
export function getVisibleTargets(): HTMLElement[] {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>('.subnode, .pushed-subnode, .sortable-section')
  );

  const visible = elements.filter(el => {
    if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0 || rect.width <= 0) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    return true;
  });

  // Sort strictly by vertical document coordinate
  visible.sort((a, b) => {
    const topA = a.getBoundingClientRect().top + window.scrollY;
    const topB = b.getBoundingClientRect().top + window.scrollY;
    return topA - topB;
  });

  // Deduplicate elements whose vertical positions are very close (within 25px)
  const deduplicated: HTMLElement[] = [];
  for (const el of visible) {
    const elTop = Math.round(el.getBoundingClientRect().top + window.scrollY);
    if (deduplicated.length === 0) {
      deduplicated.push(el);
    } else {
      const last = deduplicated[deduplicated.length - 1];
      const lastTop = Math.round(last.getBoundingClientRect().top + window.scrollY);
      if (Math.abs(elTop - lastTop) > 25) {
        deduplicated.push(el);
      } else {
        // If one contains the other, prefer the more specific inner subnode
        if (last.contains(el)) {
          deduplicated[deduplicated.length - 1] = el;
        }
      }
    }
  }

  return deduplicated;
}

/**
 * Smoothly scrolls to the next contribution or section in the document flow.
 */
export function scrollToNext(): void {
  const targets = getVisibleTargets();
  if (targets.length === 0) return;

  const headerOffset = getHeaderOffset();
  const now = performance.now();
  let nextTarget: HTMLElement | null = null;

  // If user is rapidly tapping 'j', step sequentially from the currently targeted element
  if (lastTargetElement && (now - lastTargetTime < 600) && targets.includes(lastTargetElement)) {
    const currentIndex = targets.indexOf(lastTargetElement);
    if (currentIndex >= 0 && currentIndex < targets.length - 1) {
      nextTarget = targets[currentIndex + 1];
    }
  }

  // Otherwise locate target based on current viewport coordinates
  if (!nextTarget) {
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top > headerOffset + 15) {
        nextTarget = el;
        break;
      }
    }
  }

  if (nextTarget) {
    lastTargetElement = nextTarget;
    lastTargetTime = now;
    scrollElementIntoView(nextTarget, headerOffset);
  }
}

/**
 * Smoothly scrolls to the previous contribution or section in the document flow.
 */
export function scrollToPrevious(): void {
  const targets = getVisibleTargets();
  if (targets.length === 0) {
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  const headerOffset = getHeaderOffset();
  const now = performance.now();
  let prevTarget: HTMLElement | null = null;

  // If user is rapidly tapping 'k', step backward sequentially
  if (lastTargetElement && (now - lastTargetTime < 600) && targets.includes(lastTargetElement)) {
    const currentIndex = targets.indexOf(lastTargetElement);
    if (currentIndex > 0) {
      prevTarget = targets[currentIndex - 1];
    } else if (currentIndex === 0) {
      lastTargetElement = null;
      lastTargetTime = now;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }

  // Otherwise locate target above the current reading line
  if (!prevTarget) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const el = targets[i];
      const rect = el.getBoundingClientRect();
      if (rect.top < headerOffset - 15) {
        prevTarget = el;
        break;
      }
    }
  }

  if (prevTarget) {
    lastTargetElement = prevTarget;
    lastTargetTime = now;
    scrollElementIntoView(prevTarget, headerOffset);
  } else if (window.scrollY > 0) {
    lastTargetElement = null;
    lastTargetTime = now;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function scrollElementIntoView(el: HTMLElement, headerOffset: number): void {
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - headerOffset;

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth',
  });

  highlightTarget(el);
}

function highlightTarget(el: HTMLElement): void {
  if (currentHighlightedEl && currentHighlightedEl !== el) {
    currentHighlightedEl.classList.remove('agora-kb-active');
  }
  if (currentHighlightTimeout) {
    window.clearTimeout(currentHighlightTimeout);
  }

  el.classList.add('agora-kb-active');
  currentHighlightedEl = el;

  currentHighlightTimeout = window.setTimeout(() => {
    el.classList.remove('agora-kb-active');
    if (currentHighlightedEl === el) {
      currentHighlightedEl = null;
    }
  }, 1200);
}

function clearHighlight(): void {
  if (currentHighlightedEl) {
    currentHighlightedEl.classList.remove('agora-kb-active');
    currentHighlightedEl = null;
  }
  if (currentHighlightTimeout) {
    window.clearTimeout(currentHighlightTimeout);
    currentHighlightTimeout = null;
  }
}

/**
 * Locates the currently active or in-view element.
 */
export function getCurrentTarget(): HTMLElement | null {
  const headerOffset = getHeaderOffset();
  if (lastTargetElement && document.contains(lastTargetElement)) {
    const rect = lastTargetElement.getBoundingClientRect();
    if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
      return lastTargetElement;
    }
  }

  const targets = getVisibleTargets();
  if (targets.length === 0) return null;

  for (const el of targets) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > headerOffset + 10 && rect.top <= window.innerHeight) {
      return el;
    }
  }

  return targets[0];
}

/**
 * Toggles expand/collapse on the currently focused or in-view section or subnode.
 */
export function toggleActiveSection(): void {
  const target = getCurrentTarget();
  if (!target) return;

  let detailsEl: HTMLDetailsElement | null = null;
  if (target instanceof HTMLDetailsElement || target.tagName.toLowerCase() === 'details') {
    detailsEl = target as HTMLDetailsElement;
  } else {
    detailsEl = target.closest('details') || target.querySelector('details');
  }

  if (detailsEl) {
    const wasOpen = detailsEl.open;
    const summary = detailsEl.querySelector('summary');
    if (summary) {
      summary.click();
    }
    if (detailsEl.open === wasOpen) {
      detailsEl.open = !wasOpen;
      detailsEl.dispatchEvent(new Event('toggle'));
    }
    lastTargetElement = detailsEl;
    highlightTarget(detailsEl);
  }
}

/**
 * Triggers Wander navigation (navigates to /wander/<current-node> or /random).
 */
export function triggerWander(): void {
  const wanderBtn = document.getElementById('mini-cli-wander') as HTMLButtonElement | null;
  if (wanderBtn) {
    wanderBtn.click();
    return;
  }
  const miniCli = document.getElementById('mini-cli') as HTMLInputElement | null;
  let node = miniCli?.value?.trim();
  if (!node && typeof NODENAME !== 'undefined' && NODENAME) {
    node = NODENAME;
  }
  if (node) {
    window.location.href = '/wander/' + encodeURIComponent(node);
  } else {
    window.location.href = '/random';
  }
}

/**
 * Focuses the #mini-cli search bar and selects existing text for easy replacement.
 */
export function focusSearch(): void {
  const miniCli = (document.getElementById('mini-cli') ||
    document.querySelector('input[name="q"]')) as HTMLInputElement | null;
  if (miniCli) {
    miniCli.focus();
    miniCli.select();
  }
}

/**
 * Toggles expand or collapse for all sections.
 */
export function toggleExpandAll(): void {
  const expandBtn = document.getElementById('expand-all') as HTMLButtonElement | null;
  if (expandBtn) {
    expandBtn.click();
  }
}

/**
 * Toggles light and dark themes.
 */
export function toggleTheme(): void {
  const themeBox = document.getElementById('theme-checkbox') as HTMLInputElement | null;
  if (themeBox) {
    themeBox.click();
  }
}

/**
 * Triggers pulling / transcluding another node.
 */
export function triggerPull(): void {
  const pullBtn = document.getElementById('mini-cli-pull') as HTMLButtonElement | null;
  if (pullBtn) {
    pullBtn.click();
  }
}

/**
 * Follows [[go]] target or navigates directly to target node.
 */
export function triggerGo(): void {
  const goBtn = document.getElementById('mini-cli-go') as HTMLButtonElement | null;
  if (goBtn) {
    goBtn.click();
  }
}

/**
 * Triggers Go Beyond (lucky web search).
 */
export function triggerGoBeyond(): void {
  const beyondBtn = document.getElementById('mini-cli-go-beyond') as HTMLButtonElement | null;
  if (beyondBtn) {
    beyondBtn.click();
  }
}

/**
 * Opens editor to write a subnode for this node.
 */
export function triggerWrite(): void {
  const writeBtn = document.getElementById('mini-cli-write') as HTMLButtonElement | null;
  if (writeBtn) {
    writeBtn.click();
  }
}

/**
 * Triggers AI perspective synthesis or expands the synthesis section.
 */
export function triggerSynthesize(): void {
  const synBtn = document.getElementById('mini-cli-synthesize') as HTMLButtonElement | null;
  const synDetails = document.getElementById('synthesis-details') as HTMLDetailsElement | null;
  if (synBtn && synBtn.style.display !== 'none') {
    synBtn.click();
  } else if (synDetails) {
    synDetails.open = true;
    synDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // @ts-ignore
    if (typeof window.showToast === 'function') {
      // @ts-ignore
      window.showToast('✨ AI Synthesis is not available on this page.');
    }
  }
}

/**
 * Scrolls to the local graph and context.
 */
export function triggerLookAround(): void {
  const lookBtn = document.getElementById('mini-cli-look-around') as HTMLButtonElement | null;
  if (lookBtn) {
    lookBtn.click();
  }
}

/**
 * Opens or scrolls to interactive Agora minigames.
 */
export function triggerPlay(): void {
  const playBtn = document.getElementById('mini-cli-play') as HTMLButtonElement | null;
  if (playBtn) {
    playBtn.click();
  }
}

/**
 * Closes active overlays, dismisses the shortcuts sheet, and blurs active inputs.
 */
export function handleEscape(): void {
  // 0. Close live search dropdown if active
  closeLiveSearch();

  // 0b. Exit monocle mode if active
  if (document.body.classList.contains('nagora-monocle')) {
    exitMonocle();
    return;
  }

  // 1. Close keyboard shortcuts modal if open
  closeShortcutsModal();

  // 2. Unfocus active input or editable element
  if (
    document.activeElement &&
    document.activeElement instanceof HTMLElement &&
    document.activeElement !== document.body
  ) {
    document.activeElement.blur();
  }

  // 3. Close settings overlay (#overlay)
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.classList.contains('active')) {
    overlay.classList.remove('active');
    document.body.classList.remove('overlay-open');
  }

  // 4. Close join overlay (#join-overlay)
  const joinOverlay = document.getElementById('join-overlay');
  if (joinOverlay && joinOverlay.classList.contains('active')) {
    joinOverlay.classList.remove('active');
    document.body.classList.remove('overlay-open');
  }

  // 5. Close any other open overlays
  document.querySelectorAll('.overlay.active').forEach(el => el.classList.remove('active'));
  document.body.classList.remove('overlay-open');

  // 6. Reset spatial column focus to center if a side pane was focused
  if (getActiveColumn() !== 'center') {
    setActiveColumn('center');
  }
}

function getOrCreateShortcutsModal(): HTMLElement {
  let modal = document.getElementById('agora-shortcuts-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'agora-shortcuts-modal';
  modal.className = 'agora-shortcuts-overlay';
  modal.style.display = 'none';

  modal.innerHTML = `
    <div class="agora-shortcuts-backdrop"></div>
    <div class="agora-shortcuts-card" role="dialog" aria-modal="true" aria-labelledby="agora-shortcuts-title">
      <div class="agora-shortcuts-header">
        <div id="agora-shortcuts-title" class="agora-shortcuts-title">
          <span>⌨️</span> <strong>Agora Keyboard Shortcuts</strong>
        </div>
        <button class="agora-shortcuts-close" aria-label="Close shortcuts dialog">✕</button>
      </div>
      <div class="agora-shortcuts-body">
        <table class="agora-shortcuts-table">
          <tbody>
            <tr>
              <td class="key-col"><kbd>j</kbd> / <kbd>k</kbd></td>
              <td class="desc-col">Scroll down / up within active column or section</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>h</kbd> / <kbd>l</kbd></td>
              <td class="desc-col">Switch spatial column focus (Left / Center / Right)</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>Enter</kbd> / <kbd>o</kbd></td>
              <td class="desc-col">Expand/collapse section, or promote focused column to main view</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>z</kbd></td>
              <td class="desc-col">Monocle: toggle maximize focused satellite column</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>e</kbd></td>
              <td class="desc-col">Expand or collapse all sections</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>t</kbd></td>
              <td class="desc-col">Toggle light / dark theme</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>/</kbd></td>
              <td class="desc-col">Jump to search bar (focuses <code>#mini-cli</code>)</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>g</kbd></td>
              <td class="desc-col"><strong>Go</strong>: follow <code>[[go]]</code> link or Google search</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>b</kbd></td>
              <td class="desc-col"><strong>Go Beyond</strong>: I'm Feeling Lucky search</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>w</kbd></td>
              <td class="desc-col"><strong>Wander</strong>: explore connected or random node</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>p</kbd></td>
              <td class="desc-col"><strong>Pull</strong>: transclude another node into this page</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>c</kbd></td>
              <td class="desc-col"><strong>Compose</strong> / Write a subnode for this node</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>s</kbd></td>
              <td class="desc-col"><strong>Synthesize</strong>: trigger AI perspective synthesis</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>a</kbd></td>
              <td class="desc-col"><strong>Look</strong>: jump to local graph &amp; context</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>m</kbd></td>
              <td class="desc-col"><strong>Play</strong>: open interactive Agora minigames</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>?</kbd></td>
              <td class="desc-col">Toggle this keyboard shortcuts cheat sheet</td>
            </tr>
            <tr>
              <td class="key-col"><kbd>Esc</kbd></td>
              <td class="desc-col">Unfocus search / inputs &amp; close overlays</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="agora-shortcuts-footer">
        <span>🌿 <em>For the benefit of all beings • Maitreya</em></span>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const backdrop = modal.querySelector('.agora-shortcuts-backdrop');
  backdrop?.addEventListener('click', () => closeShortcutsModal());

  const closeBtn = modal.querySelector('.agora-shortcuts-close');
  closeBtn?.addEventListener('click', () => closeShortcutsModal());

  return modal;
}

export function openShortcutsModal(): void {
  const modal = getOrCreateShortcutsModal();
  modal.style.display = 'flex';
  void modal.offsetHeight;
  modal.classList.add('active');
}

export function closeShortcutsModal(): void {
  const modal = document.getElementById('agora-shortcuts-modal');
  if (modal && modal.classList.contains('active')) {
    modal.classList.remove('active');
    setTimeout(() => {
      if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
      }
    }, 200);
  }
}

export function toggleShortcutsModal(): void {
  const modal = document.getElementById('agora-shortcuts-modal');
  if (modal && modal.classList.contains('active')) {
    closeShortcutsModal();
  } else {
    openShortcutsModal();
  }
}

/**
 * Initializes Keyboard-First Navigation.
 */
export function initKeyNavigation(): void {
  if (isInitialized) return;
  if (window.self !== window.top) return;
  isInitialized = true;

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Escape always handles dismissing dialogs and unfocusing inputs
    if (e.key === 'Escape') {
      handleEscape();
      return;
    }

    // Respect user setting: if keyboard shortcuts are disabled, do not intercept keys
    if (!areShortcutsEnabled()) {
      return;
    }

    // Never intercept if modifier keys (Ctrl, Alt, Meta) are held
    if (e.ctrlKey || e.altKey || e.metaKey) {
      return;
    }

    // Toggle shortcuts dialog on '?' (Shift + / or ?)
    if (e.key === '?') {
      // Input Safety Guard: do not capture when typing in inputs/textareas
      if (isEditingActive(e.target)) {
        return;
      }
      // If another overlay is open (Settings/Join), do not intercept
      if (isOtherOverlayOpen()) {
        return;
      }
      e.preventDefault();
      toggleShortcutsModal();
      return;
    }

    // Input Safety Guard: never capture keystrokes if actively typing or overlay is open
    if (isEditingActive(e.target) || isOverlayOpen()) {
      return;
    }

    // Single-key shortcuts should not trigger if Shift is held
    if (e.shiftKey) {
      return;
    }

    switch (e.key) {
      case 'h': {
        const col = getActiveColumn();
        if (col === 'right') {
          e.preventDefault();
          setActiveColumn('center');
        } else if (col === 'center' && hasVisiblePane('left')) {
          e.preventDefault();
          clearHighlight();
          setActiveColumn('left');
        }
        break;
      }

      case 'l': {
        const col = getActiveColumn();
        if (col === 'left') {
          e.preventDefault();
          setActiveColumn('center');
        } else if (col === 'center' && hasVisiblePane('right')) {
          e.preventDefault();
          clearHighlight();
          setActiveColumn('right');
        }
        break;
      }

      case 'j':
        e.preventDefault();
        if (getActiveColumn() !== 'center') {
          scrollActivePane('down');
        } else {
          scrollToNext();
        }
        break;

      case 'k':
        e.preventDefault();
        if (getActiveColumn() !== 'center') {
          scrollActivePane('up');
        } else {
          scrollToPrevious();
        }
        break;

      case 'Enter': {
        const active = document.activeElement;
        if (active && (active.tagName === 'A' || active.tagName === 'BUTTON')) {
          return;
        }
        if (getActiveColumn() !== 'center') {
          e.preventDefault();
          promoteActivePane();
          return;
        }
        e.preventDefault();
        toggleActiveSection();
        break;
      }

      case 'o':
        e.preventDefault();
        toggleActiveSection();
        break;

      case 'z': {
        const col = getActiveColumn();
        if (col === 'left' || col === 'right') {
          e.preventDefault();
          toggleMonocle(col);
        }
        break;
      }

      case 'w':
        e.preventDefault();
        triggerWander();
        break;

      case '/':
        e.preventDefault();
        focusSearch();
        break;

      case 'e':
        e.preventDefault();
        toggleExpandAll();
        break;

      case 't':
        e.preventDefault();
        toggleTheme();
        break;

      case 'p':
        e.preventDefault();
        triggerPull();
        break;

      case 'g':
        e.preventDefault();
        triggerGo();
        break;

      case 'b':
        e.preventDefault();
        triggerGoBeyond();
        break;

      case 'c':
        e.preventDefault();
        triggerWrite();
        break;

      case 's':
        e.preventDefault();
        triggerSynthesize();
        break;

      case 'a':
        e.preventDefault();
        triggerLookAround();
        break;

      case 'm':
        e.preventDefault();
        triggerPlay();
        break;
    }
  });
}
