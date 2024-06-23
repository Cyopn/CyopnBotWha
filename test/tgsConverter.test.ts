import { describe, expect, test } from "@jest/globals";
import toGif from "./lib/func";

describe("sum module", () => {
	test("Convertir archivo .tgs a gif/video.", async () => {
		//Enlace del archivo .tgs de telegram
		const link = `https://api.telegram.org/file/bot6789674253:AAEb47skb8wD6h1bX02oqOUHxqa8VdySQ6k/stickers/file_822.tgs`;
		const result = await toGif(link);
		expect(result).toContain(".gif");
		console.log(result);
	});
});
