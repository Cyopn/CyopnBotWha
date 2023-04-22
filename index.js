const { create, Client } = require("@open-wa/wa-automate");
const handler = require("./handler");
const temp = require("./media/temp/output.json")

const start = async (client = new Client()) => {
  console.log(
    `[SR] Cliente listo - ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
  );
  await client.sendText(temp.from, `Bot listo`)
  await client.onStateChanged((state) => {
    console.log(
      `[SR] ${state} - ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
    );
    if (state === "CONFLICT" || state === "UNLAUNCHED") {
      client.forceRefocus();
    }
  });

  await client.onMessage(async (message) => {
    await handler(client, message);
  });

  await client.onAddedToGroup(async (chat) => {
    client.sendText(
      chat.groupMetadata.id,
      `Gracias por la invitacion
Puedes escribir !help para ver los comandos
Para resolver tus dudas sobre el desarrollo del bot, puedes contactarme aqui:
WhatsApp: wa.me/525633592644
Discord: Cyopn#7302
Instagram: https://instagram.com/Cyopn_`
    );
  });

  await client.onIncomingCall(async (call) => {
    await client.sendText(call.peerJid, "Llamar = Bloquear").then(() => {
      client.contactBlock(call.peerJid);
    });
  });
};

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
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--aggressive-cache-discard",
    "--disable-cache",
    "--disable-application-cache",
    "--disable-offline-load-stale-cache",
    "--disk-cache-size=0",
  ],
  onError: "AS_STRING",
})
  .then((client) => start(client))
  .catch((e) => console.log("[SR]", e));
