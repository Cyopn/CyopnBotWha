const { getIgFile } = require("./lib/func");

test("Retorno de enlace de archivo fuente de una publicacion de Instagram", async () => {
	const link =
		"https://www.instagram.com/reel/C7hRq0opqNg";
	const result = await getIgFile(link);
    expect(result.status).toBe(200);
    expect(result.data.code).toBe(200)
    console.log(result.data.result[0].url);
	/**
	 * Primero se espera obtener la respuesta del servidor
     * Se espera la respuesta del api consumida
     * Se depura el resultado (url del archivo de video)
	 */
});
