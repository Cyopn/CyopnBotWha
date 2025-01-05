const read = require("node-read")
const cheerio = require("cheerio")
const { TwitterDL } = require("twitter-downloader")

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

const twitter = async (url) => {
    let results = []
    try {
        const result = await TwitterDL(url, {})
        result.result.media.forEach(async (media) => {
            if (media.type == "video" || media.type == "animated_gif") {
                results.push({ url: media.videos.pop().url, type: "video" })
            } else {
                results.push({ url: media.image, type: "image" })
            }
        })
    } catch (e) {
    }
    return results
}

module.exports = {
    pinterest,
    twitter
}