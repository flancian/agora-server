$(() => {
	console.log("loaded")
	main()
})

const accessToken = localStorage["gitea-token"]
let user
let raw



async function getUser() {
	user = await $.ajax({
		url: `https://git.anagora.org/api/v1/user`,
		headers: { "Authorization": `token ${accessToken}` },
	});
	return user.login
}

window.saveData = async function () {
	const text = $("#node-editor").val()

	let body

	try {
		body = await $.ajax({
			url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
			headers: { "Authorization": `token ${accessToken}` },
		});

		const sha = body.sha
		const result = await $.ajax({
			method: "PUT",
			contentType: "application/json",
			url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
			headers: { "Authorization": `token ${accessToken}` },
			data: JSON.stringify({
				content: btoa(text),
				sha
			})
		})
		console.log("RESULT", result)
	} catch (e) {
		console.error()
		const result = await $.ajax({
			method: "POST",
			contentType: "application/json",
			url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
			headers: { "Authorization": `token ${accessToken}` },
			data: JSON.stringify({
				content: btoa(text),
			})
		})
	}

}

let saved
async function main() {
	if(accessToken == "") return
	user = localStorage["gitea-user"] || await getUser()

	const subnode = `
	<div class="subnode" data-author="${user}">
	<div class="subnode-header">
							<span class="subnode-id">
									<a href="/@${user}/${NODENAME}">📓</a>
									<span class="subnode-links"><a href="/raw/garden/${user}/${NODENAME}.md">garden/${user}/${NODENAME}.md</a> by <a href="/@${user}">@<span class="subnode-user">${user}</span>
									</a></span><a href="/@${user}">
									</a>
							</span>
							<span class="subnode-contrib">
									
	
									
							</span>
	
							
					</div>
					<span class="subnode-content"><textarea style="width: 100%" id="node-editor" cols="60" rows="10">
</textarea>
	<br>
	<button onclick="saveData()">Save</button> <button onClick="toggle()">Toggle</button></span>


					</div>


	`






	const repo = localStorage["gitea-repo"]
	const snelement = "div.subnode[data-author='" + user + "']"
	const selector = `${snelement} .subnode-content`
	raw = $(`${snelement} .subnode-links a`).attr("href")
	const snode = $(selector).first()
	saved = snode.html()
	if (snode.length) {
		const text = await grabMarkdown()
		snode.html(`<textarea style="width: 100%" id=node-editor cols=60 rows=10>${text}</textarea>

	
	<br>
	<button onClick="saveData()">Save</button> <button onClick="toggle()">Toggle</button>`)
	} else {
		nh = $(".node-header").first()
		$(subnode).insertAfter(nh)
	}

}

window.main = main

window.toggle = async function toggle(){
	console.log("toggle")
	const user = localStorage["gitea-user"] || await getUser()
	const snelement = "div.subnode[data-author='" + user + "']"
	const selector = `${snelement} .subnode-content`
	raw = $(`${snelement} .subnode-links a`).attr("href")
	const snode = $(selector).first()
	if(!saved.match(/toggle/i)){
		saved += "<button onClick='main()'>Toggle</button>"
	}
	snode.html(saved)
}


async function grabMarkdown() {
	let text
	try {
		text = await fetch(raw).then(response => response.text())
	} catch (e) {
		console.error(e)
		text = ""
	}
	return text
}

