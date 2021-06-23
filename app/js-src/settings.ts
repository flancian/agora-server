// Copyright 2021 Google LLC
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

import { html, define } from 'hybrids';
import * as $ from "jquery"

let rawRanking = JSON.parse(localStorage["ranking"] || '{}')

function processRanking(host, e) {
    host.ranking = e.currentTarget.value.split(",")
    localStorage["ranking"] = JSON.stringify(host.ranking)
}
const Settings = {
    ranking: rawRanking,
    render: ({ ranking }) => html`
        <div>
            Enter comma separated list of users to rank
            <input type="text" placeholder="e.g. flancian, vera" oninput="${processRanking}" value="${ranking}" />
        </div>
    `
}

let subnodes = $(".subnode")
let sortList = Array.prototype.sort.bind(subnodes);
sortList(function (a, b) {
    if(rawRanking.indexOf(a.dataset.author) === -1) return 1
    if(rawRanking.indexOf(b.dataset.author) === -1) return -1
    // console.log(rawRanking.indexOf(a.dataset.author), rawRanking.indexOf(b.dataset.author))
    if(rawRanking.indexOf(a.dataset.author) < rawRanking.indexOf(b.dataset.author)) return -1
    if(rawRanking.indexOf(a.dataset.author) > rawRanking.indexOf(b.dataset.author)) return 1
    return 0
})
subnodes.remove()
subnodes.insertAfter($(".main-header"))

define('settings-form', Settings);
