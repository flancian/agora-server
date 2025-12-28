
// app/js-src/demo.ts

import { makeDraggable } from './draggable';
import { CLIENT_DEFAULTS } from './util';

export function initDemoMode() {
    const demoCheckboxes = document.querySelectorAll(".demo-checkbox-input") as NodeListOf<HTMLInputElement>;
    const meditationPopupContainer = document.getElementById("meditation-popup-container");
    const meditationPopupContent = document.getElementById("meditation-popup-content");
    const meditationCloseButton = document.getElementById("meditation-popup-close-btn");

    let demoIntervalId: number | null = null;
    let isDraggableInitialized = false;

    // This function is ONLY for implicit cancellation via user interaction.
    const cancelOnInteraction = (event: Event) => {
        // Ignore events that are not triggered by direct user action.
        if (!event.isTrusted) {
            return;
        }

        // A guard clause to ensure the event target is a DOM element.
        if (!(event.target instanceof Element)) {
            return;
        }
        const target = event.target as HTMLElement;
        const demoSwitch = target.closest('.demo-switch');
        const burgerMenu = target.closest('#burger');

        // If the interaction was a click on the toggle itself or the burger menu, do nothing.
        if (event.type === 'click' && (demoSwitch || burgerMenu)) {
            return;
        }

        // For any other interaction, programmatically uncheck the box.
        const anyCheckedDemoBox = Array.from(demoCheckboxes).some(cb => cb.checked);
        if (anyCheckedDemoBox) {
            console.log('Deep demo mode cancelled by user interaction.');
            // Programmatically uncheck the box and trigger the change event.
            const mainCheckbox = document.getElementById('demo-checkbox') as HTMLInputElement;
            if (mainCheckbox) {
                mainCheckbox.checked = false;
                mainCheckbox.dispatchEvent(new Event('change'));
            }
        }
    };

    const cancelDeepDemo = () => {
        if (demoIntervalId) {
            clearInterval(demoIntervalId);
            demoIntervalId = null;
            const timerElement = document.getElementById('demo-timer');
            if (timerElement) {
                timerElement.innerHTML = '';
                timerElement.style.display = 'none';
            }
            // Remove interaction listeners since the demo is now off.
            window.removeEventListener('scroll', cancelOnInteraction);
            window.removeEventListener('click', cancelOnInteraction);
            window.removeEventListener('keypress', cancelOnInteraction);
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
                timerElement.innerHTML = `<span>${countdown}s</span>`;
            }
        };

        updateTimer();

        demoIntervalId = window.setInterval(() => {
            countdown--;
            updateTimer();
            if (countdown <= 0) {
                clearInterval(demoIntervalId as number);
                window.location.href = '/random';
            }
        }, 1000);

        // Add interaction listeners that will trigger the cancellation.
        window.addEventListener('scroll', cancelOnInteraction, { once: true });
        window.addEventListener('click', cancelOnInteraction, { once: true });
        window.addEventListener('keypress', cancelOnInteraction, { once: true });
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
                const meditationDragHandle = document.getElementById('meditation-popup-header');
                if (meditationPopupContainer && meditationDragHandle) {
                    const { reposition } = makeDraggable(meditationPopupContainer, meditationDragHandle, 'meditation-position', 'top-left');
                    reposition();
                    isDraggableInitialized = true;
                }
            });
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

    const hidePopup = () => {
        meditationPopupContainer.classList.remove('active');
    };

    const setDemoMode = (isChecked: boolean) => {
        localStorage.setItem("deep-demo-active", JSON.stringify(isChecked));
        demoCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        if (isChecked) {
            startDeepDemo();
        } else {
            cancelDeepDemo();
            hidePopup();
        }
    };

    if (demoCheckboxes.length > 0) {
        // Set initial state from localStorage
        const isDemoActive = JSON.parse(localStorage.getItem("deep-demo-active") || 'false');
        setDemoMode(isDemoActive);

        // Add event listeners to all demo checkboxes
        demoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                setDemoMode(checkbox.checked);
            });
        });

        meditationCloseButton?.addEventListener("click", () => {
            hidePopup();
        });
    }

    document.getElementById('show-meditation-popup')?.addEventListener('click', () => {
        const meditationPopupContainer = document.getElementById("meditation-popup-container");
        if (meditationPopupContainer.classList.contains('active')) {
            hidePopup();
            return;
        }

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
    });
}
