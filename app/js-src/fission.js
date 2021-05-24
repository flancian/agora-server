import 'regenerator-runtime/runtime'
const wn = self.webnative
wn.setup.debug({ enabled: true })
window.wn = wn
const state = async () => {
    return await wn.initialise({
        permissions: {
            // Will ask the user permission to store
            // your apps data in `private/Apps/Nullsoft/Winamp`
            app: {
                name: "Winamp",
                creator: "Nullsoft"
            },

            // Ask the user permission to additional filesystem paths
            fs: {
                private: [wn.path.directory("Audio", "Music")],
                public: [wn.path.directory("Audio", "Mixtapes")]
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

const start = async () =>{
    const s = await state()
    console.log(s.scenario)

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
            break;
    
        case wn.Scenario.NotAuthorised:
            wn.redirectToLobby(s.permissions)
            break;
    
    }    
    // wn.leave()
    
}





// start()
// console.log("PATH",__dirname)