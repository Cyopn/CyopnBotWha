const { create, Client } = require("@open-wa/wa-automate")
const welcome = require('./lib/welcome')
const handler = require("./handler")
const opt = require("./options")
const { prefix } = require("./config")

const start = async(client = new Client()) => {
    console.log("[SR] Cliente listo")
    client.sendText('5215627127780@c.us', `Bot listo`)
    client.onStateChanged((state) => {
        console.log("[SR]", state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
            client.forceRefocus()
        }
    })

    client.onMessage((async(message) => {
        handler(client, message)
    }))

    client.onGlobalParticipantsChanged((async(event) => {
        await welcome(client, event)
    }))

    client.onAddedToGroup(((chat) => {
        let tMem = chat.groupMetadata.participants.length
        if (tMem < 5) {
            client.sendText(chat.id, `Para usarme necesita al menos 5 miembros en el grupo, total de miembros : ${tMem}`)
                .then(() => {
                    setTimeout(() => {
                        client.leaveGroup(chat.id)
                    }, 3000)
                })
        } else {
            client.sendText(`Hola, *${chat.contact.name}*, gracias por invitarme, escribe *${prefix}help* para ver el menu de comandos`)
        }
    }))

    client.onIncomingCall((async(call) => {
        await client.sendText(call.peerJid, "Llamar= Bloquear\nPara arreglar esto contactame\nwa.me/+525627127780")
            .then(() => {
                client.contactBlock(call.peerJid)
            })
    }))
}

create(opt(true, start))
    .then(client => start(client))
    .catch((err) => console.log("[SR]", err))