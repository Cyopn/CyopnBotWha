const db = require("megadb");
const { prefix, owner, channel } = process.env;
const fs = require("fs/promises");
const sleep = require("ko-sleep");

let dbe = new db.crearDB({
    nombre: "error",
    carpeta: "./database",
});

const errorHandler = async (client, msg, command, err) => {
    try {
        console.error(err.toString());
        dbe.set(`${command}.${new Date().toLocaleDateString().replaceAll("/", "-")}T${new Date().toLocaleTimeString().replaceAll(":", "-")}`, {
            error: err.toString(),
            errorobj: err,
            message: msg,
        });
    } catch (e) {
        console.error(`try-catch ${err}`);
    }
    const sub = msg.isGroupMsg ? msg.chat.name : msg.chat.id.replace("@c.us", "")

    await client.sendText(`${owner}@c.us`, `Error en ${command} - ${sub}\n${String(err)}`);
    await client.reply(msg.from, "Ocurrio un error inesperado.", msg.id);
};

/**
 * Funcion asincrona para obtener los comandos existententes en el directorio ./commands.
 * @returns Diccionario con todos los comandos con su respectivo alias, tipo, descripcion y descripcion detallada.
 */
const getCommands = async () => {
    let command = [];
    let alias = [];
    let type = [];
    let desc = [];
    fs.readdir("./commands/").then((files) => {
        let jsfile = files.filter((f) => f.split(".").pop() === "js");
        if (jsfile.length <= 0)
            return console.log("No se encontro ningun comando");
        jsfile.forEach((f) => {
            let pull = require(`../commands/${f}`);
            command.push(pull.config.name);
            alias.push(pull.config.alias);
            type.push(pull.config.type);
            desc.push(pull.config.description);
        });
    })
    await sleep(1 * 1000);
    const dict = {
        command: command,
        alias: alias,
        type: type,
        desc: desc,
    };
    return dict;
};

module.exports = {
    errorHandler, getCommands
}