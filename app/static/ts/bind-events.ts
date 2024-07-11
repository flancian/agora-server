const autoPull = JSON.parse(localStorage["auto-pull"] || 'true')
export default async function bindEvents() {

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

    // this works and has already replaced most pull buttons for Agora sections.
    // this is for 'zippies' that require pulling (e.g. pulled nodes).
    var details = document.querySelectorAll("details.node");
    details.forEach((item) => {
        item.addEventListener("toggle", (event) => {
            if (item.open) {
                console.log("Details have been shown");
                nodeEmbed = item.querySelector(".node-embed");
                if (nodeEmbed) {
                    let node = nodeEmbed.id;
                    console.log("Node embed found, here we would pull.");
                    nodeEmbed.innerHTML = '<iframe src="' + AGORAURL + '/' + node + '" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>';
                }
            } else {
                console.log("Details have been hidden");
                nodeEmbed = item.querySelector(".node-embed");
                if (nodeEmbed) {
                    console.log("Node embed found, here we would fold.");
                    nodeEmbed.innerHTML = '';
                }
            }
        });
    });


    // end zippies.

    $(".pushed-subnodes-embed").each(function (e) {
        // auto pull pushed subnodes by default.
        // it would be better to infer this from node div id?
        let node = NODENAME;
        let arg = ARG;
        let id = ".pushed-subnodes-embed";
        console.log('auto pulling pushed subnodes, will write to id: ' + id);
        if (arg != '') {
            $.get(AGORAURL + '/push/' + node + '/' + arg, function (data) {
                $(id).html(data);
            });
        }
        else {
            $.get(AGORAURL + '/push/' + node, function (data) {
                $(id).html(data);
            });
        }
        // end auto pull pushed subnodes.
    });

    $(".context").each(function (e) {
        // auto pull context by default.
        // it would be better to infer this from node div id?
        let node = NODENAME
        let id = '.context'
        console.log('auto pulling context, will write to id: ' + id);
        $.get(AGORAURL + '/context/' + node, function (data) {
            $(id).html(data);
        });
        // end auto pull pushed subnodes.

        // $(".autopull").each(function (e) {
        //   console.log('*** auto pulling item, trying to activate' + this)
        //   this.click()
        // });

        if (autoPull) {
            console.log('auto pulling recommended (local, friendly-looking domains) resources!');
            // auto pull everything with class auto-pull by default.
            // as of 2022-03-24 this is used to automatically include nodes pulled by gardens in the Agora.
            $(".auto-pull-button").each(function (e) {
                console.log('auto pulling URLs, trying to press button' + this)
                this.click()
            });
        }
    });
    // end async content code.

    // pull nodes from the [[agora]]
    // pull-node are high-ranking (above the 'fold' of context), .pull-related-node are looser links below.
    $(".pull-node").click(function (e) {
        let node = this.value;

        if (this.classList.contains('pulled')) {
            // already pulled.
            // $(e.currentTarget).nextAll('div').remove()
            $("#" + node + ".pulled-node-embed").html('');
            this.innerText = 'pull';
            this.classList.remove('pulled');
        }
        else {
            this.innerText = 'pulling';
            console.log('pulling node');
            // now with two methods! you can choose the simpler/faster one (just pulls static content) or the nerdy one (recursive) in settings.
            if (pullRecursive) {
                $("#" + node + ".pulled-node-embed").html('<iframe src="' + AGORAURL + '/embed/' + node + '" style="max-width: 100%;" allowfullscreen="allowfullscreen"></iframe>');
            }
            else {
                $.get(AGORAURL + '/pull/' + node, function (data) {
                    $("#" + node + ".pulled-node-embed").html(data);
                });
            }
            this.innerText = 'fold';
            this.classList.add('pulled');
        }
    });

    // pull arbitrary URL
    $(".pull-url").click(function (e) {
        console.log("in pull-url!")
        if (this.classList.contains('pulled')) {
            // already pulled.
            this.innerText = 'pull';
            $(e.currentTarget).nextAll('iframe').remove()
            this.classList.remove('pulled');
        }
        else {
            // pull.
            this.innerText = 'pulling';
            let url = this.value;
            console.log('pull url : ' + url)
            $(e.currentTarget).after('<iframe class="stoa2-iframe" allow="camera; microphone; fullscreen; display-capture; autoplay" src="' + url + '"></iframe>')
            this.innerText = 'fold';
            this.classList.add('pulled');
        }
    });

    $(".pull-tweet").click(function (e) {
        if (this.classList.contains('pulled')) {
            div = $(e.currentTarget).nextAll('.twitter-tweet')
            div.remove()
            this.innerText = 'pull';
            this.classList.remove('pulled');
        }
        else {
            this.innerText = 'pulling';
            let tweet = this.value;

            $(e.currentTarget).after(`<blockquote class="twitter-tweet" data-theme="dark"><a href="${tweet}"> </blockquote>
                <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"> </script>`)
            this.classList.add('pulled');
            this.innerText = 'fold';
        }
    });

    // pull a mastodon status (toot) using the roughly correct way IIUC.
    $(".pull-mastodon-status").click(function (e) {
        if (this.classList.contains('pulled')) {
            div = $(e.currentTarget).nextAll('.mastodon-embed')
            div.remove()
            br = $(e.currentTarget).nextAll('')
            br.remove()
            this.innerText = 'pull';
            this.classList.remove('pulled');
        }
        else {
            this.innerText = 'pulling';
            statusContent(this)
            this.classList.add('pulled');
            this.innerText = 'fold';
        }
    });

    // pull a pleroma status (toot) using the laziest way I found, might be a better one
    $(".pull-pleroma-status").click(function (e) {
        let toot = this.value;
        $(e.currentTarget).after(`<br /><iframe src="${toot}" class="mastodon-embed" style="max-width: 100%;"
width="400" allowfullscreen="allowfullscreen" > </iframe>
        <script src="https://freethinkers.lgbt/embed.js" async="async" > </script>`)
        this.innerText = 'pulled';
    });

    // pull all/fold all button in main node
    $("#pull-all").click(function (e) {

        if (!this.classList.contains('pulled')) {
            // this hasn't been pulled yet, so go ahead and pull

            // this.innerText = 'pulling all';
            console.log('auto pulling all!');
            $(".pull-node").each(function (e) {
                if (!this.classList.contains('pulled')) {
                    console.log('auto pulling nodes');
                    this.click();
                }
            });
            $(".pull-mastodon-status").each(function (e) {
                if (!this.classList.contains('pulled')) {
                    console.log('auto pulling activity');
                    this.click();
                }
            });
            $(".pull-tweet").each(function (e) {
                if (!this.classList.contains('pulled')) {
                    console.log('auto pulling tweet');
                    this.click();
                }
            });
            /*
            $(".pull-stoa").each(function (e) {
            if (!this.classList.contains('pulled')) {
            console.log('auto pulling stoa');
            this.click();
            }
            });
            */
            $(".pull-search").each(function (e) {
                if (!this.classList.contains('pulled')) {
                    console.log('auto pulling search');
                    this.click();
                }
            });
            $(".pull-url").each(function (e) {
                console.log('auto pulling url');
                this.click();
            });
            this.innerText = 'fold all';
            this.title = 'Folds (hides) pulls below.';
            this.classList.add('pulled');

        }
        else {
            // Already pulled -> fold and flip back button.
            $(".pull-node").each(function (e) {
                if (this.classList.contains('pulled')) {
                    console.log('auto folding nodes');
                    this.click();
                }
            });
            $(".pull-mastodon-status").each(function (e) {
                if (this.classList.contains('pulled')) {
                    console.log('auto folding activity');
                    this.click();
                }
            });
            $(".pull-tweet").each(function (e) {
                if (this.classList.contains('pulled')) {
                    console.log('auto folding tweet');
                    this.click();
                }
            });
            /*
            $(".pull-stoa").each(function (e) {
            if (this.classList.contains('pulled')) {
            console.log('auto folding stoa');
            this.click();
            }
            });
            */
            $(".pull-search").each(function (e) {
                if (this.classList.contains('pulled')) {
                    console.log('auto folding search');
                    this.click();
                }
            });
            $(".pull-url").each(function (e) {
                if (this.classList.contains('pulled')) {
                    console.log('auto pulling url');
                    this.click();
                }
            });

            this.innerText = 'pull all';
            this.title = 'Pulls (embeds, transcludes) some links below.';
            this.classList.remove('pulled');

        }

    });

}