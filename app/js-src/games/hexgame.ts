// app/js-src/games/hexgame.ts

interface Hex {
    q: number;
    r: number;
}

const HEX_NUMBERS = [1, 7, 19, 37, 61, 91, 127];

function getTargetHex(n: number): { target: number, ring: number } {
    for (let i = HEX_NUMBERS.length - 1; i >= 0; i--) {
        if (n > HEX_NUMBERS[i]) {
            return { target: HEX_NUMBERS[i], ring: i };
        }
    }
    return { target: 1, ring: 0 };
}

function getSpiralPositions(maxCount: number): Hex[] {
    const positions: Hex[] = [{ q: 0, r: 0 }];
    if (maxCount <= 1) return positions;

    let ring = 1;
    while (positions.length < maxCount) {
        let currQ = 0;
        let currR = -ring;
        
        const walkDirs = [
            { q: 1, r: 0 },
            { q: 0, r: 1 },
            { q: -1, r: 1 },
            { q: -1, r: 0 },
            { q: 0, r: -1 },
            { q: 1, r: -1 }
        ];

        for (let side = 0; side < 6; side++) {
            for (let step = 0; step < ring; step++) {
                if (positions.length >= maxCount) break;
                positions.push({ q: currQ, r: currR });
                currQ += walkDirs[side].q;
                currR += walkDirs[side].r;
            }
            if (positions.length >= maxCount) break;
        }
        ring++;
    }
    return positions;
}

function rotatePointCW(p: Hex, times: number): Hex {
    let { q, r } = p;
    for (let i = 0; i < times; i++) {
        const nextQ = -r;
        const nextR = q + r;
        q = nextQ;
        r = nextR;
    }
    return { q, r };
}

function rotatePointCCW(p: Hex, times: number): Hex {
    let { q, r } = p;
    for (let i = 0; i < times; i++) {
        const nextQ = q + r;
        const nextR = -q;
        q = nextQ;
        r = nextR;
    }
    return { q, r };
}

export function initHexgame(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let numBalls = Math.floor(Math.random() * (128 - 8 + 1)) + 8;
    if (HEX_NUMBERS.includes(numBalls)) numBalls += 1;
    
    let { target, ring } = getTargetHex(numBalls);
    let remainderRing = ring + 1;

    let balls: { q: number, r: number, startQ: number, startR: number, t: number, removing: boolean, opacity: number }[] = [];
    
    const spiral = getSpiralPositions(numBalls);
    
    const initialRotations = Math.floor(Math.random() * 5) + 1;
    for (let pos of spiral) {
        const rotated = rotatePointCW(pos, initialRotations);
        balls.push({ q: rotated.q, r: rotated.r, startQ: rotated.q, startR: rotated.r, t: 1, removing: false, opacity: 1 });
    }

    let isAnimatingRotation = false;
    let rotationStartTime = 0;
    const rotationDuration = 200;
    
    let hasWon = false;

    function restartGame() {
        numBalls = Math.floor(Math.random() * (128 - 8 + 1)) + 8;
        if (HEX_NUMBERS.includes(numBalls)) numBalls += 1;
        
        let targetObj = getTargetHex(numBalls);
        target = targetObj.target;
        remainderRing = targetObj.ring + 1;

        balls = [];
        const spiral = getSpiralPositions(numBalls);
        const initialRotations = Math.floor(Math.random() * 5) + 1;
        for (let pos of spiral) {
            const rotated = rotatePointCW(pos, initialRotations);
            balls.push({ q: rotated.q, r: rotated.r, startQ: rotated.q, startR: rotated.r, t: 1, removing: false, opacity: 1 });
        }
        hasWon = false;
        isAnimatingRotation = false;
    }

    function resize() {
        if (!canvas) return;
        const container = canvas.parentElement;
        if (container) {
            const size = Math.min(600, container.clientWidth);
            canvas.width = size;
            canvas.height = size;
        }
    }
    
    window.addEventListener('resize', resize);
    resize();

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (hasWon) {
            restartGame();
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (isAnimatingRotation) return;
            
            const isCW = e.key === 'ArrowRight';
            for (let b of balls) {
                b.startQ = b.q;
                b.startR = b.r;
                const nextPos = isCW ? rotatePointCW(b, 1) : rotatePointCCW(b, 1);
                b.q = nextPos.q;
                b.r = nextPos.r;
                b.t = 0;
            }
            isAnimatingRotation = true;
            rotationStartTime = performance.now();
        } else if (e.key === ' ') {
            e.preventDefault();
            if (isAnimatingRotation) return;
            
            let removedCount = 0;
            for (let b of balls) {
                if (!b.removing && b.r === -remainderRing) {
                    const dist = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
                    if (dist === remainderRing) {
                        b.removing = true;
                        removedCount++;
                    }
                }
            }
            if (removedCount > 0) {
                numBalls -= removedCount;
                if (numBalls === target) {
                    hasWon = true;
                }
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    function easeOutQuad(t: number): number {
        return t * (2 - t);
    }
    
    function hexToScreen(q: number, r: number, spacing: number, cx: number, cy: number) {
        const x = cx + spacing * (q + r / 2);
        const y = cy + spacing * (Math.sqrt(3) / 2 * r);
        return { x, y };
    }

    const computedStyle = getComputedStyle(document.body);
    let textColor = computedStyle.getPropertyValue('--text-color').trim() || '#333';

    let animationFrameId: number;
    function animate(time: number) {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 20;
        
        const maxRings = Math.max(7, remainderRing + 2);
        const spacing = (canvas.width / 2) / (maxRings * Math.sqrt(3) / 2);
        const ballRadius = spacing * 0.45;

        // Draw top cutting zone indicator
        ctx.save();
        ctx.beginPath();
        const topY = cy + spacing * (Math.sqrt(3) / 2 * -remainderRing);
        ctx.moveTo(cx - canvas.width/4, topY);
        ctx.lineTo(cx + canvas.width/4, topY);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
        ctx.lineWidth = ballRadius * 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        let allAnimationsDone = true;
        for (let i = balls.length - 1; i >= 0; i--) {
            let b = balls[i];
            
            if (b.removing) {
                b.opacity -= 0.05;
                if (b.opacity <= 0) {
                    balls.splice(i, 1);
                    continue;
                }
            }

            if (b.t < 1) {
                const elapsed = time - rotationStartTime;
                b.t = Math.min(1, elapsed / rotationDuration);
                allAnimationsDone = false;
            }
            
            const easedT = easeOutQuad(b.t);
            const currQ = b.startQ + (b.q - b.startQ) * easedT;
            const currR = b.startR + (b.r - b.startR) * easedT;
            
            const { x, y } = hexToScreen(currQ, currR, spacing, cx, cy);
            
            const dist = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
            const isSelected = (!isAnimatingRotation && dist === remainderRing && b.r === -remainderRing && !b.removing);

            ctx.save();
            ctx.globalAlpha = b.opacity;
            ctx.beginPath();
            ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
            
            if (isSelected) {
                ctx.shadowColor = '#ff6b6b';
                ctx.shadowBlur = 15;
            }

            const gradient = ctx.createRadialGradient(x - ballRadius*0.3, y - ballRadius*0.3, ballRadius*0.1, x, y, ballRadius);
            if (isSelected) {
                gradient.addColorStop(0, '#ff9999');
                gradient.addColorStop(1, '#cc0000');
            } else {
                gradient.addColorStop(0, '#88cc88');
                gradient.addColorStop(1, '#228b22'); 
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        }

        if (allAnimationsDone) {
            isAnimatingRotation = false;
        }

        ctx.fillStyle = textColor;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Balls: ${numBalls} / Target: ${target}`, 20, 30);
        
        if (hasWon) {
            ctx.textAlign = 'center';
            ctx.lineJoin = 'round';
            
            // "Perfect Hexagon!"
            ctx.font = '900 42px sans-serif';
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#111';
            ctx.strokeText("Perfect Hexagon!", canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText("Perfect Hexagon!", canvas.width/2, canvas.height/2);
            
            // "Press any key to play again"
            ctx.font = '700 20px sans-serif';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#111';
            ctx.strokeText("Press any key to play again", canvas.width/2, canvas.height/2 + 40);
            ctx.fillStyle = '#fff';
            ctx.fillText("Press any key to play again", canvas.width/2, canvas.height/2 + 40);
        }

        animationFrameId = requestAnimationFrame(animate);
    }
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animationFrameId);
    };
}
