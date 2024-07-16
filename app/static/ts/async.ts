import bindEvents from "./bind-events.ts"

export async function loadAsyncContent() {

    // this loads everything from the local node down to the footer.
    // prior to this as of 2023-12-06 we render the navbar, including search box, web search and stoas.
    var content = document.querySelector("#async-content");
    var node;
    if (content != null) {
        node = content.getAttribute('src');
        console.log("loading " + node + " async");
    }
    else {
        node = NODENAME;
        console.log("loading " + node + " sync");
    }

    // give some time to Wikipedia to search before trying to pull it (if it's considered relevant here).
    setTimeout(autoPullAsync, 1000)

    // Check local storage to see if the info boxes should be hidden
    const dismissButtons = document.querySelectorAll(".dismiss-button");
    dismissButtons.forEach(button => {
        const infoBoxId = button.getAttribute("info-box-id");
        const infoBox = document.querySelector(`.info-box[info-box-id="${infoBoxId}"]`);
        // Add click event to the dismiss button

        if (localStorage.getItem(`dismissed-${infoBoxId}`) === "true") {
            infoBox.classList.add("hidden");
            infoBox.style.display = "none";
        }

        button.addEventListener("click", function () {
            const parentDiv = button.parentElement;
            parentDiv.classList.add("hidden");
            localStorage.setItem(`dismissed-${infoBoxId}`, "true");

            // Optionally, you can completely remove the element from the DOM after the transition
            parentDiv.addEventListener("transitionend", function () {
                parentDiv.style.display = "none";
            }, { once: true });

        });
    });
    // end infobox dismiss code.



    // bind stoas, search and genai early.
    var details = document.querySelectorAll("details.url");
    details.forEach((item) => {
        item.addEventListener("toggle", async (event) => {
            if (item.open) {
                console.log("Details have been shown");
                const embed = item.querySelector(".stoa-iframe");
                if (embed) {
                    let url = embed.getAttribute('src');
                    embed.innerHTML = '<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="' + url + '" style="width: 100%;" height="700px"></iframe>';
                }
            } else {
                console.log("Details have been hidden");
                const embed = item.querySelector(".stoa-iframe");
                if (embed) {
                    console.log("Embed found, here we would fold.");
                    embed.innerHTML = '';
                }
            }
        });
    });

    var details = document.querySelectorAll("details.search");
    details.forEach((item) => {
        item.addEventListener("toggle", async (event) => {
            if (item.open) {
                console.log("Details have been shown");
                const searchEmbed = item.querySelector(".pulled-search-embed");
                if (searchEmbed) {
                    let qstr = searchEmbed.id;
                    console.log("Search embed found, here we would pull.");
                    /*
                    $.get(AGORAURL + '/fullsearch/' + qstr, function (data) {
                        $("#pulled-search.pulled-search-embed").html(data);
                    });
                    */
                    const response = await fetch(AGORAURL + '/fullsearch/' + qstr);
                    searchEmbed.innerHTML = await response.text();
                }
            } else {
                console.log("Details have been hidden");
                searchEmbed = item.querySelector(".pulled-search-embed");
                if (searchEmbed) {
                    console.log("Search embed found, here we would fold.");
                    searchEmbed.innerHTML = '';
                }
            }
        });
    });

    // same for GenAI if we have it enabled.
    var genai = document.querySelectorAll("details.genai");
    genai.forEach((item) => {
        item.addEventListener("toggle", async (event) => {
            if (item.open) {
                console.log("Details for GenAI have been shown");
                const genAIEmbed = item.querySelector(".pulled-genai-embed");
                if (genAIEmbed) {
                    let qstr = genAIEmbed.id;
                    console.log("GenAI embed found, here we would pull.");
                    const response = await fetch(AGORAURL + '/api/complete/' + qstr);
                    genAIEmbed.innerHTML = await response.text();
                }
            } else {
                console.log("Details for GenAI have been hidden");
                genAIEmbed = item.querySelector(".pulled-genai-embed");
                if (genAIEmbed) {
                    console.log("GenAI embed found, here we would fold.");
                    genAIEmbed.innerHTML = '';
                }
            }
        });

    });




    if (content != null) {
        // block on node loading (expensive if the task is freshly up)
        const response = await fetch(AGORAURL + '/node/' + node);
        content.innerHTML = await response.text();
    }

    setTimeout(bindEvents, 10)

}

export async function autoPullAsync() {
    // autopull if the local node is empty.
    // if ($(".not-found").length > 0) {
    console.log('auto pulling resources');
    var details = document.querySelectorAll(".autopull");
    details.forEach((item) => {
        item.click();
    });
    // }
}

