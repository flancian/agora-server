// Copyright 2020 Google LLC
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

import { initializeStars } from './starring';





// these define default dynamic behaviour client-side, based on local storage preferences.
// these come from toggles in settings.ts.
const autoPullExtra = JSON.parse(localStorage["auto-pull-extra"] || 'false')
// This would make sense but Hedgedoc currently steals focus on embed and I've been unable to fix it so far :).
const autoPullSearch = JSON.parse(localStorage["auto-pull-search"] || 'false')
const autoPullWikipedia = JSON.parse(localStorage["auto-pull-wikipedia"] || 'false')
const autoExec = JSON.parse(localStorage["auto-exec"] || 'true')
const pullRecursive = JSON.parse(localStorage["pull-recursive"] || 'true')

import { initializeStars, initializeNodeStars } from './starring';
import { initSettings } from './settings';
import { safeJsonParse, darkenColor } from './util';
import { makeDraggable } from './draggable';
import { initDemoMode } from './demo';
import { initMusicPlayer } from './music';
import { renderGraph } from './graph';
import { initPullButtons } from './pull';

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DomContentLoaded");
  initSettings();

  // This function reads localStorage and hides any info-boxes that have been previously dismissed.
  // It's safe to call multiple times.
  function applyDismissals() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dismissed-')) {
            if (localStorage.getItem(key) === 'true') {
                const infoBoxId = key.substring('dismissed-'.length);
                const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
                if (infoBox) {
                    infoBox.classList.add("hidden");
                    infoBox.style.display = "none";
                }
            }
        }
    }
  }

  // Run on initial load for static elements.
  applyDismissals();

  // Event delegation for dismiss buttons.
  // This handles buttons present on initial load AND those added dynamically.
  document.body.addEventListener('click', function(event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('dismiss-button')) {
      const infoBoxId = target.getAttribute("info-box-id");
      const parentDiv = target.parentElement;
      if (parentDiv) {
        console.log("Dismissing info box: " + infoBoxId);
        parentDiv.classList.add("hidden");
        localStorage.setItem(`dismissed-${infoBoxId}`, "true");

        parentDiv.addEventListener("transitionend", function () {
          parentDiv.style.display = "none";
        }, { once: true });
      }
    }
  });

  // Observer to initialize stars on dynamically added subnodes.
  const starObserver = new MutationObserver((mutations) => {
      let needsUpdate = false;
      for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
              for (const node of mutation.addedNodes) {
                  if (node.nodeType === 1 && (node as HTMLElement).querySelector('.star-toggle')) {
                      needsUpdate = true;
                      break;
                  }
              }
          }
          if (needsUpdate) break;
      }
      if (needsUpdate) {
          console.log("New subnodes detected, re-initializing stars.");
          initializeStars();
      }
  });

  // Start observing the document body for child list changes.
  starObserver.observe(document.body, {
      childList: true,
      subtree: true
  });

  // Unified scroll button logic
  const scrollToggle = document.getElementById("scroll-toggle") as HTMLElement;

  if (scrollToggle) {
    const updateScrollButton = () => {
        // Check if we are at the bottom of the page (with a small tolerance)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
            scrollToggle.innerHTML = '▲';
            scrollToggle.title = 'Scroll to top';
        } else {
            scrollToggle.innerHTML = '▼';
            scrollToggle.title = 'Scroll to bottom';
        }
    };

    // Update button on scroll
    window.addEventListener('scroll', updateScrollButton);

    // Handle button click
    scrollToggle.addEventListener('click', () => {
        if (scrollToggle.innerHTML === '▲') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
  }

    // Make the Hypothesis frame draggable
  const hypothesisFrame = document.getElementById('hypothesis-frame');
  const dragHandle = document.getElementById('hypothesis-drag-handle');

  if (hypothesisFrame && dragHandle) {
    makeDraggable(hypothesisFrame, dragHandle, 'hypothesis-position');
  }

  // Event listener for the close button on the Hypothesis frame
  const hypothesisCloseBtn = document.getElementById('hypothesis-close-btn');
  const showHypothesisCheckbox = document.getElementById("show-hypothesis") as HTMLInputElement;
  const showHypothesisNavbar = document.getElementById("show-hypothesis-navbar") as HTMLInputElement;

  if (hypothesisCloseBtn && hypothesisFrame && showHypothesisCheckbox) {
    hypothesisCloseBtn.addEventListener('click', () => {
      hypothesisFrame.classList.remove('visible');
      showHypothesisCheckbox.checked = false;
      showHypothesisNavbar.checked = false;
      localStorage.setItem('show-hypothesis', 'false');
    });
  }

  // Function to sync hypothesis toggles and panel visibility
  const syncHypothesisState = (isVisible: boolean) => {
    if (hypothesisFrame) {
      hypothesisFrame.classList.toggle('visible', isVisible);
    }
    if (showHypothesisCheckbox) {
      showHypothesisCheckbox.checked = isVisible;
    }
    if (showHypothesisNavbar) {
      showHypothesisNavbar.checked = isVisible;
    }
    localStorage.setItem('show-hypothesis', isVisible.toString());
  };

  // Event listener for the "Show annotations" toggle in settings
  if (showHypothesisCheckbox) {
    showHypothesisCheckbox.addEventListener('change', () => {
      syncHypothesisState(showHypothesisCheckbox.checked);
    });
  }

  // Event listener for the new navbar toggle
  if (showHypothesisNavbar) {
    showHypothesisNavbar.addEventListener('change', () => {
      syncHypothesisState(showHypothesisNavbar.checked);
    });
  }

  // Watch for Hypothesis highlights and auto-show the panel
  const annotationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        const hasHighlights = Array.from(mutation.addedNodes).some(node => 
            node.nodeName.toLowerCase() === 'hypothesis-highlight' || (node as HTMLElement).querySelector?.('hypothesis-highlight')
        );

        if (hasHighlights) {
          const hypothesisFrame = document.getElementById('hypothesis-frame');
          const showHypothesisCheckbox = document.getElementById("show-hypothesis") as HTMLInputElement;

          if (hypothesisFrame && !hypothesisFrame.classList.contains('visible')) {
            console.log('Hypothesis highlight detected, showing panel.');
            hypothesisFrame.classList.add('visible');
            if (showHypothesisCheckbox) {
              showHypothesisCheckbox.checked = true;
            }
            localStorage.setItem('show-hypothesis', 'true');
          }
          // No need to continue observing if we've found what we're looking for in this batch.
          break; 
        }
      }
    }
  });

  annotationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Theme toggle stuff for initial load
  const themeCheckboxes = document.querySelectorAll(".theme-checkbox-input") as NodeListOf<HTMLInputElement>;
  const currentTheme = localStorage.getItem("theme");

  const setTheme = (theme: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("theme", theme);
    themeCheckboxes.forEach(checkbox => {
        checkbox.checked = theme === 'dark';
    });

    // Re-render graphs if they exist.
    if (document.getElementById('graph')) {
        renderGraph('graph', '/graph/json/' + NODENAME);
    }
    const fullGraphContainer = document.getElementById('full-graph');
    if (fullGraphContainer) {
        const activeTab = document.querySelector(".graph-size-tab.active");
        if (activeTab) {
            const size = activeTab.getAttribute('data-size');
            renderGraph('full-graph', `/graph/json/top/${size}`);
        }
    }
  };

  // Set the theme on initial load
  if (currentTheme === "dark") {
    setTheme('dark');
  } else {
    setTheme('light');
  }

  // Add event listeners to both checkboxes
  themeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        setTheme(checkbox.checked ? 'dark' : 'light');
    });
  });

  // Burger menu, where we keep settings presumably :)
  document.querySelectorAll(['#burger', '#join', '#join2']).forEach(element => {
    console.log(`Clicked ${element.id}`);
    element.addEventListener("click", function () {
      const overlay = document.getElementById('overlay');
      overlay.classList.toggle('active');
      document.body.classList.toggle('overlay-open');
      const overlayContent = overlay.querySelector('.overlay-content');
      if (overlayContent) {
        overlayContent.scrollTop = 0;
      }
    });
  });

  // Add click listener to the overlay to close it when clicking on the background
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) {
        this.classList.remove('active');
        document.body.classList.remove('overlay-open');
      }
    });
  }

  // Iframe navigation watcher.
  // We can't see *where* an iframe navigates due to Same-Origin Policy,
  // but we can detect *that* it has navigated and hide the (now incorrect) initial URL overlay.
  const setupIframeNavigationWatcher = (container) => {
    const iframe = container.querySelector('iframe');
    const overlay = container.querySelector('.iframe-url-overlay');
    if (!iframe || !overlay) return;

    let isInitialLoad = true;
    iframe.addEventListener('load', () => {
      if (isInitialLoad) {
        isInitialLoad = false;
      } else {
        // This is a subsequent load (navigation), so hide the overlay.
        overlay.style.display = 'none';
      }
    });
  };

  // Set up watcher for any iframes already on the page.
  document.querySelectorAll('.iframe-container').forEach(setupIframeNavigationWatcher);

  // And observe the DOM for any new iframe containers that get added asynchronously.
  const iframeObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && (node as HTMLElement).classList.contains('iframe-container')) {
          setupIframeNavigationWatcher(node);
        }
        // Also check for containers within the added node.
        (node as HTMLElement).querySelectorAll?.('.iframe-container').forEach(setupIframeNavigationWatcher);
      });
    });
  });

  iframeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Stuff to try to react to changes in iframes.
  // The following was generated by Claude Sonnet 3.5 on 2024-11-08.
  // Function to add load listener to a single iframe
  const addIframeListener = (iframe) => {
    console.log('Adding listener to iframe:', iframe.src || 'no src');

    try {
      iframe.addEventListener('load', () => {
        console.log('Iframe load event triggered:', iframe.src);
      });
    } catch (err) {
      console.error('Error adding listener:', err);
    }
  };

  // Log initial iframes
  console.log('Initial iframes:', document.querySelectorAll('iframe').length);

  // Add listeners to existing iframes
  document.querySelectorAll('iframe').forEach(addIframeListener);

  // Watch for new iframes being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      console.log('Mutation detected:', mutation.type);

      mutation.addedNodes.forEach(node => {
        // console.log('Added node type: ', node.nodeName);
        if (node.nodeName === 'IFRAME') {
          console.log('Added iframe: ', node.nodeName);
          addIframeListener(node);
        }
      });
    });
  });

  // Start observing with logging
  console.log('Starting observer');
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  console.log('Observer started');
  // end code from Claude Sonnet 3.5.

  // Responsive navbar rearrangement
  const setupNavbarLayoutEngine = () => {
    const toggleContainer = document.querySelector('.toggle-container');
    const searchButton = document.getElementById('mini-cli-exec');
    const scrollToggle = document.getElementById('scroll-toggle');
    
    const wideToggleContainer = document.querySelector('.navigation-content');
    const searchContainer = document.querySelector('.search-container');
    const actionBar = document.querySelector('.action-bar');

    if (!toggleContainer || !searchButton || !scrollToggle || !wideToggleContainer || !searchContainer || !actionBar) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 60em)');

    const handleLayoutChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
            // Mobile layout
            searchContainer.appendChild(toggleContainer);
            actionBar.appendChild(scrollToggle);
            actionBar.insertBefore(searchButton, actionBar.firstChild);
        } else {
            // Desktop layout
            wideToggleContainer.appendChild(toggleContainer);
            searchContainer.insertBefore(searchButton, searchContainer.firstChild);
            actionBar.appendChild(scrollToggle);
        }
    };

    mediaQuery.addEventListener('change', handleLayoutChange);
    handleLayoutChange(mediaQuery); // Initial check
  };

  setupNavbarLayoutEngine();

  // Scroll hints for horizontally scrollable elements
  const handleScrollHints = () => {
    document.querySelectorAll('.navigation-content, .action-bar, #footer').forEach(element => {
      const el = element as HTMLElement;
      const parent = el.parentElement;
      if (!parent) return;

      const isScrollable = el.scrollWidth > el.clientWidth;
      if (isScrollable) {
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        parent.classList.toggle('scrolled-to-end', isAtEnd);
      } else {
        parent.classList.add('scrolled-to-end');
      }
    });
  };

  // Add scroll event listeners
  document.querySelectorAll('.navigation-content, .action-bar, #footer').forEach(element => {
    element.addEventListener('scroll', handleScrollHints);
  });

  // Initial check on load and resize
  window.addEventListener('resize', handleScrollHints);
  handleScrollHints(); // Initial check


  // clear mini cli on clicking clear button
  /*
  document.querySelector("#mini-cli-clear").addEventListener("click", () => {
    console.log("clearing mini-cli");
    document.querySelector("#mini-cli").value = "";
  });
  */

  const miniCliExec = document.querySelector("#mini-cli-exec");
  if (miniCliExec) {
    miniCliExec.addEventListener("click", () => {
      console.log("exec mini-cli");
      let val = (document.querySelector("#mini-cli") as HTMLInputElement).value;
      (document.querySelector("#mini-cli").parentElement as HTMLFormElement).submit();
    });
  }

  const miniCliGo = document.querySelector("#mini-cli-go");
  if (miniCliGo) {
    miniCliGo.addEventListener("click", () => {
      console.log("go mini-cli executes");
      let val = (document.querySelector("#mini-cli") as HTMLInputElement).value;
      (document.querySelector("#mini-cli") as HTMLInputElement).value = 'go/' + val;
      (document.querySelector("#mini-cli").parentElement as HTMLFormElement).submit();
    });
  }

  initDemoMode();

  const toastContainer = document.getElementById('toast-container');
  //

	function showToast(message, duration = 3000) {
			// 1. Create a new toast element
			const toastElement = document.createElement('div');
			toastElement.className = 'toast'; // Start with base styles (hidden)
			toastElement.textContent = message;

			// 2. Add it to the container
			toastContainer.appendChild(toastElement);

			// 3. Force a browser repaint, then add the 'visible' class to trigger the transition
			// A tiny timeout is a reliable way to do this.
			setTimeout(() => {
					toastElement.classList.add('toast-visible');
			}, 10);

			// 4. Set a timer to remove the toast
			setTimeout(() => {
					// First, trigger the exit animation
					toastElement.classList.remove('toast-visible');

					// 5. Wait for the exit animation to finish before removing the element from the DOM
					toastElement.addEventListener('transitionend', () => {
							toastElement.remove();
					}, { once: true }); // Use 'once' so the listener cleans itself up

			}, duration);
	}

  const miniCliRetry = document.querySelector("#mini-cli-retry");
  if (miniCliRetry) {
    miniCliRetry.addEventListener("click", () => {
      console.log("retry mini-cli executes");
      const url = new URL(window.location.href);
      url.searchParams.set('t', new Date().getTime());
      window.location.href = url.href;
    });
  }

  const miniCliPull = document.querySelector("#mini-cli-pull");
  if (miniCliPull) {
    miniCliPull.addEventListener("click", (e) => {
      const button = e.currentTarget as HTMLElement;
      const isExpanded = button.dataset.state === 'expanded';

      if (isExpanded) {
        console.log("pull mini-cli executes: collapsing top-level details");
        document.querySelectorAll("details[open]").forEach(detail => {
          // Only click the summary if this <details> element is not nested within another <details> element.
          if (!detail.parentElement.closest('details')) {
              const summary = detail.querySelector(':scope > summary');
              if (summary) {
                  (summary as HTMLElement).click();
              }
          }
        });
        button.innerHTML = '🧲 pull';
        button.title = 'Tries to pull (embed) more into this context';
        button.dataset.state = 'collapsed';
      } else {
        console.log("pull mini-cli executes: expanding top-level details");
        document.querySelectorAll("details:not([open])").forEach(detail => {
          // Only click the summary if this <details> element is not nested within another <details> element.
          if (!detail.parentElement.closest('details')) {
              const summary = detail.querySelector(':scope > summary');
              if (summary) {
                  (summary as HTMLElement).click();
              }
          }
        });
        button.innerHTML = '✕ fold';
        button.title = 'Collapses all expanded sections';
        button.dataset.state = 'expanded';

        document.querySelectorAll(".pull-mastodon-status").forEach(element => {
          if (!element.classList.contains('pulled')) {
              console.log('auto pulling mastodon status from navbar');
              (element as HTMLElement).click();
          }
        });
      }
    });
  }

  /*
  document.querySelector("#internet-go").addEventListener("click", () => {
    console.log("go internet");
    window.location.href = 'https://google.com/search?q=' + NODEQ;
  });
  */

  // focus mini-cli on key combo
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode == 83) {
      const miniCli = document.querySelector("#mini-cli");
      miniCli.focus();
      miniCli.value = "";
    }
  });

  // pull arbitrary URL
  document.querySelectorAll(".pull-url").forEach(element => {
    element.addEventListener('click', function (e) {
      console.log("in pull-url!");
      if (this.classList.contains('pulled')) {
        // already pulled.
        this.innerText = 'pull';
        this.nextElementSibling.remove();
        this.classList.remove('pulled');
      } else {
        // pull.
        this.innerText = 'pulling';
        let url = this.value;
        console.log('pull url : ' + url);
        const iframe = document.createElement('iframe');
        iframe.className = 'stoa2-iframe';
        iframe.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; autoplay');
        iframe.src = url;
        this.after(iframe);
        this.innerText = 'fold';
        this.classList.add('pulled');
      }
    });
  });

  // pull a node from the default [[stoa]]
  document.querySelector("#pull-stoa")?.addEventListener("click", function (e) {
    console.log('clicked stoa button');
    if (this.classList.contains('pulled')) {
      // already pulled.
      this.innerText = 'pull';
      this.nextElementSibling.remove();
      document.querySelector("#stoa-iframe").innerHTML = '';
      this.classList.remove('pulled');
    } else {
      this.innerText = 'pulling';
      let node = this.value;
      document.querySelector("#stoa-iframe").innerHTML = '<iframe id="stoa-iframe" name="embed_readwrite" src="https://doc.anagora.org/' + node + '?edit"></iframe>';
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });

  async function statusContent(self) {
    let toot = self.value;
    let domain, post;
    // extract instance and :id, then use https://docs.joinmastodon.org/methods/statuses/ and get an oembed
    // there are two kinds of statuses we want to be able to embed: /web/ led and @user led.
    const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig
    const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig

    let m;
    console.log("testing type of presumed mastodon embed: " + toot);
    if (m = web_regex.exec(toot)) {
      console.log("found status of type /web/");
      domain = m[1];
      post = m[2];
    }
    if (m = user_regex.exec(toot)) {
      console.log("found status of type /@user/");
      domain = m[1];
      post = m[2];
    }

    let req = domain + '/api/v1/statuses/' + post
    console.log('req for statusContent: ' + req)
    try {
      const response = await fetch(req);
      const data = await response.json();
      console.log('status: ' + data['url']);
      let actual_url = data['url'];

      console.log('actual url for mastodon status: ' + actual_url);
      let oembed_req = domain + '/api/oembed?url=' + actual_url;
      const oembedResponse = await fetch(oembed_req);
      const oembedData = await oembedResponse.json();
      console.log('oembed: ' + oembedData['html']);
      self.insertAdjacentHTML('afterend', oembedData['html']);
    } catch (error) {
      console.error('Error fetching Mastodon status:', error);
    }
    self.innerText = 'pulled';
  }


  // start async content code.
  setTimeout(loadAsyncContent, 10)

  async function loadAsyncContent() {

    // this loads everything from the local node down to the footer.
    // prior to this as of 2023-12-06 we render the navbar, including search box, web search and stoas.
    var content = document.querySelector("#async-content");
    var node;
    let response; // Declare response here
    if (content != null) {
      node = content.getAttribute('src');
      console.log("loading " + node + " async");
    }
    else {
      node = NODENAME;
      console.log("loading " + node + " sync");
    }

    // give some time to Wikipedia to search before trying to pull it (if it's considered relevant here).
    setTimeout(autoPullAsync, 1000)

    // New, safe info box dismissal logic.
    // First, apply dismissals from localStorage.
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dismissed-')) {
            if (localStorage.getItem(key) === 'true') {
                const infoBoxId = key.substring('dismissed-'.length);
                const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
                if (infoBox) {
                    infoBox.classList.add("hidden");
                    infoBox.style.display = "none";
                }
            }
        }
    }

    // end infobox dismiss code.

    // bind stoas, search and genai early.
    var details = document.querySelectorAll("details.url");
    details.forEach((item) => {
      item.addEventListener("toggle", async (event) => {
        if (item.open) {
          console.log("Details have been shown");
          let embed = item.querySelector(".stoa-iframe, .edit-iframe");
          if (embed) {
            let url = embed.getAttribute('src');
            if (embed.classList.contains('edit-iframe')) {
                const user = localStorage.getItem('user') || 'flancian';
                const nodeUri = url.split('/').pop();
                url = `https://edit.anagora.org/@${user}/${nodeUri}`;
            }
            const iframeHTML = `<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="${url}" style="width: 100%;" height="700px"></iframe>`;
            const overlayHTML = `<a href="${url}" target="_blank" class="iframe-url-overlay" title="Open in new tab">${url}</a>`;
            embed.innerHTML = `<div class="iframe-container">${iframeHTML}${overlayHTML}</div>`;
          }
        } else {
          console.log("Details have been hidden");
          let embed = item.querySelector(".stoa-iframe, .edit-iframe");
          if (embed) {
            console.log("Embed found, here we would fold.");
            embed.innerHTML = '';
          }
        }
      });
    });

    var details = document.querySelectorAll("details.search");
    details.forEach((item) => {
      item.addEventListener("toggle", async (event) => {
        let searchEmbed;
        if (item.open) {
          console.log("Details have been shown");
          searchEmbed = item.querySelector(".pulled-search-embed");
          if (searchEmbed) {
            let qstr = searchEmbed.id;
            console.log("Search embed found, here we would pull.");
            const response = await fetch(AGORAURL + '/fullsearch/' + qstr);
            searchEmbed.innerHTML = await response.text();
          }
        } else {
          console.log("Details have been hidden");
          searchEmbed = item.querySelector(".pulled-search-embed");
          if (searchEmbed) {
            console.log("Search embed found, here we would fold.");
            searchEmbed.innerHTML = '';
          }
        }
      });
    });

    // same for GenAI if we have it enabled.
    const genaiContainer = document.querySelector("details.genai");
    if (genaiContainer) {
        const tabs = genaiContainer.querySelectorAll(".ai-provider-tab");
        const nodeId = NODENAME; // Assuming NODENAME is available globally
        const spinner = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Generating text...</em></p></center><br />`;

        const loadContent = async (provider, embedDiv) => {
            if (!embedDiv || embedDiv.innerHTML.trim() !== '') return;
            
            embedDiv.innerHTML = spinner;
            let endpoint = '';
            if (provider === 'mistral') {
                endpoint = '/api/complete/';
            } else if (provider === 'gemini') {
                endpoint = '/api/gemini_complete/';
            }

            if (endpoint) {
                try {
                    const response = await fetch(AGORAURL + endpoint + encodeURIComponent(nodeId));
                    const data = await response.json();

                    // Create a collapsible section for the prompt
                    const promptDetails = document.createElement('details');
                    const promptSummary = document.createElement('summary');
                    promptSummary.textContent = 'View Full Prompt';
                    promptDetails.appendChild(promptSummary);

                    const promptPre = document.createElement('pre');
                    promptPre.textContent = data.prompt;
                    promptDetails.appendChild(promptPre);
                    
                    // Clear the spinner and add the new content
                    embedDiv.innerHTML = '';
                    embedDiv.appendChild(promptDetails);

                    const answerDiv = document.createElement('div');
                    answerDiv.innerHTML = data.answer;
                    embedDiv.appendChild(answerDiv);

                    embedDiv.classList.add('visible');
                } catch (error) {
                    embedDiv.innerHTML = `<p>Error loading content: ${error}</p>`;
                }
            }
        };

        genaiContainer.addEventListener("toggle", (event) => {
            if ((genaiContainer as HTMLDetailsElement).open) {
                const activeTab = genaiContainer.querySelector(".ai-provider-tab.active");
                if (activeTab) {
                    const provider = activeTab.getAttribute('data-provider');
                    const embed = genaiContainer.querySelector(`.ai-embed[data-provider="${provider}"]`);
                    loadContent(provider, embed);
                }
            }
        });

        tabs.forEach(tab => {
            tab.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();

                const details = genaiContainer as HTMLDetailsElement;
                if (!details.open) {
                    details.open = true;
                }

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const provider = tab.getAttribute('data-provider');
                const embeds = genaiContainer.querySelectorAll(".ai-embed");
                embeds.forEach((embed: HTMLElement) => {
                    if (embed.dataset.provider === provider) {
                        embed.style.display = 'block';
                        loadContent(provider, embed);
                    } else {
                        embed.style.display = 'none';
                    }
                });
            });
        });
    }

    if (autoPullSearch) {
        // auto pull search by default.
        document.querySelectorAll("details.search").forEach(function (element) {
          console.log('auto pulling search');
          // We click the summary element to trigger the toggle event listener.
          const summary = element.querySelector('summary');
          if (summary && !(element as HTMLDetailsElement).open) {
            summary.click();
          }
        });
    }

    if (safeJsonParse(localStorage["auto-expand-stoas"], false)) {
        document.querySelectorAll("details.stoa").forEach(function (element) {
            console.log('auto expanding stoas');
            if (!(element as HTMLDetailsElement).open) {
                element.open = true;
            }
        });
    }

    if (autoPullWikipedia) {
        const observer = new MutationObserver((mutations, obs) => {
            const wikipediaDetails = document.querySelector("details.wikipedia");
            if (wikipediaDetails) {
                console.log('auto pulling wikipedia');
                const summary = wikipediaDetails.querySelector('summary');
                if (summary && !(wikipediaDetails as HTMLDetailsElement).open) {
                    summary.click();
                }
                obs.disconnect(); // Stop observing once we've found and clicked it.
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (content != null) {
      // block on node loading (expensive if the task is freshly up)
      response = await fetch(AGORAURL + '/node/' + node);
      content.outerHTML = await response.text();
    }

    setTimeout(bindEvents, 10)

  }

  async function autoPullAsync() {
    // autopull if the local node is empty.
    console.log('auto pulling resources');
    // }
  }

  async function bindEvents() {
    initializeStars();
    initializeNodeStars();
    applyDismissals(); // Run again for dynamically loaded info-boxes.

    const user = localStorage.getItem('user') || 'flancian';

    // Debounce function to limit how often a function can run.
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to sort subnodes, bringing the current user's to the top.
    const sortSubnodes = () => {
        const subnodesContainer = document.querySelector('.node[open]');
        if (!subnodesContainer) return;

        const allSubnodes = Array.from(subnodesContainer.querySelectorAll('details.subnode[data-author]'));
        if (allSubnodes.length < 2) return;

        const userSubnodes = allSubnodes.filter(subnode => (subnode as HTMLElement).dataset.author === user);
        if (userSubnodes.length === 0) return;

        // Move the elements to their new position.
        const firstSubnode = subnodesContainer.querySelector('details.subnode[data-author]');
        if (firstSubnode) {
            userSubnodes.reverse().forEach(subnode => {
                firstSubnode.parentNode.insertBefore(subnode, firstSubnode);
            });
        }

        // Add the highlight class, then remove it to fade back to normal.
        console.log(`Animating ${userSubnodes.length} subnodes for user ${user}.`);
        userSubnodes.forEach(subnode => {
            // Start the highlight.
            subnode.classList.add('subnode-arrived');
            // Set a timer to remove the highlight, which triggers the fade-out transition.
            setTimeout(() => {
                subnode.classList.remove('subnode-arrived');
            }, 100); // A short delay before fading back.
        });
    };

    // Initial sort after async content is loaded
    sortSubnodes();

    // New, safe info box dismissal logic.
    // This is duplicated from loadAsyncContent to handle elements that might be added after the initial load.
    // First, apply dismissals from localStorage.
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('dismissed-')) {
            if (localStorage.getItem(key) === 'true') {
                const infoBoxId = key.substring('dismissed-'.length);
                const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
                if (infoBox) {
                    infoBox.classList.add("hidden");
                    infoBox.style.display = "none";
                }
            }
        }
    }

    // end infobox dismiss code.

    // this works and has already replaced most pull buttons for Agora sections.
    // this is for 'zippies' that require pulling (e.g. pulled nodes).
    var details = document.querySelectorAll("details.node");
    details.forEach((item) => {
      item.addEventListener("toggle", (event) => {
        if (item.open) {
          console.log("Details have been shown");
          let nodeEmbed = item.querySelector(".node-embed");
          if (nodeEmbed) {
            let node = nodeEmbed.id;
            console.log("Node embed found, here we would pull.");
            nodeEmbed.innerHTML = '<iframe src="' + AGORAURL + '/' + node + '" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>';
          }
        } else {
          console.log("Details have been hidden");
          let nodeEmbed = item.querySelector(".node-embed");
          if (nodeEmbed) {
            console.log("Node embed found, here we would fold.");
            nodeEmbed.innerHTML = '';
          }
        }
      });
    });


    // end zippies.

    document.querySelectorAll(".pushed-subnodes-embed").forEach(async function (element) {
      // auto pull pushed subnodes by default.
      // it would be better to infer this from node div id?
      let node = NODENAME;
      let arg = ARG;
      let id = ".pushed-subnodes-embed";
      console.log('auto pulling pushed subnodes, will write to id: ' + id);
      let response;
      if (arg != '') {
      response = await fetch(AGORAURL + '/push/' + node + '/' + arg);
      } else {
      response = await fetch(AGORAURL + '/push/' + node);
      }
      const data = await response.text();
      document.querySelector(id).innerHTML = data;
      // end auto pull pushed subnodes.
    });

    document.querySelectorAll(".context").forEach(async function (element) {
      // auto pull context by default.
      // it would be better to infer this from node div id?
      let node = NODENAME;
      let id = '.context';
      console.log('auto pulling context, will write to id: ' + id);
      const response = await fetch(AGORAURL + '/context/' + node);
      const data = await response.text();
      document.querySelector(id).innerHTML = data;
      console.log('auto pulled context');
      
      // Finally!
      renderGraph('graph', '/graph/json/' + node);

      document.getElementById('graph-toggle-labels')?.addEventListener('click', () => {
          const currentSetting = safeJsonParse(localStorage.getItem('graph-show-labels'), true);
          localStorage.setItem('graph-show-labels', JSON.stringify(!currentSetting));
          renderGraph('graph', '/graph/json/' + node);
      });

      console.log("graph loaded.")
    });

    // end async content code.

    initPullButtons();

    // pull a pleroma status (toot) using the laziest way I found, might be a better one
    document.querySelectorAll(".pull-pleroma-status").forEach(element => {
      element.addEventListener("click", function (e) {
      let toot = this.value;
      const iframe = document.createElement('iframe');
      iframe.src = toot;
      iframe.className = 'mastodon-embed';
      iframe.style.maxWidth = '100%';
      iframe.width = '400';
      iframe.setAttribute('allowfullscreen', 'allowfullscreen');
      this.after(document.createElement('br'));
      this.after(iframe);
      const script = document.createElement('script');
      script.src = "https://freethinkers.lgbt/embed.js";
      script.async = true;
      this.after(script);
      this.innerText = 'pulled';
      });
    });

    // pull all/fold all button in main node
    document.querySelector("#pull-all")?.addEventListener("click", function (e) {
      console.log('auto pulling all!');
      document.querySelectorAll(".pull-node").forEach(element => {
      if (!element.classList.contains('pulled')) {
        console.log('auto pulling nodes');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-mastodon-status").forEach(element => {
      if (!element.classList.contains('pulled')) {
        console.log('auto pulling activity');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-tweet").forEach(element => {
      if (!element.classList.contains('pulled')) {
        console.log('auto pulling tweet');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-search").forEach(element => {
      if (!element.classList.contains('pulled')) {
        console.log('auto pulling search');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-url").forEach(element => {
      if (!element.classList.contains('pulled')) {
        console.log('auto pulling url');
        (element as HTMLElement).click();
      }
      });

      // experiment: make pull button expand all details.
      var details = document.querySelectorAll("details.related summary, details.pulled summary, details:not([open]):is(.node) summary, details.stoa > summary, details.search > summary");
      details.forEach(item => {
      console.log('trying to click details');
      (item as HTMLElement).click();
      });
    });

    // fold all button in intro banner.
    document.querySelector("#fold-all")?.addEventListener("click", function (e) {
      // Already pulled -> fold.
      document.querySelectorAll(".pull-node").forEach(element => {
      if (element.classList.contains('pulled')) {
        console.log('auto folding nodes');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-mastodon-status").forEach(element => {
      if (element.classList.contains('pulled')) {
        console.log('auto folding activity');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-tweet").forEach(element => {
      if (element.classList.contains('pulled')) {
        console.log('auto folding tweet');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-search").forEach(element => {
      if (element.classList.contains('pulled')) {
        console.log('auto folding search');
        (element as HTMLElement).click();
      }
      });
      document.querySelectorAll(".pull-url").forEach(element => {
      if (element.classList.contains('pulled')) {
        console.log('auto pulling url');
        (element as HTMLElement).click();
      }
      });

      // experiment: make fold button fold all details which are open.
      var details = document.querySelectorAll("details[open] > summary");
      details.forEach(item => {
      console.log('trying to click details');
      (item as HTMLElement).click();
      });
    });

    // For late rendered 'join' actions... YOLO :)
    document.querySelectorAll('#join2').forEach(element => {
      console.log(`Clicked ${element.id}`);
      element.addEventListener("click", function () {
        const overlay = document.getElementById('overlay');
        overlay.classList.toggle('active');
      });
    });

    // For the full graph in /nodes
    const fullGraphDetails = document.getElementById('full-graph-details');
    if (fullGraphDetails) {
        const tabs = fullGraphDetails.querySelectorAll(".graph-size-tab");
        let graphInstance;
        let labelsVisible = true;

        const loadGraph = (size) => {
            const url = size === 'all' ? '/graph./json/all' : `/graph/json/top/${size}`;
            renderGraph('full-graph', url);
        };

        fullGraphDetails.addEventListener('toggle', () => {
            if ((fullGraphDetails as HTMLDetailsElement).open) {
                const activeTab = fullGraphDetails.querySelector(".graph-size-tab.active");
                if (activeTab) {
                    const size = activeTab.getAttribute('data-size');
                    loadGraph(size);
                }
            }
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (!(fullGraphDetails as HTMLDetailsElement).open) {
                    (fullGraphDetails as HTMLDetailsElement).open = true;
                }

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const size = tab.getAttribute('data-size');
                loadGraph(size);
            });
        });

        document.getElementById('full-graph-toggle-labels')?.addEventListener('click', () => {
            const currentSetting = safeJsonParse(localStorage.getItem('graph-show-labels-full'), false);
            localStorage.setItem('graph-show-labels-full', JSON.stringify(!currentSetting));
            const activeTab = fullGraphDetails.querySelector(".graph-size-tab.active");
            if (activeTab) {
                const size = activeTab.getAttribute('data-size');
                loadGraph(size);
            }
        });
    }

    // Cache clearing buttons in footer.
    document.getElementById('mini-cli-cachez')?.addEventListener('click', (e) => {
        const button = e.currentTarget as HTMLButtonElement;
        const originalText = button.innerHTML;
        button.innerHTML = '🧠 Flushing...';
        button.disabled = true;

        fetch('/api/clear-in-memory-cache', {
            method: 'POST',
        })
        .then(response => {
            if (response.ok) {
                button.innerHTML = '🧠 Flushed!';
            } else {
                button.innerHTML = '🧠 Error!';
            }
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        })
        .catch(error => {
            console.error('Error flushing in-memory cache:', error);
            button.innerHTML = '🧠 Error!';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        });
    });

    document.getElementById('mini-cli-invalidate-sqlite')?.addEventListener('click', (e) => {
        const button = e.currentTarget as HTMLButtonElement;
        const originalText = button.innerHTML;
        button.innerHTML = '💾 Flushing...';
        button.disabled = true;

        fetch('/invalidate-sqlite', {
            method: 'POST',
        })
        .then(response => {
            if (response.ok) {
                button.innerHTML = '💾 Flushed!';
            } else {
                button.innerHTML = '💾 Error!';
            }
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        })
        .catch(error => {
            console.error('Error invalidating SQLite:', error);
            button.innerHTML = '💾 Error!';
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 2000);
        });
    });

    // Collapsible content handler
    const initializeCollapsibleContent = () => {
        document.querySelectorAll('.collapsible-content').forEach(content => {
            if ((content as HTMLElement).dataset.processed) return;

            const button = document.querySelector(`.show-more-button[data-target="${content.id}"]`) as HTMLElement;
            if (button) {
                // Check if the content is overflowing
                if (content.scrollHeight > content.clientHeight) {
                    button.style.display = 'block';
                } else {
                    // If not overflowing, remove the gradient effect and ensure it's fully visible
                    content.classList.add('expanded');
                }
            }
            (content as HTMLElement).dataset.processed = 'true';
        });
    };

    // Initial check
    initializeCollapsibleContent();

    // Observer for dynamically added content
    const collapsibleObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                initializeCollapsibleContent();
                break; 
            }
        }
    });
    collapsibleObserver.observe(document.body, { childList: true, subtree: true });


    document.querySelectorAll('.show-more-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const targetId = (event.target as HTMLElement).dataset.target;
            const content = document.getElementById(targetId);
            if (content) {
                content.classList.add('expanded');
                (event.target as HTMLElement).style.display = 'none';
            }
        });
    });

    initMusicPlayer();
  }
  // end bindEvents();

  function setOverlayPosition() {
    const nav = document.querySelector('nav');
    const overlay = document.querySelector('.overlay');
    if (nav && overlay) {
      const navHeight = nav.offsetHeight;
      (overlay as HTMLElement).style.top = navHeight + 'px';
      (overlay as HTMLElement).style.height = `calc(100% - ${navHeight}px)`;
    }
  }

  window.addEventListener('load', setOverlayPosition);
  window.addEventListener('resize', setOverlayPosition);

  const webContainer = document.querySelector('details.web');
  if (webContainer) {
      const tabs = webContainer.querySelectorAll('.web-provider-tab');

      const loadContent = (provider, embedDiv) => {
          if (!embedDiv || embedDiv.innerHTML.trim() !== '') return;
          
          const tabElement = webContainer.querySelector(`.web-provider-tab[data-provider="${provider}"]`);
          const url = (tabElement as HTMLElement).dataset.url;
          const externalLink = (tabElement.nextElementSibling as HTMLAnchorElement).href;

          // Show a spinner while we check for embeddability
          embedDiv.innerHTML = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Checking embeddability...</em></p></center><br />`;

          fetch(`/api/check_embeddable?url=${encodeURIComponent(url)}`)
              .then(response => response.json())
              .then(data => {
                  if (data.embeddable) {
                      const iframeHTML = `<iframe src="${url}" style="max-width: 99.5%;" width="99.5%" height="700em" allowfullscreen="allowfullscreen"></iframe>`;
                      const overlayHTML = `<a href="${url}" target="_blank" class="iframe-url-overlay" title="Open in new tab">${url}</a>`;
                      embedDiv.innerHTML = `<div class="iframe-container">${iframeHTML}${overlayHTML}</div>`;
                  } else {
                      embedDiv.innerHTML = `
                          <div class="subnode node">
                              This provider has disabled embedding for security reasons, often to prevent an attack called 'clickjacking' where a malicious site might try to trick you into clicking something on the embedded page.
                              <br/><br/>
                              You can <a href="${externalLink}" target="_blank">open the search results in a new tab</a> instead.
                          </div>
                      `;
                  }
              });
      };

      webContainer.addEventListener("toggle", (event) => {
          if ((webContainer as HTMLDetailsElement).open) {
              const activeTab = webContainer.querySelector(".web-provider-tab.active");
              if (activeTab) {
                  const provider = activeTab.getAttribute('data-provider');
                  const embed = webContainer.querySelector(`.web-embed[data-provider="${provider}"]`);
                  loadContent(provider, embed);
              }
          }
      });

      tabs.forEach(tab => {
          tab.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();

              if (!(webContainer as HTMLDetailsElement).open) {
                  (webContainer as HTMLDetailsElement).open = true;
              }

              tabs.forEach(t => t.classList.remove('active'));
              tab.classList.add('active');

              const provider = tab.getAttribute('data-provider');
              const embeds = webContainer.querySelectorAll(".web-embed");
              embeds.forEach((embed) => {
                  if ((embed as HTMLElement).dataset.provider === provider) {
                      (embed as HTMLElement).style.display = 'block';
                      loadContent(provider, embed);
                  } else {
                      (embed as HTMLElement).style.display = 'none';
                  }
              });
          });
      });
  }

  const wpWtContainer = document.getElementById('wp-wt-container');
  if (wpWtContainer) {
    fetch('/exec/wp/' + NODENAME)
        .then(response => response.text())
        .then(html => {
            if (html.trim()) {
                const placeholder = wpWtContainer.querySelector('.node');
                if (placeholder) {
                    placeholder.classList.add('fade-out');
                    placeholder.addEventListener('animationend', () => {
                        wpWtContainer.innerHTML = html;
                        const newContent = wpWtContainer.querySelector('.node');
                        if (newContent) {
                            newContent.classList.add('fade-in');
                        }

                        // Re-attach event listeners for the new content
                        if (localStorage.getItem('auto-pull-wikipedia') === 'true') {
                            (wpWtContainer.querySelector('.wiki') as HTMLDetailsElement)?.setAttribute('open', '');
                        }

                        wpWtContainer.querySelectorAll('.wiki-provider-tab').forEach(tab => {
                            tab.addEventListener('click', e => {
                                e.preventDefault();
                                const details = wpWtContainer.querySelector('.wiki');
                                if (details && !details.hasAttribute('open')) {
                                    details.setAttribute('open', '');
                                }

                                const provider = (e.target as HTMLElement).dataset.provider;
                                wpWtContainer.querySelectorAll('.wiki-provider-tab').forEach(t => t.classList.remove('active'));
                                (e.target as HTMLElement).classList.add('active');
                                wpWtContainer.querySelectorAll('.wiki-embed').forEach(embed => {
                                    if ((embed as HTMLElement).dataset.provider === provider) {
                                        (embed as HTMLElement).style.display = 'block';
                                    } else {
                                        (embed as HTMLElement).style.display = 'none';
                                    }
                                });
                            });
                        });
                        applyDismissals(); // Run again, as the wp info-box is now in the DOM.
                    }, { once: true });
                } else {
                    // Fallback for safety
                    wpWtContainer.innerHTML = html;
                    applyDismissals(); // Also run here in the fallback case.
                }
            }
        });
  }
  
	


  // go to the specified URL
  document.querySelectorAll(".go-url").forEach(element => {
    element.addEventListener("click", function () {
      let url = (this as HTMLInputElement).value;
      (this as HTMLElement).innerText = 'going';
      window.location.href = url;
    });
  });

  if (autoExec) {
    console.log('autoexec is enabled')

    // commenting out as focus stealing issues are just too disruptive.
    // setTimeout(autoPullStoaOnEmpty, 5000)

    document.querySelectorAll(".context-all").forEach(function (element) {
      // auto pull whole Agora graph in /nodes.
      const detailsElement = element.closest('details');
      if (detailsElement) {
          detailsElement.addEventListener('toggle', () => {
              if (detailsElement.open) {
                  const placeholder = document.getElementById('full-graph-placeholder');
                  if (placeholder) {
                      placeholder.addEventListener('click', async () => {
                          const container = document.getElementById('full-graph-container');
                          const spinner = `<br /><center><p><div class="spinner"><img src="/static/img/agora.png" class="logo"></img></div></p><p><em>Loading graph... (please wait)</em></p></center><br />`;
                          container.innerHTML = spinner;

                          try {
                              const response = await fetch(AGORAURL + '/context/all');
                              container.innerHTML = await response.text();
                          } catch (error) {
                              container.innerHTML = `<p>Error loading graph: ${error}</p>`;
                          }
                      }, { once: true });
                  }
              }
          });
      }
    });

    console.log('dynamic execution for node begins: ' + NODENAME)

    // Begin Wikipedia code -- this is hacky/could be refactored (but then again, that applies to most of the Agora! :)
    const req_wikipedia = AGORAURL + '/exec/wp/' + encodeURI(NODENAME);
    console.log('req for Wikipedia: ' + req_wikipedia);
    try {
      const response = await fetch(req_wikipedia);
      const data = await response.text();
      const wikiSearchElement = document.querySelector(".wiki-search");
      if (data && wikiSearchElement) {
        console.log('Got some data from Wikipedia, showing data');
        (wikiSearchElement as HTMLElement).style.display = '';
        wikiSearchElement.innerHTML = data;
      } else {
        console.log('got empty data from Wikipedia, hiding div');
        if (wikiSearchElement) {
          (wikiSearchElement as HTMLElement).style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
    }

    // Once more for Wiktionary, yolo :)
    let req_wiktionary = AGORAURL + '/exec/wt/' + encodeURI(NODENAME)
    console.log('req for Wiktionary: ' + req_wiktionary)

    try {
      const response = await fetch(req_wiktionary);
      const data = await response.text();
      const wiktionaryElement = document.querySelector(".wiktionary-search");
      if (data && wiktionaryElement) {
      wiktionaryElement.innerHTML = data;
      } else {
      console.log('got empty data from Wiktionary, hiding div');
      if (wiktionaryElement) {
        (wiktionaryElement as HTMLElement).style.display = 'none';
      }
      }
    } catch (error) {
      console.error('Error fetching Wiktionary data:', error);
    }
  }

  if (autoPullExtra) {
    console.log('auto pulling external resources!');
    document.querySelectorAll(".pull-mastodon-status").forEach(function (element) {
      console.log('auto pulling activity');
      (element as HTMLElement).click();
    });
    document.querySelectorAll(".pull-tweet").forEach(function (element) {
      console.log('auto pulling tweet');
      (element as HTMLElement).click();
    });
    document.querySelectorAll(".pull-related-node").forEach(function (element) {
      console.log('auto pulling related node');
      (element as HTMLElement).click();
    });
    document.querySelectorAll(".pull-url").forEach(function (element) {
      console.log('auto pulling url');
      (element as HTMLElement).click();
    });
    document.querySelectorAll(".pull-node").forEach(function (element) {
      console.log('auto pulling node');
      (element as HTMLElement).click();
    });
    }

        // Get the elements
    const featureLinkDialog = document.getElementById('feature-link-dialog');
    // Check if the link exists on this page before adding listener
    if (featureLinkDialog) {
        const dialog = document.getElementById('not-implemented-dialog');
        const closeButton = document.getElementById('close-dialog-btn');

        // Check if dialog and button exist
        if (dialog && closeButton) {
            // Add click listener to the link
            featureLinkDialog.addEventListener('click', function(ev) {
                ev.preventDefault();
                (dialog as HTMLDialogElement).showModal();
            });

            // Add click listener to the close button
            closeButton.addEventListener('click', function() {
                (dialog as HTMLDialogElement).close();
            });

            // Optional: Close on backdrop click
            dialog.addEventListener('click', function(e) {
              if (e.target === dialog) {
                 (dialog as HTMLDialogElement).close();
              }
            });
        }
    }


});