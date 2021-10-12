const axios = require('axios')
const geo = require('geocoder')
var NodeGeocoder = require('node-geocoder');

module.exports.run = async(client, message, args, config) => {
    const { id, from, quotedMsg, sender } = message
    const { prefix, mapKey } = config

    try {
        let mess
        client.reply(from, 'Envia tu ubicacion actual', id)

        mess = (await client.awaitMessages(from,
            (m) => m.sender.id === sender.id, {
                time: 100 * 1000,
                max: 1,
                errors: ["time"],
            })).first()


        const { lat, lng } = mess

        var geocoder = NodeGeocoder({
            provider: 'opencage',
            apiKey: '2036dca6340149e9a419aa15613873ee'
        });

        // Using callback
        geocoder.geocode(`${lat}, ${lng}`, function(err, res) {
            const { country, city, state, zipcode, streetName } = res[0]
            client.reply(from, `Informacion de la ubicacion
Pais: ${country}
Ciudad/Estado: ${city}/${state}
Calle: ${streetName}
Codigo Postal: ${zipcode}`, id)
        });

    } catch (e) {
        console.error(e)
        client.reply(from, `Fin del tiempo`, id)
        return
    }
}

module.exports.config = {
    name: "pin",
    aliases: 'pi',
    desc: 'ola'
}