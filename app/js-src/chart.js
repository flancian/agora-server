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