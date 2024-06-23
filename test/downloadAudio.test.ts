import { describe, expect, test } from "@jest/globals";
import downloadAudio from "./lib/downloadAudio";

describe("Modulo Play (downloadAudio)", () => {
	test("Descargar audio a partir de video de youtube.", async () => {
		const link = `https://www.youtube.com/watch?v=IFMpvvIOYyM`;
		const result = await downloadAudio(link);
		expect(result).toContain("Audio descargado correctamente");
		console.log(result);
	});
});
