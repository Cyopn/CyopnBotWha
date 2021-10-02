# CyopnBot
_Un bot de WhatsApp facil de usar_

## Comenzando
Use el comando `git clone https://github.com/Cyopn/CyopnBotWha.git` en cmd, o bien descargue y descomprima y abra el projecto en su editor (personalmente recomiendo Visual Studio Code)

## Pre-requisitos
Debe tener instalado en su equipo:

- [Git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/) u otro editor de su preferencia
- [Node.js](https://nodejs.org/en/)

## Instalando
Con el comando (De igual manera en cmd o en la terminal de VS Code usando <kdb> Ctrl+ñ </kbd>) `npm i` instalara todas las dependencias, si alguna es excluida es necesario instalar de forma manual con `npm i [dependencia]`, finalmente edite [configexample.json](https://github.com/Cyopn/CyopnBotWha/blob/master/configexample.json) con sus propias claves API y prefijo, ademas de cambiar el nombre a config.json.

<img
    src="https://i.imgur.com/VA1TGI0.png" height="400px">

## Arrancando
Luego de instalar dependencias, escriba `npm start` para el arraque del API, al finalizar este paso, se crearan 3 carpetas:
- node_modules (Paqeterias)
- logs (Inicios de sesion)
- configdata (Base de datos local)

Ademas de crear un archivo (session.data.json), que guarda el usuario (cuenta de WhatsApp).


