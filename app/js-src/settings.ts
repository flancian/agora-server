
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
        location.reload();
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
        // Content Settings
        localStorage["auto-expand-all"] = (document.getElementById("auto-expand-all") as HTMLInputElement).checked;
        localStorage["auto-pull"] = (document.getElementById("auto-pull") as HTMLInputElement).checked;
        localStorage["auto-expand-wikipedia"] = (document.getElementById("auto-expand-wikipedia") as HTMLInputElement).checked;
        localStorage["auto-expand-search"] = (document.getElementById("auto-expand-search") as HTMLInputElement).checked;
        localStorage["auto-expand-stoas"] = (document.getElementById("auto-expand-stoas") as HTMLInputElement).checked;

        // Display Settings
        localStorage["showBrackets"] = (document.getElementById("show-brackets") as HTMLInputElement).checked;
        localStorage["show-edit-section"] = (document.getElementById("show-edit-section") as HTMLInputElement).checked;
        
        const showGraphLabels = (document.getElementById("show-graph-labels") as HTMLInputElement).checked;
        localStorage["graph-show-labels"] = showGraphLabels;
        localStorage["graph-show-labels-full"] = showGraphLabels;

        const showHypothesis = (document.getElementById("show-hypothesis") as HTMLInputElement).checked;
        localStorage["show-hypothesis"] = showHypothesis;

        location.reload();
    });

    // We no longer auto-save these on change, as the user now must explicitly click "Apply & Reload".
    // The previous event listeners for these inputs have been removed.

    document.getElementById("demo-timeout-seconds")?.addEventListener('change', (e) => {
        const value = (e.target as HTMLInputElement).value;
        localStorage.setItem("demo-timeout-seconds", value);
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
                    let successMsg = "";
                    if (hostMe && data.password) {
                        // Rich success message for hosted gardens
                        successMsg = `
                        <div style="background: rgba(0, 255, 0, 0.1); padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid lightgreen; color: inherit;">
                            <h3 style="margin-top: 0; color: lightgreen;">🎉 Welcome, ${data.username}!</h3>
                            <p>Your digital garden has been successfully provisioned.</p>
                            
                            <div style="margin: 15px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid #555;">
                                <div style="margin-bottom: 5px;"><strong>Username:</strong> <code style="user-select: all; font-size: 1.1em;">${data.username}</code></div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <strong>Password:</strong> 
                                    <code style="user-select: all; background: #ffffcc; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 1.2em;">${data.password}</code>
                                    <button id="copy-password-btn" style="cursor: pointer; padding: 2px 8px; font-size: 0.9em;">Copy</button>
                                </div>
                                <div style="margin-top: 10px; color: #ffeb3b; font-weight: bold;">
                                    ⚠️ IMPORTANT: Log in to the <a href="${data.editor_url}" target="_blank" style="color: inherit; text-decoration: underline;">Editor</a> or <a href="${data.forge_url}" target="_blank" style="color: inherit; text-decoration: underline;">Forge</a> NOW to save this password in your browser!
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                                <a href="${data.editor_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Launch Editor 🐂</a>
                                <a href="${data.forge_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Code Forge 🔨</a>
                                <a href="${data.agora_url}" target="_blank" class="btn" style="background: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 1.1em;">Your Profile 👤</a>
                            </div>
                            
                            <button class="set-user-btn" data-user="${data.username}" style="background: transparent; border: 1px solid currentColor; padding: 5px 10px; cursor: pointer; color: inherit; opacity: 0.8;">Browse locally as @${data.username}</button>
                        </div>`;
                    } else {
                        // Standard success message for self-hosted
                        successMsg = `
                        <div style="color: lightgreen;">
                            Success! ${data.message || "You have joined the Agora."}
                            <br><br>
                            <a href="/@${username}" target="_blank" style="color: lightgreen; text-decoration: underline;">View your Profile 👤</a>
                            <br><br>
                            <button class="set-user-btn" data-user="${username}" style="background: transparent; border: 1px solid currentColor; padding: 5px 10px; cursor: pointer; color: inherit;">Browse locally as @${username}</button>
                        </div>`;
                    }
                    statusDiv.innerHTML = successMsg; 
                    statusDiv.style.color = "inherit";

                    // Attach event listener for copy button if it exists
                    const copyBtn = document.getElementById("copy-password-btn");
                    if (copyBtn) {
                        copyBtn.addEventListener("click", () => {
                            navigator.clipboard.writeText(data.password).then(() => {
                                copyBtn.innerText = "Copied!";
                                setTimeout(() => copyBtn.innerText = "Copy", 2000);
                            });
                        });
                    }
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
