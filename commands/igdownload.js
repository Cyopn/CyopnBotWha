//Importaciones de .
require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");

module.exports.run = async (client, message, args) => {
    const arg =
        args[1] === undefined && args[0].join(" ").length >= 1
            ? args[0].join(" ")
            : args[1] === undefined
                ? ""
                : args[1].join(" ");
    try {
        if (!arg)
            return await client.reply(message.from, `Debes proporcionar un enlace, escribe ${prefix}igdownload (enlace), recuerda que no es necesario escribir los parentesis.`, message.id)
        const isurl = arg.match(
            /(?:https?:\/\/)?(?:www.)?instagram.com\/?([a-zA-Z0-9\.\_\-]+)?\/([p]+)?([reel]+)?([tv]+)?([stories]+)?\/([a-zA-Z0-9\-\_\.]+)\/?([0-9]+)?/gm,
        );
        if (!isurl)
            return await client.reply(message.from, `El enlace proporcionado no es valido.`, message.id)
        const result = await igdl(arg)
        if (result.data === undefined) return await client.reply(message.from, `No se encontro el contenido.`, message.id)
        let res = []
        result.data.forEach(async (e) => {
            if (res.indexOf(e.url) !== -1) return
            await client.sendFile(from, e.url, `w`, `w`, id);
            res.push(e.url)
        });
    } catch (e) {
        await errorHandler(client, message, this.config.name, e);
    }
};

module.exports.config = {
    name: `igdownload`,
    alias: [`igdl`, `ig`],
    type: `misc`,
    description: `Envia la contenido de alguna publicacion de Instagram.`,
};
