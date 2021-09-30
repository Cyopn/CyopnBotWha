module.exports.run = async(client, message, args, config) => {
    try {
        console.log(message)
    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
}

module.exports.config = {
    name: "pin",
    aliases: 'pi',
    desc: 'ola'
}