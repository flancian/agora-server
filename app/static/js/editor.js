$(() => {
	console.log("loaded")
	main()
})

const accessToken = localStorage["gitea-token"]
let user




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
									<span class="subnode-links"><a href="/raw/garden/${user}/${NODENAME}.md">garden/${user}/${NODENAME}.md</a> by <a href="/@${user}">@<span class="subnode-user">${user}</span>
									</a></span><a href="/@${user}">
									</a>
							</span>
							<span class="subnode-contrib">
									
	
									
							</span>
	
							
					</div>
					<span class="subnode-content"><textarea id="node-editor" cols="60" rows="10">
</textarea>
	<br>
	<button onclick="saveData()">Save</button></span>


					</div>


	`






	const repo = localStorage["gitea-repo"]
	const selector = "div.subnode[data-author='" + user + "'] .subnode-content"
	const snode = $(selector)
	console.log("SNODE", snode)
	const saved = snode.html()
	if (snode.length) {
		const text = await grabMarkdown()
		snode.html(`<textarea id=node-editor cols=60 rows=10>${text}</textarea>

	
	<br>
	<button onClick="saveData()">Save</button>`)
	} else {
		$(subnode).insertAfter(".node-header")
	}

}


async function grabMarkdown() {
	let text
	try {
		text = await fetch(`/raw/garden/${user}/${NODENAME}.md`).then(response => response.text())
	} catch (e) {
		console.error(e)
		text = ""
	}
	console.log("GOT MARKDOWN", text)
	return text
}

