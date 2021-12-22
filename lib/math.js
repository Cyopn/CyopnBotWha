const math = require('mathjs')

/**
 *
 * @param {object} client Cliente
 * @param {object} message Mensaje
 * @param {string} opt Opcion
 * @param {string} query Consulta
 */
const resolve = async(client, message, opt, query) => {
    const { id, from } = message
    switch (opt) {
        case 'der':
        case 'derivar':

            break

        case 'sim':
        case 'simplificar':
            const res = math.simplify(query).toString()
            await client.reply(from, `Resultado: ${res.replace(' ', '')}`, id)
            break
        default:
            await client.reply(from, 'La opcion no esta disponiblo o no existe', id)
            break
    }
}

module.exports = { resolve }