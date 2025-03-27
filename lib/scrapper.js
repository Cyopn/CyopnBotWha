const read = require("node-read")
const cheerio = require("cheerio")
const { TwitterDL } = require("twitter-downloader")
const { Downloader } = require("@tobyg74/tiktok-api-dl")

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

const tiktok = async (url, type) => {
    let results = []
    try {
        if (type == "media") {
            let result = await Downloader(url, { version: "v3" })
            if (result.status === "success") {
                if (result.result.type === "video") {
                    results.push({ url: result.result.videoHD, type: "video" })
                } else if (result.result.type === "image") {
                    result.result.images.forEach(image => {
                        results.push({ url:image, type:"image"})
                    })
                }

            }
        } else if (type == "audio") {
            let result = await Downloader(url, { version: "v2" })
            results.push({ url: result.result.music, type: "audio" })
        }
    } catch (e) {
    }
    return results
}

module.exports = {
    pinterest,
    twitter,
    tiktok
}