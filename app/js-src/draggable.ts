
// app/js-src/draggable.ts

export type PositionType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export function makeDraggable(container: HTMLElement, handle: HTMLElement, storageKey: string, positionType: PositionType = 'top-right') {
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
    }

    const reposition = () => {
        if (hasBeenPositionedByJs) return;

        // Calculate default position based on requested type
        const rightMargin = 25;
        const bottomMargin = 5; // Reduced from 40 to 5
        const topMargin = 70;

        // The container needs to be visible for offsetWidth/offsetHeight to be accurate
        let containerWidth = container.offsetWidth;
        let containerHeight = container.offsetHeight;

        // If the container is hidden, we need to briefly show it to measure it.
        // NOTE: The caller should ensure the container is effectively visible or renderable before calling reposition()
        // But we keep the safety check here.
        if (containerWidth === 0 || containerHeight === 0) {
            const originalDisplay = container.style.display;
            const originalVisibility = container.style.visibility;
            
            container.style.visibility = 'hidden';
            container.style.display = 'block';
            
            containerWidth = container.offsetWidth;
            containerHeight = container.offsetHeight;
            
            // Restore original styles
            container.style.display = originalDisplay;
            container.style.visibility = originalVisibility;
        }
        
        console.log(`[Draggable] Measured ${storageKey}: ${containerWidth}x${containerHeight}`);

        // Fallback if measurement still fails
        if (containerWidth === 0) containerWidth = 200; 
        if (containerHeight === 0) containerHeight = 300; 

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (positionType === 'center') {
            xOffset = (viewportWidth - containerWidth) / 2;
            yOffset = (viewportHeight - containerHeight) / 2;
        } else if (positionType === 'bottom-right') {
            xOffset = viewportWidth - containerWidth - rightMargin;
            yOffset = viewportHeight - containerHeight - bottomMargin;
        } else if (positionType === 'bottom-left') {
            xOffset = 25; // Left margin
            yOffset = viewportHeight - containerHeight - bottomMargin;
        } else if (positionType === 'top-left') {
            xOffset = 2; // Left margin (Reduced from 25)
            yOffset = topMargin;
        } else {
            // Default: Top-Right (No cascading)
            xOffset = viewportWidth - containerWidth - rightMargin;
            yOffset = topMargin;
        }

        // Ensure the container is absolutely positioned for transform to work relative to viewport
        container.style.position = 'fixed';
        container.style.top = '0px';
        container.style.left = '0px';
        container.style.right = 'auto';
        container.style.bottom = 'auto';

        setTranslate(xOffset, yOffset, container);
        localStorage.setItem(storageKey, JSON.stringify({ x: xOffset, y: yOffset }));
        hasBeenPositionedByJs = true;
    };

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
        if (active) {
            e.preventDefault();
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

    return { reposition };
}
