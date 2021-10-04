# CyopnBot
_Un bot de WhatsApp facil de usar_

## Comenzando
Use el comando `git clone https://github.com/Cyopn/CyopnBotWha.git` en cmd, o bien descargue y descomprima; abra el projecto en su editor (personalmente recomiendo Visual Studio Code).

## Pre-requisitos
Debe tener instalado en su equipo:

- [Git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/) u otro editor de su preferencia
- [Node.js](https://nodejs.org/en/)

## Instalando
Con el comando (De igual manera en cmd o en la terminal de VS Code usando `Ctrl+ñ`) `npm i` instalara todas las dependencias, si alguna es excluida es necesario instalar de forma manual con `npm i [dependencia]`, finalmente edite [configexample.json](https://github.com/Cyopn/CyopnBotWha/blob/master/configexample.json) con sus propias claves API y prefijo, ademas de cambiar el nombre a config.json.

<img
    src="https://i.imgur.com/VA1TGI0.png" height="400px">

## Arrancando
Luego de instalar dependencias, escriba `npm start` para el arraque del API, al finalizar este paso, se crearan 3 carpetas:
- node_modules (Paqeterias)
- logs (Inicios de sesion)
- configdata (Base de datos local)

Ademas de crear un archivo (session.data.json), que guarda el usuario (cuenta de WhatsApp).
  
Al arrancar, se cargara lo necesario para su funcionamiento, en el proceso se necesita iniciar sesion en WhatApp Web, con el codigo Qr.

<img
    src="https://i.imgur.com/MDtfC1v.png" height="400px">

Por ahora hemos finalizado la instalacion y esta listo para usarse, pueden ocurrir fallos del servidor o de codigo, en este caso lo correcto es reiniciar usando `Ctrl+c` y seguir el paso para finalizar la tarea, finalmente volver a iniciar con `npm start`.
  
Si algun problema persiste o si existe alguna sugerencia, contactame, agradezco cada comentario.
- [WhatsApp](https://wa.me/+52562712778)
- [Instagram](https://instagram.com/Cyopn_)


## Funciones 
| Funcion | Disponible |
| :- | :-: |
|Stickers|✅|
## Construido con
Escrito en JavaScript, usando JSON para bases de datos simples, ademas del API [open-wa](https://github.com/open-wa).

## Autor
- Juan Antonio Calvillo Benitez - _Trabajo inicial_ - [Cyopn](https://github.com/Cyopn/)

## Expresiones de Gratitud
El projecto no esta sujeto a derechos de autor para su uso libre, y es desarrollado sin fines de lucro (pero agradeceria los creditos), si es necesario ser asesorado o quisiera ser contribuidor pongase en contacto.
  
Pronto mas comandos.

Gracias por usarlo :)

Cyopn.