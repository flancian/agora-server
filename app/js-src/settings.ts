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
let rawAutoPullLocal = JSON.parse(localStorage["autoPullLocal"] || 'false')
let rawAutoPullExternal = JSON.parse(localStorage["autoPullExternal"] || 'false')
let rawAutoPullStoa = JSON.parse(localStorage["autoPullStoa"] || 'false')
let rawShowBrackets = JSON.parse(localStorage["showBrackets"] || 'false')
let rawRecursive = JSON.parse(localStorage["pullRecursive"] || 'false')

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
function processPullLocal(host, e){
    host.autopulllocal = e.currentTarget.checked
    localStorage["autoPullLocal"] = JSON.stringify(host.autopulllocal)
}
function processPullExternal(host, e){
    host.autopullexternal = e.currentTarget.checked
    localStorage["autoPullExternal"] = JSON.stringify(host.autopullexternal)
}
function processPullStoa(host, e){
    host.autopullstoa = e.currentTarget.checked
    localStorage["autoPullStoa"] = JSON.stringify(host.autopullexternal)
}

function processBrackets(host, e){
    host.brackets = e.currentTarget.checked
    localStorage["showBrackets"] = JSON.stringify(host.brackets)
}

function autoPullLocal(){
    // hack for putting attribute in element
    if(localStorage["autoPullLocal"] && JSON.parse(localStorage["autoPullLocal"])) return html`
    <div>
        Do you want to auto pull Agora resources? <input type="checkbox" oninput="${processPullLocal}" checked />
    </div>
    `
    return html`
    <div>
        Do you want to auto pull Agora resources? <input type="checkbox" oninput="${processPullLocal}" />
    </div>
    `
}

function autoPullExternal(){
    // hack for putting attribute in element
    if(localStorage["autoPullExternal"] && JSON.parse(localStorage["autoPullExternal"])) return html`
    <div>
        Do you want to auto pull external resources? <input type="checkbox" oninput="${processPullExternal}" checked />
    </div>
    `
    return html`
    <div>
        Do you want to auto pull external resources? <input type="checkbox" oninput="${processPullExternal}" />
    </div>
    `
}

function autoPullStoa(){
    // hack for putting attribute in element
    if(localStorage["autoPullStoa"] && !JSON.parse(localStorage["autoPullStoa"])) return html`
    <div>
        Do you want to auto pull the Stoa? <input type="checkbox" oninput="${processPullStoa}" />
    </div>
    `
    return html`
    <div>
        Do you want to auto pull the Stoa? <input type="checkbox" oninput="${processPullStoa}" checked />
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

function pullRecursive(){
    // hack for putting attribute in element
    if(localStorage["pullRecursive"] && JSON.parse(localStorage["pullRecursive"])) return html`
    <div>
        Do you want pulls to be recursive? <input type="checkbox" oninput="${processRecursive}" checked />
    </div>
    `
    return html`
    <div>
        Do you want pulls to be recursive? <input type="checkbox" oninput="${processRecursive}" />
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
    autopulllocal: rawAutoPullLocal,
    autopullexternal: rawAutoPullExternal,
    autopullstoa: rawAutoPullStoa,
    brackets: rawShowBrackets,
    recursive: rawRecursive,
    render: ({ ranking, autopulllocal, autopullexternal, autopullstoa, brackets, recursive, checked, username, repo }) => html`
        <div>
            Enter comma separated list of users to uprank
            <input type="text" placeholder="e.g. flancian, vera" oninput="${processRanking}" value="${ranking}" />
        </div>
        ${autoPullLocal()}
        ${autoPullExternal()}
        ${autoPullStoa()}
        ${showBrackets()}
        ${pullRecursive()}
        <div>
            <h1>Add garden to Agora</h1>
            <div>This feature is <em>experimental</em>, which means it's probably broken :). If this fails, please send your repository information to signup@anagora.org. Thank you!</div>
            <br>
            <div>Preferred agora username <input type="text" oninput="${processUsername}" value="${username || ''}"/></div>
            <div>Repo git url <input type="text" oninput="${processRepo}", value="${repo || ''}"/></div>
            <button onclick="${processRepoAdd}">Add repo</button>
        </div>
				<div>
					<h1>Gitea Integration Settings</h1>
					<div>personal token: <input type="text" id="gitea-token" placeholder="${localStorage["gitea-token"]}" /></div>
					<div>repo name: <input type="text" id="gitea-repo" placeholder="${localStorage["gitea-repo"]}" /></div>
					<button onClick=saveGitea()>Save</button>
				</div>

    `
}

function saveGitea(){
		localStorage["gitea-token"] = document.getElementById("gitea-token").value
		localStorage["gitea-repo"] = document.getElementById("gitea-repo").value
}

define('settings-form', Settings);

