# CyopnBot

Hola

## Pre-requisitos

````markdown
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

Escriba `npm i` para instalar las dependencias. Si falta alguna, instálela manualmente con `npm i [dependencia]` (reemplace los corchetes por el nombre de la dependencia). Edite [.envexample](https://github.com/Cyopn/CyopnBotWha/blob/master/.envexample) con sus propias claves (prefijo y APIs) y cambie el nombre del archivo a `.env`.

Durante la instalación se creará la carpeta `node_modules`, que contiene todos los paquetes necesarios.

<img src="https://imgur.com/JhU0MVZ.png" height="400px">

## Arrancando

Después de instalar dependencias, ejecute `npm start` o `node index.js` para arrancar el API y el bot. Al completar este paso se creará la carpeta:

-   `auth_info` (registro de la sesión de WhatsApp)

La primera vez deberá escanear el código QR para vincular el dispositivo en la aplicación de WhatsApp.

<img src="https://i.imgur.com/BTgocQ7.png" height="400px">

Al finalizar verá en la consola el aviso "Cliente listo".

<img src="https://i.imgur.com/lEsEfzg.png" height="400px">

Si ocurre algún fallo, reinicie con `Ctrl+c` y vuelva a iniciar con `npm start`.

<img src="https://i.imgur.com/Qthu0i5.png" height="400px">

## Para terminar

Esta versión estable incluye un sistema para depurar errores: se notificará al usuario y se enviará información detallada al administrador ([owner](https://github.com/Cyopn/CyopnBotWha/blob/3ceb7245dc951391eb64838aa552b77a16b0f30c/.envexample#L5)).

Si tiene algún problema, sugerencia o desea colaborar, contácteme:

-   [WhatsApp](https://wa.me/+525633592644)
-   [Instagram](https://instagram.com/Cyopn_)

## Desarrollo

Escrito en JavaScript usando Node.js y el socket [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) para controlar WhatsApp.

Si eres desarrollador o quieres aprender, revisa la rama [dev](https://github.com/Cyopn/CyopnBotWha/tree/dev) para colaborar o conocer el desarrollo.

### Observaciones

Este repositorio, además de ser un bot de WhatsApp, funciona como laboratorio para probar funciones experimentales que podrían implementarse en el futuro.

## Autor

-   Juan Antonio - _Trabajo inicial_ - [Cyopn](https://github.com/Cyopn/)

El proyecto se ofrece para uso libre y se desarrolla sin fines de lucro.

Cyopn.

````
