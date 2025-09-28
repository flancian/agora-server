
// app/js-src/demo.ts

import { makeDraggable } from './draggable';
import { CLIENT_DEFAULTS } from './util';

export function initDemoMode() {
    const demoCheckboxes = document.querySelectorAll(".demo-checkbox-input") as NodeListOf<HTMLInputElement>;
    const meditationPopupContainer = document.getElementById("meditation-popup-container");
    const meditationPopupContent = document.getElementById("meditation-popup-content");
    const meditationCloseButton = document.getElementById("meditation-popup-close-btn");

    let demoIntervalId: number | null = null;

    // This function is ONLY for implicit cancellation via user interaction.
    const cancelOnInteraction = (event: Event) => {
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
        ];
        const separator = '<hr style="margin: 1rem 0;">';
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        meditationPopupContent.innerHTML = renderClientSideWikilinks(randomMessage);

        // Fetch and append a random artifact, THEN attach the listener.
        fetch('/api/random_artifact')
            .then(response => response.json())
            .then(data => {
                if (data.content) {
                    const promptHTML = `<strong>An artifact from node ${renderClientSideWikilinks(`[[${data.prompt}]]`)}:</strong><br>`;
                    const artifactHTML = data.content; // This is already rendered HTML from the server.
                    meditationPopupContent.innerHTML += separator + promptHTML + artifactHTML;
                }
            })
            .catch(error => console.error('Error fetching random artifact:', error))
            .finally(() => {
                // Attach the listener here, after all innerHTML changes are complete.
                document.getElementById('demo-beyond-button')?.addEventListener('click', () => {
                    hidePopup();
                    // Programmatically check the toggle and dispatch an event
                    // to make it the single source of truth for starting the demo.
                    const anyCheckedDemoBox = Array.from(demoCheckboxes).some(cb => cb.checked);
                    if (!anyCheckedDemoBox) {
                        const mainCheckbox = document.getElementById('demo-checkbox') as HTMLInputElement;
                        if (mainCheckbox) {
                            mainCheckbox.checked = true;
                            mainCheckbox.dispatchEvent(new Event('change'));
                        }
                    }
                });
            });

        meditationPopupContainer.classList.add('active');
    };

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

    // Make the Meditation popup draggable
    const meditationDragHandle = document.getElementById('meditation-popup-header');
    if (meditationPopupContainer && meditationDragHandle) {
        makeDraggable(meditationPopupContainer, meditationDragHandle, 'meditation-position');
    }
}
