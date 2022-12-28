const { create, Client } = require("@open-wa/wa-automate")
const { welcome } = require("./lib/functions")
const handler = require("./handler")

const start = async (client = new Client()) => {
    console.log("[SR] Cliente listo")
    await client.onStateChanged((state) => {
        console.log("[SR]", state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
            client.forceRefocus()
        }
    })

    await client.onMessage((async (message) => {
        await handler(client, message)
        await client.simulateTyping(message.from, true)
    }))

    await client.onGlobalParticipantsChanged((async (event) => {
        await welcome(client, event)
    }))

    await client.onIncomingCall((async (call) => {
        await client.sendText(call.peerJid, "Llamar = Bloquear\nPara arreglar esto contactame\nwa.me/+525627127780")
            .then(() => {
                client.contactBlock(call.peerJid)
            })
    }))
}

create({
    sessionId: "Cyopn",
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: true,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ],
    onError: 'AS_STRING'
})
    .then(client => start(client))
    .catch(e => console.log("[SR]", e))

/* create(opt(true, start))
    .then(client => start(client))
    .catch((err) => console.log("[SR]", err)) */