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

document.addEventListener("DOMContentLoaded", function() { 
    // Hack for settings page
    try { processSettings({ignore: true}) } catch(e){ console.error(e)}
    // Select button
    const btn = document.querySelector(".theme-toggle");
    var theme = document.querySelector("#theme-link");
    const currentTheme = localStorage.getItem("theme");
	// If the user's preference in localStorage is dark...
	if (currentTheme == "dark") {
      theme.href = "/static/css/screen-dark.css";
	} else if (currentTheme == "light") {
      theme.href = "/static/css/screen-light.css";
	}

    // Listen for a click on the button
    btn.addEventListener("click", function() {
      // Select the stylesheet <link>
      var theme = document.querySelector("#theme-link");
      if (theme.getAttribute("href") == "/static/css/screen-light.css") {
        theme.href = "/static/css/screen-dark.css";
	    localStorage.setItem("theme", "dark");
      } else {
        theme.href = "/static/css/screen-light.css";
	    localStorage.setItem("theme", "light");
      }
    });

    // icky but I'm not above this.
    // this is to work around etherpad grabbing focus.
    // var element = document.getElementById("mini-cli");
    // setTimeout( function() { element.focus() }, 1000 );
    // setTimeout( function() { element.focus() }, 3000 );
    // did not like it in the end, too disruptive.
});

function processSettings(args){
  args = args || {}
  let ranking // string for ranking nodes by user, comma separated user list
  ranking = document.getElementById("settings-ranking").value || ""
  if (ranking === ""){
    ranking = localStorage["ranking"] || ""
    console.log("ranking", ranking)
    if (ranking !== ""){
      document.getElementById("settings-ranking").value = ranking
    }
  }

  ranking = document.getElementById("settings-ranking").value || ""
  localStorage["ranking"] = ranking
  console.log("processing", ranking)
  if (!args["ignore"]) alert("Settings Saved")
}
