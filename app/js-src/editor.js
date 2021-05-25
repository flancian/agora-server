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

import $ from "jquery"
import { state } from "./fission.js"
// import "react"
// import ed from "./editor.jsx"
// import 'plugin-syntax-jsx'

export const initEditor = (userId) => {
  const button =
    `<div class="ctzn-submit">
        <button onclick="uploadHandler()">Save</button> 
        <button onclick="toggle()">Toggle preview</button>
      </div>`

  // let button = ed

  let node = $(`.subnode-user:contains('${userId}')`).closest(".subnode")
  if (node.length) { // we found an existing subnode

  } else {
    node = $(".node").children(".subnode").last()
    node.after("<div class='subnode'><span class='subnode-content'></span></div>")
    node = $(".node").children(".subnode").last()
  }
  node.find(".subnode-content").attr("id", "edit-textarea").after(button)
  initTiny()
}

export const initTiny = () => {
  tinymce.init({
    selector: "#edit-textarea",
    menubar: false,
    plugins: 'lists',
    toolbar: 'bullist',
    height: 400
  })
}


// async function updateCtznPage() {
//   const content = tinymce.activeEditor.getContent();
//   await ctzn.updatePage(NODENAME, content)
//   Util.downloadPage(`${ctzn.user.name}@${ctzn.user.host}`, NODENAME)
// }


window.uploadHandler = async () => {
  let s = await state()
  if (s.authenticated) {
    alert("we good")
  }
}