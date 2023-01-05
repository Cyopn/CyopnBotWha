const axios = require('axios')

module.exports.run = async(client, message, args, config) => {
    const { id, from } = message
    const { prefix } = config

    try {
        if (!args) return client.reply(from, `Envia el comando *${prefix}covid [pais]`)
        const cn = args.join(' ')
        const resp = await axios.get(`https://coronavirus-19-api.herokuapp.com/countries/${cn}/`)
        const { cases, todayCases, deaths, todayDeaths, active } = resp.data
        client.reply(from, `Informacion - ${cn}
Casos - ${cases}
Casos hoy - ${todayCases}
Muertes - ${deaths}
Muertes hoy - ${todayDeaths}
Casos activos - ${active}`, id)

    } catch (e) {
        console.error(e)
        client.reply(from, `Ocurrio un error`, id)
    }
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "covid",
    aliases: 'cd',
    desc: 'Obten informacion sobre el covid-19 en tu pais'
}