const axios = require("axios").default;
import { Blob, FormData } from "formdata-node";
const { JSDOM } = require("jsdom");

/**
 * Convierte Buffer a ArrayBuffer
 * @param {Buffer} buffer Buffer a convertir
 * @returns ArrayBuffer
 */
const toArrayBuffer = async (buffer) => {
	const ab = new ArrayBuffer(buffer.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
};

/**
 * Convierte tgs (pegatina de telegram) a gif
 * @param {TransformStream} media Media a convertir
 * @returns URL
 */
const tgsConverter = async (media) => {
	const form = new FormData();
	const blob = new Blob([await toArrayBuffer(media)]);
	form.append("new-image-url", "");
	form.append("new-image", blob, "image.tgs");
	const res = await fetch("https://ezgif.com/tgs-to-gif", {
		method: "POST",
		body: form,
	});
	const html = await res.text();
	const { document } = new JSDOM(html).window;
	const form2 = new FormData();
	const obj = { file: "" };
	for (const input of document.querySelectorAll("form input[name]")) {
		obj[input.name] = input.value;
		form2.append(input.name, input.value);
	}
	const res2 = await fetch("https://ezgif.com/tgs-to-gif/" + obj.file, {
		method: "POST",
		body: form2,
	});
	const html2 = await res2.text();
	const { document: document2 } = new JSDOM(html2).window;
	return new URL(
		document2.querySelector("div#output > p.outfile > img").src,
		res2.url,
	).toString();
};

/**
 * Convierte un archivo a gif
 * @param {String} media Media a convertir
 * @returns URL
 */
const toGif = async (media) => {
	const file = await axios.get(media, { responseType: "arraybuffer" });
	const buffer = await tgsConverter(file.data);
	return buffer;
};



export default toGif;
