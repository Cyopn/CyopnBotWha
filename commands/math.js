const { resolve } = require('../lib/mathfunc')

module.exports.run = async(client, message, args, config) => {
    const { id, from } = message

    try {
        const opt = args.shift()
        const _query = args.join('')
        await resolve(client, message, opt, _query)
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "math",
    aliases: 'mt',
    desc: `Resuelve problemas, operaciones aritmeticas: !math sim [operacion], pronto mas opciones`
}