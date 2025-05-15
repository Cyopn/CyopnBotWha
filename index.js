const wa = require('@open-wa/wa-automate');
const fs = require("fs/promises")
let commands = new Map()
require("dotenv").config();

const { prefix, owner, channel, port } = process.env;
fs.readdir(`./commands/`).then((files) => {
    let jsfile = files.filter((f) => f.split(".").pop() === "js");
    if (jsfile.length <= 0) return console.log("No se encontro ningun comando");
    jsfile.forEach((f) => {
        let pull = require(`./commands/${f}`);
        commands.set((f.split(".")[0]), { "name": pull.config.name, "alias": pull.config.alias })
    });
})

wa.create({
    sessionId: "CyopnBot",
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: true,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ],
    onError: 'AS_STRING'
}).then(client => {

    client.onMessage(async message => {
        const msg = (message.type === 'chat') ? message.body : ((message.type === 'image' && message.caption || message.type === 'video' && message.caption)) ? message.caption : ''
        const quotedMsg = message.quotedMsg ? message.quotedMsg.body.trim().split(" ") : undefined
        if ((msg.startsWith(prefix) || msg.toLowerCase().startsWith("chip")) && msg.length > 1) {
            const cmd = msg.toLowerCase().startsWith("chip") ? msg.toLowerCase().replace("chip ", "").split(" ").shift() : msg.slice(prefix.length).trim().split(" ").shift().toLowerCase();
            const arg = msg.replace("chip ", "").replace(cmd, "").slice(prefix.length).trim().split(" ")
            const args = [arg, quotedMsg];
            let cm = undefined

            for (let [key, value] of commands) {
                if (value.name === cmd) {
                    cm = key
                    break
                }
                if (value.alias.includes(cmd)) {
                    cm = key
                    break
                }
            }
            if (cm !== undefined) {
                const commFile = require(`./commands/${cm}`);
                try {
                    commFile.run(client, message, args);
                } catch (e) {
                    await client.reply(message.from, `Error al ejecutar comando: \n${e}`, message.id)
                }
            }
        }
    });
});

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);
app.get("/", (request, response) => {
    response.json({ info: "En linea" });
});
app.listen(port, () => {
    console.log(`Aplicacion corriendo en el puerto ${port}.`);
});