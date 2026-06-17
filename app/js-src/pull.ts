// app/js-src/pull.ts

// This is the legacy pull-node logic.
function pullNode(button: HTMLButtonElement) {
    const node = button.value;
    const pullRecursive = JSON.parse(localStorage.getItem("pull-recursive") || 'true');
    const embedContainer = document.querySelector(`#${node}.pulled-node-embed`);

    if (!embedContainer) return;

    if (pullRecursive) {
        embedContainer.innerHTML = `<iframe loading="lazy" src="/embed/${node}" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>`;
    } else {
        fetch(`/pull/${node}`)
            .then(response => response.text())
            .then(data => {
                embedContainer.innerHTML = data;
            });
    }
}

function pullUrl(button: HTMLButtonElement) {
    const url = button.value;
    const embedContainer = document.createElement('div');
    embedContainer.className = 'agora-pull-embed';

    const iframe = document.createElement('iframe');
    iframe.loading = 'lazy';
    iframe.className = 'stoa2-iframe';
    iframe.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; autoplay');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation');
    iframe.src = url;
    embedContainer.appendChild(iframe);
    
    button.after(embedContainer);
}

function pullTweet(button: HTMLButtonElement) {
    const tweet = button.value;
    const embedContainer = document.createElement('div');
    embedContainer.className = 'agora-pull-embed';

    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    blockquote.setAttribute('data-theme', 'dark');
    blockquote.innerHTML = `<a href="${tweet}"></a>`;
    embedContainer.appendChild(blockquote);
    
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://platform.twitter.com/widgets.js";
    script.charset = "utf-8";
    embedContainer.appendChild(script);
    
    button.after(embedContainer);
}

function renderMastodonPost(post: any): string {
    const date = new Date(post.created_at).toLocaleString();
    let media = '';
    if (post.media_attachments.length > 0) {
        media = post.media_attachments.map((attachment: any) => {
            if (attachment.type === 'image') {
                return `<a href="${attachment.url}" target="_blank"><img src="${attachment.preview_url}" alt="${attachment.description || 'Mastodon image'}" class="mastodon-embed-image"></a>`;
            }
            return '';
        }).join('');
    }

    return `
        <div class="mastodon-embed-container">
            <div class="mastodon-embed-header">
                <img src="${post.account.avatar}" class="mastodon-embed-avatar">
                <div class="mastodon-embed-author">
                    <strong>${post.account.display_name}</strong>
                    <span>@${post.account.acct}</span>
                </div>
            </div>
            <div class="mastodon-embed-content">
                ${post.content}
            </div>
            <div class="mastodon-embed-media">
                ${media}
            </div>
            <div class="mastodon-embed-footer">
                <a href="${post.url}" target="_blank">${date}</a>
            </div>
        </div>
    `;
}


async function pullMastodonStatus(button: HTMLButtonElement) {
    const toot = button.value;
    let domain, post;
    const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig;
    const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig;

    let m;
    if (m = web_regex.exec(toot)) {
        domain = m[1];
        post = m[2];
    } else if (m = user_regex.exec(toot)) {
        domain = m[1];
        post = m[2];
    } else {
        return;
    }

    try {
        const req = `${domain}/api/v1/statuses/${post}`;
        const response = await fetch(req);
        const data = await response.json();
        const embedHTML = `<div class="agora-pull-embed">${renderMastodonPost(data)}</div>`;
        button.insertAdjacentHTML('afterend', embedHTML);
    } catch (error) {
        console.error('Error fetching Mastodon status:', error);
        button.insertAdjacentHTML('afterend', '<div class="agora-pull-embed error">Could not load Mastodon post.</div>');
    }
}

async function pullBlueskyStatus(button: HTMLButtonElement) {
    const url = button.value;
    const match = url.match(/https:\/\/bsky\.app\/profile\/([^\/]+)\/post\/([^\/]+)/);
    
    if (!match) {
        console.error("Invalid Bluesky URL format");
        return;
    }

    const handle = match[1];
    const postId = match[2];

    try {
        let did = handle;
        if (!handle.startsWith("did:")) {
            const resolveReq = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`;
            const response = await fetch(resolveReq);
            if (!response.ok) throw new Error(`Resolve handle failed: ${response.statusText}`);
            const data = await response.json();
            did = data.did;
        }

        const atUri = `at://${did}/app.bsky.feed.post/${postId}`;
        
        const widgetHtml = `
            <div class="agora-pull-embed">
                <blockquote class="bluesky-embed" data-bluesky-uri="${atUri}" data-bluesky-cid="">
                  <p lang="en">
                    <a href="${url}">View on Bluesky</a>
                  </p>
                </blockquote>
            </div>
        `;

        button.insertAdjacentHTML('afterend', widgetHtml);

        if (!document.querySelector('script[src="https://embed.bsky.app/static/embed.js"]')) {
            const script = document.createElement('script');
            script.async = true;
            script.src = "https://embed.bsky.app/static/embed.js";
            script.charset = "utf-8";
            document.body.appendChild(script);
        }

    } catch (error) {
        console.error('Error fetching Bluesky status (client-side):', error);
        button.insertAdjacentHTML('afterend', `<div class="agora-pull-embed error">Could not load Bluesky post: ${error}</div>`);
    }
}


export function initPullButtons() {
    const selectors = [
        ".pull-node",
        ".pull-url",
        ".pull-tweet",
        ".pull-mastodon-status",
        ".pull-bluesky-status"
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((element: HTMLButtonElement) => {
        if (element.dataset.pullBound === 'true') return;
        element.dataset.pullBound = 'true';
        element.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const button = e.currentTarget as HTMLButtonElement;

            if (button.classList.contains('pulled')) {
                // Already pulled, so we fold.
                const nextElement = button.nextElementSibling;
                if (nextElement && (nextElement.classList.contains('agora-pull-embed') || nextElement.classList.contains('mastodon-embed-container') || nextElement.classList.contains('twitter-tweet') || nextElement.tagName === 'IFRAME' || nextElement.tagName === 'BLOCKQUOTE')) {
                    nextElement.remove();
                }
                // Special handling for the node embed container.
                if (button.classList.contains('pull-node')) {
                     const embedContainer = document.querySelector(`#${button.value}.pulled-node-embed`);
                     if (embedContainer) {
                         embedContainer.innerHTML = '';
                     }
                }

                button.innerText = 'pull';
                button.classList.remove('pulled');
            } else {
                // Not pulled, so we pull.
                button.innerText = 'pulling';

                if (button.classList.contains('pull-node')) {
                    pullNode(button);
                } else if (button.classList.contains('pull-url')) {
                    pullUrl(button);
                } else if (button.classList.contains('pull-tweet')) {
                    pullTweet(button);
                } else if (button.classList.contains('pull-mastodon-status')) {
                    pullMastodonStatus(button).then(() => {
                        button.innerText = 'fold';
                    });
                } else if (button.classList.contains('pull-bluesky-status')) {
                    pullBlueskyStatus(button).then(() => {
                        button.innerText = 'fold';
                    });
                }
                
                if (!button.classList.contains('pull-mastodon-status') && !button.classList.contains('pull-bluesky-status')) {
                    button.innerText = 'fold';
                }
                button.classList.add('pulled');
            }
        });
    });
}
