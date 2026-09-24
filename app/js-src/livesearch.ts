// Copyright 2026 Google LLC
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

export interface LiveSearchResult {
  title: string;
  node: string;
  uri: string;
  type: 'node' | 'content' | 'user';
  users?: string[];
  count?: number;
  snippet?: string | null;
}

interface LiveSearchApiResponse {
  query: string;
  results: LiveSearchResult[];
}

let dropdownEl: HTMLElement | null = null;
let currentItems: LiveSearchResult[] = [];
let activeIndex = -1;
let currentAbortController: AbortController | null = null;
let debounceTimer: number | null = null;
const searchCache = new Map<string, LiveSearchResult[]>();
const MAX_CACHE_SIZE = 50;

/**
 * Creates or retrieves the floating dropdown element.
 */
function getOrCreateDropdown(): HTMLElement {
  if (dropdownEl && document.body.contains(dropdownEl)) {
    return dropdownEl;
  }
  const existing = document.getElementById('live-search-dropdown');
  if (existing) {
    dropdownEl = existing;
    return dropdownEl;
  }

  const dropdown = document.createElement('div');
  dropdown.id = 'live-search-dropdown';
  dropdown.className = 'live-search-dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.setAttribute('aria-label', 'Search suggestions');
  dropdown.style.display = 'none';
  document.body.appendChild(dropdown);
  dropdownEl = dropdown;
  return dropdown;
}

/**
 * Updates the fixed position and width of the dropdown to match #mini-cli.
 */
export function updateDropdownPosition(): void {
  const miniCli = document.getElementById('mini-cli') as HTMLInputElement | null;
  if (!dropdownEl || !miniCli || dropdownEl.style.display === 'none') {
    return;
  }

  const rect = miniCli.getBoundingClientRect();
  dropdownEl.style.top = `${Math.round(rect.bottom + 4)}px`;
  dropdownEl.style.left = `${Math.round(rect.left)}px`;
  dropdownEl.style.width = `${Math.max(Math.round(rect.width), 320)}px`;
  dropdownEl.style.maxWidth = `calc(100vw - ${Math.round(rect.left + 16)}px)`;
}

/**
 * Closes the live search dropdown.
 */
export function closeLiveSearch(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (dropdownEl) {
    dropdownEl.style.display = 'none';
    dropdownEl.innerHTML = '';
  }
  currentItems = [];
  activeIndex = -1;
}

/**
 * Highlights matches in text safely without unescaped HTML injections.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safely renders a snippet that might have trusted <b> tags from SQLite snippet().
 */
function sanitizeSnippet(snippet: string): string {
  const parts = snippet.split(/(<\/?b>)/g);
  return parts
    .map(part => {
      if (part === '<b>' || part === '</b>') {
        return part;
      }
      return escapeHtml(part);
    })
    .join('');
}

/**
 * Renders the search results inside the dropdown.
 */
function renderResults(query: string, results: LiveSearchResult[]): void {
  const dropdown = getOrCreateDropdown();
  currentItems = results;
  activeIndex = -1;

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="live-search-empty">
        <span class="live-search-empty-text">No direct matches found for "<strong>${escapeHtml(query)}</strong>"</span>
        <a class="live-search-item fullsearch-link" href="/?q=${encodeURIComponent(query)}">
          <span class="live-search-icon">🔍</span>
          <span class="live-search-title">Press <kbd>↵ Enter</kbd> for full Agora search</span>
        </a>
      </div>
    `;
    dropdown.style.display = 'block';
    updateDropdownPosition();
    return;
  }

  const itemsHtml = results
    .map((item, index) => {
      let icon = '📗';
      let typeLabel = 'Node';
      if (item.type === 'user') {
        icon = '👩‍🌾';
        typeLabel = 'User';
      } else if (item.type === 'content') {
        icon = '📄';
        typeLabel = 'Content';
      }

      const usersHtml =
        item.users && item.users.length > 0
          ? `<span class="live-search-users">${item.users
              .slice(0, 3)
              .map(u => `@${escapeHtml(u)}`)
              .join(' ')}${item.users.length > 3 ? ' …' : ''}</span>`
          : '';

      const snippetHtml = item.snippet
        ? `<div class="live-search-snippet">${sanitizeSnippet(item.snippet)}</div>`
        : '';

      return `
        <div class="live-search-item" data-index="${index}" role="option" aria-selected="false">
          <div class="live-search-row">
            <span class="live-search-icon">${icon}</span>
            <span class="live-search-title">${escapeHtml(item.title)}</span>
            <span class="live-search-badge live-search-badge-${item.type}">${typeLabel}</span>
            ${usersHtml}
          </div>
          ${snippetHtml}
        </div>
      `;
    })
    .join('');

  dropdown.innerHTML = `
    <div class="live-search-results-list">
      ${itemsHtml}
    </div>
    <div class="live-search-footer">
      <a class="live-search-footer-action" href="/?q=${encodeURIComponent(query)}">
        <span class="live-search-footer-icon">🔍</span>
        <span>Full search for "<strong>${escapeHtml(query)}</strong>"</span>
      </a>
      <span class="live-search-hints"><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> select <kbd>esc</kbd> close</span>
    </div>
  `;

  dropdown.style.display = 'block';
  updateDropdownPosition();

  // Attach click events to items
  dropdown.querySelectorAll('.live-search-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      // Prevent input blur before click finishes
      e.preventDefault();
    });
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-index') || '-1', 10);
      if (idx >= 0 && idx < currentItems.length) {
        window.location.href = currentItems[idx].uri;
      }
    });
  });
}

/**
 * Updates visually active item selection in the dropdown.
 */
function updateActiveItem(): void {
  if (!dropdownEl) return;
  const items = dropdownEl.querySelectorAll('.live-search-item');
  items.forEach((item, idx) => {
    if (idx === activeIndex) {
      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    }
  });
}

/**
 * Dispatches an asynchronous live search request with debouncing, caching, and in-flight cancellation.
 */
async function fetchLiveSearch(query: string): Promise<void> {
  const cleanQ = query.trim();
  if (cleanQ.length < 2) {
    closeLiveSearch();
    return;
  }

  // Check cache first for instantaneous response
  if (searchCache.has(cleanQ)) {
    renderResults(cleanQ, searchCache.get(cleanQ)!);
    return;
  }

  // Cancel prior in-flight request
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  try {
    const res = await fetch(`/api/search/live?q=${encodeURIComponent(cleanQ)}`, {
      signal: currentAbortController.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as LiveSearchApiResponse;

    // Cache the result in LRU cache
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const firstKey = searchCache.keys().next().value;
      if (firstKey) searchCache.delete(firstKey);
    }
    searchCache.set(cleanQ, data.results || []);

    // Only render if input value still matches
    const miniCli = document.getElementById('mini-cli') as HTMLInputElement | null;
    if (miniCli && miniCli.value.trim().toLowerCase() === cleanQ.toLowerCase()) {
      renderResults(cleanQ, data.results || []);
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      // Aborted as expected
      return;
    }
    console.error('Live search error:', err);
  }
}

/**
 * Initializes the Live Search and Quick Switcher module.
 */
export function initLiveSearch(): void {
  const miniCli = document.getElementById('mini-cli') as HTMLInputElement | null;
  if (!miniCli) return;

  // Prevent browser autofill popping over dropdown
  miniCli.setAttribute('autocomplete', 'off');

  // Input listener with debouncing (250ms)
  miniCli.addEventListener('input', () => {
    const val = miniCli.value;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (val.trim().length < 2) {
      closeLiveSearch();
      return;
    }

    debounceTimer = window.setTimeout(() => {
      fetchLiveSearch(val);
    }, 250);
  });

  // Keyboard navigation
  miniCli.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!dropdownEl || dropdownEl.style.display === 'none' || currentItems.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentItems.length;
      updateActiveItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length;
      updateActiveItem();
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < currentItems.length) {
        e.preventDefault();
        window.location.href = currentItems[activeIndex].uri;
      }
      // If activeIndex == -1, allow default form submit!
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeLiveSearch();
    } else if (e.key === 'Tab') {
      if (activeIndex >= 0 && activeIndex < currentItems.length) {
        e.preventDefault();
        miniCli.value = currentItems[activeIndex].node;
      }
    }
  });

  // Focus & Blur
  miniCli.addEventListener('focus', () => {
    const val = miniCli.value.trim();
    if (val.length >= 2) {
      fetchLiveSearch(val);
    }
  });

  miniCli.addEventListener('blur', () => {
    // Delay dismissal slightly so clicks on results execute
    setTimeout(() => {
      closeLiveSearch();
    }, 200);
  });

  // Reposition on window resize or scroll
  window.addEventListener('resize', updateDropdownPosition);
  window.addEventListener('scroll', updateDropdownPosition, { passive: true });

  // Dismiss when clicking outside
  document.addEventListener('click', (e: MouseEvent) => {
    if (!dropdownEl || dropdownEl.style.display === 'none') return;
    const target = e.target as Node;
    if (!dropdownEl.contains(target) && target !== miniCli) {
      closeLiveSearch();
    }
  });
}
