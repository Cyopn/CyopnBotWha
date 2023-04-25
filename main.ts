import { create, Client, NotificationLanguage } from "@open-wa/wa-automate"
const express = require("express")
const onDeath = (f: { (): Promise<void>; (code: number): void }) => process.on("exit", f)
let globalClient: Client
let d = new Date()
const port = 8082

const app = express()
app.use(express.json({ limit: "200mb" }))

onDeath(async function () {
  console.log("Finalizando sesion")
  if (globalClient) await globalClient.kill()
})

async function start(client: Client) {
  app.use(client.middleware(true))

  app.listen(port, function () {
    console.log(`Oyente en el puerto ${port}`)
  })
  console.log(`Cliente listo - ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`)

  client.onStateChanged(state => {
    console.log(`El estado ha cambiado: ${state}`)
    if (state === "CONFLICT" || state === "UNLAUNCHED") client.forceRefocus();
  });

  client.onMessage(async message => {
    console.log(message)
  })
  
}

create({
  sessionId: 'Cyopn',
  useChrome: true,
  restartOnCrash: start,
  headless: false,
  throwErrorOnTosBlock: true,
  qrTimeout: 0,
  authTimeout: 0,
  killProcessOnBrowserClose: false,
  autoRefresh: true,
  safeMode: true,
  disableSpins: true,
  hostNotificationLang: NotificationLanguage.ES,
  popup: 3012,
  defaultViewport: null,
  chromiumArgs: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--aggressive-cache-discard",
    "--disable-cache",
    "--disable-application-cache",
    "--disable-offline-load-stale-cache",
    "--disk-cache-size=0",
  ],
}).then(async client => await start(client)).catch(e => {
  console.log(`Error al iniciar cliente: ${e.message}`)
})