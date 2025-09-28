
// app/js-src/graph.ts

import { safeJsonParse, darkenColor } from './util';

declare const ForceGraph: any;
declare const NODENAME: string;

export async function renderGraph(containerId: string, dataUrl: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous graph if any
    container.innerHTML = '';

    const darkPalette = {
        bg: 'rgba(0, 0, 0, 0)', // Transparent background
        edge: 'rgba(150, 150, 150, 1)',
        particle: 'rgba(150, 150, 150, 0.4)',
        text: '#bfbfbf',
        nodeBg: 'rgba(50, 50, 50, 1)'
    };

    const lightPalette = {
        bg: 'rgba(0, 0, 0, 0)', // Transparent background
        edge: 'rgba(50, 50, 50, 1)',
        particle: 'rgba(50, 50, 50, 0.4)',
        text: '#000000',
        nodeBg: '#f0f0f0'
    };

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const palette = currentTheme === 'dark' ? darkPalette : lightPalette;

    // Default to labels for per-node graph, no labels for full graph.
    const defaultShowLabels = containerId === 'graph';
    const storageKey = containerId === 'full-graph' ? 'graph-show-labels-full' : 'graph-show-labels';
    const showLabels = safeJsonParse(localStorage.getItem(storageKey), defaultShowLabels);

    console.log("loading graph...")
    fetch(dataUrl)
    .then(res => res.json())
    .then(data => {
        setTimeout(() => {
            const Graph = ForceGraph()(container);
            const graphContainer = container.closest('.graph-container');

            // Give larger graphs more time to stabilize.
            const cooldownTime = data.nodes.length > 200 ? 25000 : 5000;

            Graph.height((graphContainer as HTMLElement).getBoundingClientRect().height)
                .width(container.getBoundingClientRect().width)
                .backgroundColor(palette.bg)
                .onNodeClick((node: any) => {
                    let url = node.id;
                    location.assign(url)
                })
                .graphData(data)
                .nodeId('id')
                .nodeVal('val')
                .nodeAutoColorBy('group');

            if (showLabels) {
                Graph.nodeCanvasObject((node: any, ctx: any, globalScale: any) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                    ctx.fillStyle = palette.nodeBg;
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Theme-aware node colors.
                    let color = node.color;
                    if (currentTheme === 'light') {
                        // simple heuristic to darken colors for light theme.
                        color = darkenColor(color, 40);
                    }
                    ctx.fillStyle = color;
                    ctx.fillText(label, node.x, node.y);

                    node.__bckgDimensions = bckgDimensions;
                })
                .nodePointerAreaPaint((node: any, color: any, ctx: any) => {
                    ctx.fillStyle = color;
                    const bckgDimensions = node.__bckgDimensions;
                    bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
                });
            } else {
                // In no-label mode, make the nodes smaller.
                Graph.nodeRelSize(2);
            }

            Graph.linkDirectionalArrowLength(3)
                .linkDirectionalParticles(1)
                .linkDirectionalParticleSpeed(0.005)
                .linkDirectionalParticleColor(() => palette.particle)
                .linkColor(() => palette.edge);

            Graph.zoom(3);
            Graph.cooldownTime(cooldownTime);
            Graph.onEngineStop(() => Graph.zoomToFit(100));
        }, 0);
    })
    .catch((error: any) => console.error('Error fetching or rendering graph:', error));
  }
