//Importaciones de .
require("dotenv").config();
const { prefix, owner } = process.env;
const { errorHandler } = require("../lib/functions");

module.exports.run = async (client, message, args) => {
    //Argumetos recibidos junto al comando
    const arg =
        args[1] === undefined && args[0].join(" ").length >= 1
            ? args[0].join(" ")
            : args[1] === undefined
                ? ""
                : args[1].join(" ");
    try {
        //Codigo del comando
    } catch (e) {
        await errorHandler(client, message, this.config.name, e);
    }
};

module.exports.config = {
    //Informacion sobre el comando
    name: ``,
    alias: [],
    type: ``,
    description: ``,
};
