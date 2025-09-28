
// app/js-src/pull.ts

// This is the legacy pull-node logic.
function pullNode(button: HTMLButtonElement) {
    const node = button.value;
    const pullRecursive = JSON.parse(localStorage.getItem("pull-recursive") || 'true');
    const embedContainer = document.querySelector(`#${node}.pulled-node-embed`);

    if (!embedContainer) return;

    if (pullRecursive) {
        embedContainer.innerHTML = `<iframe src="/embed/${node}" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>`;
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
    const iframe = document.createElement('iframe');
    iframe.className = 'stoa2-iframe';
    iframe.setAttribute('allow', 'camera; microphone; fullscreen; display-capture; autoplay');
    iframe.src = url;
    button.after(iframe);
}

function pullTweet(button: HTMLButtonElement) {
    const tweet = button.value;
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    blockquote.setAttribute('data-theme', 'dark');
    blockquote.innerHTML = `<a href="${tweet}"></a>`;
    button.after(blockquote);
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://platform.twitter.com/widgets.js";
    script.charset = "utf-8";
    button.after(script);
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
        const actual_url = data['url'];

        const oembed_req = `${domain}/api/oembed?url=${actual_url}`;
        const oembedResponse = await fetch(oembed_req);
        const oembedData = await oembedResponse.json();
        button.insertAdjacentHTML('afterend', oembedData['html']);
    } catch (error) {
        console.error('Error fetching Mastodon status:', error);
    }
}


export function initPullButtons() {
    const selectors = [
        ".pull-node",
        ".pull-url",
        ".pull-tweet",
        ".pull-mastodon-status"
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((element: HTMLButtonElement) => {
        element.addEventListener("click", function (e) {
            const button = e.currentTarget as HTMLButtonElement;

            if (button.classList.contains('pulled')) {
                // Already pulled, so we fold.
                const nextElement = button.nextElementSibling;
                if (nextElement) {
                    nextElement.remove();
                }
                // Special handling for tweet's script tag.
                if (button.classList.contains('pull-tweet')) {
                    const script = button.nextElementSibling;
                    if (script && script.tagName === 'SCRIPT') {
                        script.remove();
                    }
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
                }
                
                if (!button.classList.contains('pull-mastodon-status')) {
                    button.innerText = 'fold';
                }
                button.classList.add('pulled');
            }
        });
    });
}
