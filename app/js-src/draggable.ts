
// app/js-src/draggable.ts

export type PositionType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export function makeDraggable(container: HTMLElement, handle: HTMLElement, storageKey: string, positionType: PositionType = 'top-right') {
    let active = false;
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let xOffset = 0;
    let yOffset = 0;
    let hasBeenPositionedByJs = false;

    container.classList.add('agora-draggable-container');
    handle.classList.add('agora-drag-handle');

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

    const savedShaded = localStorage.getItem(storageKey + '-shaded');
    if (savedShaded === 'true') {
        container.classList.add('shaded');
    }

    const reposition = () => {
        if (hasBeenPositionedByJs) return;

        // Calculate default position based on requested type
        const rightMargin = 25;
        const bottomMargin = 5; 
        const baseTopMargin = 70;

        // The container needs to be visible for offsetWidth/offsetHeight to be accurate
        let containerWidth = container.offsetWidth;
        let containerHeight = container.offsetHeight;

        if (containerWidth === 0 || containerHeight === 0) {
            const originalDisplay = container.style.display;
            const originalVisibility = container.style.visibility;
            
            container.style.visibility = 'hidden';
            container.style.display = 'block';
            
            containerWidth = container.offsetWidth;
            containerHeight = container.offsetHeight;
            
            container.style.display = originalDisplay;
            container.style.visibility = originalVisibility;
        }
        
        console.log(`[Draggable] Measured ${storageKey}: ${containerWidth}x${containerHeight}`);

        if (containerWidth === 0) containerWidth = 200; 
        if (containerHeight === 0) containerHeight = 300; 

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (positionType === 'center') {
            xOffset = (viewportWidth - containerWidth) / 2;
            yOffset = (viewportHeight - containerHeight) / 2;
        } else if (positionType === 'bottom-left') {
            xOffset = 25;
            yOffset = viewportHeight - containerHeight - bottomMargin;
        } else if (positionType === 'top-left') {
            xOffset = 2;
            yOffset = baseTopMargin;
        } else {
            // Smart Top-Right Stacking
            const popups = Array.from(document.querySelectorAll('.agora-draggable-container')).filter(el => {
                return el !== container && (el as HTMLElement).style.display !== 'none' && (el as HTMLElement).style.visibility !== 'hidden' && (el.getBoundingClientRect().width > 0);
            });

            let foundOverlap = true;
            let testY = baseTopMargin;
            const testX = viewportWidth - containerWidth - rightMargin;
            let attempts = 0;
            
            while (foundOverlap && attempts < 10) {
                foundOverlap = false;
                for (const p of popups) {
                    const rect = (p as HTMLElement).getBoundingClientRect();
                    // If the popup is in the top-right zone and overlaps vertically
                    if (rect.right > viewportWidth - rightMargin - containerWidth - 20) {
                        if (Math.abs(rect.top - testY) < 10 || (testY >= rect.top && testY < rect.bottom)) {
                            foundOverlap = true;
                            testY = rect.bottom + 10;
                            break;
                        }
                    }
                }
                attempts++;
            }
            
            xOffset = testX;
            yOffset = testY;
        }

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

        mouseDownX = initialX;
        mouseDownY = initialY;
        active = true;
        isDragging = false;
    }

    const dragEnd = (e: MouseEvent | TouchEvent) => {
        initialX = currentX;
        initialY = currentY;
        active = false;
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

            if (Math.abs(currentX - mouseDownX) > 3 || Math.abs(currentY - mouseDownY) > 3) {
                isDragging = true;
            }

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            currentX = Math.max(0, Math.min(currentX, viewportWidth - containerWidth));
            currentY = Math.max(0, Math.min(currentY, viewportHeight - containerHeight));

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, container);
        }
    }

    const checkBounds = () => {
        if (!hasBeenPositionedByJs || container.style.display === 'none') return;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        if (containerWidth === 0 || containerHeight === 0) return;
        
        let newX = Math.max(0, Math.min(xOffset, viewportWidth - containerWidth));
        let newY = Math.max(0, Math.min(yOffset, viewportHeight - containerHeight));
        
        if (newX !== xOffset || newY !== yOffset) {
            xOffset = newX;
            yOffset = newY;
            setTranslate(xOffset, yOffset, container);
            localStorage.setItem(storageKey, JSON.stringify({ x: xOffset, y: yOffset }));
        }
    };

    handle.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const isCloseButton = target.tagName.toLowerCase() === 'button' || 
                              target.closest('button') || 
                              target.id.includes('close') || 
                              target.className.includes('close') ||
                              target.closest('[id*="close"]') ||
                              target.closest('[class*="close"]');

        if (isCloseButton) {
            return;
        }

        if (!isDragging) {
            container.classList.toggle('shaded');
            const isShaded = container.classList.contains('shaded');
            localStorage.setItem(storageKey + '-shaded', isShaded ? 'true' : 'false');
            checkBounds(); // Ensure it doesn't jump off-screen when resizing
        }
    });

    window.addEventListener('resize', checkBounds);

    handle.addEventListener('mousedown', dragStart, false);
    handle.addEventListener('touchstart', dragStart, false);

    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('touchend', dragEnd, false);

    document.addEventListener('mousemove', drag, false);
    document.addEventListener('touchmove', drag, { passive: false });

    return { reposition };
}
