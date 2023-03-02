const request = require("request")
const client_id = "0a3465198998447bbcb8437aa9c2d289"
const client_secret = "e64a9a0904fe4e39a67cbc64e3797fc6"

module.exports.run = async (client, message, args, config) => {
    const { from, sender, author, isGroupMsg, chat, body, id } = message

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        form: {
            grant_type: 'client_credentials'
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var token = body.access_token;
            var options = {
                url: 'https://api.spotify.com/v1/playlists/0p0NOqlB832lPgtnZKL5Oi/tracks',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                json: true
            };
            
            request.get(options, function (error, response, body) {
                let a = body.items

                let index = 0
                a.forEach(e => {
                    index += 1
                })

                let i = Math.floor(Math.random() * index)
                client.sendFileFromUrl(from, `${a[i].track.album.images[0].url}`, `a.jpg`, `Recomendacion: ${a[i].track.name} - ${a[i].track.artists[0].name}
Escuchala aqui: ${a[i].track.external_urls.spotify}`, id)

            });
        }
    });

    await client.simulateTyping(from, false)
}

module.exports.config = {
    name: "spotify",
    aliases: 'sf',
    desc: 'pendejo'
}