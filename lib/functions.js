const axios = require('axios')
const fs = require('fs-extra')
const { createCanvas, loadImage } = require('canvas')
const imgSize = require('image-size')
const Jimp = require('jimp')
const fetch=require("node-fetch")
const data=require("form-data")
const db=require("megadb")
const afkdB=new db.crearDB({
    nombre:'dataAkf',
    carpeta: './database'
})


/**
 * Funcion obtener imagen de reddit
 * @param {string} subReddit Reddit a recuperar
 * @return image url
 */
const getRed = async(subReddit) => {
    return await axios.get(`https://meme-api.herokuapp.com/gimme/${subReddit}`)
}

/**
 * 
 * Funcion recuperar buffer
 * @param {string} url Pagina recipiente
 * @param {string} options Opciones para recipiente
 * @returns buffer (responsive)
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

/**
 * Funcion subir imagen en telegra.ph
 * @param buffer Imagen (aun no procesada)
 * @return image url (imagen ya posteada)
 * */
const uploadImage=async (buffer)=>{
    let form=new data
    form.append('file', buffer, 'tmp.png')
    let res=await fetch('https://telegra.ph/upload',{
        method:'POST',
        body:form
    })

    let img=await res.json()
    if(img.error)throw img.error
    return 'https://telegra.ph' + img[0].src
}

/**
 * Funcion obtener comandos
 * @return {string} Texto comandos cargados
 * @param {string} tipo Uso del resultado 
 * */
const loadCommands=async (tipo)=>{
    let txt
    let command=[]
    let alias=[]
    let desc=[]
    if(tipo==='help'){
        fs.readdir('./commands/', (err, files) => {

            if (err) return console.error(err)
            let jsfile = files.filter(f => f.split(".").pop() === "js")
            if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
            jsfile.forEach((f) => {

                let pull = require(`../commands/${f}`)
                command.push(pull.config.name)
                alias.push(pull.config.aliases)
                desc.push(pull.config.desc)
            });
            
            command.forEach((name) => {
                if (name === 'help') return
                const sr = command.indexOf(name)
                txt += `${name} (alias: ${alias[sr]})\n${desc[sr]}

`
            })
            console.log(txt)
        })
    }else if(tipo==='load'){
        return "si"
    }
}

/**
 * Funcion revisar usuario en afk
 * @param {client} object Cliente(enviar mensaje)
 * @param {message} object Mensage(datos del mensaje)
 * */
const getAfk=async (client, message)=>{
    const { from, sender, author, isGroupMsg, chat, body, quotedMsg, mentionedJidList, id } = message
    if(!isGroupMsg) return
    const groupId = isGroupMsg ? chat.groupMetadata.id.replace('@g.us', '') : ''
    const sid = author.replace('@c.us', '')
    if (message.fromMe || message.isMedia || message.type === 'image' || message.type === 'sticker' || message.type === 'ptt') return;
    let userCheck
        userCheck=mentionedJidList[0].replace('@c.us', '')
        if(afkdB.has(groupId) && afkdB.has(`${groupId}.${userCheck}`)){
            let { status, reason, delay }=await afkdB.get(`${groupId}.${userCheck}`)
            let res=await fancyTime(delay)
            let re=res.startsWith("0")?"Segundos":"Minutos"
            if(status==="afk") {
                await client.reply(from, `El usuario que estas mecionando no esta disponible ahora \n_Razon: ${reason}_ \n_Tiempo restante: ~${res} ${re}_`, id)
            }
    }
}

const fancyTime=async (time)=>{
    let hrs = ~~(time / 3600);
    let mins = ~~((time % 3600) / 60);
    let secs = ~~time % 60;

    let ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
    
module.exports = { getBuffer, createSt, getRed, uploadImage, loadCommands, getAfk, fancyTime }