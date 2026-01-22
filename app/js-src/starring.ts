
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
export function initializeStars() {
    document.querySelectorAll('.star-toggle').forEach(button => {
        // Remove any existing listener to prevent duplicates
        button.removeEventListener('click', handleStarClick);
        button.addEventListener('click', handleStarClick);
    });
}

function handleStarClick(event) {
    event.stopPropagation();
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const subnodeUri = button.dataset.subnodeUri;
    const isStarred = button.classList.contains('starred');

    button.classList.add('star-pending');

    const endpoint = isStarred ? `/api/unstar/${subnodeUri}` : `/api/star/${subnodeUri}`;

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        button.classList.remove('star-pending');
        if (data.status === 'success') {
            button.classList.toggle('starred');
            button.innerHTML = isStarred ? '☆' : '★';
            
            // Success animation
            button.classList.add('star-popping');
            setTimeout(() => button.classList.remove('star-popping'), 300);
        } else {
            console.error('Failed to update star status:', data.message);
        }
    })
    .catch(error => {
        button.classList.remove('star-pending');
        console.error('Error:', error);
    });
}

// External Stars Logic

async function starExternal(url: string, title: string, source: string) {
    const response = await fetch(`/api/star_external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, source })
    });
    return response.json();
}

async function unstarExternal(url: string) {
    const response = await fetch(`/api/unstar_external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    return response.json();
}

async function getStarredExternalUrls(): Promise<string[]> {
    const response = await fetch(`/api/starred_external_urls`);
    if (!response.ok) {
        return [];
    }
    return response.json();
}

export function initializeExternalStars() {
    // Initial load check
    getStarredExternalUrls().then(starredUrls => {
        document.querySelectorAll('.external-star-toggle').forEach((button: HTMLElement) => {
            const url = button.dataset.externalUrl;
            if (url && starredUrls.includes(url)) {
                button.classList.add('starred');
                button.innerHTML = '★';
                button.title = "Unstar this resource";
            }
        });
    });

    document.querySelectorAll('.external-star-toggle').forEach(button => {
        button.removeEventListener('click', handleExternalStarClick);
        button.addEventListener('click', handleExternalStarClick);
    });
}

function handleExternalStarClick(event) {
    event.stopPropagation();
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const url = button.dataset.externalUrl;
    const title = button.dataset.externalTitle;
    const source = button.dataset.externalSource;
    const isStarred = button.classList.contains('starred');

    button.classList.add('star-pending');

    const action = isStarred ? unstarExternal(url) : starExternal(url, title, source);

    action.then(data => {
        button.classList.remove('star-pending');
        if (data.status === 'success') {
            button.classList.toggle('starred');
            button.innerHTML = isStarred ? '☆' : '★';
            button.title = isStarred ? "Star this resource" : "Unstar this resource";
            
            // Success animation
            button.classList.add('star-popping');
            setTimeout(() => button.classList.remove('star-popping'), 300);
        } else {
            console.error('Failed to update external star status:', data.message);
        }
    })
    .catch(error => {
        button.classList.remove('star-pending');
        console.error('Error:', error);
    });
}

export function initializeNodeStars() {
    document.querySelectorAll('.node-star-toggle').forEach(button => {
        button.removeEventListener('click', handleNodeStarClick);
        button.addEventListener('click', handleNodeStarClick);
    });
}

function handleNodeStarClick(event) {
    event.stopPropagation();
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const nodeUri = button.dataset.nodeUri;
    const isStarred = button.classList.contains('starred');

    button.classList.add('star-pending');

    const endpoint = isStarred ? `/api/unstar_node/${nodeUri}` : `/api/star_node/${nodeUri}`;

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        button.classList.remove('star-pending');
        if (data.status === 'success') {
            button.classList.toggle('starred');
            button.innerHTML = isStarred ? '☆' : '★';
            
            // Success animation
            button.classList.add('star-popping');
            setTimeout(() => button.classList.remove('star-popping'), 300);
        } else {
            console.error('Failed to update node star status:', data.message);
        }
    })
    .catch(error => {
        button.classList.remove('star-pending');
        console.error('Error:', error);
    });
}
