
// app/js-src/demo.ts

import { makeDraggable } from './draggable';
import { CLIENT_DEFAULTS, safeJsonParse } from './util';

export function initDemoMode() {
    if (window.self !== window.top) return;
    const demoCheckboxes = document.querySelectorAll(".demo-checkbox-input") as NodeListOf<HTMLInputElement>;
    const autoscrollCheckboxes = document.querySelectorAll(".autoscroll-checkbox-input, #auto-scroll-demo") as NodeListOf<HTMLInputElement>;
    const meditationPopupContainer = document.getElementById("meditation-popup-container");
    const meditationPopupContent = document.getElementById("meditation-popup-body");
    const meditationCloseButton = document.getElementById("meditation-popup-close-btn");

    let demoIntervalId: number | null = null;
    let isDraggableInitialized = false;
    let meditationDraggable: { reposition: (force?: boolean) => void } | null = null;

    const stopGentleScroll = () => {
        if ((window as any).gentleScrollInterval) {
            console.log('Clearing gentle scroll interval.');
            clearInterval((window as any).gentleScrollInterval);
            (window as any).gentleScrollInterval = null;
        }
        if ((window as any).gentleScrollTimeout) {
            console.log('Clearing gentle scroll timeout.');
            clearTimeout((window as any).gentleScrollTimeout);
            (window as any).gentleScrollTimeout = null;
        }
    };

    // Pause demo mode if user engages in active typing/editing
    const cancelOnEditing = (event: Event) => {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            // Do not pause if the target is one of the toggle checkboxes
            if (target.classList.contains('demo-checkbox-input') || 
                target.classList.contains('autoscroll-checkbox-input') ||
                target.classList.contains('theme-checkbox-input') ||
                target.classList.contains('music-checkbox-input')) {
                return;
            }
            console.log('Deep demo mode paused: user engaged in typing/editing.');
            const mainCheckbox = document.getElementById('demo-checkbox') as HTMLInputElement;
            if (mainCheckbox && mainCheckbox.checked) {
                mainCheckbox.checked = false;
                mainCheckbox.dispatchEvent(new Event('change'));
            }
        }
    };

    const cancelDeepDemo = () => {
        stopGentleScroll();
        if (demoIntervalId) {
            console.log('Cancelling deep demo timer.');
            clearInterval(demoIntervalId);
            demoIntervalId = null;
            const timerElement = document.getElementById('demo-timer');
            if (timerElement) {
                timerElement.innerHTML = '';
                timerElement.style.display = 'none';
            }
            window.removeEventListener('focusin', cancelOnEditing);
            updateDemoTooltip(false);
            console.log('Deep demo mode cancelled.');
        }
    };

    const startDeepDemo = () => {
        hidePopup();
        cancelDeepDemo(); // Ensure no multiple timers are running
        console.log('Starting deep demo mode.');

        const timeoutSeconds = parseInt(localStorage.getItem("demo-timeout-seconds") || CLIENT_DEFAULTS.demoTimeoutSeconds, 10);
        let countdown = timeoutSeconds;
        const timerElement = document.getElementById('demo-timer');
        if (timerElement) {
            timerElement.style.display = 'inline-block';
        }

        const updateTimer = () => {
            if (timerElement) {
                timerElement.innerHTML = `<span>${countdown}</span>`;
            }
            updateDemoTooltip(true, countdown);
        };

        updateTimer();

        const tick = () => {
            countdown--;
            updateTimer();
            if (countdown <= 0) {
                if (demoIntervalId) {
                    clearInterval(demoIntervalId);
                    demoIntervalId = null;
                }
                // Fetch the random node URL first to ensure clean history navigation (avoiding 302 stack confusion)
                fetch('/random', { method: 'HEAD' })
                    .then(res => {
                        if (!res.ok) {
                            console.warn(`Demo Mode: Server returned status ${res.status} on /random. Retrying in 5 seconds...`);
                            if ((window as any).showToast) {
                                (window as any).showToast(`🌱 Agora resting (${res.status}). Retrying in 5s...`);
                            }
                            countdown = 5;
                            updateTimer();
                            demoIntervalId = window.setInterval(tick, 1000);
                            return;
                        }
                        try {
                            const destUrl = new URL(res.url);
                            // Safety check: only allow navigation if the destination is on the same origin.
                            // This prevents Demo Mode from being hijacked to external domains (like doc.anagora.org).
                            if (destUrl.origin === window.location.origin) {
                                window.location.href = res.url;
                            } else {
                                console.warn("Demo Mode blocked an external redirect to:", res.url);
                                window.location.href = '/agora';
                            }
                        } catch (e) {
                            console.error("Error parsing redirect URL:", e, res.url);
                            window.location.href = '/agora';
                        }
                    })
                    .catch(err => {
                        console.warn("Demo Mode: Network error checking /random. Retrying in 5s...", err);
                        if ((window as any).showToast) {
                            (window as any).showToast(`🌱 Reconnecting to Agora... Retrying in 5s...`);
                        }
                        countdown = 5;
                        updateTimer();
                        demoIntervalId = window.setInterval(tick, 1000);
                    });
            }
        };

        demoIntervalId = window.setInterval(tick, 1000);

        // Pause demo mode if user starts typing in an input or textarea
        window.addEventListener('focusin', cancelOnEditing);
    };

    const renderClientSideWikilinks = (text: string) => {
        return text.replace(/\[\[(.*?)\]\]/g, (match, target) => {
            const link = encodeURIComponent(target);
            return `<span class="wikilink-marker">[[</span><a href="/${link}" title="[[${target}]]" class="wikilink">${target}</a><span class="wikilink-marker">]]</span>`;
        });
    };

    const showPopup = () => {
        const messages = [
            "The [[Agora]] is a [[Free Knowledge Commons]]. What will you contribute?",
            "Every [[wikilink]] is a potential connection. Where will you explore next?",
            "This Agora is running on a server somewhere, but the content comes from people like you. It is a [[distributed]] system.",
            "A [[digital garden]] is a space for [[learning in public]]. What will you grow today?",
            "The [[Agora Protocol]] is about composing knowledge, not just collecting it. How can you connect ideas?",
            "Nodes are concepts, subnodes are utterances. What do you have to say?",

            "No 404s here. Every missing page is an invitation to contribute.",
            "This is a [[federated]] system. Your Agora can be part of a larger conversation.",
            "Play is a valid and valuable mode of exploration. What will you discover?",
            "Knowledge is a commons. By sharing what you learn, you enrich everyone.",
        ];
        const separator = '<hr class="meditation-divider">';
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        meditationPopupContent.innerHTML = renderClientSideWikilinks(randomMessage);
        meditationPopupContainer.classList.add('active');
        if ((window as any).showToast) {
            (window as any).showToast("🧘 Agora Meditation opened.");
        }

        const setupArtifactSection = () => {
            const artifactContainer = document.createElement('div');
            artifactContainer.innerHTML = `${separator}<button id="fetch-artifact-btn">Show random artifact</button>`;
            meditationPopupContent.appendChild(artifactContainer);

            document.getElementById('fetch-artifact-btn')?.addEventListener('click', () => {
                fetchRandomArtifact(artifactContainer);
            }, { once: true }); // The listener removes itself after the first click.
        };

        // AI Meditation on the current node.
        // NODENAME is a global constant set in base.html
        declare const NODENAME: string | undefined;
        if (typeof NODENAME !== 'undefined' && NODENAME) {
            const aiMeditationContainer = document.createElement('div');
            aiMeditationContainer.innerHTML = `${separator}Contemplating ${renderClientSideWikilinks('[[' + NODENAME + ']]')}<span class="loading-ellipsis">...</span>`;
            meditationPopupContent.appendChild(aiMeditationContainer);

            fetch(`/api/meditate_on/${encodeURIComponent(NODENAME)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.meditation) {
                        aiMeditationContainer.innerHTML = separator + data.meditation;
                    } else {
                        aiMeditationContainer.innerHTML = separator + 'Could not generate a meditation at this time.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching AI meditation:', error);
                    aiMeditationContainer.innerHTML = separator + 'An error occurred while generating a meditation.';
                });
        }
        
        // Set up the artifact section immediately, so the button is always there.
        setupArtifactSection();

        if (!isDraggableInitialized) {
            // Wait for layout to update after content injection and class addition
            requestAnimationFrame(() => {
                const meditationPopup = document.getElementById('meditation-popup');
                const meditationDragHandle = document.getElementById('meditation-popup-header');
                if (meditationPopup && meditationDragHandle) {
                    meditationDraggable = makeDraggable(meditationPopup, meditationDragHandle, 'meditation-position', 'top-right');
                    meditationDraggable.reposition();
                    isDraggableInitialized = true;
                    meditationPopup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        } else {
            // Force repositioning to re-calculate top-right stacking
            if (meditationDraggable) {
                meditationDraggable.reposition(true);
            }
            const meditationPopup = document.getElementById('meditation-popup');
            if (meditationPopup) {
                meditationPopup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const fetchRandomArtifact = (container: HTMLElement) => {
        const separator = '<hr class="meditation-divider">';
        container.innerHTML = `${separator}<em>Loading artifact...</em>`;

        fetch('/api/random_artifact')
            .then(response => response.json())
            .then(data => {
                if (data.content) {
                    const promptHTML = `<strong>An artifact from node ${renderClientSideWikilinks(`[[${data.prompt}]]`)}:</strong><br>`;
                    const artifactHTML = data.content; // This is already rendered HTML from the server.
                    container.innerHTML = separator + promptHTML + artifactHTML;
                } else {
                    container.innerHTML = `${separator}<em>No artifacts found in the database cache.</em>`;
                }
            })
            .catch(error => {
                console.error('Error fetching random artifact:', error);
                container.innerHTML = `${separator}<em>An error occurred while fetching an artifact.</em>`;
            });
    }

    const hidePopup = (showNotification = false) => {
        if (!meditationPopupContainer) return;
        const wasActive = meditationPopupContainer.classList.contains('active');
        meditationPopupContainer.classList.remove('active');
        const meditationCheckbox = document.getElementById("meditation-checkbox") as HTMLInputElement;
        if (meditationCheckbox) {
            meditationCheckbox.checked = false;
        }
        if (showNotification && wasActive && (window as any).showToast) {
            (window as any).showToast("🧘 Agora Meditation closed.");
        }
    };

    function startGentleScroll(isInitialLoad = false, isRootAutoEnable = false) {
        const autoScrollDemo = safeJsonParse(localStorage["auto-scroll-demo"], CLIENT_DEFAULTS.autoScrollDemo);
        if (!autoScrollDemo) return;

        // If the main node is still loading asynchronously, wait for it before starting the countdown/toast
        const asyncContent = document.querySelector("#async-content");
        if (asyncContent) {
            console.log("Demo: Waiting for async node content to load before scrolling...");
            window.addEventListener('agora-node-loaded', () => {
                startGentleScroll(isInitialLoad, isRootAutoEnable);
            }, { once: true });
            return;
        }

        console.log("Demo: Preparing gentle scroll.");
        stopGentleScroll();
        
        const anyCheckedDemoBox = Array.from(demoCheckboxes).some(cb => cb.checked);

        // Let the user know it's about to start scrolling.
        const showInitialToast = () => {
            if ((window as any).showToast) {
                let msg = `🏃‍♀️ Auto-scroll starting in 3 seconds...`;
                if (anyCheckedDemoBox) {
                    msg = `⏯ Demo mode active! Auto-scroll starting in 3 seconds...`;
                }
                if (isRootAutoEnable) {
                    msg = `⏯ Demo mode is auto-enabled here! Auto-scroll starting in 3 seconds...`;
                }
                (window as any).showToast(msg);
            }
        };

        const startDelay = isInitialLoad ? 1000 : 0;
        if (isInitialLoad) {
            setTimeout(showInitialToast, startDelay);
        } else {
            showInitialToast();
        }

        (window as any).gentleScrollTimeout = setTimeout(() => {
            console.log("Demo: Starting gentle scroll.");
            if ((window as any).showToast) {
                (window as any).showToast(`🏃‍♀️ Scrolling... <span style="font-size: 0.85em; opacity: 0.8;">(<a href="#" id="toast-stop-scroll" style="text-decoration: underline; color: inherit;">cancel</a> or toggle in <a href="#" id="toast-open-settings" style="text-decoration: underline; color: inherit;">settings</a>)</span>`);
                
                // Bind click handler to the newly injected links
                setTimeout(() => {
                    const stopLink = document.getElementById('toast-stop-scroll');
                    if (stopLink) {
                        stopLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            stopGentleScroll();
                            localStorage.setItem("auto-scroll-demo", "false");
                            autoscrollCheckboxes.forEach(cb => { cb.checked = false; });
                            if ((window as any).showToast) {
                                (window as any).showToast("🛑 Auto-scroll stopped.");
                            }
                        });
                    }
                    const settingsLink = document.getElementById('toast-open-settings');
                    if (settingsLink) {
                        settingsLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            const burger = document.getElementById('burger');
                            if (burger) burger.click();
                        });
                    }
                }, 50);
            }
            (window as any).gentleScrollInterval = setInterval(() => {
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
                     console.log("Gentle scroll hit bottom.");
                     stopGentleScroll();
                } else {
                    window.scrollBy(0, 1);
                }
            }, 33);
        }, 3000 + startDelay); // 3 second delay after the initial toast delay
    }

    const updateDemoTooltip = (active: boolean, remaining?: number) => {
        const demoSwitch = document.querySelector('.demo-switch');
        if (demoSwitch) {
            if (active) {
                const rem = typeof remaining === 'number' ? ` (${remaining}s remaining)` : '';
                demoSwitch.setAttribute('title', `⏱️ Demo Mode: active${rem} (click to pause) [d]`);
            } else {
                demoSwitch.setAttribute('title', "⏱️ Demo Mode: inactive (click to start contemplative timer) [d]");
            }
        }
    };

    const updateAutoscrollTooltip = (active: boolean) => {
        const autoscrollSwitch = document.querySelector('.autoscroll-switch');
        if (autoscrollSwitch) {
            autoscrollSwitch.setAttribute('title', active 
                ? "🏃‍♀️ Auto Scroll: active (click to stop)" 
                : "🏃‍♀️ Auto Scroll: inactive (click to start)");
        }
    };

    const setDemoMode = (isChecked: boolean, isInitialLoad = false, isRootAutoEnable = false) => {
        localStorage.setItem("deep-demo-active", JSON.stringify(isChecked));
        demoCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateDemoTooltip(isChecked);
        if (isChecked) {
            startDeepDemo();
            startGentleScroll(isInitialLoad, isRootAutoEnable);
            if (!isInitialLoad && (window as any).showToast) {
                const timeoutSeconds = parseInt(localStorage.getItem("demo-timeout-seconds") || CLIENT_DEFAULTS.demoTimeoutSeconds, 10);
                (window as any).showToast(`⏱️ Demo mode active! Wandering in ${timeoutSeconds}s...`);
            }
        } else {
            cancelDeepDemo();
            hidePopup();
            stopGentleScroll();
            if (!isInitialLoad && (window as any).showToast) {
                (window as any).showToast("🛑 Demo mode paused.");
            }
        }
    };

    if (demoCheckboxes.length > 0) {
        // Check for Back/Forward navigation
        const storedDemoActive = localStorage.getItem("deep-demo-active");
        let isDemoActive = false;
        let isRootAutoEnable = false;
        
        if (storedDemoActive !== null) {
            isDemoActive = JSON.parse(storedDemoActive);
        } else if ((window.location.pathname === '/' || window.location.pathname === '/index') && !window.location.search) {
            isDemoActive = true;
            isRootAutoEnable = true;
        }
        
        try {
            const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
            if (navEntry && navEntry.type === 'back_forward' && isDemoActive) {
                console.log("Detected Back/Forward navigation. Keeping Demo Mode active.");
                // We no longer disable Demo Mode on back/forward because the fetch-then-navigate 
                // strategy for /random ensures a clean history stack.
            }
        } catch (e) {
            console.warn("Could not check navigation type:", e);
        }

        // Set initial state
        setDemoMode(isDemoActive, true, isRootAutoEnable);

        // Add event listeners to all demo checkboxes
        demoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                setDemoMode(checkbox.checked, false, false);
            });
        });

        meditationCloseButton?.addEventListener("click", () => {
            hidePopup(true);
        });
    }

    // Initialize and bind autoscroll toggle checkboxes (navbar & settings)
    const storedAutoScroll = localStorage.getItem("auto-scroll-demo");
    const isAutoScrollActive = storedAutoScroll !== null 
        ? safeJsonParse(storedAutoScroll, CLIENT_DEFAULTS.autoScrollDemo)
        : CLIENT_DEFAULTS.autoScrollDemo;

    updateAutoscrollTooltip(isAutoScrollActive);

    autoscrollCheckboxes.forEach(checkbox => {
        checkbox.checked = isAutoScrollActive;
        checkbox.addEventListener('change', () => {
            const enabled = checkbox.checked;
            localStorage.setItem("auto-scroll-demo", JSON.stringify(enabled));
            autoscrollCheckboxes.forEach(other => {
                other.checked = enabled;
            });
            updateAutoscrollTooltip(enabled);
            if (enabled) {
                startGentleScroll(false, false);
                if ((window as any).showToast) {
                    (window as any).showToast("🏃‍♀️ Auto-scroll active!");
                }
            } else {
                stopGentleScroll();
                if ((window as any).showToast) {
                    (window as any).showToast("🛑 Auto-scroll stopped.");
                }
            }
        });
    });

    const triggerMeditation = () => {
        const meditationPopupContainer = document.getElementById("meditation-popup-container");
        if (meditationPopupContainer) {
            if (meditationPopupContainer.classList.contains('active')) {
                hidePopup(true);
            } else {
                // If the demo is running, cancel it before showing the popup.
                const anyCheckedDemoBox = Array.from(demoCheckboxes).some(cb => cb.checked);
                if (anyCheckedDemoBox) {
                    const mainCheckbox = document.getElementById('demo-checkbox') as HTMLInputElement;
                    if (mainCheckbox) {
                        mainCheckbox.checked = false;
                        mainCheckbox.dispatchEvent(new Event('change'));
                    }
                }
                showPopup();
            }
        }
    };

    const miniCliMeditate = document.getElementById('mini-cli-meditate');
    if (miniCliMeditate) {
        miniCliMeditate.addEventListener('click', triggerMeditation);
    }

    const meditationCheckbox = document.getElementById('meditation-checkbox') as HTMLInputElement;
    if (meditationCheckbox) {
        meditationCheckbox.addEventListener('change', () => {
            if (meditationCheckbox.checked) {
                const meditationPopupContainer = document.getElementById("meditation-popup-container");
                if (meditationPopupContainer && !meditationPopupContainer.classList.contains('active')) {
                    // If the demo is running, cancel it before showing the popup.
                    const anyCheckedDemoBox = Array.from(demoCheckboxes).some(cb => cb.checked);
                    if (anyCheckedDemoBox) {
                        const mainCheckbox = document.getElementById('demo-checkbox') as HTMLInputElement;
                        if (mainCheckbox) {
                            mainCheckbox.checked = false;
                            mainCheckbox.dispatchEvent(new Event('change'));
                        }
                    }
                    showPopup();
                }
            } else {
                hidePopup(true);
            }
        });
    }
}
