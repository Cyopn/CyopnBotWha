const { getCommands } = require("./lib/func");

test("Retorno de todos los comandos y sus atributos", async () => {
	const comando = "";
	const result = await getCommands();
	expect(result.command.length).toBe(15);
	expect(result.alias.length).toBe(15);
	expect(result.type.length).toBe(15);
	expect(result.desc.length).toBe(15);
	expect(result.fulldesc.length).toBe(15);
	console.log(result.command);
});
