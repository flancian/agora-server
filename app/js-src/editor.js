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
	console.log("USER", user)
	return user.login
}

window.saveData = async function () {
	const text = $("#node-editor").val()
	console.log("SAVING", text)

	let body

	try {
		body = await $.ajax({
			url: `https://git.anagora.org/api/v1/repos/${user}/notes/contents/${NODENAME}.md`,
			headers: { "Authorization": `token ${accessToken}` },
		});
		console.log("BODY", body)

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


async function main() {
	user = localStorage["gitea-user"] || await getUser()
	console.log("USER", user)

	const subnode = `
	<div class="subnode" data-author="${user}">
	<div class="subnode-header">
							<span class="subnode-id">
									<a href="/@${user}/${NODENAME}">📓</a>
									<span class="subnode-links"><a href="/raw/${user}/${NODENAME}">${user}/${NODENAME}</a> by <a href="/@${user}">@<span class="subnode-user">${user}</span>
									</a></span><a href="/@${user}">
									</a>
							</span>
							<span class="subnode-contrib">
									
	
									
							</span>
	
							
					</div>
					<span class="subnode-content"><textarea style="width: 100%" id="node-editor" cols="60" rows="10">
</textarea>
	<br>
	<button onclick="saveData()">Save</button></span>


					</div>


	`






	const repo = localStorage["gitea-repo"]
	const snelement = "div.subnode[data-author='" + user + "']"
	const selector = `${snelement} .subnode-content`
	raw = $(`${snelement} .subnode-links a`).attr("href")
	const snode = $(selector).first()
	console.log("SNODE", snode,snode.length)
	const saved = snode.html()
	if (snode.length) {
		const text = await grabMarkdown()
		snode.html(`<textarea style="width: 100%" id=node-editor cols=60 rows=10>${text}</textarea>

	
	<br>
	<button onClick="saveData()">Save</button>`)
	} else {
		nh = $(".node-header").first()
		$(subnode).insertAfter(nh)
	}

}


async function grabMarkdown() {
	let text
	try {
		text = await fetch(raw).then(response => response.text())
	} catch (e) {
		console.error(e)
		text = ""
	}
	console.log("GOT MARKDOWN", text)
	return text
}

