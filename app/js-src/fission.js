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


import 'regenerator-runtime/runtime'
import * as wn from 'webnative'
wn.setup.debug({ enabled: true })

export const state = async () => {
    return await wn.initialise({
        permissions: {
            app: {
                name: "Agora",
                creator: "Flancia Collective"
            },

            // Ask the user permission to additional filesystem paths
            fs: {
                private: [wn.path.directory("agora")],
                public: [wn.path.directory("agora")]
            },
            platform:{
                apps: "*"
            }
        }

    }).catch(err => {
        console.error(err)
        switch (err) {
            case wn.InitialisationError.InsecureContext:
            // We need a secure context to do cryptography
            // Usually this means we need HTTPS or localhost

            case wn.InitialisationError.UnsupportedBrowser:
            // Browser not supported.
            // Example: Firefox private mode can't use indexedDB.
        }

    })
}

export const start = async () =>{
    const s = await state()

    switch (s.scenario) {

        case wn.Scenario.AuthCancelled:
            // User was redirected to lobby,
            // but cancelled the authorisation
            break;
    
        case wn.Scenario.AuthSucceeded:
        case wn.Scenario.Continuation:
            // State:
            // state.authenticated    -  Will always be `true` in these scenarios
            // state.newUser          -  If the user is new to Fission
            // state.throughLobby     -  If the user authenticated through the lobby, or just came back.
            // state.username         -  The user's username.
            //
            // ☞ We can now interact with our file system (more on that later)
            s.fs
            window.location.href = "/"
            break;
    
        case wn.Scenario.NotAuthorised:
            wn.redirectToLobby(s.permissions)
            break;
    
    }    
    // wn.leave()
    
}


const storeProfile = ()=>{

}

const getContent = async (node)=>{
    let s = await state()
    if(s.authenticated){
        let f = wn.path.file("public", "agora", `${node}.md`)
        console.log("f", f)
        let content = await s.fs.read(f)
        console.log("content", content.toString())
    }
}



window.start = start
window.wn = wn
window.state = state
window.getContent = getContent