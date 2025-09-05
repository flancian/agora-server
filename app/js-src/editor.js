document.addEventListener('DOMContentLoaded', () => {
    console.log("loaded");
    main();
});

const accessToken = localStorage.getItem("gitea-token");
let user;
let raw;

async function getUser() {
    const response = await fetch(`https://git.anagora.org/api/v1/user`, {
        headers: { "Authorization": `token ${accessToken}` },
    });
    user = await response.json();
    return user.login;
}

window.saveData = async function () {
    const text = document.querySelector("#node-editor").value;
    let body;

    try {
        const response = await fetch(`https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`, {
            headers: { "Authorization": `token ${accessToken}` },
        });
        body = await response.json();

        const sha = body.sha;
        const result = await fetch(`https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`, {
            method: "PUT",
            headers: {
                "Authorization": `token ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: btoa(text),
                sha
            })
        });
        console.log("RESULT", await result.json());
    } catch (e) {
        console.error(e);
        const result = await fetch(`https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`, {
            method: "POST",
            headers: {
                "Authorization": `token ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: btoa(text),
            })
        });
        console.log("RESULT", await result.json());
    }
};

let saved;
async function main() {
    user = localStorage.getItem("gitea-user") || await getUser();

    const subnodeHTML = `
    <div class="subnode" data-author="${user}">
        <div class="subnode-header">
            <span class="subnode-id">
                <a href="/@${user}/${NODENAME}">📓</a>
                <span class="subnode-links"><a href="/raw/garden/${user}/${NODENAME}.md">garden/${user}/${NODENAME}.md</a> by <a href="/@${user}">@<span class="subnode-user">${user}</span></a></span>
            </span>
            <span class="subnode-contrib"></span>
        </div>
        <span class="subnode-content">
            <textarea style="width: 100%" id="node-editor" cols="60" rows="10"></textarea>
            <br>
            <button onclick="saveData()">Save</button> <button onClick="toggle()">Toggle</button>
        </span>
    </div>`;

    const repo = localStorage.getItem("gitea-repo");
    const snelementSelector = `div.subnode[data-author='${user}']`;
    const selector = `${snelementSelector} .subnode-content`;
    
    const linkElement = document.querySelector(`${snelementSelector} .subnode-links a`);
    if (linkElement) {
        raw = linkElement.getAttribute("href");
    }

    const snode = document.querySelector(selector);
    if (snode) {
        saved = snode.innerHTML;
        const text = await grabMarkdown();
        snode.innerHTML = `<textarea style="width: 100%" id="node-editor" cols="60" rows="10">${text}</textarea>
            <br>
            <button onClick="saveData()">Save</button> <button onClick="toggle()">Toggle</button>`;
    } else {
        const nh = document.querySelector(".node-header");
        if (nh) {
            nh.insertAdjacentHTML('afterend', subnodeHTML);
        }
    }
}

window.main = main;

window.toggle = async function toggle() {
    console.log("toggle");
    const user = localStorage.getItem("gitea-user") || await getUser();
    const snelementSelector = `div.subnode[data-author='${user}']`;
    const selector = `${snelementSelector} .subnode-content`;
    
    const linkElement = document.querySelector(`${snelementSelector} .subnode-links a`);
    if (linkElement) {
        raw = linkElement.getAttribute("href");
    }
    
    const snode = document.querySelector(selector);
    if (snode) {
        if (!saved.includes('toggle')) { // A bit brittle, but matches original logic
            saved += "<button onClick='main()'>Toggle</button>";
        }
        snode.innerHTML = saved;
    }
};

async function grabMarkdown() {
    let text;
    try {
        const response = await fetch(raw);
        text = await response.text();
    } catch (e) {
        console.error(e);
        text = "";
    }
    return text;
}