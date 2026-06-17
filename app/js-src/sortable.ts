export function initSortable() {
    const container = document.querySelector('.content') as HTMLElement;
    if (!container) return;

    let draggedEl: HTMLElement | null = null;
    let placeholder: HTMLElement | null = null;

    // Attach drag events to all sortable sections
    const sortables = container.querySelectorAll('.sortable-section');
    sortables.forEach(section => {
        const handle = section.querySelector('.drag-handle') as HTMLElement;
        if (!handle) return;

        // Prevent duplicate listener binding
        const sec = section as HTMLElement;
        if (sec.dataset.sortableInitialized === 'true') return;
        sec.dataset.sortableInitialized = 'true';

        // When pressing the handle, make the parent section draggable
        handle.addEventListener('mousedown', () => {
            (section as HTMLElement).setAttribute('draggable', 'true');
        });
        handle.addEventListener('mouseup', () => {
            (section as HTMLElement).setAttribute('draggable', 'false');
        });

        // Touch support (mobile)
        handle.addEventListener('touchstart', () => {
            (section as HTMLElement).setAttribute('draggable', 'true');
        }, { passive: true });
        handle.addEventListener('touchend', () => {
            (section as HTMLElement).setAttribute('draggable', 'false');
        });

        // Handle the native drag events
        section.addEventListener('dragstart', (e: Event) => {
            const dragEvent = e as DragEvent;
            draggedEl = section as HTMLElement;
            draggedEl.classList.add('dragging');
            if (dragEvent.dataTransfer) {
                dragEvent.dataTransfer.effectAllowed = 'move';
                // Necessary for Firefox
                dragEvent.dataTransfer.setData('text/plain', 'sortable');
            }
        });

        section.addEventListener('dragend', () => {
            if (draggedEl) {
                draggedEl.classList.remove('dragging');
                draggedEl.setAttribute('draggable', 'false');
                draggedEl = null;
            }
            
            // Save the new order
            saveOrder();
        });

        section.addEventListener('dragover', (e: Event) => {
            e.preventDefault(); // Necessary to allow dropping
            const dragEvent = e as DragEvent;
            if (dragEvent.dataTransfer) {
                dragEvent.dataTransfer.dropEffect = 'move';
            }

            if (!draggedEl || draggedEl === section) return;

            // Determine whether to drop above or below based on mouse position
            const bounding = section.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            
            if (dragEvent.clientY - offset > 0) {
                section.after(draggedEl);
            } else {
                section.before(draggedEl);
            }
        });

        section.addEventListener('dragenter', (e: Event) => {
            e.preventDefault();
        });
    });
}

export function saveOrder() {
    const container = document.querySelector('.content') as HTMLElement;
    if (!container) return;

    // Build array of data-section identifiers in DOM order
    const order: string[] = [];
    const elements = container.querySelectorAll('.sortable-section');
    elements.forEach(el => {
        const sectionId = (el as HTMLElement).dataset.section;
        if (sectionId && !order.includes(sectionId)) {
            order.push(sectionId);
        }
    });

    localStorage.setItem('agora-section-order', JSON.stringify(order));
    console.log("Saved section order:", order);
}

export function restoreOrder() {
    const container = document.querySelector('.content') as HTMLElement;
    if (!container) return;

    try {
        const orderStr = localStorage.getItem('agora-section-order');
        if (!orderStr) return;

        const order: string[] = JSON.parse(orderStr);
        if (!Array.isArray(order) || order.length === 0) return;

        console.log("Restoring section order:", order);

        // Any elements that weren't in the saved order array will remain at the top 
        // (because appendChild moves elements to the bottom). 
        // If we want unsaved elements to remain at the bottom, we should append them too.
        // Actually, elements not in `order` stay where they were unless they were moved.
        // The ones we append get moved to the end. That means elements NOT in the order
        // list will end up BEFORE the ordered elements.
        // Let's fix that by collecting the new/untracked elements and appending them at the end.
        
        const allSortables = Array.from(container.querySelectorAll('.sortable-section'));
        const orderedElements: HTMLElement[] = [];
        const untrackedElements: HTMLElement[] = [];

        allSortables.forEach(el => {
            const id = (el as HTMLElement).dataset.section;
            if (id && order.includes(id)) {
                // Will be appended via order iteration
            } else {
                untrackedElements.push(el as HTMLElement);
            }
        });

        const anchor = document.querySelector('.edit-section-container') || null;

        order.forEach(sectionId => {
            allSortables.forEach(el => {
                if ((el as HTMLElement).dataset.section === sectionId) {
                    if (anchor) {
                        container.insertBefore(el, anchor);
                    } else {
                        container.appendChild(el);
                    }
                }
            });
        });

        // Finally, put any newly discovered sections at the very bottom of the sortables
        untrackedElements.forEach(el => {
            if (anchor) {
                container.insertBefore(el, anchor);
            } else {
                container.appendChild(el);
            }
        });

    } catch (e) {
        console.error("Failed to restore section order", e);
    }
}
