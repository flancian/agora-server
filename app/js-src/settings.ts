
// app/js-src/settings.ts

import { CLIENT_DEFAULTS, safeJsonParse } from './util';
import { renderGraph } from './graph';

declare const NODENAME: string;

export function initSettings() {
    // set values from storage
    (document.getElementById("user") as HTMLInputElement).value = localStorage["user"] || CLIENT_DEFAULTS.user;
    (document.getElementById("auto-pull-search") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-pull-search"], CLIENT_DEFAULTS.autoPullSearch);
    (document.getElementById("auto-pull-wikipedia") as HTMLInputElement).checked = safeJsonParse(localStorage["auto-pull-wikipedia"], CLIENT_DEFAULTS.autoPullWikipedia);
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

    document.getElementById("apply-user")?.addEventListener('click', () => {
        location.reload();
    });

    document.getElementById("auto-pull-search")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["auto-pull-search"] = isChecked;
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
    document.getElementById("auto-pull-wikipedia")?.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        localStorage["auto-pull-wikipedia"] = isChecked;
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
}
