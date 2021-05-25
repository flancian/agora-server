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



window.start = start
window.wn = wn
window.state = state