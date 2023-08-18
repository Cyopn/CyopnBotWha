const { prefix } = require("../config.json");

module.exports.run = async (sock, msg, args) => {
	const t = `   Afrikáans (Sudáfrica)	*af-ZA*
    Albanés (Albania)   *sq-AL*
    Amárico (Etiopía)	*am-ET*
    Árabe (Argelia) *ar-DZ*
    Árabe (Baréin)	*ar-BH*
    Árabe (Egipto)	*ar-EG*
    Árabe (Irak)	*ar-IQ*
    Árabe (Israel)	*ar-IL*
    Árabe (Jordania)	*ar-JO*
    Árabe (Kuwait)	*ar-KW*
    Árabe (Líbano)	*ar-LB*
    Árabe (Mauritania)	*ar-MR*
    Árabe (Marruecos)	*ar-MA*
    Árabe (Omán)	*ar-OM*
    Árabe (Catar)	*ar-QA*
    Árabe (Arabia Saudita)	*ar-SA*
    Árabe (Estado de Palestina)	*ar-PS*
    Árabe (Túnez)	*ar-TN*
    Árabe (Emiratos Árabes Unidos)	*ar-AE*
    Árabe (Yemen)	*ar-YE*
    Armenio (Armenia)	*hy-AM*
    Azerbaiyano (Azerbaiyán)	*az-AZ*
    Vasco (España)	*eu-ES*
    Bengalí (Bangladés)	*bn-BD*
    Bengalí (India)	*bn-IN*
    Bosnio (Bosnia y Escocia)	*bs-BA*
    Búlgaro (Bulgaria)	*bg-BG*
    Birmano (Birmania)	*my-MM*
    Catalán (España)	*ca-ES*
    Chino, Cantonés (Tradicional Hong Kong)	*yue-Hant-HK*
    Chino, Mandarín (Simplificado, China)	*zh*
    Chino, Mandarín (Tradicional, Taiwán)	*zh-TW*
    Croata (Croacia)	*hr-HR*
    Checo (República Checa)	*cs-CZ*
    Danés (Dinamarca)	*da-DK*
    Holandés (Bélgica)	*nl-BE*
    Holandés (Países Bajos)	*nl-NL*
    Inglés (Australia)	*en-AU*
    Inglés (Canadá)	*en-CA*
    Inglés (Ghana)	*en-GH*
    Inglés (Hong Kong)	*en-HK*
    Inglés (India)	*en-IN*
    Inglés (Irlanda)	*en-IE*
    Inglés (Kenia)	*en-KE*
    Inglés (Nueva Zelanda)	*en-NZ*
    Inglés (Nigeria)	*en-NG*
    Inglés (Pakistán)	*en-PK*
    Inglés (Filipinas)	*en-PH*
    Inglés (Singapur)	*en-SG*
    Inglés (Tanzania)	*en-TZ*
    Inglés (Reino Unido)	*en-GB*
    Inglés (Estados Unidos)	*en-US*
    Estonio (Estonia)	*et-EE*
    Filipino (Filipinas)	*fil-PH*
    Finés (Finlandia)	*fi-FI*
    Francés (Bélgica)	*fr-BE*
    Francés (Canadá)	*fr-CA*
    Francés (Francia)	*fr-FR*
    Francés (Suiza)	*fr-CH*
    Gallego (España)	*gl-ES*
    Georgiano (Georgia)	*ka-GE*
    Alemán (Austria)	*de-AT*
    Alemán (Alemania)	*de-DE*
    Alemán (Suiza)	*de-CH*
    Griego (Grecia)	*el-GR*
    Guyaratí (India)	*gu-IN*
    Hebreo (Israel)	*iw-IL*
    Hindi (India)	*hi-IN*
    Húngaro (Hungría)	*hu-HU*
    Islandés (Islandia)	*is-IS*
    Indonesio (Indonesia)	*id-ID*
    Italiano (Italia)	*it-IT*
    Italiano (Suiza)	*it-CH*
    Japonés (Japón)	*ja-JP*
    Javanés (Indonesia)	*jv-ID*
    Canarés (India)	*kn-IN*
    Kazajo (Kazajistán)	*kk-KZ*
    Jemer (Camboya)	*km-KH*
    Coreano (Corea del Sur)	*ko-KR*
    Lao (Laos)	*lo-LA*
    Letón (Letonia)	*lv-LV*
    Lituano (Lituania)	*lt-LT*
    Macedonio (Macedonia del Norte)	*mk-MK*
    Malayo (Malasia)	*ms-MY*
    Malabar (India)	*ml-IN*
    Maratí (India)	*mr-IN*
    Mongol (Mongolia)	*mn-MN*
    Nepalí (Nepal)	*ne-NP*
    Noruego, Bokmål (Noruega)	*no-NO*
    Persa (Irán)	*fa-IR*
    Polaco (Polonia)	*pl-PL*
    Portugués (Brasil)	*pt-BR*
    Portugués (Portugal)	*pt-PT*
    Panyabí (Gurmukhi, India)	*pa-Guru-IN*
    Rumano (Rumania)	*ro-RO*
    Ruso (Rusia)	*ru-RU*
    Kiñarwanda (Ruanda)	*rw-RW
    Serbio (Serbia)	*sr-RS*
    Cingalés (Sri Lanka)	*si-LK*
    Eslovaco (Eslovaquia)	*sk-SK*
    Esloveno (Eslovenia)	*sl-SI*
    Suazi (Sudáfrica)	*ss-latn-za*
    Sesotho meridional (Sudáfrica)	*st-ZA*
    Español (Argentina)	*es-AR*
    Español (Bolivia)	*es-BO*
    Español (Chile)	*es-CL*
    Español (Colombia)	*es-CO*
    Español (Costa Rica)	*es-CR*
    Español (República Dominicana)	*es-DO*
    Español (Ecuador)	*es-EC*
    Español (El Salvador)	*es-SV*
    Español (Guatemala)	*es-GT*
    Español (Honduras)	*es-HN*
    Español (México)	*es-MX*
    Español (Nicaragua)	*es-NI*
    Español (Panamá)	*es-PA*
    Español (Paraguay)	*es-PY*
    Español (Perú)	*es-PE*
    Español (Puerto Rico)	*es-PR*
    Español (España)	*es-ES*
    Español (Uruguay)	*es-UY*
    Español (Venezuela)	*es-VE*
    Sondanés (Indonesia)	*su-ID*
    Suajili (Kenia)	*sw-KE*
    Suajili (Tanzania)	*sw-TZ*
    Sueco (Suecia)	*sv-SE*
    Tamil (India)	*ta-IN*
    Tamil (Malasia)	*ta-MY*
    Tamil (Singapur)	*ta-SG*
    Tamil (Sri Lanka)	*ta-LK*
    Telugu (India)	*te-IN*
    Tailandés (Tailandia)	*th-TH*
    Setswana (Sudáfrica)	*tn-latn-za*
    Turco (Turquía)	*tr-TR*
    Tsonga (Sudáfrica)	*ts-ZA*
    Ucraniano (Ucrania)	*uk-UA*
    Urdu (India)	*ur-IN*
    Urdu (Pakistán)	*ur-PK*
    Uzbeko (Uzbekistán)	*uz-UZ*
    Venda (Sudáfrica)	*ve‐ZA*
    Vietnamita (Vietnam)	*vi-VN*
    Xhosa (Sudáfrica)	*xh-ZA*
    Zulú (Sudáfrica)	*zu-ZA*`;
	await sock.sendMessage(
		msg.key.remoteJid,
		{
			text: `_Nota: Debe ser escrito correctamente (respetando mayusculas y minusculas), solamente se debe escribir el fragmento resaltado_.\nLista de idiomas disponibles:\n${t}`,
		},
		{ quoted: msg },
	);
};

module.exports.config = {
	name: `lang`,
	alias: `la`,
	type: `ign`,
	description: `Muestra los idiomas disponibles para el comando ${prefix}tts, debe ser escrito correctamente (respetando mayusculas y minusculas).`,
	fulldesc: `Comando para mostrar los idiomas compatibles para el comando ${prefix}tts. \nEste comando puede usarse en mensajes directos y/o grupos.`,
};
