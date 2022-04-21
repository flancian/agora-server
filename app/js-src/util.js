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

let u = {}
import 'regenerator-runtime/runtime'
// consider if we need this, it used to be for CTZN
// let config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

u.replaceStrings = (str) => {
    const wikireg = /\[\[(.*?)\]\]/g
    const out = str.matchAll(wikireg)

    for (const rep of out) {
        const slug = rep[1]
        const wiki = rep[0]
        const f = slug.toLowerCase().replace(/ /g, "-")
        str = str.replace(wiki, `<a href='/${f}'>${wiki}</a>`)
    }
    return str
}

u.downloadPage = async (userId, pageName) => {
    console.log("downloading",pageName)
    let route = `${config.ctznhost}/${userId}-${pageName}`
    let res = await fetch(route)
    res.text()
}


window.Util = u
