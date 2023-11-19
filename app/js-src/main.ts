// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// Adapted from https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/#toggling-themes

import jquery from "jquery";
import { SingleEntryPlugin } from "webpack";
(<any>window).$ = (<any>window).jQuery = jquery;

// these define default dynamic behaviour client-side, based on local storage preferences.
// these come from toggles in settings.ts.
const autoPull = JSON.parse(localStorage["auto-pull"] || 'true')
const autoPullExtra = JSON.parse(localStorage["auto-pull-extra"] || 'false')
// This would make sense but Hedgedoc currently steals focus on embed and I've been unable to fix it so far :).
const autoPullStoa = JSON.parse(localStorage["auto-pull-stoa"] || 'false')
const autoPullSearch = JSON.parse(localStorage["auto-pull-search"] || 'true')
const autoExec = JSON.parse(localStorage["auto-exec"] || 'true')
const pullRecursive = JSON.parse(localStorage["pull-recursive"] || 'true')
const showBrackets = JSON.parse(localStorage["showBrackets"] || 'false')

document.addEventListener("DOMContentLoaded", function () {
  // Select button
  var theme = document.querySelector("#theme-link");
  var toggle = document.querySelector("#theme-toggle");
  const currentTheme = localStorage.getItem("theme");
  console.log("DomContentLoaded");
  console.log("Settings are: " + autoPull + " " + autoPullExtra);
  // If the user's preference in localStorage is dark...
  if (currentTheme == "dark") {
    theme.href = "/static/css/screen-dark.css";
    toggle.innerHTML = '🌞 Theme';
  } else if (currentTheme == "light") {
    theme.href = "/static/css/screen-light.css";
    theme.innerHTML = '🌙 Theme';
  }

  // Listen for a click on the button
  toggle.addEventListener("click", function () {
    // Select the stylesheet <link>
    console.log("click!");
    var theme = document.querySelector("#theme-link");
    var toggle = document.querySelector("#theme-toggle");
    if (theme.getAttribute("href") == "/static/css/screen-light.css") {
      theme.href = "/static/css/screen-dark.css";
      // this doesn't work and I don't know why, but it also doesn't seem like a priority :)
      localStorage.setItem("theme", "dark");
      toggle.innerHTML = '🌞 Theme';
    } else {
      theme.href = "/static/css/screen-light.css";
      localStorage.setItem("theme", "light");
      toggle.innerHTML = '🌙 Theme';
    }
  });

  // clear mini cli on clicking clear button
  $("#mini-cli-clear").click(() => {
    console.log("clearing mini-cli")
    $("#mini-cli").val("")
  })
  $("#mini-cli-exec").click(() => {
    console.log("exec mini-cli")
    $("#mini-cli").parent().submit()
  })
  $("#mini-cli-go").click(() => {
    console.log("go mini-cli")
    let val = $("#mini-cli").val()
    $("#mini-cli").val('go/' + val)
    $("#mini-cli").parent().submit()
  })
  $("#mini-cli-pull").click(() => {
    console.log("pull mini-cli")
    /* some logic to add a new pulled node div and embed the target node would go here */
  })

  // focus mini-cli on key combo
  $(window).keydown(function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode == 83) {
      $("#mini-cli").focus().val("")
    }
  })

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
      $(e.currentTarget).after('<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="' + url + '" style="max-width: 100%;" width="960px" height="700em"></iframe>')
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });

  // jitsi specific code using their api.
  // unused / disabled right now as there was no evident advantage in using this as opposed to just using generic pull-url code for embedding the iframe.
  /*
  $(".pull-jitsi").click(function (e) {
    console.log("in pull-url!")
    if (this.classList.contains('pulled')) {
      // already pulled.
      this.innerText = 'pull';
      $('#meet-iframe').html('');
      this.classList.remove('pulled');
    }
    else {
      // pull.
      this.innerText = 'pulling';
      let url = this.value;
      const domain = 'meet.jit.si';
      const options = {
        roomName: NODENAME,
        width: 800,
        height: 600,
        parentNode: document.querySelector('#meet-iframe')
      };
      const api = new JitsiMeetExternalAPI(domain, options);
      //$(e.currentTarget).nextAll('iframe').attr('allow', 'camera; microphone; fullscreen; display-capture; autoplay')
      //$(e.currentTarget).nextAll('iframe').attr('src', url)
      //$(e.currentTarget).nextAll('iframe').show()
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });
  */

  // pull a node from the default [[stoa]]
  $("#pull-stoa").click(function (e) {
    console.log('clicked stoa button')
    if (this.classList.contains('pulled')) {
      // already pulled.
      this.innerText = 'pull';
      $(e.currentTarget).nextAll('iframe').remove()
      $("#stoa-iframe").html('');
      this.classList.remove('pulled');
    }
    else {
      this.innerText = 'pulling';
      let node = this.value;
      $("#stoa-iframe").html('<iframe id="stoa-iframe" name="embed_readwrite" src="https://doc.anagora.org/' + node + '?edit" width="100%" height="700em"></iframe>');
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });

  // pull a node from the second [[stoa]] (ha!)
  $("#pull-stoa2").click(function (e) {
    console.log('clicked stoa2 button')
    if (this.classList.contains('pulled')) {
      // already pulled.
      this.innerText = 'pull';
      $(e.currentTarget).nextAll('iframe').remove()
      $("#stoa2-iframe").html('');
      this.classList.remove('pulled');
    }
    else {
      this.innerText = 'pulling';
      let node = this.value;
      $("#stoa2-iframe").html('<iframe id="stoa2-iframe" name="embed_readwrite" src="https://stoa.anagora.org/p/' + node + '?edit" width="100%" height="700em"></iframe>');
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });

  // pull jitsi [[stoa]] (ha!)
  $("#pull-jitsi").click(function (e) {
    console.log('clicked jitsi button')
    if (this.classList.contains('pulled')) {
      // already pulled.
      this.innerText = 'pull';
      $(e.currentTarget).nextAll('iframe').remove()
      $("#meet-iframe").html('');
      this.classList.remove('pulled');
    }
    else {
      this.innerText = 'pulling';
      let value = this.value;
      $("#meet-iframe").html('<iframe id="meet-iframe" allow="camera; microphone; fullscreen; display-capture; autoplay" name="embed_readwrite" src="' + value + '" width="100%" + height="700em"></iframe>');
      this.innerText = 'fold';
      this.classList.add('pulled');
    }
  });

  // start async content code.
  setTimeout(loadAsyncContent, 10)

  async function loadAsyncContent() {
    var content = document.querySelector("#async-content");
    let node = content.getAttribute('src');
    console.log("loading " + node + " async");
    response = await fetch(AGORAURL + '/node/' + node);
    content.innerHTML = await response.text();
    setTimeout(bindEvents, 10)
  }

  async function bindEvents() {
    // this works and has already replaced most pull buttons for Agora sections.
    // this is for 'zippies' that require pulling (e.g. pulled nodes).
    var details = document.querySelectorAll("details.node");
    details.forEach((item) => {
        item.addEventListener("toggle", (event) => {
            if (item.open) {
                console.log("Details have been shown");
                embed = item.querySelector(".node-embed");
                if (embed) {
                    let node = embed.id;
                    console.log("Embed found, here we would pull.");
                    embed.innerHTML = '<iframe src="' + AGORAURL + '/' + node + '" style="max-width: 100%;" width="100%" height="700em" allowfullscreen="allowfullscreen"></iframe>';
                }
            } else {
                console.log("Details have been hidden");
                embed = item.querySelector(".node-embed");
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
                embed = item.querySelector(".pulled-search-embed");
                if (embed) {
                    let qstr = embed.id;
                    console.log("Embed found, here we would pull.");
                    /*
                    $.get(AGORAURL + '/fullsearch/' + qstr, function (data) {
                        $("#pulled-search.pulled-search-embed").html(data);
                    });
                    */
                    response = await fetch(AGORAURL + '/fullsearch/' + qstr);
                    embed.innerHTML = await response.text();
                }
            } else {
                console.log("Details have been hidden");
                embed = item.querySelector(".pulled-search-embed");
                if (embed) {
                    console.log("Embed found, here we would fold.");
                    embed.innerHTML = '';
                }
            }
        });
    });

    var details = document.querySelectorAll("details.url");
    details.forEach((item) => {
        item.addEventListener("toggle", async (event) => {
            if (item.open) {
                console.log("Details have been shown");
                embed = item.querySelector(".stoa-iframe");
                if (embed) {
                    let url = embed.getAttribute('src');
                    embed.innerHTML = '<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="' + url + '" style="width: 100%;" height="700px"></iframe>';
                }
            } else {
                console.log("Details have been hidden");
                embed = item.querySelector(".stoa-iframe");
                if (embed) {
                    console.log("Embed found, here we would fold.");
                    embed.innerHTML = '';
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
      let id = "#" + node + " .pushed-subnodes-embed";
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
        $("#" + node + ".pulled-node-embed").html('<iframe src="' + AGORAURL + '/embed/' + node + '" style="max-width: 100%;" width="100%" height="700em" allowfullscreen="allowfullscreen"></iframe>');
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
  }

  // pull full text search 
  $(".pull-search").click(function (e) {
    if (autoPullSearch) {
      console.log('pulling full text search');
      if (this.classList.contains('pulled')) {
        $("#pulled-search.pulled-search-embed").html('');
        this.innerText = 'pull';
        this.classList.remove('pulled');
      }
      else {
        this.innerText = 'pulling';
        let qstr = this.value;
        $.get(AGORAURL + '/fullsearch/' + qstr, function (data) {
          $("#pulled-search.pulled-search-embed").html(data);
        });
        this.classList.add('pulled');
        this.innerText = 'fold';
      }
    }
  });

  if (showBrackets) {
    elements = document.getElementsByClassName("wikilink-marker");
    console.log("should show brackets");
    for (var i = 0; i < elements.length; i++) {
      elements[i].style.display = 'inline';
    }
  }


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
        $(e.currentTarget).after('<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="' + tweet + '"></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>')
        this.classList.add('pulled');
        this.innerText = 'fold';
    }
  });

  function statusContent(self) {
    let toot = self.value;
    let domain, post;
    // extract instance and :id, then use https://docs.joinmastodon.org/methods/statuses/ and get an oembed
    // there are two kinds of statuses we want to be able to embed: /web/ led and @user led.
    const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig
    const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig

    console.log("testing type of presumed mastodon embed: " + toot);
    if (m = web_regex.exec(toot)) {
      console.log("found status of type /web/");
      domain = m[1];
      post = m[2];
    }
    if (m = user_regex.exec(toot)) {
      console.log("found status of type /@user/");
      domain = m[1];
      post = m[2];
    }

    req = domain + '/api/v1/statuses/' + post
    console.log('req: ' + req)
    $.get(req, function (data) {
      console.log('status: ' + data['url'])
      let actual_url = data['url']

      let oembed_req = domain + '/api/oembed?url=' + actual_url
      $.get(oembed_req, function (data) {
        console.log('oembed: ' + data['html'])
        let html = '<br /> ' + data['html']
        $(self).after(html);
      });
    });
    self.innerText = 'pulled';
  }
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
    $(e.currentTarget).after('<br /><iframe src="' + toot + '" class="mastodon-embed" style="max-width: 100%;" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://freethinkers.lgbt/embed.js" async="async"></script>')
    this.innerText = 'pulled';
  });

  // go to the specified URL
  $(".go-url").click(function (e) {
    let url = this.value;
    this.innerText = 'going';
    window.location.replace(url);
  });

  // fold all button
  $("#fold-all").click(function (e) {
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
      $(".pull-url").each(function(e) {
        if (this.classList.contains('pulled')) {
            console.log('auto pulling url');
            this.click();
        }
      });
    });


  $("#pull-all").click(function (e) {
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
      $(".pull-url").each(function(e) {
        console.log('auto pulling url');
        this.click();
      });

  });

  if (autoExec) {
    console.log('autoexec is enabled')

    setTimeout(autoPullWpOnEmpty, 2000)
    // commenting out as focus stealing issues are just too disruptive.
    // setTimeout(autoPullStoaOnEmpty, 5000)

    // auto pull search by default.
    $(".pull-search").each(function (e) {
      console.log('auto pulling search');
      this.click();
    });

   $(".pushed-subnodes-embed").each(function (e) {
      // auto pull pushed subnodes by default.
      // it would be better to infer this from node div id?
      let node = NODENAME;
      let arg = ARG;
      let id = "#" + node + " .pushed-subnodes-embed";
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
    });

    $(".context-all").each(function (e) {
      // auto pull whole Agora graph in /nodes.
      let id = '.context-all'
      console.log('auto pulling whole Agora graph, will write to id: ' + id);
      $.get(AGORAURL + '/context/all', function (data) {
        $(id).html(data);
      });
      // end auto pull pushed subnodes.
    });

    console.log('executing node: ' + NODENAME)
    req = AGORAURL + '/exec/wp/' + encodeURI(NODENAME)
    console.log('req: ' + req)
    $.get(req, function (data) {
      // console.log('html: ' + data)
      embed = $(".topline-search").after(data);

      // figure out how to do this without code repetition -- ask [[vera]]?
      // also, could we scope this search to stuff inside embed? unsure if that points to the DOM, it didn't seem to work.
      $(".pull-exec").click(function (e) {
        console.log("in pull-exec!")
        if (this.classList.contains('pulled')) {
          // already pulled.
          this.innerText = 'pull';
          $(e.currentTarget).nextAll('iframe').remove()
          this.classList.remove('pulled');
          $(".node-hint").show();
        }
        else {
          // pull.
          this.innerText = 'pulling';
          let url = this.value;
          console.log('pull exec: ' + url)
          $(e.currentTarget).after('<iframe id="exec-wp" src="' + url + '" style="max-width: 100%;" width="100%" height="700em" allowfullscreen="allowfullscreen"></iframe>')
          this.innerText = 'fold';
          this.classList.add('pulled');
          $(".node-hint").hide();
        }
      });

      $(".go-exec").click(function (e) {
        // this doesn't work because of same-origin restrictions I think -- contentWindow/contentDocument are always undefined.
        console.log("in go-exec!")
        window.location.href = $('#exec-wp').contentWindow.location.href
      });

    });

  }
 
  if (autoPull) {
    console.log('auto pulling recommended (local, friendly-looking domains) resources!');
     // auto pull everything with class auto-pull by default.
    // as of 2022-03-24 this is used to automatically include nodes pulled by gardens in the Agora.
    $(".auto-pull-button").each(function (e) {
      console.log('auto pulling node, trying to press button' + this)
      this.click()
    });
 
  }
  if (autoPullExtra) {
    console.log('auto pulling external resources!');
    $(".pull-mastodon-status").each(function (e) {
      console.log('auto pulling activity');
      this.click();
    });
    $(".pull-tweet").each(function (e) {
      console.log('auto pulling tweet');
      this.click();
    });
    $(".pull-related-node").each(function (e) {
      console.log('auto pulling related node');
      this.click();
    });
    $(".pull-url").each(function(e) {
        console.log('auto pulling url');
        this.click();
    });
   $(".pull-node").each(function (e) {
      console.log('auto pulling node');
      this.click();
    });
  }

  function autoPullWpOnEmpty() {
    if ($(".not-found").length > 0) {
      $(".pull-exec.wp").each(function (e) {
        console.log('trying to auto pull wp');
        if (!this.classList.contains('pulled')) {
          this.innerText = 'autopulling in empty node...';
        }
      });
      setTimeout(autoPullWp, 2000);
    }
  }

// hedgedoc steals focus on being transcluded and that just doesn't work well.
/*
  function autoPullStoaOnEmpty() {
    console.log('trying to auto pull stoa if empty');
    // if we're doing this, 'uprank' the Stoa by pushing it above of the actual empty node (below Wikipedia, setting up a lightweight note taking activity.)
    if ($(".not-found").length > 0) {
      let stoa = $(".stoa")
      stoa.remove()
      stoa.insertBefore($(".node"))
      $("#pull-stoa").each(function (e) {
        if (!this.classList.contains('pulled')) {
          this.innerText = 'autopulling in empty node...';
        }
      });

      // hack hack
      // this is copy/pasted from the first bind, as for some reason we need to re-bind after insert/remove.
      $("#pull-stoa").click(function (e) {
        console.log('clicked stoa button')
        if (this.classList.contains('pulled')) {
          // already pulled.
          this.innerText = 'pull';
          $(e.currentTarget).nextAll('iframe').remove()
          $("#stoa-iframe").html('');
          this.classList.remove('pulled');
        }
        else {
          this.innerText = 'pulling';
          let node = this.value;
          $("#stoa-iframe").html('<iframe id="stoa-iframe" name="embed_readwrite" src="https://doc.anagora.org/' + node + '?edit" width="100%" height="500"></iframe>');
          this.innerText = 'fold';
          this.classList.add('pulled');
        }
      });
    // also copy paste the second pull, yolo :)
    $("#pull-stoa2").click(function (e) {
        console.log('clicked stoa2 button')
        if (this.classList.contains('pulled')) {
        // already pulled.
        this.innerText = 'pull';
        $(e.currentTarget).nextAll('iframe').remove()
        $("#stoa2-iframe").html('');
        this.classList.remove('pulled');
        }
        else {
        this.innerText = 'pulling';
        let node = this.value;
        $("#stoa2-iframe").html('<iframe id="stoa2-iframe" name="embed_readwrite" src="https://stoa.anagora.org/p/' + node + '?edit" width="100%" height="500"></iframe>');
        this.innerText = 'fold';
        this.classList.add('pulled');
        }
    });


      setTimeout(autoPullStoa2, 2000);
    }
  }
*/

  function autoPullWp() {
    $(".pull-exec.wp").each(function (e) {
        if (!this.classList.contains('pulled')) {
          this.click();
        }
        console.log('auto pulled wp');
    })
  }

  function autoPullStoa2() {
    // terrible name because autoPullStoa is a setting -- yolo.
    $("#pull-stoa").each(function (e) {
        if (!this.classList.contains('pulled')) {
          this.click();
        }
        console.log('auto pulled stoa');
    })
  }

  function sleep(ms) {
    // https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* this should be autoPullStoas?
  or maybe just let this go and embrace pull all / fold all?
  if (autoPullStoa) {
    console.log('queueing auto pull');
    setTimeout(pullStoa, ms);
    console.log('auto pulled');
  }

  if (autoPullSearch) {
    console.log('queueing auto pull');
    setTimeout(pullSearch, ms);
    console.log('auto pulled');
  }

  function pullStoa() {
    console.log('auto pulling stoa');
    $("#pull-stoa").each(function (e) {
      this.click();
    });
  }

  */

 if (localStorage["ranking"]) {
    let subnodes = $(".subnode")
    let sortList = Array.prototype.sort.bind(subnodes);
    sortList(function (a, b) {
        if (rawRanking.indexOf(a.dataset.author) === -1) return 1
        if (rawRanking.indexOf(b.dataset.author) === -1) return -1
        if (rawRanking.indexOf(a.dataset.author) < rawRanking.indexOf(b.dataset.author)) return -1
        if (rawRanking.indexOf(a.dataset.author) > rawRanking.indexOf(b.dataset.author)) return 1
        return 0
    })
    subnodes.remove()
    subnodes.insertAfter($(".main-header"))
}

});

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sortObjectEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(el => el[0])
}

function loadGraph() {
  const colorNames = ["#1B9E77", "#D95F02", "#7570B3", "#E7298A"]
  const ctx = document.getElementById('myChart');
  const json = $('#proposal-data').text()
  const data = JSON.parse(json)
  // const fillPattern = ctx.createPattern(img, 'repeat');
  const colors = Object.values(data).map(() => colorNames.shift())
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sortObjectEntries(data),
      datasets: [{
        label: '# of Votes',
        data: Object.values(data).sort(function (a, b) { return b - a }),
        borderWidth: 1,
        backgroundColor: colors
      }]
    },

  });
}

