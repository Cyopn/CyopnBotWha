# CyopnBot

Hola

## Pre-requisitos

Debe tener instalado en su equipo:

-   [Git](https://git-scm.com/downloads) (Si tiene algun conocimiento en git, de otro modo, eliga la opcion de descomprimir)
-   [Visual Studio Code](https://code.visualstudio.com/) u otro editor de su preferencia
-   [Node.js](https://nodejs.org/en/)

## Comenzando

Para iniciar, debemos conocer como podemos abrir tanto la consola de Windows y la integrada en Visual Studio Code:

-   Para hacerlo en Windows debemos usar la combinacion de teclas `Win + r`, escibir `cmd` en el cuadro de texto y presionar Enter para abrir la terminal de comandos del mismo Windows.
-   En Visual Studio Code solo es necesario usar la combinacon de teclas `Ctrl + ñ`, se abrira la terminal de comandos en la parte inferior del editor con otras varias pestañas, usaremos siempre esta pestaña (terminal).

Ya en la terminal, escriba el comando (en caso de tener un conocimeinto previo en git):

```
git clone https://github.com/Cyopn/CyopnBotWha.git
```

O bien descargue, descomprima y abra el proyecto (carpeta raiz) en su editor (personalmente recomiendo Visual Studio Code).

**Nota**: Si esta usando Visual Studio Code, primero debe crear una carpeta (puede estar localizada en la ruta que prefiera), debe dar clic derecho sobre la carpeta y presionar _Abrir con code_ cuando se despliegue el menu contextual, luego de esto ya puede ejecutar el comando; en caso contrario, luego de descomprimir, siga el paso anterior para abrir la carpeta ya descomprimida.

## Instalando

Escriba `npm i` para instalar todas las dependencias, si alguna es excluida es necesario instalar de forma manual con `npm i [dependencia]` sustituyendo los corchetes y dependencia con el nombre de la dependencia (generalmente aparece en la terminal como un error al intentar arrancar), edite [.envexample](https://github.com/Cyopn/CyopnBotWha/blob/master/.envexample) con sus propias claves (prefijo y API's), y finalmente cambie el nombre del archivo a ".env".

Durante la instalacion de las dependencias sera creada la carpeta `node_modules`, donde se almacenaran todos los paquetes y dependencias necesarias para el funcionamiento del bot.

<img
    src="https://imgur.com/JhU0MVZ.png" height="400px">

## Arrancando

Luego de instalar dependencias, escriba `npm start` o `node index.js` (de igual manera en la termianl o la consola de comandos), para el arraque del API y del bot, al finalizar este paso, se creara una carpeta:

-   auth_info (Registro de la sesion de Whatsapp)

La primera vez deberas escanear el codigo QR para agregar como dispositivo vinculado dentro de la aplicacion de Whatsapp.

<img
    src="https://i.imgur.com/BTgocQ7.png" height="400px">

Al finalizar, en la misma consola, se encontrara el aviso sobre inicio del bot con la leyenda "Cliente listo".

<img
    src="https://i.imgur.com/lEsEfzg.png" height="400px">

Por ahora hemos finalizado la instalacion y esta listo para usarse, pueden ocurrir fallos del servidor o de codigo aun no previstos, en este caso lo correcto es reiniciar usando `Ctrl+c` y seguir el paso para finalizar la tarea, finalmente volver a iniciar con `npm start`.

Finalmente comprobamos si hemos hecho una correcta instalacion revisando el comando de ayuda esperando la respuesta.

<img
    src="https://i.imgur.com/Qthu0i5.png" height="400px">

## Para terminar

Esta version estable contiene una nueva forma de depurar errores, estos enviaran un mensaje al usuario informado sobre el error, mientras que al administrador ([owner](https://github.com/Cyopn/CyopnBotWha/blob/3ceb7245dc951391eb64838aa552b77a16b0f30c/.envexample#L5)) le envia la descripcion y otros datos importantes sobre el error.

Si algun problema persiste, si existe alguna sugerencia o quisieras colaborar en el proyecto, contactame, agradezco cada comentario.

-   [WhatsApp](https://wa.me/+525633592644)
-   [Instagram](https://instagram.com/Cyopn_)

## Desarrollo

Escrito en JavaScript usando el entorno de ejecucion multiplataforma [Node.js](https://nodejs.org/) ademas del socket [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) para controlar Whatsapp.

Si eres desarrollador, o quieres aprender, te invito a visiar la rama [dev](https://github.com/Cyopn/CyopnBotWha/tree/dev), ya sea para hacerte colaborador del proyecto o conocer su desarrollo y las funciones en las que se estan trabajando.

### Observaciones

Este repositorio ademas de ser propiamente un bot de Whatsapp, tambien hace la funcion de un laboratorio para implementar ciertas funciones, tales que en parte no son removidas por si en algun futuro cercano seran implementadas.

## Autor

-   Juan Antonio - _Trabajo inicial_ - [Cyopn](https://github.com/Cyopn/)

El projecto no esta sujeto a derechos de autor para su uso libre, y es desarrollado sin fines de lucro.

Cyopn.
