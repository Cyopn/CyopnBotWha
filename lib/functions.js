const axios = require('axios')
const fs = require('fs-extra')
const { createCanvas, loadImage } = require('canvas')
const imgSize = require('image-size')
const Jimp = require('jimp')

/**
 * 
 * Funcion obtener imagen de reddit
 * @param {string} subReddit Reddit a recuperar
 */
const getRed = async(subReddit) => {
    return await axios.get(`https://meme-api.herokuapp.com/gimme/${subReddit}`)
}

/**
 * 
 * Funcion recuperar buffer
 * @param {string} url Pagina recipiente
 * @param {string} options Opciones para recipiente
 * @returns Informacion (responsive)
 */
const getBuffer = async(url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.error(e)
    }
}

/** 
 * 
 * Funcion para stickers
 * @param {object} client Metodo para enviar
 * @param {string} message Informacion para enviar
 */
const createSt = async(client, message) => {
    const { id, from } = message
    const canvas = createCanvas(500, 500)
    const ctx = canvas.getContext('2d')

    try {
        imgSize('./media/images/imgSt.jpg', function(err, dim) {
            if (err) {
                console.error(err)
            } else {
                let hres = dim.height
                let wres = dim.width
                if (hres > wres) {
                    let sc = hres / 500
                    wres = wres / sc
                    hres = 500
                    let ps = (500 - wres) / 2
                    Jimp.read('./media/images/imgSt.jpg', (err, imgRes) => {
                        if (err) {
                            console.error(err)
                        } else {
                            imgRes
                                .resize(wres, hres) // resize
                                .quality(60) // set JPEG quality
                                .write('./media/images/imgSt.jpg'); // save
                        }
                    })
                    loadImage('https://i.imgur.com/2J1anK8.png').then(image => {
                        ctx.drawImage(image, 0, 0, 500, 500)
                        loadImage('./media/images/imgSt.jpg').then(st => {
                            ctx.drawImage(st, ps, 0, wres, hres)
                        })
                        const out = fs.createWriteStream('./media/images/imgSt.png')
                        const stream = canvas.createPNGStream({
                            backgroundIndex: 0
                        })
                        stream.pipe(out)
                        out.on('finish', () => {
                            client.sendImageAsSticker(from, './media/images/imgSt.png', {
                                author: 'ig: @Cyopn_',
                                pack: 'CyopnBot'
                            })
                        })
                    })
                } else if (wres > hres) {
                    let sca = wres / 500
                    hres = hres / sca
                    wres = 500
                    let pos = (500 - hres) / 2
                    Jimp.read('./media/images/imgSt.jpg', (err, imgRes) => {
                        if (err) {
                            console.error(err)
                        } else {
                            imgRes
                                .resize(wres, hres) // resize
                                .quality(60) // set JPEG quality
                                .write('./media/images/imgSt.jpg'); // save
                        }
                    })
                    loadImage('https://i.imgur.com/2J1anK8.png').then(image => {
                        ctx.drawImage(image, 0, 0, 500, 500)
                        loadImage('./media/images/imgSt.jpg').then(st => {
                            ctx.drawImage(st, 0, pos, wres, hres)
                        })
                        const out = fs.createWriteStream('./media/images/imgSt.png')
                        const stream = canvas.createPNGStream({
                            backgroundIndex: 0
                        })
                        stream.pipe(out)
                        out.on('finish', () => {
                            client.sendImageAsSticker(from, './media/images/imgSt.png', {
                                author: 'ig: @Cyopn_',
                                pack: 'CyopnBot'
                            })
                        })
                    })
                } else if (wres === hres) {
                    client.sendImageAsSticker(from, './media/images/imgSt.jpg', {
                        author: 'ig: @Cyopn_',
                        pack: 'CyopnBot'
                    })
                }
            }
        })
    } catch (e) {
        console.log(e)
        await client.reply(from, 'Ocurio un error', id)
    }
}



module.exports = { getBuffer, createSt, getRed }