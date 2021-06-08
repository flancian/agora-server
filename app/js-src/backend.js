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


import { Client } from "rpc-websockets"
let ws = new Client('ws://localhost:8080')
import * as wn from 'webnative'

let backend = {
    async migrate(userName, repoUrl)  {
        // call an RPC method with parameters
        console.log("calling rpc")
        let res = await ws.call('migrateRepo', [userName, repoUrl, this.did]).catch(e => {return e})
        console.log("migrate response", res)
        return res
    },
    async login(){
        let raw = await wn.ucan.build({audience: await wn.did.ucan()})
        let ucan = wn.ucan.encode(raw)
        this.did = await wn.did.ucan()
        return await ws.login({ucan})
    },
    async writeFile(repoName, fileName, content, hash){
        let res = await ws.call('writeFile', [repoName, fileName, content, hash, this.did])
        console.log("write response", res)
        return res
    },
    async readFile(repoName, fileName){
        let res = await ws.call("readFile", [repoName, fileName])
        console.log("file response", res)
        return res
    },
    async checkAccess(repoNames){
        let res = await ws.call("checkAccess", [repoNames, this.did])
        console.log({res})
        return res
    }
}

window.backend =  backend