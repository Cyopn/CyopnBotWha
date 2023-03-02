const { Configuration, OpenAIApi } = require("openai");
const translate = require('translate-google')

module.exports.run = async (client, message, args, config) => {
    const { from, id } = message
    const { opentk } = config
    const configuration = new Configuration({
        apiKey: opentk,
    });
    const openai = new OpenAIApi(configuration);
    await openai.createImage({
        prompt: args.join(" "),
        n: 1,
        size: "1024x1024",
    }).then(r => {
        let image_url = r.data.data[0].url;
        client.sendFileFromUrl(from, image_url, "", "w", id)
    }).catch(e => {
        if (e.response.data.error.message == "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.") {
            client.reply(from, `Tu solicitud fue rechazada debido a contiene texto que no esta permitido.`, id)
        } else {
            translate(e.response.data.error.message, { to: 'es' }).then(res => {
                client.reply(from, res, id)
            }).catch(err => {
                console.error(err)
            })
        }
    })
    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "imageia",
    aliases: 'ima',
    desc: 'Genera imagenes con inteligencia artificial'
}