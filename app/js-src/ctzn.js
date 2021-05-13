// CTZN code
console.log("Loading agora-ctzn module")

import { Client as WebSocket } from "rpc-websockets"


class CTZN {
  constructor(user) {
    this.user = user
  }
  
  
  /* Websocket Handler */
  connect() {
    const wsServer = `wss://${this.user.host}`
    const ws = new WebSocket(wsServer);
    const self = this
    return new Promise((resolve, reject) => {

      ws.on("open", async function () {
        console.log("websocket set")
        self.ws = ws
        resolve("connected")
      });
      ws.onclose = function (e) {
        console.log(
          "Socket is closed. Reconnect will be attempted in 1 second.",
          e.reason
        );
        setTimeout(function () {
          connect();
        }, 1000);
      };
      ws.onerror = function (err) {
        console.error("Socket encountered error: ", err.message, "Closing socket");
        ws.close();
        reject(err)
      };

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
    console.log("this user", this.user, "ws", this.ws)
    if (!this.ws) return "websocket not connected"
    const user = { username: this.user.name, password: this.user.pass }
    let res = await this.apiCall("accounts.login", [user])
    return res;
  };


  async getPages(user) {
    try {
      const serverHost = user.split("@")[1]
      // const res = await fetch(`https://${serverHost}/.table/${user}/ctzn.network/page`)
      const res = await this.apiCall("table.list", [user, "ctzn.network/page"])
      // console.log("res", res)

      return res.entries || [{}]
    } catch (err) {
      console.error(err)
      return [{}]
    }
  }


  async discoverPage(f, slug) {
    const pages = await this.getPages(f)
    // console.log("pages", pages)
    const page = pages.find(p => {
      // console.log("p",p,"slug",slug)
      const dateSlug = `agora-prefix-${slug}`
      // console.log("wtf", p.key == dateSlug)
      return (p.key == slug || p.key == dateSlug)
    })
    if (!page) return
    console.log("page", page)
    const blobName = page.value.content.blobName
    const blob = await this.apiCall("blob.get", [f, blobName])
    console.log("blob", blob)
    const content = atob(blob.buf)
    console.log("content", content)
    return { username: f, content }
  }

  async findNodes(slug) {
    let nodes = []
    const following = await this.getFollowing(`${this.user.name}@${this.user.host}`)
    console.log("following", following)
    following.push(`${this.user.name}@${this.user.host}`)
    try {
    nodes = await Promise.all(following.map((f) => this.discoverPage(f, slug)))
    } catch(e){
      console.log("DOH")
      console.error(e)
    }
    console.log("nodes", nodes)
    nodes = nodes.filter(p => p)
    return nodes
  }


  async apiCall(params, data) {
    var result = await this.ws
      .call(params, data)
      .then(function (result) {
        return result;
      }).catch(function (error) {
        console.error(error);
        return {};
      });
    return result;
  }

  async updatePage(pageName, content) {
    const encoded = btoa(content)
    if(pageName.match(/^\d/)) pageName = `agora-prefix-${pageName}`
    const res = await this.apiCall("blob.update", [`ui:pages:${pageName}`, encoded, { "mimeType": "text/html" }])
    const update = await this.apiCall("table.create", [this.userId, "ctzn.network/page", {
      id: pageName,
      title: pageName,
      content: { mimeType: "text/html", blobName: `ui:pages:${pageName}` },


    }])
    console.log("page update",update)
    return res
  }

  get userId() {
    return `${this.user.name}@${this.user.host}`
  }
}


window.CTZN = CTZN



