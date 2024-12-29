const read = require("node-read")
const cheerio = require("cheerio")

const pinterest = async (url) => {
    return new Promise(function (resolve, reject) {
        let pass = ""
        read(url, async function (err, article, res) {
            if (err) return reject(err)
            const html = article.html
            const video = html.includes("VideoObject")
            const page = cheerio.load(html)
            if (video) {
                page("script").each((index, value) => {
                    try {
                        const data = value.children[0].data
                        if (!data.includes("VideoObject")) return
                        const json = JSON.parse(data)
                        pass = json.contentUrl
                    } catch (e) { }
                })
            } else {
                page("script").each((index, value) => {
                    try {
                        const data = value.children[0].data
                        if (!data.includes("SocialMediaPosting") || data.includes("thumbnail")) return
                        const json = JSON.parse(data)
                        pass = json.image
                    } catch (e) { }
                })
            }
        })
        setTimeout(() => {
            resolve(pass)
        }, 1000);
    })
}

module.exports = {
    pinterest
}