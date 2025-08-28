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

/**
 * Darkens a hex color by a given percentage.
 * @param {string} color - The hex color code (e.g., "#RRGGBB").
 * @param {number} percent - The percentage to darken by (0 to 100).
 * @returns {string} The new, darkened hex color code.
 */
function darkenColor(color, percent) {
    // If color is invalid, return a default fallback.
    if (typeof color !== 'string' || !color) {
        return '#000000';
    }

    // Ensure the color starts with a hash
    if (color.startsWith('#')) {
        color = color.slice(1);
    }

    // Parse the R, G, B values
    const num = parseInt(color, 16);
    let r = (num >> 16);
    let g = (num >> 8) & 0x00FF;
    let b = num & 0x0000FF;

    // Apply the darkening percentage
    const factor = 1 - (percent / 100);
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);

    // Ensure values are within the 0-255 range
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Convert back to a hex string and pad with zeros if needed
    const darkened = `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
    
    return darkened;
}


// these define default dynamic behaviour client-side, based on local storage preferences.
// these come from toggles in settings.ts.
const autoPullExtra = JSON.parse(localStorage["auto-pull-extra"] || 'false')
// This would make sense but Hedgedoc currently steals focus on embed and I've been unable to fix it so far :).
const autoPullSearch = JSON.parse(localStorage["auto-pull-search"] || 'false')
const autoPullWikipedia = JSON.parse(localStorage["auto-pull-wikipedia"] || 'false')
const autoExec = JSON.parse(localStorage["auto-exec"] || 'true')
const pullRecursive = JSON.parse(localStorage["pull-recursive"] || 'true')

function safeJsonParse(value: string, defaultValue: any) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DomContentLoaded");

  // set values from storage
  (document.getElementById("ranking") as HTMLInputElement).value = localStorage["ranking"] || '';
  (document.getElementById("auto-pull-search") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-pull-search"], false);
  (document.getElementById("auto-pull-wikipedia") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-pull-wikipedia"], false);
  (document.getElementById("render-wikilinks") as HTMLInputElement).checked = safeJsonParse(localStorage["render-wikilinks"], true);
  (document.getElementById("show-brackets") as HTMLInputElement).checked = safeJsonParse(localStorage["showBrackets"], false);
  (document.getElementById("show-hypothesis") as HTMLInputElement).checked = safeJsonParse(localStorage["show-hypothesis"], false);
  (document.getElementById("auto-expand-stoas") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-expand-stoas"], true);

  // Function to apply the wikilink rendering style
  const applyWikilinkStyle = () => {
    const shouldRender = (document.getElementById("render-wikilinks") as HTMLInputElement).checked;
    if (shouldRender) {
      document.body.classList.remove('no-wikilinks');
    } else {
      document.body.classList.add('no-wikilinks');
    }
  };

  // Function to apply the bracket visibility style
  const applyBracketVisibility = () => {
    const shouldShow = (document.getElementById("show-brackets") as HTMLInputElement).checked;
    const markers = document.querySelectorAll(".wikilink-marker");
    markers.forEach(marker => {
        (marker as HTMLElement).style.display = shouldShow ? 'inline' : 'none';
    });
  };

  // Apply styles on initial load
  applyWikilinkStyle();
  applyBracketVisibility();

  // Toggle Hypothesis visibility on initial load
  const hypothesisFrame = document.getElementById('hypothesis-frame');
  if (hypothesisFrame && (document.getElementById("show-hypothesis") as HTMLInputElement).checked) {
    hypothesisFrame.classList.add('visible');
  }

  // Watch for new nodes being added to the DOM and re-apply the style
  const bracketObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        applyBracketVisibility();
      }
    });
  });
  bracketObserver.observe(document.body, { childList: true, subtree: true });


  // Add event listeners to checkboxes to apply style on change
  const renderWikilinksCheckbox = document.getElementById("render-wikilinks");
  if (renderWikilinksCheckbox) {
    renderWikilinksCheckbox.addEventListener('change', applyWikilinkStyle);
  }
  const showBracketsCheckbox = document.getElementById("show-brackets");
  if (showBracketsCheckbox) {
    showBracketsCheckbox.addEventListener('change', applyBracketVisibility);
  }

  // bind clear button (why is this here? good question!)
  var clear = document.getElementById("clear-settings");
  clear.addEventListener("click", function () {
    console.log("clearing settings");
    localStorage.clear();
    location.reload();
  });

  // Auto-save settings on change
  document.getElementById("ranking")?.addEventListener('change', (e) => {
    localStorage["ranking"] = (e.target as HTMLInputElement).value;
  });
  document.getElementById("auto-pull-search")?.addEventListener('change', (e) => {
    localStorage["auto-pull-search"] = (e.target as HTMLInputElement).checked;
    location.reload();
  });
  document.getElementById("auto-pull-wikipedia")?.addEventListener('change', (e) => {
    localStorage["auto-pull-wikipedia"] = (e.target as HTMLInputElement).checked;
    location.reload();
  });
  document.getElementById("render-wikilinks")?.addEventListener('change', (e) => {
    localStorage["render-wikilinks"] = (e.target as HTMLInputElement).checked;
  });
  document.getElementById("show-brackets")?.addEventListener('change', (e) => {
    localStorage["showBrackets"] = (e.target as HTMLInputElement).checked;
  });

  document.getElementById("auto-expand-stoas")?.addEventListener('change', (e) => {
    localStorage["auto-expand-stoas"] = (e.target as HTMLInputElement).checked;
    location.reload();
  });

  document.getElementById("show-hypothesis")?.addEventListener('change', (e) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    localStorage["show-hypothesis"] = isChecked;
    const hypothesisFrame = document.getElementById('hypothesis-frame');
    if (hypothesisFrame) {
      hypothesisFrame.classList.toggle('visible', isChecked);
    }
  });

  document.getElementById("hypothesis-close-btn")?.addEventListener('click', () => {
    const hypothesisFrame = document.getElementById('hypothesis-frame');
    if (hypothesisFrame) {
      hypothesisFrame.classList.remove('visible');
    }
    const showHypothesisCheckbox = document.getElementById("show-hypothesis") as HTMLInputElement;
    if (showHypothesisCheckbox) {
        showHypothesisCheckbox.checked = false;
    }
    localStorage["show-hypothesis"] = false;
  });

  // Make the Hypothesis frame draggable
  const dragHandle = document.getElementById('hypothesis-drag-handle');

  if (hypothesisFrame && dragHandle) {
    let active = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const setTranslate = (xPos, yPos, el) => {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Restore position from local storage
    const savedPosition = localStorage.getItem('hypothesis-position');
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        xOffset = pos.x;
        yOffset = pos.y;
        setTranslate(xOffset, yOffset, hypothesisFrame);
    }

    const dragStart = (e) => {
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === dragHandle) {
        active = true;
      }
    }

    const dragEnd = (e) => {
      initialX = currentX;
      initialY = currentY;
      active = false;
      // Save position to local storage
      localStorage.setItem('hypothesis-position', JSON.stringify({ x: xOffset, y: yOffset }));
    }

    const drag = (e) => {
      if (active) {
        e.preventDefault();
        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, hypothesisFrame);
      }
    }

    dragHandle.addEventListener('mousedown', dragStart, false);
    dragHandle.addEventListener('touchstart', dragStart, false);

    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('touchend', dragEnd, false);

    document.addEventListener('mousemove', drag, false);
    document.addEventListener('touchmove', drag, false);
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
  const toggles = document.querySelectorAll(".theme-toggle");
  const currentTheme = localStorage.getItem("theme");

  // Set the theme on initial load
  if (currentTheme === "dark") {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggles.forEach(toggle => {
      if (toggle) toggle.innerHTML = '🌞';
    });
  } else {
    // Default to light theme
    document.documentElement.setAttribute('data-theme', 'light');
    toggles.forEach(toggle => {
      if (toggle) toggle.innerHTML = '🌙';
    });
  }

  // Then listen for clicks on the theme toggle button or the link text
  const clickable = document.querySelectorAll('.theme-toggle, .theme-toggle-text');
  clickable.forEach(element => {
    element.addEventListener('click', function (event) {
      event.preventDefault(); // Stop the browser from jumping to the top of the page.
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const toggles = document.querySelectorAll(".theme-toggle");
      if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem("theme", "dark");
        toggles.forEach(toggle => {
          if (toggle) toggle.innerHTML = '🌞';
        });
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem("theme", "light");
        toggles.forEach(toggle => {
          if (toggle) toggle.innerHTML = '🌙';
        });
      }
      renderGraph(); // Re-render the graph with the new theme
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

  // clear mini cli on clicking clear button
  /*
  document.querySelector("#mini-cli-clear").addEventListener("click", () => {
    console.log("clearing mini-cli");
    document.querySelector("#mini-cli").value = "";
  });
  */

  document.querySelector("#mini-cli-exec").addEventListener("click", () => {
    console.log("exec mini-cli");
    let val = document.querySelector("#mini-cli").value;
    document.querySelector("#mini-cli").parentElement.submit();
  });

  document.querySelector("#mini-cli-go").addEventListener("click", () => {
    console.log("go mini-cli executes");
    let val = document.querySelector("#mini-cli").value;
    document.querySelector("#mini-cli").value = 'go/' + val;
    document.querySelector("#mini-cli").parentElement.submit();
  });

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

  document.querySelector("#mini-cli-retry").addEventListener("click", () => {
    console.log("retry mini-cli executes");
    const url = new URL(window.location.href);
    url.searchParams.set('t', new Date().getTime());
    window.location.href = url.href;
  });

  document.querySelector("#mini-cli-pull").addEventListener("click", () => {
    console.log("pull mini-cli executes");
    document.querySelectorAll("details:not([open]) > summary").forEach(summary => {
        (summary as HTMLElement).click();
    });
  });

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

    req = domain + '/api/v1/statuses/' + post
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

    // Check local storage to see if the info boxes should be hidden
    const dismissButtons = document.querySelectorAll(".dismiss-button");
    dismissButtons.forEach(button => {
      const infoBoxId = button.getAttribute("info-box-id");
      const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
      // Add click event to the dismiss button

      if (localStorage.getItem(`dismissed-${infoBoxId}`) === "true") {
        infoBox.classList.add("hidden");
        infoBox.style.display = "none";
      }

      button.addEventListener("click", function () {
        const parentDiv = button.parentElement;
        console.log("Dismissing info box");
        parentDiv.classList.add("hidden");
        localStorage.setItem(`dismissed-${infoBoxId}`, "true");

        // Optionally, you can completely remove the element from the DOM after the transition
        parentDiv.addEventListener("transitionend", function () {
          parentDiv.style.display = "none";
        }, { once: true });

      });
    });
    // end infobox dismiss code.

    // bind stoas, search and genai early.
    var details = document.querySelectorAll("details.url");
    details.forEach((item) => {
      item.addEventListener("toggle", async (event) => {
        if (item.open) {
          console.log("Details have been shown");
          embed = item.querySelector(".stoa-iframe");
          if (embed) {
            let url = embed.getAttribute('src');
            embed.innerHTML = '<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="' + url + '" style="width: 100%;" height="700px"></iframe>';
          }
        } else {
          console.log("Details have been hidden");
          embed = item.querySelector(".stoa-iframe");
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
        if (item.open) {
          console.log("Details have been shown");
          searchEmbed = item.querySelector(".pulled-search-embed");
          if (searchEmbed) {
            let qstr = searchEmbed.id;
            console.log("Search embed found, here we would pull.");
            response = await fetch(AGORAURL + '/fullsearch/' + qstr);
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
                    embedDiv.innerHTML = await response.text();
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

    if (safeJsonParse(localStorage["auto-expand-stoas"], true)) {
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

    // Check local storage to see if the info boxes should be hidden
    const dismissButtons = document.querySelectorAll(".dismiss-button");
    dismissButtons.forEach(button => {
      const infoBoxId = button.getAttribute("info-box-id");
      const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
      // Add click event to the dismiss button

      if (localStorage.getItem(`dismissed-${infoBoxId}`) === "true") {
        infoBox.classList.add("hidden");
        infoBox.style.display = "none";
      }

      button.addEventListener("click", function () {
        const parentDiv = button.parentElement;
        parentDiv.classList.add("hidden");
        localStorage.setItem(`dismissed-${infoBoxId}`, "true");

        // Optionally, you can completely remove the element from the DOM after the transition
        parentDiv.addEventListener("transitionend", function () {
          parentDiv.style.display = "none";
        }, { once: true });

      });
    });
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
      renderGraph();

      document.getElementById('graph-toggle-labels')?.addEventListener('click', () => {
          const currentSetting = safeJsonParse(localStorage.getItem('graph-show-labels'), true);
          localStorage.setItem('graph-show-labels', JSON.stringify(!currentSetting));
          renderGraph();
      });

      console.log("graph loaded.")
    });

    // end async content code.

    // pull nodes from the [[agora]]
    // pull-node are high-ranking (above the 'fold' of context), .pull-related-node are looser links below.
    document.querySelectorAll(".pull-node").forEach(element => {
      element.addEventListener("click", function (e) {
      let node = this.value;

      if (this.classList.contains('pulled')) {
        // already pulled.
        document.querySelector(`#${node}.pulled-node-embed`).innerHTML = '';
        this.innerText = 'pull';
        this.classList.remove('pulled');
      } else {
        this.innerText = 'pulling';
        console.log('pulling node');
        // now with two methods! you can choose the simpler/faster one (just pulls static content) or the nerdy one (recursive) in settings.
        if (pullRecursive) {
        document.querySelector(`#${node}.pulled-node-embed`).innerHTML = `<iframe src="${AGORAURL}/embed/${node}" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>`;
        } else {
        fetch(`${AGORAURL}/pull/${node}`)
          .then(response => response.text())
          .then(data => {
          document.querySelector(`#${node}.pulled-node-embed`).innerHTML = data;
          });
        }
        this.innerText = 'fold';
        this.classList.add('pulled');
      }
      });
    });

    // pull arbitrary URL
    document.querySelectorAll(".pull-url").forEach(element => {
      element.addEventListener("click", function (e) {
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

    document.querySelectorAll(".pull-tweet").forEach(element => {
      element.addEventListener("click", function (e) {
      if (this.classList.contains('pulled')) {
        const div = this.nextElementSibling;
        div.remove();
        this.innerText = 'pull';
        this.classList.remove('pulled');
      } else {
        this.innerText = 'pulling';
        let tweet = this.value;
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'twitter-tweet';
        blockquote.setAttribute('data-theme', 'dark');
        blockquote.innerHTML = `<a href="${tweet}"></a>`;
        this.after(blockquote);
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://platform.twitter.com/widgets.js";
        script.charset = "utf-8";
        this.after(script);
        this.classList.add('pulled');
        this.innerText = 'fold';
      }
      });
    });

    // pull a mastodon status (toot) using the roughly correct way IIUC.
    document.querySelectorAll(".pull-mastodon-status").forEach(element => {
      element.addEventListener("click", function (e) {
      if (this.classList.contains('pulled')) {
        const div = this.nextElementSibling;
        div.remove();
        this.innerText = 'pull';
        this.classList.remove('pulled');
      } else {
        this.innerText = 'pulling';
        statusContent(this);
        this.classList.add('pulled');
        this.innerText = 'fold';
      }
      });
    });

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

  }
  // end bindEvents();

  async function renderGraph() {
    const container = document.getElementById('graph');
    if (!container) return;

    // Clear previous graph if any
    container.innerHTML = '';

    const darkPalette = {
        bg: 'rgba(0, 0, 0, 0)', // Transparent background
        edge: 'rgba(150, 150, 150, 1)',
        text: '#bfbfbf',
        nodeBg: 'rgba(50, 50, 50, 1)'
    };

    const lightPalette = {
        bg: 'rgba(0, 0, 0, 0)', // Transparent background
        edge: 'rgba(50, 50, 50, 1)',
        text: '#000000',
        nodeBg: '#f0f0f0'
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const palette = currentTheme === 'dark' ? darkPalette : lightPalette;
    const showLabels = safeJsonParse(localStorage.getItem('graph-show-labels'), true);

    console.log("loading graph...")
    fetch("/graph/json/" + NODENAME)
    .then(res => res.json())
    .then(data => {
        const Graph = ForceGraph()(container);

        Graph.height(container.clientHeight)
            .width(container.clientWidth)
            .backgroundColor(palette.bg)
            .onNodeClick(node => {
                let url = (node as any).id;
                location.assign(url)
            })
            .graphData(data)
            .nodeId('id')
            .nodeVal('val')
            .nodeAutoColorBy('group');

        if (showLabels) {
            Graph.nodeCanvasObject((node, ctx, globalScale) => {
                const label = (node as any).name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                ctx.fillStyle = palette.nodeBg;
                ctx.fillRect((node as any).x - bckgDimensions[0] / 2, (node as any).y - bckgDimensions[1] / 2, ...bckgDimensions);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Theme-aware node colors.
                let color = (node as any).color;
                if (currentTheme === 'light') {
                    // simple heuristic to darken colors for light theme.
                    color = darkenColor(color, 40);
                }
                ctx.fillStyle = color;
                ctx.fillText(label, (node as any).x, (node as any).y);

                (node as any).__bckgDimensions = bckgDimensions;
            })
            .nodePointerAreaPaint((node, color, ctx) => {
                ctx.fillStyle = color;
                const bckgDimensions = (node as any).__bckgDimensions;
                bckgDimensions && ctx.fillRect((node as any).x - bckgDimensions[0] / 2, (node as any).y - bckgDimensions[1] / 2, ...bckgDimensions);
            });
        } else {
            // In no-label mode, make the nodes smaller.
            Graph.nodeRelSize(2);
        }

        Graph.linkDirectionalArrowLength(3)
            .linkColor(() => palette.edge);

        Graph.zoom(3);
        Graph.cooldownTime(5000);
        Graph.onEngineStop(() => Graph.zoomToFit(400));
    })
    .catch(error => console.error('Error fetching or rendering graph:', error));
  }

  // go to the specified URL
  document.querySelectorAll(".go-url").forEach(element => {
    element.addEventListener("click", function () {
      let url = (this as HTMLInputElement).value;
      (this as HTMLElement).innerText = 'going';
      window.location.replace(url);
    });
  });

  if (autoExec) {
    console.log('autoexec is enabled')

    // commenting out as focus stealing issues are just too disruptive.
    // setTimeout(autoPullStoaOnEmpty, 5000)

    document.querySelectorAll(".context-all").forEach(function (element) {
      // auto pull whole Agora graph in /nodes.
      let id = '.context-all';
      console.log('auto pulling whole Agora graph, will write to id: ' + id);
      fetch(AGORAURL + '/context/all')
      .then(response => response.text())
      .then(data => {
        document.querySelector(id).innerHTML = data;
      });
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
