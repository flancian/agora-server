let draggedEl: HTMLElement | null = null;
let placeholder: HTMLElement | null = null;
let draggedSubnode: HTMLElement | null = null;

export function initSortable() {
    const container = document.querySelector('.content') as HTMLElement;
    if (!container) return;

    // Attach drag events to all sortable sections
    const sortables = container.querySelectorAll('.sortable-section');
    sortables.forEach(section => {
        const summary = section.querySelector('summary') as HTMLElement;
        const trigger = summary || section;

        // Prevent duplicate listener binding
        const sec = section as HTMLElement;
        if (sec.dataset.sortableInitialized === 'true') return;
        sec.dataset.sortableInitialized = 'true';

        // Helper to check if interactive elements are clicked
        const isInteractive = (target: HTMLElement): boolean => {
            return (
                target.tagName === 'A' || 
                target.tagName === 'BUTTON' || 
                target.closest('.wiki-provider-tab') !== null || 
                target.closest('.web-provider-tab') !== null || 
                target.closest('.ai-provider-tab') !== null || 
                target.closest('.synthesis-provider-tab') !== null ||
                target.closest('.external-star-toggle') !== null || 
                target.closest('.node-star-toggle') !== null || 
                target.closest('.star-toggle') !== null || 
                target.closest('.dismiss-button') !== null
            );
        };

        // When pressing the summary header, make the parent section draggable
        trigger.addEventListener('mousedown', (e: Event) => {
            if (isInteractive(e.target as HTMLElement)) return;
            (section as HTMLElement).setAttribute('draggable', 'true');
        });
        trigger.addEventListener('mouseup', () => {
            (section as HTMLElement).setAttribute('draggable', 'false');
        });

        // Touch support (mobile)
        trigger.addEventListener('touchstart', (e: Event) => {
            if (isInteractive(e.target as HTMLElement)) return;
            (section as HTMLElement).setAttribute('draggable', 'true');
        }, { passive: true });
        trigger.addEventListener('touchend', () => {
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

export function initSortableSubnodes() {
    const parents = document.querySelectorAll('details.node');
    parents.forEach(parent => {
        const subnodes = parent.querySelectorAll('details.subnode');
        if (subnodes.length <= 1) return; // No need to sort if 0 or 1 subnode

        subnodes.forEach(subnode => {
            const sec = subnode as HTMLElement;
            sec.classList.add('sortable-subnode');
            
            if (sec.dataset.sortableSubnodeInitialized === 'true') return;
            sec.dataset.sortableSubnodeInitialized = 'true';

            const summary = sec.querySelector('summary.subnode-header') as HTMLElement;
            const trigger = summary || sec;

            trigger.addEventListener('mousedown', (e: Event) => {
                const target = e.target as HTMLElement;
                if (
                    target.tagName === 'A' || 
                    target.tagName === 'BUTTON' || 
                    target.closest('.star-toggle') !== null
                ) return;
                sec.setAttribute('draggable', 'true');
            });
            trigger.addEventListener('mouseup', () => {
                sec.setAttribute('draggable', 'false');
            });

            // Touch support (mobile)
            trigger.addEventListener('touchstart', (e: Event) => {
                const target = e.target as HTMLElement;
                if (
                    target.tagName === 'A' || 
                    target.tagName === 'BUTTON' || 
                    target.closest('.star-toggle') !== null
                ) return;
                sec.setAttribute('draggable', 'true');
            }, { passive: true });
            trigger.addEventListener('touchend', () => {
                sec.setAttribute('draggable', 'false');
            });

            sec.addEventListener('dragstart', (e: Event) => {
                const dragEvent = e as DragEvent;
                draggedSubnode = sec;
                draggedSubnode.classList.add('dragging');
                if (dragEvent.dataTransfer) {
                    dragEvent.dataTransfer.effectAllowed = 'move';
                    dragEvent.dataTransfer.setData('text/plain', 'subnode');
                }
            });

            sec.addEventListener('dragend', () => {
                if (draggedSubnode) {
                    draggedSubnode.classList.remove('dragging');
                    draggedSubnode.setAttribute('draggable', 'false');
                    draggedSubnode = null;
                }
                saveSubnodeOrder(parent as HTMLElement);
            });

            sec.addEventListener('dragover', (e: Event) => {
                e.preventDefault();
                const dragEvent = e as DragEvent;
                if (dragEvent.dataTransfer) {
                    dragEvent.dataTransfer.dropEffect = 'move';
                }

                if (!draggedSubnode || draggedSubnode === sec) return;
                if (draggedSubnode.parentElement !== sec.parentElement) return;

                const bounding = sec.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                
                if (dragEvent.clientY - offset > 0) {
                    sec.after(draggedSubnode);
                } else {
                    sec.before(draggedSubnode);
                }
            });

            sec.addEventListener('dragenter', (e: Event) => {
                e.preventDefault();
            });
        });

        restoreSubnodeOrder(parent as HTMLElement);
    });
}

function saveSubnodeOrder(parent: HTMLElement) {
    const parentId = parent.id;
    if (!parentId) return;

    const order: string[] = [];
    const subnodes = parent.querySelectorAll('details.subnode');
    subnodes.forEach(el => {
        const uri = (el as HTMLElement).dataset.subnodeUri;
        if (uri) {
            order.push(uri);
        }
    });

    localStorage.setItem(`agora-subnode-order-${parentId}`, JSON.stringify(order));
    console.log(`Saved subnode order for ${parentId}:`, order);
}

function restoreSubnodeOrder(parent: HTMLElement) {
    const parentId = parent.id;
    if (!parentId) return;

    try {
        const orderStr = localStorage.getItem(`agora-subnode-order-${parentId}`);
        if (!orderStr) return;

        const order: string[] = JSON.parse(orderStr);
        if (!Array.isArray(order) || order.length === 0) return;

        console.log(`Restoring subnode order for ${parentId}:`, order);

        const subnodes = Array.from(parent.querySelectorAll('details.subnode'));
        const anchor = parent.querySelector('.pushed-subnodes-embed') || null;

        order.forEach(uri => {
            subnodes.forEach(el => {
                if ((el as HTMLElement).dataset.subnodeUri === uri) {
                    if (anchor) {
                        parent.insertBefore(el, anchor);
                    } else {
                        parent.appendChild(el);
                    }
                }
            });
        });
    } catch (e) {
        console.error(`Failed to restore subnode order for ${parentId}`, e);
    }
}
