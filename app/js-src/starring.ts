
// app/js-src/starring.ts

async function starSubnode(uri: string) {
    const response = await fetch(`/api/star/${uri}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No user needed
    });
    return response.json();
}

async function unstarSubnode(uri: string) {
    const response = await fetch(`/api/unstar/${uri}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No user needed
    });
    return response.json();
}

async function getStarredUris(): Promise<string[]> {
    const response = await fetch(`/api/starred`);
    if (!response.ok) {
        return [];
    }
    return response.json();
}

function attachStarClickListeners() {
    document.querySelectorAll('.star-toggle').forEach((star: HTMLElement) => {
        // If the listener is already attached, don't add it again.
        if (star.dataset.listenerAttached) return;

        star.addEventListener('click', async (event) => {
            // This is no longer needed as we are not inside a <summary>
            // event.stopPropagation(); 
            
            const uri = star.dataset.subnodeUri;
            if (!uri) return;

            const isStarred = star.classList.contains('starred');
            const action = isStarred ? unstarSubnode : starSubnode;

            try {
                const result = await action(uri);
                if (result.status === 'success') {
                    // Optimistically update the UI
                    if (isStarred) {
                        star.textContent = '☆';
                        star.classList.remove('starred');
                        star.title = "Star this subnode";
                    } else {
                        star.textContent = '★';
                        star.classList.add('starred');
                        star.title = "Unstar this subnode";
                    }
                }
            } catch (error) {
                console.error("Failed to update star:", error);
            }
        });
        star.dataset.listenerAttached = 'true';
    });
}

function updateStarUI(starredUris: string[]) {
    document.querySelectorAll('.star-toggle').forEach((star: HTMLElement) => {
        const uri = star.dataset.subnodeUri;
        if (uri && starredUris.includes(uri)) {
            star.textContent = '★';
            star.classList.add('starred');
            star.title = "Unstar this subnode";
        } else {
            star.textContent = '☆';
            star.classList.remove('starred');
            star.title = "Star this subnode";
        }
    });
    // After updating the UI, make sure the listeners are attached.
    attachStarClickListeners();
}

// We need to run this on initial load, but also whenever new subnodes are added to the DOM.
export async function initializeStars() {
    const starredUris = await getStarredUris();
    updateStarUI(starredUris);
};

// Node starring
async function starNode(uri: string) {
    const response = await fetch(`/api/star_node/${uri}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    return response.json();
}

async function unstarNode(uri: string) {
    const response = await fetch(`/api/unstar_node/${uri}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    return response.json();
}

async function getStarredNodeUris(): Promise<string[]> {
    const response = await fetch(`/api/starred_nodes`);
    if (!response.ok) {
        return [];
    }
    return response.json();
}

function attachNodeStarClickListeners() {
    document.querySelectorAll('.node-star-toggle').forEach((star: HTMLElement) => {
        if (star.dataset.listenerAttached) return;

        star.addEventListener('click', async (event) => {
            event.stopPropagation();
            event.preventDefault();
            const uri = star.dataset.nodeUri;
            if (!uri) return;

            const isStarred = star.classList.contains('starred');
            const action = isStarred ? unstarNode : starNode;

            try {
                const result = await action(uri);
                if (result.status === 'success') {
                    if (isStarred) {
                        star.textContent = '☆';
                        star.classList.remove('starred');
                        star.title = "Star this node";
                    } else {
                        star.textContent = '★';
                        star.classList.add('starred');
                        star.title = "Unstar this node";
                    }
                }
            } catch (error) {
                console.error("Failed to update node star:", error);
            }
        });
        star.dataset.listenerAttached = 'true';
    });
}

function updateNodeStarUI(starredUris: string[]) {
    document.querySelectorAll('.node-star-toggle').forEach((star: HTMLElement) => {
        const uri = star.dataset.nodeUri;
        if (uri && starredUris.includes(uri)) {
            star.textContent = '★';
            star.classList.add('starred');
            star.title = "Unstar this node";
        } else {
            star.textContent = '☆';
            star.classList.remove('starred');
            star.title = "Star this node";
        }
    });
    attachNodeStarClickListeners();
}

export async function initializeNodeStars() {
    const starredNodeUris = await getStarredNodeUris();
    updateNodeStarUI(starredNodeUris);
}
