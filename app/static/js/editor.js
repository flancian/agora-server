$(() => {
	console.log("loaded")
	main()
})

const user = "vera"
const repo = "notes"
const selector = "div.subnode[data-author='"+user+"'] .subnode-content"
const accessToken = localStorage["accessToken"]

window.saveData = async function(){
	const text = $("#node-editor").val()
	console.log("SAVING",text)
	

	const body = await $.ajax({
    url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
    headers: {"Authorization": `Bearer ${accessToken}`},
	});
	console.log("BODY", body)

	const sha = body.sha
	const result = await $.ajax({
		method: "PUT",
		contentType: "application/json",
		url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
		headers: {"Authorization": `token ${accessToken}`},
		data: JSON.stringify({
			content: btoa(text),
			sha
		})
	})
	console.log("RESULT", result)
}


async function main(){
	const text = await grabMarkdown()
	$(selector).html(`<textarea id=node-editor cols=60 rows=10>${text}</textarea>
	<br>
	<button onClick="saveData()">Save</button>`)
}


async function grabMarkdown(){
	const text = await fetch(`/raw/garden/${user}/${NODENAME}.md`).then(response => response.text())
	console.log("GOT MARKDOWN", text)
	return text
}



// async function select(selector){
// 	return $(selector).trumbowyg({
// 		svgPath: false,
// 		btnsDef:{
// 			save: {
// 				text: "Save",
// 				fn: saveData,
// 			}
// 		},
// 		btns: [
// 			['bold', 'italic', 'save'],
// 		]
// 	});
// }



// function newEditor(selector){
// 	return tinymce.init({selector,
// 		setup: function (editor){
// 			editor.ui.registry.addButton('customSave', {
// 				text: 'SAVE',
// 				onAction: function (_) {
// 					editor.insertContent('&nbsp;<strong>It\'s my button!</strong>&nbsp;');
// 				}
// 			});
// 		}})
// }
