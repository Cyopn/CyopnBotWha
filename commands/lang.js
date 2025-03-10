require("dotenv").config();
const { prefix } = process.env;

module.exports.run = async (sock, msg) => {
    const t = `af - Afrikaans
sq - Albanian
de - German
ar - Arabic
bn - Bengali
my - Burmese
bs - Bosnian
bg - Bulgarian
km - Cambodian
kn - Kannada
ca - Catalan
cs - Czech
zh - Simplified Chinese
zh-TW - Traditional Chinese
si - Sinhalese
ko - Korean
hr - Croatian
da - Danish
sk - Slovak
es - Spanish
et - Estonian
fi - Finnish
fr - French
el - Greek
gu - Gujarati
hi - Hindi
nl - Dutch
hu - Hungarian
id - Indonesian
en - English
is - Icelandic
it - Italian
ja - Japanese
la - Latin
lv - Latvian
ml - Malayalam
ms - Malay
mr - Marathi
ne - Nepali
no - Norwegian
pl - Polish
pt - Portuguese
ro - Romanian
ru - Russian
sr - Serbian
sw - Swahili
sv - Swedish
su - Sundanese
tl - Tagalog
th - Thai
ta - Tamil
te - Telugu
tr - Turkish
uk - Ukrainian
ur - Urdu
vi - Vietnamese`;
    await sock.sendMessage(
        msg.key.remoteJid,
        {
            text: `Lista de idiomas disponibles para el comando tts\n_Nota: Debe ser escrito correctamente (simplemente las del primer bloque)_.\n${t}`,
        },
        { quoted: msg },
    );
};

module.exports.config = {
    name: `lang`,
    alias: [`la`],
    type: `misc`,
    description: `Muestra los idiomas disponibles para el comando ${prefix}tts, debe ser escrito correctamente (respetando mayusculas y minusculas).`,
};
