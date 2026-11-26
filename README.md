# CyopnBot

Hola

## Pre-requisitos

Debe tener instalado en su equipo:

-   [Git](https://git-scm.com/downloads) (Si tiene algún conocimiento en Git; de lo contrario, puede descomprimir el ZIP)
-   [Visual Studio Code](https://code.visualstudio.com/) u otro editor de su preferencia
-   [Node.js](https://nodejs.org/en/)

## Comenzando

Para iniciar, veamos cómo abrir la consola de Windows y la terminal integrada en Visual Studio Code:

-   En Windows: use la combinación de teclas `Win + r`, escriba `cmd` y presione Enter para abrir la terminal del sistema.
-   En Visual Studio Code: use la combinación `Ctrl + ñ` para abrir la terminal integrada en la parte inferior del editor.

Ya en la terminal, escriba el comando (si utiliza Git):

```
git clone https://github.com/Cyopn/CyopnBotWha.git
```

O bien descargue, descomprima y abra el proyecto (carpeta raíz) en su editor (recomiendo Visual Studio Code).

**Nota**: Si está usando Visual Studio Code, cree una carpeta en la ubicación que prefiera, haga clic derecho y seleccione _Abrir con Code_ en el menú contextual; luego podrá ejecutar los comandos indicados.

## Instalando

Escriba `npm i` para instalar las dependencias. En Windows, cree el archivo `.env` a partir de la plantilla:

```
copy .envexample .env
```

Edite `.env` y configure, como mínimo:

-   `prefix`: símbolo o texto que se escribirá antes del nombre del comando, por ejemplo `!`.
-   `owner`: número del propietario de WhatsApp, incluido el código de país.
-   `bot`: número de WhatsApp que se vinculará con el bot.

También puede ajustar `port` (el puerto del servidor; la plantilla usa `4000`) y `channel` (el canal de anuncios). Algunas funciones necesitan opciones adicionales:

-   `ADMIN_PANEL_USER` y `ADMIN_PANEL_PASSWORD`: credenciales del panel administrativo.
-   `APP_URL`: dirección pública del servidor, necesaria para que otras personas puedan abrir los enlaces temporales de descarga y de selección de formatos de YouTube. Sin esta variable se usa `localhost`.
-   `token`: token de un bot de Telegram, requerido por el comando `stelegram`.
-   `py_cmd_img` y `py_cmd_vid`: comandos de Python usados por las conversiones de stickers a imagen o vídeo.

Durante la instalación se creará la carpeta `node_modules`, que contiene los paquetes necesarios.

<img src="https://imgur.com/JhU0MVZ.png" height="400px">

## Arrancando

Después de instalar dependencias y configurar `.env`, ejecute:

```
npm start
```

El servidor web se iniciará en el puerto configurado y el bot se conectará a WhatsApp. La primera vez, si el número todavía no está vinculado, aparecerá un código de vinculación en la terminal. En WhatsApp, abra **Dispositivos vinculados**, elija **Vincular con el número de teléfono** e introduzca ese código.

Al completar la vinculación se creará `auth_info`, que contiene la sesión de WhatsApp. Consérvela para no tener que vincular el número de nuevo y no la compartas.

Si ocurre algún fallo, reinicie con `Ctrl+c` y vuelva a iniciar con `npm start`. La raíz del servidor (`http://localhost:4000/`, si usa el puerto de la plantilla) muestra el estado básico de la aplicación.

## Control de acceso

El bot funciona con una blacklist: todos tienen acceso por defecto, excepto los grupos o personas bloqueados. Los siguientes comandos de acceso son exclusivos del propietario:

-   `!access allow group ID` / `!access allow user NUMERO` para quitar un bloqueo.
-   `!access deny group ID` / `!access deny user NUMERO` para bloquear.
-   `!access mode whitelist` / `!access mode blacklist` para cambiar el modo.
-   `!access pending` para consultar solicitudes y `!access approve ID` para autorizar una.
-   `!access status` para consultar el modo y los bloqueos.
-   `!access known` para consultar grupos y personas detectados automáticamente.

En los ejemplos se usa `!`; reemplácelo por el valor configurado en `prefix`.

En modo `blacklist`, todos tienen acceso salvo los grupos o personas bloqueados. En modo `whitelist`, pueden usar el bot los usuarios que comparten al menos un grupo con él o que hayan sido aprobados manualmente. Si alguien sin grupos escribe al bot, queda pendiente: el propietario recibe una notificación y la persona recibe un aviso de que está pendiente. Las notificaciones se limitan para evitar mensajes repetidos. El propietario conserva acceso; para el resto, un bloqueo tiene prioridad sobre la autorización.

La membresía se sincroniza al conectar y cuando WhatsApp notifica cambios en grupos o participantes. Los mensajes también actualizan el inventario de grupos y personas detectados. El endpoint `GET /access` permite consultar ese inventario y requiere las credenciales del panel.

El panel web está disponible en `http://localhost:4000/admin` cuando se usa el puerto de la plantilla. Usa autenticación Basic: configura `ADMIN_PANEL_USER` y `ADMIN_PANEL_PASSWORD` en `.env`; sin esas variables el panel permanece bloqueado. Desde ahí se puede administrar grupos, personas y participantes; aprobar usuarios pendientes; activar o desactivar comandos; y configurar los niveles por grupo.

El panel también muestra métricas de mensajes y comandos, errores recientes, sugerencias y una bitácora administrativa. Las métricas se pueden filtrar por fechas, grupo o comando y exportar a CSV. Además, permite consultar el estado de conexión y sincronización, y descargar o restaurar respaldos de acceso. Estos respaldos incluyen únicamente configuración, grupos y usuarios: no incluyen `.env` ni `auth_info`.

<img src="https://i.imgur.com/Qthu0i5.png" height="400px">

## Funcionalidades adicionales

El comando `!help` muestra los comandos generales disponibles y sus alias. Algunas funciones disponibles son:

-   **Grupos:** `!edchat` permite cambiar entre el modo de solo administradores y el modo abierto; quien lo use y el bot deben ser administradores. `!tagall texto` menciona a los miembros con un mensaje personalizado y requiere que quien lo use sea administrador. `!edrank` activa o desactiva los niveles del grupo y requiere permisos de administrador.
-   **Niveles:** `!level` muestra el nivel y la experiencia; `!rank` muestra el top de miembros. El progreso se basa en los mensajes y el sistema debe estar activado en el grupo.
-   **Stickers y conversiones:** `!sticker` crea un sticker a partir de una imagen, vídeo o GIF; `!attp texto` crea un sticker de texto; `!stickeraudio` crea stickers con audio. También están disponibles `!toaudio`, `!toimg` y `!tovideo` para conversiones. `toimg` y `tovideo` requieren configurar sus comandos de Python en `.env`.
-   **Descargas:** hay comandos para obtener contenido de Instagram, Facebook, TikTok y X/Twitter. Para YouTube, `!youtube enlace` ofrece una página para elegir formato, mientras que `!ytmp3 enlace` y `!ytmp4 enlace` crean enlaces temporales de descarga. Los enlaces deben usar un `APP_URL` accesible por quienes los recibirán y caducan después de una hora.
-   **Texto y audio:** `!tts texto` genera audio; `!lang` muestra los idiomas disponibles. También se incluyen comandos para consultar letras de canciones, enviar memes y enviar sugerencias al desarrollador.
-   **Stickers de Telegram:** `!stelegram enlace_del_paquete` permite enviar stickers de un paquete de Telegram. Usa el enlace directo `https://t.me/addstickers/...` y configura `token` en `.env`.

## Para terminar

Esta versión incluye un sistema para depurar errores: se notificará al usuario y se enviará información detallada al administrador ([owner](./.envexample)). También se generan registros de actividad para ayudar a diagnosticar problemas.

Si tiene algún problema, sugerencia o desea colaborar, contácteme:

-   [WhatsApp](https://wa.me/+525633592644)
-   [Instagram](https://instagram.com/Cyopn_)

## Desarrollo

Escrito en JavaScript usando Node.js y el socket [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) para controlar WhatsApp.

## Autor

-   Juan Antonio - _Trabajo inicial_ - [Cyopn](https://github.com/Cyopn/)

El proyecto se ofrece para uso libre y se desarrolla sin fines de lucro.

Cyopn.
