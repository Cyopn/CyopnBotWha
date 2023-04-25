# CyopnBot
_Un bot de WhatsApp facil de usar_


## Pre-requisitos
Debe tener instalado en su equipo:

- [Git](https://git-scm.com/downloads)
- [Visual Studio Code](https://code.visualstudio.com/) u otro editor de su preferencia
- [Node.js](https://nodejs.org/en/)


## Comenzando
Para iniciar, debemos conocer como podemos abrir tanto la consola de Windows y la integrada en Visual Studio Code:
- Para hacerlo en Windows debemos usar la combinacion de teclas `Win + r`, escribir `cmd` en el cuadro de texto y presionar Enter.
- En Visual Studio Code solo es necesario usar la combinacon de teclas `Ctrl + ñ`, se abrira una pestaña en la parte inferior del editor con otras varias pestañas, usaremos siempre la pestaña terminal.

Ya en la consola de comandos o la terminal, escriba el comando:
```
git clone https://github.com/Cyopn/CyopnBotWha.git
``` 
O bien descargue, descomprima y abra el proyecto en su editor (personalmente recomiendo Visual Studio Code).

Nota: Si esta usando Visual Studio Code, primero debe crear una carpeta (puede estar localizada en la ruta que prefiera), debe dar clic derecho sobre la carpeta y presionar _Abrir con code_, luego de esto ya puede ejecutar el comando; en caso contrario, luego de descomprimir, siga el paso anterior para abrir la carpeta ya descomprimida.

## Instalando
Escriba `npm i` para instalar todas las dependencias, si alguna es excluida es necesario instalar de forma manual con `npm i [dependencia]` sustituyendo los corchetes y dependencia con el nombre de la dependencia, finalmente edite [configexample.json](https://github.com/Cyopn/CyopnBotWha/blob/master/configexample.json) con sus propias claves API y prefijo, finalmente cambie el nombre del archivo a config.json.

Durante la instalacion de las dependencias sera creada la carpeta `node_modules`, donde se almacenaran todos los paquetes y dependencias necesarias para el funcionamiento del bot.

<img
    src="https://i.imgur.com/VA1TGI0.png" height="400px">


## Arrancando
Luego de instalar dependencias, escriba `npm start` o `node index.js` (de igual manera en la termianl o la consola de comandos), para el arraque del API y del bot, al finalizar este paso, se crearan 2 carpetas:

- _IGNORE_Cyopn (Registro general de eventos del API)
- .node-persist (Ruta ejecutable de Chrome)

La primera vez deberas escanear el codigo QR en la parte de dispositivos vinculados dentro de la aplicacion de Whatsapp.

<img
    src="https://i.imgur.com/MDtfC1v.png" height="400px">

Por ahora hemos finalizado la instalacion y esta listo para usarse, pueden ocurrir fallos del servidor o de codigo, en este caso lo correcto es reiniciar usando `Ctrl+c` y seguir el paso para finalizar la tarea, finalmente volver a iniciar con `npm start`.
  
Si algun problema persiste, si existe alguna sugerencia o quisieras colaborar en el proyecto, contactame, agradezco cada comentario.
- [WhatsApp](https://wa.me/+525633592644)
- [Instagram](https://instagram.com/Cyopn_)

## Desarrollo
Escrito en JavaScript, usando JSON para bases de datos simples, ademas del API [open-wa](https://github.com/open-wa/wa-automate-nodejs).

## Autor
- Juan Antonio - _Trabajo inicial_ - [Cyopn](https://github.com/Cyopn/)

## Expresiones de Gratitud
El projecto no esta sujeto a derechos de autor para su uso libre, y es desarrollado sin fines de lucro.

Cyopn.
