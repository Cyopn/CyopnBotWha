import { describe, expect, test } from "@jest/globals";
import downloadVideo from "./lib/downloadVideo";

describe("Modulo Videodl (downloadVideo)", () => {
	test("Descargar video a partir de video de youtube", async () => {
		const link = `https://www.youtube.com/watch?v=IFMpvvIOYyM`;
		const result = await downloadVideo(link);
		expect(result).toContain("Video descargado correctamente");
		console.log(result);
	});
});
