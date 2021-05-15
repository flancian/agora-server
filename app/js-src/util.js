let u = {}
import fs from 'fs'
import 'regenerator-runtime/runtime'
let config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

u.replaceStrings = (str) => {
    const wikireg = /\[\[(.*?)\]\]/g
    const out = str.matchAll(wikireg)

    for (const rep of out) {
        const slug = rep[1]
        const wiki = rep[0]
        const f = slug.toLowerCase().replace(/ /g, "-")
        str = str.replace(wiki, `<a href='/${f}'>${wiki}</a>`)
    }
    return str
}

u.downloadPage = async (userId, pageName) => {
    console.log("downloading",pageName)
    let route = `${config.ctznhost}/${userId}-${pageName}`
    let res = await fetch(route)
    res.text()
}


window.Util = u