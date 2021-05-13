// CTZN code
console.log("Loading agora-ctzn module")

import { Client as WebSocket } from "rpc-websockets"
const wsServer = "wss://ctzn.one"


class CTZN {
  constructor(user) {
    this.user = user
  }


  /* Websocket Handler */
  connect() {
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
    const user = {username: this.user.name, password: this.user.pass}
    let res = await this.apiCall("accounts.login", [user])
    return res;
  };


  async getPages(user) {
    try {
      const serverHost = user.split("@")[1]
      // const res = await fetch(`https://${serverHost}/.table/${user}/ctzn.network/page`)
      const res = await this.apiCall("table.list", [user, "ctzn.network/page"])
      console.log("res", res)

      return res.entries || [{}]
    } catch (err) {
      console.error(err)
      return [{}]
    }
  }


  async discoverPage(f, slug) {
    const pages = await this.getPages(f)
    const page = await pages.find(p => {
      return p.key == slug
    })
    if (!page) return
    const blobName = page.value.content.blobName
    const blob = await this.apiCall("blob.get", [f, blobName])
    const content = atob(blob.buf)
    return { username: f, content }
  }

  async findNodes(slug) {
    const followers = await this.getFollowing(`${this.user.name}@${this.user.host}`)
    console.log("followers", followers)
    followers.push(`${this.user.name}@${this.user.host}`)
    let nodes = await Promise.all(followers.map((f) => this.discoverPage(f, slug)))
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

  get userId(){
    return `${this.user.name}@${this.user.host}`
  }
}


window.CTZN = CTZN



