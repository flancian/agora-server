// CTZN code
console.log("Loading agora-ctzn module")

import { Client as WebSocket } from "rpc-websockets"
import { isBrowser, isNode } from 'browser-or-node';

export default class CTZN {
  constructor(user) {
    this.user = user
  }


  /* Websocket Handler */
  async connect() {
    const wsServer = `wss://${this.user.host}`
    const ws = new WebSocket(wsServer);
    return new Promise((resolve, reject) => {
      ws.on("open", async () => {
        this.ws = ws
        console.log("websocket set")
        await this.login()
        resolve()
      }).on("close", (e) => {
        console.error(
          "Socket is closed. Reconnect will be attempted in 1 second.",
          e
        );
        setTimeout(function () {
          // connect();
          // throw "supposed to stay open"
        }, 1000)
      }).on("error", (err) => {
        console.error("Socket encountered error: ", err.message, "Closing socket");
        ws.close();
        reject(err)
      })

    })

  }

  async getFollowers(user) {
    const serverHost = user.split("@")[1]
    const res = await fetch(`https://${serverHost}/.view/ctzn.network/followers-view/${user}`)
    const body = await res.json()
    return body.followers
  }

  async getFollowing(user) {
    const following = await this.apiCall("table.list", [user, "ctzn.network/follow"])
    const entries = following.entries.map(f => f.key)
    return entries
  }


  // Login using ctzn account
  async login() {
    if (!this.ws) return "websocket not connected"
    const user = { username: this.user.name, password: this.user.pass }
    let res = await this.apiCall("accounts.login", [user])
    return res;
  };


  async getPages(user) {
    const serverHost = user.split("@")[1]
    const res = await this.apiCall("table.list", [user, "ctzn.network/page"])
    return res.entries || [{}]
  }



  async discoverPage(f, slug) {
    const pages = await this.getPages(f)
    const page = pages.find(p => {
      const dateSlug = `agora-prefix-${slug}`
      return (p.key == slug || p.key == dateSlug)
    })
    if (!page) return
    const blobName = page.value.content.blobName
    const blob = await this.apiCall("blob.get", [f, blobName])
    const content = atob(blob.buf)
    return { username: f, content }
  }

  async findNodes(slug) {
    let nodes = []
    const following = await this.getFollowing(`${this.user.name}@${this.user.host}`)
    console.log("following", following)
    following.push(`${this.user.name}@${this.user.host}`)
    try {
      nodes = await Promise.all(following.map((f) => this.discoverPage(f, slug)))
    } catch (e) {
      console.log("DOH")
      console.error(e)
    }
    console.log("nodes", nodes)
    nodes = nodes.filter(p => p)
    return nodes
  }


  async apiCall(params, data) {
    try {
      return await this.ws.call(params, data)
    } catch (e) {
      console.error(e)
    }
  }

  async updatePage(pageName, content) {
    const encoded = btoa(content)
    if (pageName.match(/^\d/)) pageName = `agora-prefix-${pageName}`
    const res = await this.apiCall("blob.update", [`ui:pages:${pageName}`, encoded, { "mimeType": "text/html" }])
    const update = await this.apiCall("table.create", [this.userId, "ctzn.network/page", {
      id: pageName,
      title: pageName,
      content: { mimeType: "text/html", blobName: `ui:pages:${pageName}` },


    }])
    console.log("page update", update)
    return res
  }

  get userId() {
    return `${this.user.name}@${this.user.host}`
  }
}

if (isBrowser) {
  window.CTZN = CTZN
}


