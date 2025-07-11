const read = require("node-read")
const cheerio = require("cheerio")
const { TwitterDL } = require("twitter-downloader")
const { Downloader } = require("@tobyg74/tiktok-api-dl")
const qs = require("qs");
const axios = require("axios");
const { default: Axios } = require('axios')

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

const tiktok = async (url) => {
    let results = {}
    try {
        let result = await Downloader(url, { version: "v2" })
        if (result.status === "success") {
            if (result.result.type === "video") {
                results["video"] = result.result.video.playAddr[0]
            } else if (result.result.type === "image") {
                img = []
                result.result.images.forEach(image => {
                    img.push(image)
                })
                results["image"] = img
            }
            results["audio"] = result.result.music.playUrl[0]
        } else {
            return { data: { error: "No se encontro contenido." } }
        }
    } catch (e) {
        console.log(e)
    }
    return { data: results }
}


const getDownloadLinks = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                !url.match(
                    /(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/,
                ) &&
                !url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi)
            ) {
                return reject({
                    msg: "Invalid URL",
                });
            }

            function decodeData(data) {
                let [part1, part2, part3, part4, part5, part6] = data;

                function decodeSegment(segment, base, length) {
                    const charSet =
                        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split(
                            "",
                        );
                    let baseSet = charSet.slice(0, base);
                    let decodeSet = charSet.slice(0, length);

                    let decodedValue = segment
                        .split("")
                        .reverse()
                        .reduce((accum, char, index) => {
                            if (baseSet.indexOf(char) !== -1) {
                                return (accum += baseSet.indexOf(char) * Math.pow(base, index));
                            }
                        }, 0);

                    let result = "";
                    while (decodedValue > 0) {
                        result = decodeSet[decodedValue % length] + result;
                        decodedValue = Math.floor(decodedValue / length);
                    }

                    return result || "0";
                }

                part6 = "";
                for (let i = 0, len = part1.length; i < len; i++) {
                    let segment = "";
                    while (part1[i] !== part3[part5]) {
                        segment += part1[i];
                        i++;
                    }

                    for (let j = 0; j < part3.length; j++) {
                        segment = segment.replace(new RegExp(part3[j], "g"), j.toString());
                    }
                    part6 += String.fromCharCode(
                        decodeSegment(segment, part5, 10) - part4,
                    );
                }
                return decodeURIComponent(encodeURIComponent(part6));
            }

            function extractParams(data) {
                return data
                    .split("decodeURIComponent(escape(r))}(")[1]
                    .split("))")[0]
                    .split(",")
                    .map((item) => item.replace(/"/g, "").trim());
            }

            function extractDownloadUrl(data) {
                return data
                    .split('getElementById("download-section").innerHTML = "')[1]
                    .split('"; document.getElementById("inputData").remove(); ')[0]
                    .replace(/\\(\\)?/g, "");
            }

            function getVideoUrl(data) {
                return extractDownloadUrl(decodeData(extractParams(data)));
            }

            const response = await axios.post(
                "https://snapsave.app/action.php?lang=id",
                "url=" + url, {
                headers: {
                    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "content-type": "application/x-www-form-urlencoded",
                    origin: "https://snapsave.app",
                    referer: "https://snapsave.app/id",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
                },
            },
            );

            const data = response.data;
            const videoPageContent = getVideoUrl(data);
            const $ = cheerio.load(videoPageContent);
            const downloadLinks = [];

            $("div.download-items__thumb").each((index, item) => {
                $("div.download-items__btn").each((btnIndex, button) => {
                    let downloadUrl = $(button).find("a").attr("href");
                    if (!/https?:\/\//.test(downloadUrl || "")) {
                        downloadUrl = "https://snapsave.app" + downloadUrl;
                    }
                    downloadLinks.push(downloadUrl);
                });
            });
            if (!downloadLinks.length) {
                return reject({
                    msg: "No data found",
                });
            }

            return resolve({
                url: downloadLinks,
                metadata: {
                    url: url,
                },
            });
        } catch (error) {
            return reject({
                msg: error.message,
            });
        }
    });
};

const HEADERS = {
    Accept: "/",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-FB-Friendly-Name": "PolarisPostActionLoadPostQueryQuery",
    "X-CSRFToken": "RVDUooU5MYsBbS1CNN3CzVAuEP8oHB52",
    "X-IG-App-ID": "1217981644879628",
    "X-FB-LSD": "AVqbxe3J_YA",
    "X-ASBD-ID": "129477",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36",
};

function getInstagramPostId(url) {
    const regex =
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|tv|stories|reel)\/([^/?#&]+).*/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function encodeGraphqlRequestData(shortcode) {
    const requestData = {
        av: "0",
        __d: "www",
        __user: "0",
        __a: "1",
        __req: "3",
        __hs: "19624.HYP:instagram_web_pkg.2.1..0.0",
        dpr: "3",
        __ccg: "UNKNOWN",
        __rev: "1008824440",
        __s: "xf44ne:zhh75g:xr51e7",
        __hsi: "7282217488877343271",
        __dyn: "7xeUmwlEnwn8K2WnFw9-2i5U4e0yoW3q32360CEbo1nEhw2nVE4W0om78b87C0yE5ufz81s8hwGwQwoEcE7O2l0Fwqo31w9a9x-0z8-U2zxe2GewGwso88cobEaU2eUlwhEe87q7-0iK2S3qazo7u1xwIw8O321LwTwKG1pg661pwr86C1mwraCg",
        __csr: "gZ3yFmJkillQvV6ybimnG8AmhqujGbLADgjyEOWz49z9XDlAXBJpC7Wy-vQTSvUGWGh5u8KibG44dBiigrgjDxGjU0150Q0848azk48N09C02IR0go4SaR70r8owyg9pU0V23hwiA0LQczA48S0f-x-27o05NG0fkw",
        __comet_req: "7",
        lsd: "AVqbxe3J_YA",
        jazoest: "2957",
        __spin_r: "1008824440",
        __spin_b: "trunk",
        __spin_t: "1695523385",
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "PolarisPostActionLoadPostQueryQuery",
        variables: JSON.stringify({
            shortcode: shortcode,
            fetch_comment_count: null,
            fetch_related_profile_media_count: null,
            parent_comment_count: null,
            child_comment_count: null,
            fetch_like_count: null,
            fetch_tagged_user_count: null,
            fetch_preview_comment_count: null,
            has_threaded_comments: false,
            hoisted_comment_id: null,
            hoisted_reply_id: null,
        }),
        server_timestamps: "true",
        doc_id: "10015901848480474",
    };

    return qs.stringify(requestData);
}

async function getPostGraphqlData(postId, proxy) {
    try {
        const encodedData = encodeGraphqlRequestData(postId);
        const response = await axios.post(
            "https://www.instagram.com/api/graphql",
            encodedData, {
            headers: HEADERS,
            httpsAgent: proxy
        },
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

function extractPostInfo(mediaData) {
    try {
        const getUrlFromData = (data) => {
            if (data.edge_sidecar_to_children) {
                return data.edge_sidecar_to_children.edges.map(
                    (edge) => edge.node.video_url || edge.node.display_url,
                );
            }
            return data.video_url ? [data.video_url] : [data.display_url];
        };

        return {
            url: getUrlFromData(mediaData),
        };
    } catch (error) {
        throw error;
    }
}

async function ig(url, proxy = null) {
    const postId = getInstagramPostId(url);
    if (!postId) {
        throw new Error("Invalid Instagram URL");
    }
    const data = await getPostGraphqlData(postId, proxy);
    const mediaData = data.data?.xdt_shortcode_media;
    return extractPostInfo(mediaData);
}

const instagram = async (url) => {
    let result = "";
    try {
        result = await ig(url);
    } catch (e) {
        try {
            result = await getDownloadLinks(url);
        } catch (e) {
            result = { msg: e }
        }
    }
    return result;
}

async function tiktok2(url) {
    return new Promise((resolve, reject) => {
        Axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`)
            .then(({ data }) => {
                resolve(data)
            })
            .catch(e => {
                reject(e)
            })
    })
}

module.exports = {
    pinterest,
    twitter,
    tiktok,
    instagram,
    tiktok2
}