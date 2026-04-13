// app/js-src/games/hexgame.ts

export function initHexgame(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animationFrameId: number;
    
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

    function drawHexagon(x: number, y: number, radius: number) {
        if (!ctx) return;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const currentAngle = angle + (Math.PI / 3) * i;
            const xPos = x + radius * Math.cos(currentAngle);
            const yPos = y + radius * Math.sin(currentAngle);
            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = '#228b22'; // Forest green
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(34, 139, 34, 0.05)';
        ctx.fill();
    }

    function animate() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const maxRadius = Math.min(cx, cy) * 0.8;
        
        for(let r = maxRadius; r > 10; r -= 20) {
            drawHexagon(cx, cy, r);
        }
        
        angle += 0.005;
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    // Return a cleanup function
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
}
