import { Client } from "rpc-websockets"
let ws = new Client('ws://localhost:8080')
import * as wn from 'webnative'

let backend = {
    async migrate(userName, repoUrl)  {
        // call an RPC method with parameters
        console.log("calling rpc")
        let res = await ws.call('migrateRepo', [userName, repoUrl]).catch(console.error)
        console.log("migrate response", res)
        return res
    },
    async login(){
        let raw = await wn.ucan.build({audience: await wn.did.ucan()})
        let ucan = wn.ucan.encode(raw)
        return await ws.login({ucan})
    }
}

window.backend =  backend