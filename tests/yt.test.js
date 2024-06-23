const { ytSimpleSolver } = require("./lib/func");

test("Retorno de atributos de un video de Youtue a apartir de su enlace", async () => {
    const link = "https://www.youtube.com/watch?v=srNAkPCyahw";
	const result = await ytSimpleSolver(link);

    expect(result.status).toBe(200);
    console.log(result);
	/**
	 * Solo importa el restuldado del estado, si el estado es 200, entonces el resto
	 * de los atributos seran validos sin importar la informacion que contenga
	 */
});


