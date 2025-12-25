
// app/js-src/settings.ts

import { CLIENT_DEFAULTS, safeJsonParse } from './util';
import { renderGraph } from './graph';

declare const NODENAME: string;

export function initSettings() {
    // set values from storage
    (document.getElementById("user") as HTMLInputElement).value = localStorage["user"] || CLIENT_DEFAULTS.user;
    (document.getElementById("auto-expand-all") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-expand-all"], CLIENT_DEFAULTS.autoExpandAll);
    (document.getElementById("auto-expand-search") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-expand-search"], CLIENT_DEFAULTS.autoExpandSearch);
    (document.getElementById("auto-expand-wikipedia") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-expand-wikipedia"], CLIENT_DEFAULTS.autoExpandWikipedia);
    (document.getElementById("auto-pull") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-pull"], CLIENT_DEFAULTS.autoPull);
    (document.getElementById("show-brackets") as HTMLInputElement).checked = safeJsonParse(localStorage["showBrackets"], CLIENT_DEFAULTS.showBrackets);

    // Set graph label visibility from storage, defaulting to true.
    // This also writes the canonical value back to both storage keys to ensure consistency on first load.
    const showLabelsCheckbox = document.getElementById("show-graph-labels") as HTMLInputElement;
    if (showLabelsCheckbox) {
        const initialShowLabels = safeJsonParse(localStorage["graph-show-labels"], CLIENT_DEFAULTS.showGraphLabels);
        showLabelsCheckbox.checked = initialShowLabels;
        localStorage["graph-show-labels"] = initialShowLabels;
        localStorage["graph-show-labels-full"] = initialShowLabels;
    }

    (document.getElementById("show-hypothesis") as HTMLInputElement).checked = safeJsonParse(localStorage["show-hypothesis"], CLIENT_DEFAULTS.showHypothesis);
    (document.getElementById("auto-expand-stoas") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-expand-stoas"], CLIENT_DEFAULTS.autoExpandStoas);
    (document.getElementById("demo-timeout-seconds") as HTMLInputElement).value = localStorage.getItem("demo-timeout-seconds") || CLIENT_DEFAULTS.demoTimeoutSeconds;
    (document.getElementById("show-edit-section") as HTMLInputElement).checked = safeJsonParse(localStorage["show-edit-section"], CLIENT_DEFAULTS.showEditSection);

    // Function to apply the bracket visibility style
    const applyBracketVisibility = () => {
        const shouldShow = (document.getElementById("show-brackets") as HTMLInputElement).checked;
        const markers = document.querySelectorAll(".wikilink-marker");
        markers.forEach(marker => {
            (marker as HTMLElement).style.display = shouldShow ? 'inline' : 'none';
        });
    };

    // Apply styles on initial load
    applyBracketVisibility();

    // Toggle Hypothesis visibility on initial load
    const hypothesisFrame = document.getElementById('hypothesis-frame');
    if (hypothesisFrame && (document.getElementById("show-hypothesis") as HTMLInputElement).checked) {
        hypothesisFrame.classList.add('visible');
    }

    // Toggle Edit Section visibility on initial load
    const editSection = document.querySelector('.edit-section-container');
    if (editSection && !(document.getElementById("show-edit-section") as HTMLInputElement).checked) {
        (editSection as HTMLElement).style.display = 'none';
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
    document.getElementById("user")?.addEventListener('change', (e) => {
        localStorage["user"] = (e.target as HTMLInputElement).value;
    });

    const applyUser = () => {
        const user = (document.getElementById("user") as HTMLInputElement).value;
        localStorage["user"] = user;
        // @ts-ignore
        if (window.showToast) window.showToast(`Browsing Agora as ${user}...`);
        
        // Delay reload to let the toast be seen/animation start
        setTimeout(() => location.reload(), 1000);
    };

    // Handle Enter key on username input
    document.getElementById("user")?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            applyUser();
        }
    });

    document.getElementById("apply-user")?.addEventListener('click', () => {
        applyUser();
    });

    document.getElementById("apply-settings")?.addEventListener('click', () => {
        location.reload();
    });

    document.getElementById("auto-expand-all")?.addEventListener('change', (e) => {
        localStorage["auto-expand-all"] = (e.target as HTMLInputElement).checked;
    });

    document.getElementById("auto-expand-search")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["auto-expand-search"] = isChecked;
        document.querySelectorAll("details.search").forEach(function (element) {
            const summary = element.querySelector('summary');
            if (summary) {
                const isOpen = (element as HTMLDetailsElement).open;
                if (isChecked && !isOpen) {
                    summary.click();
                } else if (!isChecked && isOpen) {
                    summary.click();
                }
            }
        });
    });
    document.getElementById("auto-expand-wikipedia")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["auto-expand-wikipedia"] = isChecked;
        // The container is #wp-wt-container, the details element has class .wiki
        const wikipediaDetails = document.querySelector("details.wiki");
        if (wikipediaDetails) {
            const summary = wikipediaDetails.querySelector('summary');
            if (summary) {
                const isOpen = (wikipediaDetails as HTMLDetailsElement).open;
                if (isChecked && !isOpen) {
                    summary.click();
                } else if (!isChecked && isOpen) {
                    summary.click();
                }
            }
        }
    });
    document.getElementById("auto-pull")?.addEventListener('change', (e) => {
        localStorage["auto-pull"] = (e.target as HTMLInputElement).checked;
    });
    document.getElementById("show-brackets")?.addEventListener('change', (e) => {
        localStorage["showBrackets"] = (e.target as HTMLInputElement).checked;
    });

    document.getElementById("show-graph-labels")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        // Save setting for both per-node and full-agora graphs.
        localStorage["graph-show-labels"] = isChecked;
        localStorage["graph-show-labels-full"] = isChecked;

        // Re-render the per-node graph if it exists.
        // @ts-ignore
        if (document.getElementById('graph') && typeof renderGraph !== 'undefined') {
            // @ts-ignore
            renderGraph('graph', '/graph/json/' + NODENAME);
        }
        // Re-render the full-agora graph if it exists.
        const fullGraphContainer = document.getElementById('full-graph');
        // @ts-ignore
        if (fullGraphContainer && typeof renderGraph !== 'undefined') {
            const activeTab = document.querySelector(".graph-size-tab.active");
            if (activeTab) {
                const size = activeTab.getAttribute('data-size');
                // @ts-ignore
                renderGraph('full-graph', `/graph/json/top/${size}`);
            }
        }
    });

    document.getElementById("auto-expand-stoas")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["auto-expand-stoas"] = isChecked;
        document.querySelectorAll("details.stoa").forEach(function (element) {
            (element as HTMLDetailsElement).open = isChecked;
        });
    });

    document.getElementById("demo-timeout-seconds")?.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).value;
        localStorage.setItem("demo-timeout-seconds", value);
    });

    document.getElementById("show-hypothesis")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["show-hypothesis"] = isChecked;
        const hypothesisFrame = document.getElementById('hypothesis-frame');
        if (hypothesisFrame) {
            hypothesisFrame.classList.toggle('visible', isChecked);
        }
    });

    document.getElementById("show-edit-section")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["show-edit-section"] = isChecked;
        const editSection = document.querySelector('.edit-section-container');
        if (editSection) {
            (editSection as HTMLElement).style.display = isChecked ? 'block' : 'none';
        }
    });

    // Join form handler
    const joinBtn = document.getElementById("join-submit-btn");
    const contractCheckbox = document.getElementById("join-contract") as HTMLInputElement;
    const hostMeCheckbox = document.getElementById("join-host-me") as HTMLInputElement;
    
    // Form containers
    const emailContainer = document.getElementById("join-email-container");
    const repoContainer = document.getElementById("join-repo-container");
    const webUrlContainer = document.getElementById("join-web-url-container");
    const formatContainer = document.getElementById("join-format-container");

    if (hostMeCheckbox) {
        hostMeCheckbox.addEventListener('change', () => {
            if (hostMeCheckbox.checked) {
                // Host Me Mode
                if (repoContainer) repoContainer.style.display = 'none';
                if (webUrlContainer) webUrlContainer.style.display = 'none';
                if (formatContainer) formatContainer.style.display = 'none';
            } else {
                // Bring your own garden Mode
                if (repoContainer) repoContainer.style.display = 'block';
                if (webUrlContainer) webUrlContainer.style.display = 'block';
                if (formatContainer) formatContainer.style.display = 'block';
            }
        });
    }

    if (contractCheckbox && joinBtn) {
        contractCheckbox.addEventListener('change', () => {
            if (contractCheckbox.checked) {
                joinBtn.removeAttribute("disabled");
                joinBtn.style.opacity = "1";
                joinBtn.style.cursor = "pointer";
            } else {
                joinBtn.setAttribute("disabled", "true");
                joinBtn.style.opacity = "0.6";
                joinBtn.style.cursor = "not-allowed";
            }
        });
    }

    // Event delegation for dynamically added "Set User" button
    document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('set-user-btn')) {
            const user = target.dataset.user;
            if (user) {
                localStorage.setItem('user', user);
                const userInput = document.getElementById("user") as HTMLInputElement;
                if (userInput) userInput.value = user;
                // @ts-ignore
                if (window.showToast) window.showToast(`Now browsing as ${user}!`);
                target.innerText = "Done! (Reloading...)";
                setTimeout(() => location.reload(), 1000);
            }
        }
    });

    if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
            const statusDiv = document.getElementById("join-status");
            if (!statusDiv) return;
            
            const usernameInput = document.getElementById("join-username") as HTMLInputElement;
            const repoInput = document.getElementById("join-repo") as HTMLInputElement;
            const formatInput = document.getElementById("join-format") as HTMLSelectElement;
            const webUrlInput = document.getElementById("join-web-url") as HTMLInputElement;
            const messageInput = document.getElementById("join-message") as HTMLTextAreaElement;
            const emailInput = document.getElementById("join-email") as HTMLInputElement;
            
            const username = usernameInput.value.trim();
            const message = messageInput ? messageInput.value.trim() : '';
            const hostMe = hostMeCheckbox ? hostMeCheckbox.checked : false;
            const email = emailInput ? emailInput.value.trim() : '';
            
            let repoUrl = '';
            let format = 'markdown';
            let webUrl = '';

            if (hostMe) {
                if (!username || !email) {
                    statusDiv.innerText = "Please fill in username and email.";
                    statusDiv.style.color = "red";
                    return;
                }
            } else {
                repoUrl = repoInput.value.trim();
                format = formatInput ? formatInput.value : 'markdown';
                webUrl = webUrlInput ? webUrlInput.value.trim() : '';
                
                if (!username || !email || !repoUrl) {
                    statusDiv.innerText = "Please fill in username, email, and repo URL.";
                    statusDiv.style.color = "red";
                    return;
                }
            }
            
            statusDiv.innerText = "Processing...";
            statusDiv.style.color = "inherit";
            joinBtn.setAttribute("disabled", "true");
            
            try {
                const response = await fetch("/api/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        username, 
                        repo_url: repoUrl, 
                        format, 
                        web_url: webUrl, 
                        message,
                        email,
                        host_me: hostMe
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    let successMsg = "Success! " + (data.message || "You have joined the Agora.");
                    if (hostMe && data.password) {
                        // Display the generated password for hosted gardens
                        successMsg += `<br><br><strong>Your new garden is ready!</strong><br>
                        Clone URL: <code>${data.repo_url}</code><br>
                        Username: <strong>${data.username}</strong><br>
                        Password: <strong>${data.password}</strong><br>
                        <br><em>Please save this password immediately! It will not be shown again.</em>
                        <br><br><button class="set-user-btn" data-user="${data.username}">Browse Agora as ${data.username}</button>`;
                    }
                    statusDiv.innerHTML = successMsg; // Use innerHTML to render bold tags
                    statusDiv.style.color = "lightgreen";
                    // Optionally refresh or redirect
                } else {
                    statusDiv.innerText = "Error: " + (data.error || "Unknown error.");
                    statusDiv.style.color = "red";
                    joinBtn.removeAttribute("disabled");
                }
            } catch (e) {
                statusDiv.innerText = "Network error: " + e;
                statusDiv.style.color = "red";
                joinBtn.removeAttribute("disabled");
            }
        });
    }
}
