// app/js-src/games/conway.ts

export function initConway(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 10;
    let cols = 0;
    let rows = 0;
    let grid: number[][] = [];
    let animationFrameId: number;
    let isPaused = false;
    let isDrawing = false;
    let drawMode = 1;

    function resize() {
        if (!canvas) return;
        const container = canvas.parentElement;
        if (container) {
            const size = Math.min(600, container.clientWidth);
            canvas.width = size;
            canvas.height = size;
            cols = Math.floor(canvas.width / cellSize);
            rows = Math.floor(canvas.height / cellSize);
            initGrid();
        }
    }

    function initGrid() {
        grid = new Array(cols).fill(null).map(() => 
            new Array(rows).fill(null).map(() => Math.random() > 0.85 ? 1 : 0)
        );
    }

    window.addEventListener('resize', resize);
    resize();

    function drawGrid() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (grid[i][j] === 1) {
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
    }

    function updateGrid() {
        let nextGrid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let state = grid[i][j];
                let neighbors = countNeighbors(i, j);
                
                if (state === 0 && neighbors === 3) {
                    nextGrid[i][j] = 1;
                } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                    nextGrid[i][j] = 0;
                } else {
                    nextGrid[i][j] = state;
                }
            }
        }
        grid = nextGrid;
    }

    function countNeighbors(x: number, y: number) {
        let sum = 0;
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let col = (x + i + cols) % cols;
                let row = (y + j + rows) % rows;
                sum += grid[col][row];
            }
        }
        sum -= grid[x][y];
        return sum;
    }

    let lastTime = 0;
    function animate(timestamp: number) {
        if (!isPaused) {
            if (!lastTime) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            
            if (deltaTime > 100) { // roughly 10fps
                updateGrid();
                drawGrid();
                lastTime = timestamp;
            }
        }
        animationFrameId = requestAnimationFrame(animate);
    }

    const updatePlayPauseButton = () => {
        const btn = document.getElementById('conwayPlayPause');
        if (btn) {
            btn.innerText = isPaused ? '▶ Play' : '⏸ Pause';
        }
    };

    const drawAtCoords = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / cellSize);
        const y = Math.floor((clientY - rect.top) / cellSize);
        if(x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y] = drawMode;
            drawGrid();
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        if(x >= 0 && x < cols && y >= 0 && y < rows) {
            drawMode = grid[x][y] === 1 ? 0 : 1;
        }

        isPaused = true;
        updatePlayPauseButton();
        isDrawing = true;
        drawAtCoords(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDrawing) {
            drawAtCoords(e.clientX, e.clientY);
        }
    };

    const handleMouseUp = () => {
        isDrawing = false;
    };

    const handlePlayPauseClick = () => {
        isPaused = !isPaused;
        updatePlayPauseButton();
        if (!isPaused) {
            lastTime = 0;
        }
    };

    const handleClearClick = () => {
        grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
        isPaused = true;
        updatePlayPauseButton();
        drawGrid();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    const btn = document.getElementById('conwayPlayPause');
    if (btn) {
        btn.addEventListener('click', handlePlayPauseClick);
    }
    const clearBtn = document.getElementById('conwayClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearClick);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        const btn = document.getElementById('conwayPlayPause');
        if (btn) btn.removeEventListener('click', handlePlayPauseClick);
        const clearBtn = document.getElementById('conwayClear');
        if (clearBtn) clearBtn.removeEventListener('click', handleClearClick);
        cancelAnimationFrame(animationFrameId);
    };
}
