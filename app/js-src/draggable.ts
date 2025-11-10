
// app/js-src/draggable.ts

export function makeDraggable(container: HTMLElement, handle: HTMLElement, storageKey: string) {
    let active = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;
    let xOffset = 0;
    let yOffset = 0;
    let hasBeenPositionedByJs = false;

    const setTranslate = (xPos: number, yPos: number, el: HTMLElement) => {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Restore position from local storage
    const savedPosition = localStorage.getItem(storageKey);
    if (savedPosition) {
        const pos = JSON.parse(savedPosition);
        xOffset = pos.x;
        yOffset = pos.y;
        // If we have a saved position, we must switch to transform-based positioning immediately.
        container.style.top = '0';
        container.style.left = '0';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
        setTranslate(xOffset, yOffset, container);
        hasBeenPositionedByJs = true;
    } else {
        // If no position is saved, we do nothing and let CSS handle the initial position.
        // The first drag event will then capture the initial position.
    }

    const dragStart = (e: MouseEvent | TouchEvent) => {
        if (!hasBeenPositionedByJs) {
            const rect = container.getBoundingClientRect();
            // Switch from CSS-based positioning (e.g., top: 10%) to transform-based positioning.
            container.style.top = '0px';
            container.style.left = '0px';
            xOffset = rect.left;
            yOffset = rect.top;
            setTranslate(xOffset, yOffset, container);
            hasBeenPositionedByJs = true;
        }

        if (e.type === "touchstart") {
            initialX = (e as TouchEvent).touches[0].clientX - xOffset;
            initialY = (e as TouchEvent).touches[0].clientY - yOffset;
        } else {
            initialX = (e as MouseEvent).clientX - xOffset;
            initialY = (e as MouseEvent).clientY - yOffset;
        }

        // The listener is on the header, so any mousedown should activate dragging.
        active = true;
    }

    const dragEnd = (e: MouseEvent | TouchEvent) => {
        initialX = currentX;
        initialY = currentY;
        active = false;
        // Save position to local storage
        localStorage.setItem(storageKey, JSON.stringify({ x: xOffset, y: yOffset }));
    }

    const drag = (e: MouseEvent | TouchEvent) => {
        if (e.type === "touchmove") {
            e.preventDefault();
        }
        if (active) {
            if (e.type === "touchmove") {
                currentX = (e as TouchEvent).touches[0].clientX - initialX;
                currentY = (e as TouchEvent).touches[0].clientY - initialY;
            } else {
                currentX = (e as MouseEvent).clientX - initialX;
                currentY = (e as MouseEvent).clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, container);
        }
    }

    handle.addEventListener('mousedown', dragStart, false);
    handle.addEventListener('touchstart', dragStart, false);

    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('touchend', dragEnd, false);

    document.addEventListener('mousemove', drag, false);
    document.addEventListener('touchmove', drag, { passive: false });
}
