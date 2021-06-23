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

import * as $ from "jquery"

document.addEventListener("DOMContentLoaded", function () {
  // Hack for settings page
  // try { processSettings({ignore: true}) } catch(e){ console.error(e)}
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
  btn.addEventListener("click", function () {
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

  // clear mini cli on click
  $("#mini-cli").click(() => $("#mini-cli").val(""))

  // focus mini-cli on key combo

  $(window).keydown(function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode == 83) {
      $("#mini-cli").focus().val("")
    }
  })


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



