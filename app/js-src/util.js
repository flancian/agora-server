let u = {}
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


window.Util = u