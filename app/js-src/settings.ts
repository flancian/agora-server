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

import jquery from "jquery";
(<any>window).$ = (<any>window).jQuery = jquery;

let rawRanking = JSON.parse(localStorage["ranking"] || '[]')
let rawAutoPull = JSON.parse(localStorage["autoPull"] || 'false')
let rawShowBrackets = JSON.parse(localStorage["showBrackets"] || 'false')

function processRanking(host, e) {
    host.ranking = e.currentTarget.value.split(",")
    localStorage["ranking"] = JSON.stringify(host.ranking)
}
function processUsername(h,e ){
    h.username = e.currentTarget.value
}
function processRepo(h, e){
    h.repo = e.currentTarget.value
}
function processPull(host, e){
    host.autopull = e.currentTarget.checked
    localStorage["autoPull"] = JSON.stringify(host.autopull)
}

function processBrackets(host, e){
    host.brackets = e.currentTarget.checked
    localStorage["showBrackets"] = JSON.stringify(host.brackets)
}

function autoPull(){
    // hack for putting attribute in element
    if(localStorage["autoPull"] && JSON.parse(localStorage["autoPull"])) return html`
    <div>
        Do you want to auto pull external resources? <input type="checkbox" oninput="${processPull}" checked />
    </div>
    `
    return html`
    <div>
        Do you want to auto pull external resources? <input type="checkbox" oninput="${processPull}" />
    </div>
    `
}

function showBrackets(){
    // hack for putting attribute in element
    if(localStorage["showBrackets"] && JSON.parse(localStorage["showBrackets"])) return html`
    <div>
        Do you want to render wikilinks with brackets? <input type="checkbox" oninput="${processBrackets}" checked />
    </div>
    `
    return html`
    <div>
        Do you want to render wikilinks with brackets? <input type="checkbox" oninput="${processBrackets}" />
    </div>
    `
}

async function processRepoAdd(h, e,){
    let response = await fetch(`${APIBASE}/repo`, {
        method: "PUT",
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({target: h.username, url: h.repo, format: "foam"})
    })
    let d = await response.json()
    alert(JSON.stringify(d))
}

const Settings = {
    ranking: rawRanking,
    autopull: rawAutoPull,
    brackets: rawShowBrackets,
    render: ({ ranking, autopull, brackets, checked, username, repo }) => html`
        <div>
            Enter comma separated list of users to uprank
            <input type="text" placeholder="e.g. flancian, vera" oninput="${processRanking}" value="${ranking}" />
        </div>
        ${autoPull()}
        ${showBrackets()}
        <br><br>
        <div>
            <h1>Add garden to agora</h1>
            <div>Preferred agora username <input type="text" oninput="${processUsername}" value="${username || ''}"/></div>
            <div>Repo git url <input type="text" oninput="${processRepo}", value="${repo || ''}"/></div>
            <button onclick="${processRepoAdd}">Add repo</button>
        </div>

    `
}

define('settings-form', Settings);

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

console.log(APIBASE)

