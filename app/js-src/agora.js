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
import CTZN from "./ctzn.js"
import {state} from "./fission.js"
import {initEditor} from "./editor.js"

$(async () => {
  // on page ready
  console.log("page loaded")

  $("#mini-cli").on("click", () => $("#mini-cli").val(""))

  // focus mini-cli on key combo
  $(window).on("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.keyCode == 83) {
      $("#mini-cli").trigger("focus").val("")
    }
  })

  let s = await state()
  if(s.authenticated){
    initEditor()
  }

});





const toggleEditor = () => {
  const content = tinymce.get("edit-textarea").getContent()
  const updated = Util.replaceStrings(content)
  tinymce.get("edit-textarea").setContent(updated)
  tinymce.execCommand('mceToggleEditor', false, 'edit-textarea')
}


const initTiny = () => {
  tinymce.init({
    selector: "#write-textarea",
    menubar: false,
    plugins: 'lists',
    toolbar: 'bullist',
    height: 400
  })
}


function initCtzn() {
  const storageJson = localStorage["ctzn"]
  if (!storageJson) return
  const storage = JSON.parse(storageJson)
  if (storageJson) {
    // have localstorage object
    if (!storage.userId) return
    let [name, host] = storage.userId.split("@")
    let pass = storage.pass
    let ctzn = new CTZN({ name, host, pass })
  }
  return ctzn
}



// TODO re-enable this when I figure out the bigger picture




// async function connect() {
//   if (connected) return
//   connected = true
//   console.log("connecing to ctzn websocket")
//   await ctzn.connect()
//   await ctzn.login()
// }


// function logout() {
//   localStorage.removeItem("ctzn")
//   location.reload()
// }